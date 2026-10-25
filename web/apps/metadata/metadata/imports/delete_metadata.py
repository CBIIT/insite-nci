import argparse
import json
from omero.gateway import BlitzGateway, MapAnnotationWrapper
from omero.constants.metadata import NSCLIENTMAPANNOTATION
from omero.model import TagAnnotationI, MapAnnotationI
import omero
from omero.rtypes import rstring

from .tag_operations import TagManager
from .import_util import delete_all_annotations, get_object_id

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

            except Exception:
                continue
            # Convert numeric indices to a location string.
            # (Assuming well rows start at 0 corresponding to "A", and columns are 0-indexed.)
            loc_str = chr(well_row + ord('A')) + str(well_col + 1)
            wells_dict[loc_str] = well
        _plate_well_cache[plate_id] = wells_dict
    else:
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
    
    # Allow single dictionary or list of dictionaries.
    for tag_dict in copy_tags if isinstance(copy_tags, list) else [copy_tags]:

        obj = None

        # For well_tags, allow PlateID and location keys.
        if object_type == "Well":
            """set plate id for well"""
            # plateIdKey = None
            # for keyItem in tag_dict:
            #     key = "".join(keyItem.split()).lower()
            #     if key == "plateid":
            #         plateIdKey = keyItem
            
            # if  not plateIdKey:
            #     print("provide plate Id for well object")

            plate_id = get_object_id("plate", tag_dict)
            # plate_id = tag_dict[object_id]
            if "location" not in tag_dict:
                print("provide location for well object")
            location = tag_dict["location"]
            well_tags = {}
            if append_tags and "Well Level" in append_tags:
                well_tags = append_tags["Well Level"]
            append_well_tags = TagManager.get_all_tag_values(tag_dict, well_tags)
            
            obj = lookup_well(conn, plate_id, location, append_well_tags, existing_tags)
            if not obj:
                continue
        else:
            # id_key = next(
            #     (k for k in tag_dict.keys() if k.endswith("ID") and k != "annotationID"),
            #     None,
            # )
            # if not id_key:
            #     continue
            # obj_id = tag_dict[object_id]
            # append tags to obj
            # object type id mapping
            object_id = get_object_id(object_type, tag_dict)
            obj = conn.getObject(object_type, object_id)
            if obj is not None:
                existing_tags = TagManager.append_tag_to_obj(conn, obj, object_type, append_tags, tag_dict, existing_tags)

            if not obj:
                print(f"Warning: {object_type} with ID {object_id} not found")
                continue
        
        # for testing
        if obj:
            delete_all_annotations(conn, obj, object_type) 

    return results

def main():
    parser = argparse.ArgumentParser(
        description="Apply metadata annotations to OMERO objects."
    )
    parser.add_argument("--file", required=True, help="Path to JSON input file")
    parser.add_argument("--username", required=True, help="OMERO username")
    parser.add_argument("--password", required=True, help="OMERO password")
    parser.add_argument("--host", required=True, help="OMERO server host")
    parser.add_argument("--port", type=int, default=4064, help="OMERO server port")
    # plate id as argument to override plateid in json
    # or exception - plate id required.
    # screen id provided in json metadata or as argument
    parser.add_argument("--group", help="OMERO group ID")
    parser.add_argument("--project", type=int, help="OMERO Project ID to override")
    parser.add_argument("--dataset", type=int, help="OMERO Dataset ID to override")
    parser.add_argument("--screen", type=int, help="OMERO Screen ID to override")
    parser.add_argument("--plate", type=int, help="OMERO Plate ID to override")
    parser.add_argument("--image", type=int, help="OMERO image ID to override")

    args = parser.parse_args()
    with open(args.file, encoding="utf-8") as f:
        data = json.load(f)

    # If command-line overrides are provided, update the JSON input accordingly.
    if args.project and "project_tags" in data:
        for tag in data["project_tags"]:
            for k in tag.keys():
                if k.endswith("ID") and k != "annotationID":
                    tag[k] = args.project
                    break

    if args.dataset and "dataset_tags" in data:
        for tag in data["dataset_tags"]:
            for k in tag.keys():
                if k.endswith("ID") and k != "annotationID":
                    tag[k] = args.dataset
                    break

    if args.screen and "screen_tags" in data:
        for tag in data["screen_tags"]:
            for k in tag.keys():
                if k.endswith("ID") and k != "annotationID":
                    tag[k] = args.screen
                    break

    if args.plate and "plate_tags" in data:
        plateIDs = args.plate
        pltIDs = plateIDs.split(",")
        for index, tag in enumerate(data["plate_tags"]):
            for k in tag.keys():
                if k.endswith("ID") and k != "annotationID":
                    tag[k] = pltIDs[index]
                    break

    if args.image and "image_tags" in data:
        imageIDs = args.image
        imageIDs = imageIDs.split(",")
        for tag in data["image_tags"]:
            if "imageID" in tag:
                index = tag["imageID"]
                if len(imageIDs) < index and index > 0:
                    tag["imageID"] = imageIDs[index]

    append_tags = {}
    if "append_tags" in data:
        append_tags = data['append_tags']

    # Map of tag types to OMERO object types
    object_type_map = {
        "project_tags": "Project",
        "dataset_tags": "Dataset",
        "screen_tags": "Screen",
        "plate_tags": "Plate",
        "well_tags": "Well",
        "image_tags": "Image",
    }

    conn = BlitzGateway(
        args.username, args.password, host=args.host, port=args.port, group=args.group
    )
    if not conn.connect():
        raise ConnectionError("Failed to connect to OMERO")

    existing_tags = TagManager.get_existing_tag(conn)
    try:
        results = {}
        for tag_type, object_type in object_type_map.items():
            if tag_type in data:
                results[tag_type] = process_object_tags(
                    conn, object_type, data[tag_type], append_tags, existing_tags
                )
        print(json.dumps(results, indent=2))
    except Exception as e:
        raise Exception(f"Failed in delete metadata : {str(e)}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
