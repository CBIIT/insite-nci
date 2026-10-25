import argparse
import json
from omero.gateway import BlitzGateway, MapAnnotationWrapper, TagAnnotationWrapper
from omero.constants.metadata import NSCLIENTMAPANNOTATION
from omero.model import TagAnnotationI, MapAnnotationI, PlateAnnotationLinkI, ImageAnnotationLinkI, WellAnnotationLinkI, ScreenAnnotationLinkI, DatasetAnnotationLinkI, ProjectAnnotationLinkI
import omero
from omero.rtypes import rstring

def get_object_id(object_type, tag_dict):
    key = None
    if not object_type:
        print("provide object type to verify object id")
    object_type_lc = "".join(object_type.split()).lower()
    if object_type_lc == "well":
        key = "plateid"
    elif object_type_lc == "plate":
        key = "plateid"
    elif object_type_lc == "screen":
        key = "omeroscreenprojectid"
    elif object_type_lc == "project":
        key = "omeroscreenprojectid"
    elif object_type_lc == "dataset":
        key = "omerodatasetorplateid"
    elif object_type_lc == "image":
        key = "imageid"
    
    for item in tag_dict:
        item_lc = "".join(item.split()).lower()
        if key == item_lc:
            return tag_dict[item]
    if not key:
        print(f"provide valid object key for {object_type}")

def generate_annotation(curr_obj, metadata):
    obj = {}
    for key in curr_obj:
        obj[key] = curr_obj[key]
    for item in metadata:
        obj[item] = metadata[item]
    return obj

def dulicate_object(conn, obj, object_type, key, value):
    if obj:
        object_id = obj.getId()
        existing_obj = conn.getObject(object_type, object_id)
        """Check if a specific key-value metadata pair already exists on the object."""
        annotations = list(existing_obj.listAnnotations())
        map_annotations = [ann for ann in annotations if isinstance(ann, MapAnnotationWrapper)]
        if not map_annotations:
            # print(f"No MapAnnotations found for object {obj.getId().getValue()}.")
            return []
        for ann in map_annotations:
            # ann_id = ann.getId()  # Annotation ID
            # namespace = ann.getNs()  # Namespace
            key_values = dict(ann.getValue())  # Extract key-value pairs correctly
            if key in key_values and value == key_values[key]:
                return key_values
    return False

def duplicate_namespace_object(conn, obj_type, obj_id, namespace):
    existing_ann_id = None
    obj = conn.getObject(obj_type, obj_id)
    if obj is None:
        return False, existing_ann_id
    print(obj)
    try:
        annotations = obj.listAnnotations()
        if annotations is None:
            return False, existing_ann_id

        for ann in annotations:
            if hasattr(ann, "getNs") and ann.getNs() == namespace:
                existing_ann_id = ann.getId()
                return True, existing_ann_id
        return False, existing_ann_id
    except Exception as e:
        print(f"Error checking annotations: {e}")
        return False, existing_ann_id
    
def delete_existing_well_annotation(
    conn,
    plate,
    wellRowIndex,
    wellColIndex,
    namespace
    ):
    if plate is None:
        raise Exception("Plate not found for Delete annotation")
    for well in plate.listChildren():
        if well.row == wellRowIndex and well.column == wellColIndex:
            # Check all annotations on the well
            for ann in well.listAnnotations(ns=namespace):
                print(f"Deleting annotation ID: {ann.id}")
                conn.deleteObjects("Annotation", [ann.id])
            break
        # else:
        #     print(f"Well not found in location row {wellRowIndex} col {wellColIndex}")
    
