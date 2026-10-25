from omero.gateway import BlitzGateway, MapAnnotationWrapper, TagAnnotationWrapper
from omero.constants.metadata import NSCLIENTMAPANNOTATION
from omero.model import (
    TagAnnotationI, 
    AnnotationAnnotationLinkI, 
    NamedValue, 
    MapAnnotationI, 
    WellAnnotationLinkI, 
    WellI
)
import omero
from omero.rtypes import rstring, rlong
from .tag_operations import TagManager
from .import_util import (
    dulicate_object,
    generate_annotation,
    find_existing_map_annotation,
    handle_map_annotations,
    duplicate_namespace_object,
)
from collections import defaultdict
# remove metadata attributes
rm_attrs = ["plateID", "namespace", "location", "internalID", "rowIndex", "colIndex", "tags"]

def append_well_annotations(conn, wells_key_value_tags, plate_id):
    """"""

    """
    Prepares MapAnnotations and links to append to a Well object in batch.

    Args:
        conn: BlitzGateway connection.
        well_id (int): ID of the Well object.
        namespace (str): Namespace for annotations.
        append_data (List[List[Tuple[str, str]]]): List of key-value pairs for each annotation.

    Returns:
        Tuple[List[MapAnnotationWrapper._obj], List[WellAnnotationLinkI]]: Prepared annotations and links.
    """
    plate = conn.getObject("Plate", int(plate_id))
    if not plate:
        print(f"Plate {plate_id} not found.")
        return
    
    """existing annotation ids"""
    
    # Build a location-to-well map
    location_to_well = {}
    for well in plate.listChildren():
        try:
            row = int(well.row.val) if hasattr(well.row, "val") else int(well.row)
            col = int(well.column.val) if hasattr(well.column, "val") else int(well.column)
            loc = chr(ord('A') + row) + str(col + 1)
            location_to_well[loc] = well
        except Exception as e:
            print(f"Error determining location: {e}")
            continue
    
    annotations = []
    links = []
    tag_cache = {}

    for location, ann_list in wells_key_value_tags.items():
        # print(f"well location {location}")
        well = location_to_well.get(location)

        if not well:
            print(f"❌ No well found at {location}")
            continue

        well_id = int(well.getId())
        batch_tag_names = set() 
        # Get existing namespaces
        # existing_ns = {
        #     ann.getNs() for ann in well.listAnnotations()
        #     if hasattr(ann, "getNs") and ann.getNs()
        # }

        existing_by_ns = {}

        # get existing tag names or value
        existing_tag_names = {
            tag.getTextValue() for tag in well.listAnnotations()
            if tag.OMERO_TYPE == "omero.model.TagAnnotationI"
        }

        # Index current annotations by namespace
        for ann in well.listAnnotations():
            if hasattr(ann, "getNs"):
                existing_by_ns[ann.getNs()] = ann
            if isinstance(ann, TagAnnotationWrapper):
                existing_tag_names.add(ann.getTextValue())

        for ann_data in ann_list:
            namespace = ann_data.get("namespace")
            # isduplicateObj, existing_ann_id, existed_ann = duplicate_namespace_object(conn, "Well", well_id, namespace)
            if not namespace:
                continue
            map_ann = [
                NamedValue(k, str(v or ""))
                for k, v in ann_data.items()
                if (k != "annotationID" and k not in rm_attrs) and len(str(v)) < 1000
            ]

            if len(map_ann) == 0:
                continue
            # tags to append well
            tags = ann_data.get("tags", [])

            if namespace in existing_by_ns:
                # Update existing annotation
                exist_ann = existing_by_ns[namespace]
                ann_id = exist_ann.getId()
                new_ann = MapAnnotationI()
                new_ann.setId(rlong(ann_id))
                new_ann.setMapValue(map_ann)
                new_ann.setNs(rstring(namespace))
                annotations.append(new_ann)

                # for tag_name in tags:
                #     if tag_name in existing_tag_names:
                #         continue
                #     if tag_name in tag_cache:
                #         tag_ann = tag_cache[tag_name]
                #     else:
                #         tag_ann = TagAnnotationI()
                #         tag_ann.setTextValue(rstring(tag_name))
                #         tag_cache[tag_name] = tag_ann
                #     tag_link = WellAnnotationLinkI()
                #     tag_link.setParent(WellI(well_id, False))
                #     tag_link.setChild(tag_ann)
                #     annotations.append(tag_link)

                for tag_name in tags:
                    t = (tag_name or "").strip()
                    # skip if already on the well OR already queued this run
                    if not t or t in existing_tag_names or t in batch_tag_names:
                        continue
                    batch_tag_names.add(t)

                    if t in tag_cache:
                        tag_ann = tag_cache[t]
                    else:
                        tag_ann = TagAnnotationI()
                        tag_ann.setTextValue(rstring(t))
                        tag_cache[t] = tag_ann
                    tag_link = WellAnnotationLinkI()
                    tag_link.setParent(WellI(well_id, False))
                    tag_link.setChild(tag_ann)
                    annotations.append(tag_link)
                
            else:
                # Create new MapAnnotationI (not Wrapper)
                ann = MapAnnotationI()
                ann.setNs(rstring(namespace))
                ann.setMapValue(map_ann)
                # Link object
                link = WellAnnotationLinkI()
                well_ref = WellI(well_id, False) #required for link s
                link.setParent(well_ref)  # get raw Ice object
                link.setChild(ann)

                annotations.append(ann)
                links.append(link)

                for tag_name in tags:
                    t = (tag_name or "").strip()
                    # skip if already on the well OR already queued this run
                    if not t or t in existing_tag_names or t in batch_tag_names:
                        continue
                    batch_tag_names.add(t)

                    if t in tag_cache:
                        tag_ann = tag_cache[t]
                    else:
                        tag_ann = TagAnnotationI()
                        tag_ann.setTextValue(rstring(t))
                        tag_cache[t] = tag_ann
                    tag_link = WellAnnotationLinkI()
                    tag_link.setParent(WellI(well_id, False))
                    tag_link.setChild(tag_ann)
                    links.append(tag_link)

    update_service = conn.getUpdateService()
    if len(links) > 0:
        try:
            saved_ann = update_service.saveAndReturnIds(links)
            # saved_links = update_service.saveAndReturnObject(link)
            print(f"✅ Saved {len(saved_ann)} new metadata annotations and links.")
        except Exception as e:
            print(f"{e}")
    # batch update the well annotation
    if len(annotations) > 0:
        try:
            saved_ann = update_service.saveCollection(annotations)
            # saved_links = update_service.saveAndReturnObject(link)
            print(f"✅ Update {len(saved_ann)} metadata annotations and links.")
        except Exception as e:
            print(f"{e}")
    return len(annotations) + len(links)

