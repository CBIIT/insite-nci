import omero
from omero.model import (
    TagAnnotationI, 
    PlateAnnotationLinkI, 
    ImageAnnotationLinkI, 
    WellAnnotationLinkI, 
    ScreenAnnotationLinkI, 
    DatasetAnnotationLinkI, 
    ProjectAnnotationLinkI,
    PlateI
)
from omero.rtypes import rstring

append_tags_2_object_types = {
    "Well": "Well Level",
    "Image": "Image Level",
    "Screen": "Screen Level",
}

# append tag to object types
class TagManager:

    @staticmethod
    def get_annotation_instance(object_type):
        if object_type:
            # Fetch annotations based on the object type
            if object_type == "Well":
                return WellAnnotationLinkI()
            elif object_type == "Plate":
                return PlateAnnotationLinkI()
            elif object_type == "Screen":
                return ScreenAnnotationLinkI()  # Get annotations for Screen
            elif object_type == "Image":
                return ImageAnnotationLinkI()  # Get annotations for Screen
            else:
                print(f"Unhandled object type: {object_type}")
                return None
        return None

    # @staticmethod
    # def add_tag_to_object(conn, obj, tag_values = [], existing_tags = {}):
    #     append_tags = []
    #     if obj is not None:
    #         annotations = list(obj.listAnnotations())
    #         appended_well_tags = TagManager.get_existing_tag_of_object(annotations)
    #         for tag_text in tag_values:
    #             if tag_text not in appended_well_tags:
    #                 # appended existing tags to well
    #                 if tag_text in existing_tags:
    #                     try: 
    #                         tag = existing_tags[tag_text]
    #                         obj.linkAnnotation(tag)
    #                     except Exception as e:
    #                         print(f"❌ Error accessing tag {tag_text}: {e}. Creating a new tag.")
    #                 else:
    #                     # if not append new tag to well
    #                     new_tag = TagAnnotationI()
    #                     new_tag.textValue = TagManager.truncate_string(tag_text)
    #                     append_tag = conn.getUpdateService().saveAndReturnObject(new_tag)
    #                     # Link the tag to the Well
    #                     link = TagManager.get_annotation_instance(obj)
    #                     link.setChild(append_tag)
    #                     link.setParent(obj._obj)
    #                     append_tags.append(link)

    #     if len(append_tags) > 0:
    #         conn.getUpdateService().saveArray(append_tags)
    #     return append_tags

    @staticmethod
    def add_tag_to_object(conn, obj, tag_values = [], existing_tags = {}):
        append_tags = []
        tags_text = []

        if obj is not None:
            annotations = list(obj.listAnnotations())
            appended_tags = TagManager.get_existing_tag_of_object(annotations)

            for tag_text in tag_values:
                if tag_text not in appended_tags and tag_text not in tags_text:
                    tags_text.append(tag_text)
                    tag = None

                    if tag_text in existing_tags:
                        try:
                            tag = existing_tags[tag_text]
                            _ = tag.getId()  # Access check (forces lazy-load to catch permission issues)
                            obj.linkAnnotation(tag)
                            continue  # Successfully linked; skip to next tag
                        except Exception as e:
                            print(f"⚠️ Failed to use existing tag '{tag_text}': {e}. Creating new tag.")

                    # If existing tag is inaccessible or doesn't exist, create a new tag
                    new_tag = TagAnnotationI()
                    new_tag.setTextValue(rstring(TagManager.truncate_string(tag_text)))
                    new_tag.setDescription(rstring("Generated due to access restriction or absence"))

                    append_tag = conn.getUpdateService().saveAndReturnObject(new_tag)

                    # Link the tag to the Dataset
                    link = DatasetAnnotationLinkI()
                    link.setChild(append_tag)
                    link.setParent(obj._obj)
                    append_tags.append(link)

        # Save all new links in a single batch
        if append_tags:
            conn.getUpdateService().saveArray(append_tags)

        return append_tags
    
    # prevent long string to attach as tag
    @staticmethod
    def truncate_string(s = '', limit=100):
        if len(s) <= limit:
            return rstring(s)
        return rstring(s[:limit] + "...")

    @staticmethod
    def add_tag_to_well(conn, well, tag_values = [], existing_tags = {}):
        # get global tags
        # existing_tags = TagManager.get_existing_tag(conn)
        append_tags = []
        tags_text = []
        if well is not None:
            annotations = list(well.listAnnotations())  
            appended_well_tags = TagManager.get_existing_tag_of_object(annotations)
            for tag_text in tag_values:
                if tag_text not in appended_well_tags and tag_text not in tags_text:
                    tags_text.append(tag_text)
                    # appended existing tags to well
                    if tag_text in existing_tags:
                        tag = existing_tags[tag_text]
                        well.linkAnnotation(tag)
                    else:
                        # if not append new tag to well
                        new_tag = TagAnnotationI()
                        new_tag.textValue = TagManager.truncate_string(tag_text)
                        # Save the tag to the server
                        append_tag = conn.getUpdateService().saveAndReturnObject(new_tag)
                        # update global tag pool
                        # Link the tag to the Well
                        link = WellAnnotationLinkI()
                        link.setChild(append_tag)
                        link.setParent(well._obj)
                        append_tags.append(link)

        if len(append_tags) > 0:
            conn.getUpdateService().saveArray(append_tags)
        return append_tags
            
    @staticmethod
    def add_tag_to_plate(conn, plate, tag_values = [], existing_tags = {}):
        append_tags = []
        tags_text = set()
        if plate is not None:
            # Get existing tags linked to the plate
            annotations = list(plate.listAnnotations())
            appended_plate_tags = TagManager.get_existing_tag_of_object(annotations)
    
            for tag_text in tag_values:
                if tag_text in tags_text or tag_text in appended_plate_tags:
                    continue
                tags_text.add(tag_text)
    
                try:
                    if tag_text in existing_tags:
                        tag = existing_tags[tag_text]
                        if hasattr(tag, 'getId'):  # ensure it's a valid, accessible tag
                            plate.linkAnnotation(tag)
                    else:
                        # Create and link new tag
                        new_tag = TagAnnotationI()
                        new_tag.setTextValue(rstring(TagManager.truncate_string(tag_text)))
                        append_tag = conn.getUpdateService().saveAndReturnObject(new_tag)
                        
                        # Link to plate
                        link = PlateAnnotationLinkI()
                        link.setChild(append_tag)
                        link.setParent(PlateI(plate.getId(), False))
                        append_tags.append(link)
    
                except Exception as e:
                    print(f"⚠️ Skipping tag '{tag_text}' due to error: {e}")

        # Save all new links
        if append_tags:
            try:
                conn.getUpdateService().saveArray(append_tags)
            except Exception as e:
                print(f"❌ Error saving tag links: {e}")


        return append_tags
    
    @staticmethod
    def add_tag_to_image(conn, image, tag_values = [], existing_tags = {}):
        append_tags =[]
        tags_text = []
        if image is not None:
            annotations = list(image.listAnnotations())
            appended_image_tags = TagManager.get_existing_tag_of_object(annotations)

            for tag_text in tag_values:
                if tag_text not in appended_image_tags and tag_text not in tags_text:
                    tags_text.append(tag_text)
                    tag = None
                    if tag_text in existing_tags:
                        # tag = existing_tags[tag_text]
                        # image.linkAnnotation(tag)
                        try:
                            tag = existing_tags[tag_text]
                            _ = tag.getId()  # force check for permission
                            image.linkAnnotation(tag)
                            continue
                        except Exception as e:
                            print(f"⚠️ Cannot reuse tag '{tag_text}': {e}. Creating new one.")
                        # new_tag = TagAnnotationI()
                        # new_tag.textValue = TagManager.truncate_string(tag_text)
                        # append_tag = conn.getUpdateService().saveAndReturnObject(new_tag)
                        # # Link the tag to the Well
                        # link = ImageAnnotationLinkI()
                        # link.setChild(append_tag)
                        # link.setParent(image._obj)
                        # append_tags.append(link)

                        # If existing tag is inaccessible or doesn't exist, create a new tag
                        new_tag = TagAnnotationI()
                        new_tag.setTextValue(rstring(TagManager.truncate_string(tag_text)))
                        new_tag.setDescription(rstring("Generated due to access restriction or absence"))

                        append_tag = conn.getUpdateService().saveAndReturnObject(new_tag)

                        # Link the tag to the Dataset
                        link = ImageAnnotationLinkI()
                        link.setChild(append_tag)
                        link.setParent(image._obj)
                        append_tags.append(link)
        # Save links
        if append_tags:
            conn.getUpdateService().saveArray(append_tags)

            
        return append_tags

    @staticmethod
    def add_tag_to_screen(conn, screen, tag_values = [], existing_tags = {}):
        append_tags =[]
        tags_text = []
        if screen is not None:
            annotations = list(screen.listAnnotations())
            appended_image_tags = TagManager.get_existing_tag_of_object(annotations)
            for tag_text in tag_values:
                if tag_text not in appended_image_tags and tag_text not in tags_text:
                    tags_text.append(tag_text)
                    if tag_text in existing_tags:
                        # tag = existing_tags[tag_text]
                        # screen.linkAnnotation(tag)
                        try:
                            tag = existing_tags[tag_text]
                            _ = tag.getId()  # force check for permission
                            screen.linkAnnotation(tag)
                            continue
                        except Exception as e:
                            print(f"⚠️ Cannot reuse tag '{tag_text}': {e}. Creating new one.")
                        
                    # else:
                        new_tag = TagAnnotationI()
                        new_tag.textValue = TagManager.truncate_string(tag_text)
                        append_tag = conn.getUpdateService().saveAndReturnObject(new_tag)
                        # Link the tag to the Well
                        link = ScreenAnnotationLinkI()
                        link.setChild(append_tag)
                        link.setParent(screen._obj)
                        append_tags.append(link)
        # Save links
        if len(append_tags) > 0:
            conn.getUpdateService().saveArray(append_tags)
        return append_tags
    
    @staticmethod
    def add_tag_to_project(conn, project, tag_values = [], existing_tags = {}):
        append_tags =[]
        tags_text = []
        if project is not None:
            annotations = list(project.listAnnotations())
            appended_image_tags = TagManager.get_existing_tag_of_object(annotations)
            for tag_text in tag_values:
                if tag_text not in appended_image_tags and tag_text not in tags_text:
                    tags_text.append(tag_text)
                    if tag_text in existing_tags:
                        # tag = existing_tags[tag_text]
                        # screen.linkAnnotation(tag)
                        try:
                            tag = existing_tags[tag_text]
                            _ = tag.getId()  # force check for permission
                            project.linkAnnotation(tag)
                            continue
                        except Exception as e:
                            print(f"⚠️ Cannot reuse tag '{tag_text}': {e}. Creating new one.")
                        
                    # else:
                        new_tag = TagAnnotationI()
                        new_tag.textValue = TagManager.truncate_string(tag_text)
                        append_tag = conn.getUpdateService().saveAndReturnObject(new_tag)
                        # Link the tag to the Well
                        link = ProjectAnnotationLinkI()
                        link.setChild(append_tag)
                        link.setParent(project._obj)
                        append_tags.append(link)
        # Save links
        if len(append_tags) > 0:
            conn.getUpdateService().saveArray(append_tags)
        return append_tags
    
    # @staticmethod
    # def add_tag_to_dataset(conn, dataset, tag_values = [], existing_tags = {}):
    #     append_tags = []
    #     tags_text = []

    #     if dataset is not None:
    #         annotations = list(dataset.listAnnotations())
    #         appended_image_tags = TagManager.get_existing_tag_of_object(annotations)
    #         for tag_text in tag_values:
    #             if tag_text not in appended_image_tags and tag_text not in tags_text:
    #                 tags_text.append(tag_text)
    #                 if tag_text in existing_tags:
    #                     tag = existing_tags[tag_text]
    #                     dataset.linkAnnotation(tag)
    #                 else:
    #                     new_tag = TagAnnotationI()
    #                     new_tag.textValue = TagManager.truncate_string(tag_text)
    #                     append_tag = conn.getUpdateService().saveAndReturnObject(new_tag)
    #                     # Link the tag to the Well
    #                     link = DatasetAnnotationLinkI()
    #                     link.setChild(append_tag)
    #                     link.setParent(dataset._obj)
    #                     append_tags.append(link)
    #     # Save links
    #     if len(append_tags) > 0:
    #         conn.getUpdateService().saveArray(append_tags)
    #     return append_tags

    @staticmethod
    def add_tag_to_dataset(conn, dataset, tag_values = [], existing_tags = {}):
        append_tags = []
        tags_text = []

        if dataset is not None:
            annotations = list(dataset.listAnnotations())
            appended_dataset_tags = TagManager.get_existing_tag_of_object(annotations)

            for tag_text in tag_values:
                if tag_text not in appended_dataset_tags and tag_text not in tags_text:
                    tags_text.append(tag_text)
                    tag = None

                    if tag_text in existing_tags:
                        try:
                            tag = existing_tags[tag_text]
                            _ = tag.getId()  # Access check (forces lazy-load to catch permission issues)
                            dataset.linkAnnotation(tag)
                            continue  # Successfully linked; skip to next tag
                        except Exception as e:
                            print(f"⚠️ Failed to use existing tag '{tag_text}': {e}. Creating new tag.")

                    # If existing tag is inaccessible or doesn't exist, create a new tag
                    new_tag = TagAnnotationI()
                    new_tag.setTextValue(rstring(TagManager.truncate_string(tag_text)))
                    new_tag.setDescription(rstring("Generated due to access restriction or absence"))

                    append_tag = conn.getUpdateService().saveAndReturnObject(new_tag)

                    # Link the tag to the Dataset
                    link = DatasetAnnotationLinkI()
                    link.setChild(append_tag)
                    link.setParent(dataset._obj)
                    append_tags.append(link)

        # Save all new links in a single batch
        if append_tags:
            conn.getUpdateService().saveArray(append_tags)

        return append_tags


    @staticmethod
    def get_all_tag_values(object, append_tags = {}):
        # check if the tags is in the append metadata from 
        if "tags" in object:
            return object["tags"]
        
        tags = []
        for key in append_tags:
            if key in object:
                # check for int val
                try:
                    tag_val = f"{object[key]}"
                    if len(tag_val) > 0:
                        tags.append(tag_val)
                except Exception as e:
                    print(f"tag value error {e}")
                
        return tags

    @staticmethod
    def delete_all_tags(conn, images):
        for image in images:
            print(f"Image ID: {image.getId()}, Name: {image.getName()}")
            if image:
            # Get all TagAnnotations linked to the image
                existing_tags = [ann for ann in image.listAnnotations() if isinstance(ann, TagAnnotationI)]
                print(existing_tags)
                for tag in existing_tags:
                    if isinstance(tag, omero.gateway.TagAnnotationWrapper):
                        link_id = tag.getLink().getId()
                        link = WellAnnotationLinkI(link_id, False)
                        conn.getUpdateService().deleteObject(link)
                        print(f"Removed tag '{tag.getTextValue()}' from Image ID: {image.getId()}")
    
    @staticmethod
    def get_existing_tag(conn):
        # add distinct tags
        tag_annotations = conn.getObjects("TagAnnotation")
        unique_tags = {}
        for tag in tag_annotations:
            key = tag.getTextValue()
            if key not in unique_tags:
                unique_tags[key] = tag

        return unique_tags
    
    @staticmethod
    def get_existing_tag_of_object(annotations):
        unique_tags = {}
        for ann in annotations:
            if isinstance(ann._obj, omero.model.TagAnnotationI):
                # print(f"Annotation ID: {ann.getId()}, Type: {ann.OMERO_TYPE}, Value: {ann.getValue()}")
                # print(f"existing tag value {ann.getValue()} ")
                existing_key_value = ann.getValue()
                if existing_key_value not in unique_tags:
                    unique_tags[existing_key_value] = ann._obj
        return unique_tags

    @staticmethod
    def append_tag_to_obj(conn, obj, object_type, append_tags, tag_dict, existing_tags):
        if object_type == "Image":
            if "Image Level" in append_tags:
                img_tags = append_tags["Image Level"]
                append_img_tags = TagManager.get_all_tag_values(tag_dict, img_tags)
                if len(append_img_tags) > 0:
                    added_tags = TagManager.add_tag_to_image(conn, obj, append_img_tags, existing_tags)
                    # update existing tag value with added new tags if any
                    if len(added_tags) > 0:
                        existing_tags = TagManager.get_existing_tag(conn)

        if object_type == "Project":
            if "Project Level" in append_tags:
                img_tags = append_tags["Project Level"]
                append_img_tags = TagManager.get_all_tag_values(tag_dict, img_tags)
                if len(append_img_tags) > 0:
                    added_tags = TagManager.add_tag_to_project(conn, obj, append_img_tags, existing_tags)
                    # update existing tag value with added new tags if any
                    if len(added_tags) > 0:
                        existing_tags = TagManager.get_existing_tag(conn)
        
        if object_type == "Dataset":
            if "Dataset Level" in append_tags:
                img_tags = append_tags["Dataset Level"]
                append_img_tags = TagManager.get_all_tag_values(tag_dict, img_tags)
                if len(append_img_tags) > 0:
                    added_tags = TagManager.add_tag_to_dataset(conn, obj, append_img_tags, existing_tags)
                    # update existing tag value with added new tags if any
                    if len(added_tags) > 0:
                        existing_tags = TagManager.get_existing_tag(conn)

        if object_type == "Screen":
            if "Screen Level" in append_tags:
                screen_tags = append_tags["Screen Level"]
                # print("add screen tags")
                append_screen_tags = TagManager.get_all_tag_values(tag_dict, screen_tags)
                if len(append_screen_tags) > 0:
                    added_tags = TagManager.add_tag_to_screen(conn, obj, append_screen_tags, existing_tags)
                    # update existing tag value with added new tags if any
                    if len(added_tags) > 0:
                        existing_tags = TagManager.get_existing_tag(conn)
                        
        if object_type == "Plate":
            if "Plate Level" in append_tags:
                screen_tags = append_tags["Plate Level"]
                # print("add screen tags")
                append_screen_tags = TagManager.get_all_tag_values(tag_dict, screen_tags)
                if len(append_screen_tags) > 0:
                    added_tags = TagManager.add_tag_to_plate(conn, obj, append_screen_tags, existing_tags)
                    # update existing tag value with added new tags if any
                    if len(added_tags) > 0:
                        existing_tags = TagManager.get_existing_tag(conn)

        if object_type == "Well":
            if "Well Level" in append_tags:
                screen_tags = append_tags["Well Level"]
                # print("add screen tags")
                append_screen_tags = TagManager.get_all_tag_values(tag_dict, screen_tags)
                if len(append_screen_tags) > 0:
                    added_tags = TagManager.add_tag_to_well(conn, obj, append_screen_tags, existing_tags)
                    # update existing tag value with added new tags if any
                    if len(added_tags) > 0:
                        existing_tags = TagManager.get_existing_tag(conn)
        return existing_tags

# key value pair