def delete_all_annotations(conn, obj, object_type):
    annotations = list(obj.listAnnotations())
    # remove all tags from object
    # tag_ids = [ann.id for ann in obj.listAnnotations(ns='openmicroscopy.org/omero/client/tag')]
    if obj:
        tag_ids = [ann.id for ann in obj.listAnnotations() if isinstance(ann, TagAnnotationWrapper)]
        if tag_ids:
            conn.deleteObjects("TagAnnotation", tag_ids)
            print(f"Deleted {len(tag_ids)} Tag Annotations from {object_type} {obj.getId()}.")
        else:
            print(f"No Tag Annotations found on {object_type} {obj.getId()}.")
    else:
        print(f"{object_type} {obj.getId()} not found.")
    
    if not annotations:
        print(f"✅ No annotations found for {object_type} ID {obj.getId()}.")
    else:
        # Get the IDs of all annotations
        # ann_ids = [ann.getId() for ann in annotations]
        ann_ids = []
        for ann in annotations:
            annotation = conn.getObject("Annotation", ann.getId())
            if isinstance(annotation, omero.gateway.TagAnnotationWrapper):
                # link_id = annotation.getLink().getId()
                # conn.deleteObjects("TagAnnotation", [annotation.getId()], wait=True)
                # ann_ids.append(ann.getId())
                continue
            if annotation is not None:  
                print(f"Annotation {ann.getId()} exists, proceeding with deletion.")
                ann_ids.append(ann.getId())
                conn.deleteObjects("Annotation", [ann.getId()],  wait=True)
            else:
                print(f"Annotation {ann.getId()} does not exist or has already been deleted.")

        # Delete all annotations
        # conn.deleteObjects("Annotation", ann_ids, wait=True)
        print(f"✅ Deleted {len(ann_ids)} annotations from {object_type} with ID {obj.getId()}.")


def find_existing_map_annotation(
    obj, script_key, script_value, ns=NSCLIENTMAPANNOTATION
):
    """
    Search for an existing map annotation on the object that contains
    the given script-specific key/value pair.
    Returns the annotation's ID if found; otherwise, returns None.
    """
    # List all annotations attached to the object
    for ann in obj.listAnnotations():
        # We only check annotations in the expected namespace.
        if hasattr(ann, "getNs") and ann.getNs() == ns:
            try:
                ann_data = ann.getValue()  # Expecting a list of (key, value) pairs
            except Exception:
                continue
            # Ensure ann_data is in the expected format before searching
            if isinstance(ann_data, list):
                for key, value in ann_data:
                    if key == script_key and value == script_value:
                        return ann.getId()
    return None

def handle_map_annotations(
    conn,
    objects,
    map_annotation_data,
    ann_ids=None,
    ns=NSCLIENTMAPANNOTATION,
    duplicate=False,
):
    """Create or update map annotations on OMERO objects."""
    ann_ids = ann_ids or []
    new_ann_ids = []

    if objects:
        conn.SERVICE_OPTS.setOmeroGroup(objects[0].getDetails().group.id.val)

    if not ann_ids and map_annotation_data:
        # When using the client namespace we want to duplicate the annotation.
        if ns == NSCLIENTMAPANNOTATION:
            duplicate = True    

        if duplicate:
            for obj in objects:
                ann = MapAnnotationWrapper(conn)
                ann.setValue(map_annotation_data)
                ann.setNs(ns)
                ann.save()
                new_ann_ids.append(ann.getId())
                obj.linkAnnotation(ann)
        else:
            ann = MapAnnotationWrapper(conn)
            ann.setValue(map_annotation_data)
            ann.setNs(ns)
            ann.save()
            new_ann_ids.append(ann.getId())
            for obj in objects:
                obj.linkAnnotation(ann)
        return {"annId": new_ann_ids}

    updated_ann_ids = []

    for ann_id in ann_ids:
        ann = conn.getObject("MapAnnotation", ann_id)
        if not ann:
            continue
        if map_annotation_data:
            ann.setValue(map_annotation_data)
            ann.setNs(ns)
            ann.save()
            updated_ann_ids.append(ann_id)
        else:
            handle = conn.deleteObjects("/Annotation", [ann_id])
            try:
                conn._waitOnCmd(handle)
            except Exception as e:
                raise Exception(f"Failed in handle_map_annotations: {str(e)}")
            # finally:
            #     print("import util close() !!")
            #     # handle.close()
    return {"annId": updated_ann_ids if map_annotation_data else None}