def append_well_metadata(
      conn,
      obj,
      object_type,
      tags,
      append_tags,
      existing_tags
    ):

    results = []
    # return results
    copy_tag_values = tags.copy()

    ol_namespace = "Well"
    if "namespace" in copy_tag_values:
        ol_namespace = copy_tag_values["namespace"]
        del copy_tag_values["namespace"]
    
    # internalID = f"omero.import_metadata_{ol_namespace}"
    # existing_obj = dulicate_object(conn, obj, object_type, "internalID", internalID)
    obj_id = obj.getId()
    isduplicateObj, existing_ann_id = duplicate_namespace_object(conn, object_type, obj_id, ol_namespace)
    for tag_dict in tags:
        print(tag_dict)
    # if isduplicateObj:
    #     update_obj_map_annotation = [
    #         (k, str(v))
    #         for k, v in copy_tag_values.items()
    #         if (k != "annotationID" and k not in rm_attrs) and len(str(v)) < 1000
    #     ]
    #     if existing_ann_id:
    #         ann_ids = [existing_ann_id]
    #         result = handle_map_annotations(
    #             conn, [obj], update_obj_map_annotation, ann_ids=ann_ids, ns=ol_namespace
    #         )
    #         results.append({"id": obj.getId(), "annotations": result.get("annId")})
    # else:
    #     copy_tag_values["internalID"] = f"omero.import_metadata_{ol_namespace}"
    #     new_obj_map_annotation = [
    #         (k, str(v))
    #         for k, v in copy_tag_values.items()
    #         if (k != "annotationID" and k not in rm_attrs) and len(str(v)) < 1000
    #     ]
    #     result = handle_map_annotations(conn, [obj], new_obj_map_annotation, ns=ol_namespace)
    #     new_ids = result.get("annId")
    #     if new_ids:
    #         # Save the newly created annotation id so that next time it will be updated.
    #         copy_tag_values["annotationID"] = new_ids[-1]
    #     results.append({"id": obj.getId(), "annotations": result.get("annId")})
    # if len(append_tags) > 0:
    #     # Fetch existing tags for the well
    #     # if existing_tags
    #     added_tags = TagManager.add_tag_to_well(conn, obj, append_tags, existing_tags)
    #     if len(added_tags) > 0:
    #         existing_tags = TagManager.get_existing_tag(conn)
    # tags = copy_tag_values
    return results
