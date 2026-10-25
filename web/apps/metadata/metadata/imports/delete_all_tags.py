import argparse
import json
from omero.gateway import BlitzGateway, MapAnnotationWrapper
from omero.constants.metadata import NSCLIENTMAPANNOTATION
from omero.model import TagAnnotationI
import omero

# script - ranaab@NCI-02294597-ML scripts % python3 delete_all_tags.py --username=root --password=omero --host=localhost

def delete_all_existing_tags(conn):
    tags = list(conn.getObjects("TagAnnotation"))
    if tags:
        tag_ids = [tag.getId() for tag in tags]
        
        # Delete tags using the OMERO service
        conn.deleteObjects("Annotation", tag_ids, wait=True)
        print(f"Deleted {len(tag_ids)} tags.")
    else:
        print("No tags found.")

# def delete_existing_object_tags(conn):
#     tags_to_delete = []
#     for obj_type in ["Dataset", "Image", "Project"]:  # Check different object types
#         objects = conn.getObjects(obj_type)
        
#         for obj in objects:
#             for ann in obj.listAnnotations():
#                 if ann.OMERO_TYPE == "TagAnnotation":
#                     tags_to_delete.append(ann.getId())
#     # Remove duplicate tag IDs (to avoid redundant deletions)
#     tags_to_delete = list(set(tags_to_delete))
#     if tags_to_delete:
#         # Unlink and delete the tags
#         conn.deleteObjects("Annotation", tags_to_delete, wait=True)
#         print(f"Deleted {len(tags_to_delete)} assigned tags.")
#     else:
#         print("No assigned tags found.")

def delete_existing_object_tags(conn, object_type, id):
    tags_to_delete = []
    # for obj_type in ["Well"]:  # Check different object types
    #     objects = conn.getObjects(obj_type)
        
    #     for obj in objects:
    plate = conn.getObjects(object_type, id)
    for obj in plate.listChildren():
            for ann in obj.listAnnotations():
                if ann.OMERO_TYPE == "TagAnnotation":
                    tags_to_delete.append(ann.getId())
    # Remove duplicate tag IDs (to avoid redundant deletions)
    tags_to_delete = list(set(tags_to_delete))
    if tags_to_delete:
        # Unlink and delete the tags
        conn.deleteObjects("Annotation", tags_to_delete, wait=True)
        print(f"Deleted {len(tags_to_delete)} assigned tags.")
    else:
        print("No assigned tags found.")


def main():
    parser = argparse.ArgumentParser(
        description="Apply metadata annotations to OMERO objects."
    )
    # parser.add_argument("--file", required=True, help="Path to JSON input file")
    parser.add_argument("--username", required=True, help="OMERO username")
    parser.add_argument("--password", required=True, help="OMERO password")
    parser.add_argument("--host", required=True, help="OMERO server host")
    parser.add_argument("--port", type=int, default=4064, help="OMERO server port")
    parser.add_argument("--group", help="OMERO group ID")
    parser.add_argument("--project", type=int, help="OMERO Project ID to override")
    parser.add_argument("--dataset", type=int, help="OMERO Dataset ID to override")
    parser.add_argument("--screen", type=int, help="OMERO Screen ID to override")

    args = parser.parse_args()
    plate_id = args.plate
    conn = BlitzGateway(
        args.username, args.password, host=args.host, port=args.port, group=args.group
    )
    delete_all_existing_tags(conn)
    # delete_existing_object_tags(conn)
    print("delete plate tags {}".format(plate_id))
    if plate_id:
        print("delete plate tags {}".format(plate_id))
        delete_existing_object_tags(conn, "Plate", plate_id)

    # delete_existing_object_tags(conn)



    