import argparse
import json
from omero.gateway import BlitzGateway, MapAnnotationWrapper
from omero.model import (
    ScreenAnnotationLinkI,
    PlateAnnotationLinkI,
    ImageAnnotationLinkI,
    WellAnnotationLinkI,
    TagAnnotationI,
    MapAnnotationI,
    OriginalFileI,
    FileAnnotationI,
    ProjectAnnotationLinkI,
    DatasetAnnotationLinkI
)
from omero.constants.metadata import NSCLIENTMAPANNOTATION
import omero
from omero.rtypes import rtime, rstring, rlong, rint
from io import BytesIO

from .tag_operations import TagManager
from .import_util import get_object_id
from .well_level import (
    append_well_annotations
)
from .screen_level import append_screen_metadata
from .plate_level import append_plate_metadata
from .project_level import (
    append_project_metadata,
    append_project_annotations
)
from .dataset_level import append_dataset_metadata
from .image_level import append_image_metadata

# Global cache for plate well mappings.
_plate_well_cache = {}

def lookup_well(conn, plate_id, location, append_tags, existing_tags):
    """
    Given a Plate ID and a location string (e.g. "A03"),
    look up and return the corresponding Well object.
    This version builds and caches a mapping from location to well,
    so subsequent lookups on the same plate are much faster.
    """
    plate = conn.getObject("Plate", plate_id)
    if not plate:
        print(f"Warning: Plate with ID {plate_id} not found")
        return None

    # If we haven't already cached the mapping for this plate, build it.
    if plate_id not in _plate_well_cache:
        print(f"plate id not in cache {plate_id}")
        wells_dict = {}
        for well in plate.listChildren():
            try:
                # Some well attributes may be wrapped in objects (rint), so check for .val.
                well_row = int(well.row.val) if hasattr(well.row, "val") else int(well.row)
                well_col = int(well.column.val) if hasattr(well.column, "val") else int(well.column)
                
                if len(append_tags) > 0:
                    # Fetch existing tags for the well
                    # if existing_tags
                    added_tags = TagManager.add_tag_to_well(conn, well, append_tags, existing_tags)
                    if len(added_tags) > 0:
                        existing_tags = TagManager.get_existing_tag(conn)

            except Exception as e:
                print(f"An error occurred: {e}")
                continue
            # Convert numeric indices to a location string.
            # (Assuming well rows start at 0 corresponding to "A", and columns are 0-indexed.)
            loc_str = chr(well_row + ord('A')) + str(well_col + 1)
            wells_dict[loc_str] = well
        _plate_well_cache[plate_id] = wells_dict
    else:
        print(f"plate id EXIST in cache {plate_id}")
        wells_dict = _plate_well_cache[plate_id]

    # Return the well if found.
    if location in wells_dict:
        return wells_dict[location]
    else:
        print(f"Warning: No well found at location '{location}' on plate {plate_id}")
        return None

def process_object_tags(conn, object_type, tags, append_tags = {}, existing_tags= []):
    
    """
    Process tags for a specific OMERO object type.
    For each tag dictionary, the function searches for an existing map annotation
    with the script-specific key/value pair ('internalID': 'omero.import_metadata').
    If found, that annotation is updated. Otherwise a new annotation is created,
    ensuring that the script-specific key/value pair is included.
    Additionally, for 'well_tags' (object_type "Well"), if a Plate ID and location string
    are provided instead of a Well ID, the Well is looked up from the Plate.
    """
    results = []
    copy_tags = tags.copy()
    object_type_lc = "".join(object_type.split()).lower()

    # if object_type_lc == "image":
    #     annot_result = append_image_annotations(conn, copy_tags)
    #     results.append(annot_result)
    #     return results
    
    if object_type_lc == "project":
        isTag = False
        for item in copy_tags:
            if "tags" in item:
                isTag = True
                break
        if isTag:
            annot_result = append_project_annotations(conn, copy_tags)
            results.append(annot_result)
            return results
    
    if object_type_lc == "well":
        plate_id = int(copy_tags.pop("plateID"))
        result = append_well_annotations(conn, copy_tags, plate_id)
        return result
    
    # Allow single dictionary or list of dictionaries.
    for tag_dict in copy_tags if isinstance(copy_tags, list) else [copy_tags]:

        obj = None

        if object_type != "Well":
            object_id = get_object_id(object_type, tag_dict)
            if object_id:
                obj = conn.getObject(object_type, object_id)
                if obj is not None:
                    existing_tags = TagManager.append_tag_to_obj(
                        conn,
                        obj,
                        object_type, 
                        append_tags, 
                        tag_dict, 
                        existing_tags
                      )

            if not obj:
                print(f"Warning: {object_type} with ID {object_id} not found")
                continue

        object_type_lc = "".join(object_type.split()).lower()
        if object_type_lc == "screen":
            result = append_screen_metadata(
                conn,
                obj,
                object_type,
                tag_dict
            )
            results.append(result)

        elif object_type_lc == "plate":
            result = append_plate_metadata(
                conn,
                obj,
                object_type,
                tag_dict
            )
            results.append(result)

        # elif object_type_lc == "well":
        #     plate_id = int(copy_tags.pop("plateID"))
        #     append_well_annotations(conn, copy_tags, plate_id)

        elif object_type_lc == "project":
            result = append_project_metadata(
                conn,
                obj,
                object_type,
                tag_dict
            )
            results.append(result)
        elif object_type_lc == "dataset":
            result = append_dataset_metadata(
                conn,
                obj,
                object_type,
                tag_dict
            )
            results.append(result)
        elif object_type_lc == "image":
            result = append_image_metadata(
                conn,
                obj,
                object_type,
                tag_dict
            )
            results.append(result)

    return results

