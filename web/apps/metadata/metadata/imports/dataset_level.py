
from omero.gateway import BlitzGateway, MapAnnotationWrapper
from omero.constants.metadata import NSCLIENTMAPANNOTATION
from omero.model import TagAnnotationI, MapAnnotationI
import omero
from omero.rtypes import rstring
from .import_util import (
    dulicate_object,
    generate_annotation,
    find_existing_map_annotation,
    handle_map_annotations,
    duplicate_namespace_object,
)
rm_attrs = ["internalID", "datasetID", "omeroDatasetOrPlateID", "tags", "tag", "imageID"]

def append_dataset_metadata(
      conn,
      obj,
      object_type,
      tags
    ):
    results = []
    # return results
    copy_tag_values = tags.copy()

    ol_namespace = "Dataset"
    if "namespace" in copy_tag_values:
        ol_namespace = copy_tag_values["namespace"]
        del copy_tag_values["namespace"]
        
    internalID = f"omero.import_metadata_{ol_namespace}"
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
            (k, str(v or ""))
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

    # existing_obj = dulicate_object(conn, obj, object_type, "internalID", internalID)
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