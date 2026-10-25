import argparse
import json
from omero.gateway import BlitzGateway
from import_metadata import process_object_tags
from tag_operations import TagManager

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
    parser.add_argument("--delete", type=bool, help="OMERO image ID to override")

    args = parser.parse_args()
    with open(args.file, encoding="utf-8") as f:
        data = json.load(f)

    # delete_all = False
    # if args.delete:
    #     delete_all = args.delete

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

    # conn = BlitzGateway(
    #     args.username, args.password, host=args.host, port=args.port
    # )
    group_name = args.group
    conn = BlitzGateway(
        args.username, args.password, host=args.host, port=args.port, group=args.group
    )
    if not conn.connect():
        raise ConnectionError("Failed to connect to OMERO")
    
    """ set target group to append metadata """
    target_group = None
    for group in conn.getGroupsMemberOf():
        if group.getName() == group_name:
            target_group = group
            conn.setGroupForSession(target_group.getId())
            print(f"target group = {group.getName()} group Id = {group.getId()}")
            break
    if not target_group:
        raise ValueError(f"Group '{group_name}' not found.")
 
    projects = list(conn.getObjects("Project"))
    print(f"Projects in group '{group_name}':")
    for project in projects:
        print(f"  Project ID: {project.getId()}, Name: {project.getName()}")

    existing_tags = TagManager.get_existing_tag(conn)
    try:
        results = {}
        for tag_type, object_type in object_type_map.items():
            if tag_type in data:
                results[tag_type] = process_object_tags(
                    conn, object_type, data[tag_type], append_tags, existing_tags
                )
        print(json.dumps(results, indent=2))
    finally:
        conn.close()

if __name__ == "__main__":
    main()