def append_metadata(conn, data):
    append_tags = {}
    if "append_tags" in data:
        append_tags = data['append_tags']

    # Map of tag types to OMERO object types
    object_type_map = {
        "project_tags": "Project",
        "dataset_tags": "Dataset",
        "screen_tags": "Screen",
        "plate_tags": "Plate",
        "image_tags": "Image",
        "multiWell_tags": "Well"
    }

    existing_tags = TagManager.get_existing_tag(conn)
    try:
        results = {}
        for mapping_key, level in object_type_map.items():
            if mapping_key in data:
                results[mapping_key] = process_object_tags(
                    conn, level, data[mapping_key], append_tags, existing_tags
                )
        # resp = json.dumps(results, indent=2)
        # print(json.dumps(results, indent=2))
        return results
    except Exception as e:
        raise Exception(f"Failed in append_metadata: {str(e)}")
    # finally:
    #     print(" do not close the connection ")
    #     conn.close()

def append_file(request, conn):
    file_type_map = {
        "project_files": "Project",
        "dataset_files": "Dataset",
        "screen_files": "Screen",
        "plate_files": "Plate",
        "image_files": "Image",
        "multiWell_files": "Well"
    }
    appended_files = []
    for mapping_key, object_type in file_type_map.items():
        files = request.FILES.getlist(mapping_key)
        if len(files) > 0:
            for file in files:
                if not file:
                    continue
                object_id = request.POST.get(f"{object_type}ID")
                if not object_id:
                    # No ID provided, skip this file
                    return {
                        "object_type": object_type,
                        "obj id": request.POST.get(f"{object_type}ID")
                    }
                try:
                    object_id = int(object_id)
                except ValueError:
                    # Invalid ID format, skip
                    continue

                # object_id = int(request.POST.get(object_type, 1))
                obj = conn.getObject(object_type, object_id)

                # --- Step 1: Create OriginalFile metadata ---
                update_service = conn.getUpdateService()
                raw_file_store = conn.createRawFileStore()

                # file metadata
                file_name = file.name
                mime_type = file.content_type or "application/octet-stream"
                file_size = file.size

                orig_file = OriginalFileI()
                orig_file.setName(rstring(file_name))
                orig_file.setPath(rstring("/"))  # Can be any dummy path
                orig_file.setSize(rlong(file_size))
                orig_file.setMimetype(rstring(mime_type))

                # Save OriginalFile object
                orig_file = update_service.saveAndReturnObject(orig_file)

                # --- Step 2: Upload file content ---
                file_id = orig_file.getId().getValue()  # This is the ID used by raw_file_store
                orig_file = conn.getObject("OriginalFile", file_id)

                raw_file_store.setFileId(file_id)

                # Upload data (assuming `file_bytes` is a byte array or BytesIO)
                offset = 0
                chunk_size = 4096
                file_bytes = file.read()
                # file_bytes = b"Hello, this is file content."
                with BytesIO(file_bytes) as byte_stream:
                    chunk = byte_stream.read(chunk_size)
                    while chunk:
                        raw_file_store.write(chunk, offset, len(chunk))
                        offset += len(chunk)
                        chunk = byte_stream.read(chunk_size)

                #--- Step 3: Annotate the file ---
                file_annotation = FileAnnotationI()
                file_annotation.setFile(orig_file._obj)  # Must use the actual `OriginalFileI` object
                saved_ann = update_service.saveAndReturnObject(file_annotation)

                # --- Step 4: Link annotation to project ---
                link = None
                if object_type == "Project":
                    link = ProjectAnnotationLinkI()
                elif object_type == "Dataset":
                    link = DatasetAnnotationLinkI()
                elif object_type == "Screen":
                    link = ScreenAnnotationLinkI()
                elif object_type == "Plate":
                    link = PlateAnnotationLinkI()
                elif object_type == "Image":
                    link = ImageAnnotationLinkI()

                if link is None:
                    continue

                link.setParent(obj._obj)   # Make sure `project` is a wrapped object
                link.setChild(saved_ann)
                update_service.saveAndReturnObject(link)

                appended_files.append({    
                    "status": "success",
                    "file_name": file_name,
                    "mime_type": mime_type,
                    "file_size": file_size
                })
    return appended_files
        