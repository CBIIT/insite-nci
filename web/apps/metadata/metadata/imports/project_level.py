
from omero.gateway import BlitzGateway, MapAnnotationWrapper, TagAnnotationWrapper
from omero.constants.metadata import NSCLIENTMAPANNOTATION
from omero.model import (
    TagAnnotationI, 
    AnnotationAnnotationLinkI, 
    NamedValue, 
    MapAnnotationI, 
    ProjectAnnotationLinkI, 
    ProjectI
)
import omero
from omero.rtypes import rstring, rlong
from .import_util import (
    dulicate_object,
    generate_annotation,
    find_existing_map_annotation,
    handle_map_annotations,
    duplicate_namespace_object,
)
rm_attrs = ["internalID", "omeroScreenProjectId", "tags", "namespace"]

def append_project_annotations(conn, project_key_value_tags):
    annotations = []
    links = []
    tag_cache = {}
    results = []

    for ann_data in project_key_value_tags:
        # image_id = ann_list["imageID"]
        project_id = ann_data.get("omeroScreenProjectId", None)
        if not project_id:
            print(f"❌ Project {project_id} not found.")
            continue

        project = conn.getObject("Project", int(project_id))
        if not project:
            print(f"❌ Image {project_id} not found.")
            continue

        project_id = int(project.getId())
        existing_by_ns = {}
        existing_tag_names = set()
        for ann in project.listAnnotations():
            if hasattr(ann, "getNs") and ann.getNs():
                existing_by_ns[ann.getNs()] = ann
            if isinstance(ann, TagAnnotationWrapper):
                existing_tag_names.add(ann.getTextValue())
            
        namespace = ann_data.get("namespace")
        if not namespace:
            continue
        map_ann = [
            NamedValue(k, str(v or ""))
            for k, v in ann_data.items()
            if (k != "annotationID" and k not in rm_attrs) and len(str(v)) < 1000
        ]
        tags = ann_data.get("tags", [])
        if namespace in existing_by_ns:
            exist_ann = existing_by_ns[namespace]
            ann_id = exist_ann.getId()
            new_ann = MapAnnotationI()
            new_ann.setId(rlong(ann_id))
            new_ann.setMapValue(map_ann)
            new_ann.setNs(rstring(namespace))
            annotations.append(new_ann)
            results.append({ "namespace": namespace, "annID": ann_id})
            for tag_name in tags:
                if tag_name in existing_tag_names:
                    continue
                if tag_name in tag_cache:
                    tag_ann = tag_cache[tag_name]
                else:
                    tag_ann = TagAnnotationI()
                    tag_ann.setTextValue(rstring(tag_name))
                    tag_cache[tag_name] = tag_ann
                tag_link = ProjectAnnotationLinkI()
                tag_link.setParent(ProjectI(project.id, False))
                tag_link.setChild(tag_ann)
                annotations.append(tag_link)
        else:
            ann = MapAnnotationI()
            ann.setNs(rstring(namespace))
            ann.setMapValue(map_ann)
            link = ProjectAnnotationLinkI()
            image_ref = ProjectI(project.id, False)
            link.setParent(image_ref)
            link.setChild(ann)
            annotations.append(ann)
            links.append(link)
            results.append({
                "namespace": namespace,
                "annID": ann.getId()
            })
            for tag_name in tags:
                if tag_name in existing_tag_names:
                    continue
                if tag_name in tag_cache:
                    tag_ann = tag_cache[tag_name]
                else:
                    tag_ann = TagAnnotationI()
                    tag_ann.setTextValue(rstring(tag_name))
                    tag_cache[tag_name] = tag_ann
                tag_link = ProjectAnnotationLinkI()
                tag_link.setParent(ProjectI(project.id, False))
                tag_link.setChild(tag_ann)
                links.append(tag_link)

    update_service = conn.getUpdateService()
    if len(links) > 0:
        try:
            saved_ann = update_service.saveAndReturnIds(links)
            print(f"✅ Saved {len(saved_ann)} new metadata annotations and links.")
        except Exception as e:
            print(f"{e}")

    if len(annotations) > 0:
        try:
            saved_ann = update_service.saveCollection(annotations)
            print(f"✅ Update {len(saved_ann)} metadata annotations and links.")
        except Exception as e:
            print(f"{e}")
    return results

def append_project_metadata(
      conn,
      obj,
      object_type,
      tags
    ):
    print('append project metadata')
    results = []
    # return results
    copy_tag_values = tags.copy()

    ol_namespace = "Project"
    if "namespace" in copy_tag_values:
        ol_namespace = copy_tag_values["namespace"]
        del copy_tag_values["namespace"]
    
    internalID = f"omero.import_metadata_{ol_namespace}"
    # existing_obj = dulicate_object(conn, obj, object_type, "internalID", internalID)
    obj_id = obj.getId()
    isduplicateObj, existing_ann_id = duplicate_namespace_object(conn, object_type, obj_id, ol_namespace)
    if isduplicateObj:
        update_obj_map_annotation = [
            (k, str(v or ""))
            for k, v in copy_tag_values.items()
            if (k != "annotationID" and k not in rm_attrs) and len(str(v)) < 1000
        ]
        if existing_ann_id:
            ann_ids = [existing_ann_id]
            # remove_attributes(obj)
            result = handle_map_annotations(
                conn, [obj], update_obj_map_annotation, ann_ids=ann_ids, ns=ol_namespace
            )
            results.append({"id": obj.getId(), "annotations": result.get("annId")})
    else:
        copy_tag_values["internalID"] = internalID
        new_obj_map_annotation = [
            (k, str(v or""))
            for k, v in copy_tag_values.items()
            if (k != "annotationID" and k not in rm_attrs) and len(str(v)) < 1000
        ]
        result = handle_map_annotations(conn, [obj], new_obj_map_annotation, ns=ol_namespace)
        new_ids = result.get("annId")
        if new_ids:
            # Save the newly created annotation id so that next time it will be updated.
            copy_tag_values["annotationID"] = new_ids[-1]
        results.append({"id": obj.getId(), "annotations": result.get("annId")})
    tags = copy_tag_values
    # if existing_obj:
    #     add_annotation_obj = generate_annotation(existing_obj, copy_tag_values)
    #     existing_ann_id = find_existing_map_annotation(
    #         obj, "internalID", internalID, ns=ol_namespace
    #     )
    #     update_obj_map_annotation = [
    #         (k, str(v))
    #         for k, v in add_annotation_obj.items()
    #         if (k != "annotationID" and k not in rm_attrs) and len(str(v)) < 1000
    #     ]
    #     print(f"existing ids {existing_ann_id}")
    #     if existing_ann_id:
    #         ann_ids = [existing_ann_id]
    #         result = handle_map_annotations(
    #             conn, [obj], update_obj_map_annotation, ann_ids=ann_ids, ns=ol_namespace
    #         )
    #         results.append({"id": obj.getId(), "annotations": result.get("annId")})
    # else:
    #     copy_tag_values["internalID"] = internalID
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
    # tags = copy_tag_values
    return results