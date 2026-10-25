import omero
import numpy as np
import string

problematic_ann_ids = []


def get_objects(conn, type, ids=None):
    """
    Retrieves objects from the given connection.

    Parameters:
        conn (connection): The connection to retrieve the objects from.
        type (str): The type of objects to retrieve.
        ids (list, optional): The list of ids of the objects to retrieve.
            Defaults to None.

    Returns:
        list: The list of retrieved objects.
    """
    return conn.getObjects(type, ids)


def get_projects(conn, ids=None):
    """
    Retrieves projects from the database.

    Parameters:
        conn: The database connection object.
        ids (optional): A list of project IDs to retrieve. If not provided,
            all projects will be retrieved.

    Returns:
        A list of project objects.
    """
    return get_objects(conn, "Project", ids)


def get_screens(conn, ids=None):
    """
    Get screens based on the given connection and optional screen IDs.

    Parameters:
        conn (connection): The connection object used to access the screens.
        ids (list, optional): The list of screen IDs to retrieve.
            Defaults to None.

    Returns:
        list: The list of screen objects based on the provided IDs.
    """
    return get_objects(conn, "Screen", ids)


def get_plates(conn, ids=None):
    """
    Get plates from the given connection using the specified IDs.

    Parameters:
        conn (connection): The connection object used to retrieve the plates.
        ids (list, optional): The list of plate IDs to retrieve. If not
            provided, all plates will be retrieved.

    Returns:
        list: A list of plate objects.
    """
    return get_objects(conn, "Plate", ids)


def get_wells(conn, ids=None):
    """
    Get the wells from the given connection.

    Parameters:
        conn (Connection): The connection object.
        ids (List[int], optional): The list of well ids to retrieve.
            Defaults to None.

    Returns:
        List[Well]: The list of well objects retrieved from the database.
    """
    return get_objects(conn, "Well", ids)


def print_obj(obj, indent=0):
    """
    Print an object's information.

    Parameters:
        obj (object): The object to print.
        indent (int): The number of spaces to indent the object's information.

    Returns:
        None
    """
    print("""%s%s:%s  Name:"%s" (owner=%s)""" % (
        " " * indent,
        obj.OMERO_CLASS,
        obj.getId(),
        obj.getName(),
        obj.getOwnerOmeName()))


def dictionary_to_array(dic):
    """
    Converts a dictionary to a 2D array.

    Parameters:
        dic (dict): The dictionary to be converted.

    Returns:
        list: A 2D array where each inner array contains the key-value pairs
            from the dictionary.
    """
    arr = []
    for key in dic.keys():
        arr.append([key, dic[key]])
    return arr


def clear_tag_value(value):
    """
    Removes punctuation and extra spaces from the given string value.

    Parameters:
        value (str): The string value to be processed.

    Returns:
        str: The processed string value with punctuation and extra spaces
            removed.
    """
    v = value.translate(
        str.maketrans('', '', string.punctuation)).replace("  ", " ").strip()
    v = v.replace("_", "").replace("  ", " ")
    return v


def create_tag(description, value, conn):
    """
    Creates a tag in the given connection object with the specified
        `description` and `value`.

    Parameters:
        description (str): The description of the tag.
        value (str): The value of the tag.
        conn (Connection): The connection object to the database.

    Returns:
        TagAnnotation: The created tag object.
    """
    # Check existance of a tag:
    tags = conn.getObjects(
        "TagAnnotation", attributes={
            "textValue": clear_tag_value(value),
            "description": clear_tag_value(description)})
    for tag in tags:
        # print("Tag already found")
        return tag
    # print("Creating Tag")
    tag_ann = omero.gateway.TagAnnotationWrapper(conn)
    tag_ann.setValue(clear_tag_value(value))
    tag_ann.setDescription(clear_tag_value(description))
    tag_ann.save()
    return tag_ann


def create_annotation_from_dict(dic, conn, name=None):
    """
    Create an annotation from a dictionary.

    Parameters:
        dic (dict): The dictionary containing key-value pairs.
        conn (object): The connection object to the database.

    Returns:
        object: The created MapAnnotationWrapper object.
    """
    key_value_data = dictionary_to_array(dic)
    map_ann = omero.gateway.MapAnnotationWrapper(conn)
    namespace = omero.constants.metadata.NSCLIENTMAPANNOTATION
    map_ann.setNs(name if name is not None else namespace)
    map_ann.setValue(key_value_data)
    map_ann.save()
    return map_ann


def intermediate_table(df, key):
    """
    Generate an intermediate table from a pandas DataFrame.

    Parameters:
        df (pandas.DataFrame): The input DataFrame.
        key (str): The column name to group by.

    Returns:
        dict: The resulting nested dictionary.
        tuple: The unique keys of the resulting nested dictionary.
    """
    g = df[key].unique()
    d = {}
    for index in g:
        di = {}
        for col in df.columns:
            val = df[df[key] == index][col].astype(str).unique()
            if len(val) == 0:
                continue
            elif len(val) == 1:
                val = val[0]
            else:
                val = ", ".join(np.array(val).astype(str))
            di[col] = val
        d[index] = di
    return d, g


def clear_unexistent_cols(df, cols):
    """
    Remove any columns in the list `cols` that do not exist in the
    provided DataFrame `df`.

    Parameters:
        df: A pandas DataFrame. The DataFrame to check for column existence.
        cols: A list of strings. The list of columns to remove if they do not
            exist in `df`.

    Returns:
        cols: A list of strings. The updated list of columns after removing
            any non-existent columns.
    """
    to_rm = []
    for i in range(len(cols)):
        if cols[i] not in df.columns:
            to_rm.append(i)

    for i in reversed(range(len(to_rm))):
        del cols[to_rm[i]]

    return cols


def table_to_dict(df, cols, key):
    """
    Convert a Pandas DataFrame to a nested dictionary structure.

    Parameters:
        df (pandas.DataFrame): The DataFrame to be converted.
        cols (list of str): The names of the columns to include in the
            dictionary.
        key (str or tuple): The column name or tuple of column names
            to use as the key(s) for the nested dictionary.

    Returns:
        dict: The resulting nested dictionary.
        tuple: A tuple containing the unique keys and the inner keys of the
            resulting nested dictionary.
    """
    if len(cols) == 0:
        return {}, []

    cols = clear_unexistent_cols(df, cols)
    print(cols)

    dfx = df[cols].copy()
    dfx.drop_duplicates(inplace=True)

    if type(key) == str:
        return intermediate_table(dfx, key)

    g = dfx[key[0]].unique()
    d = {}
    for index in g:
        dfy = dfx[dfx[key[0]] == index]
        di, inner_g = intermediate_table(dfy, key[1])
        d[index] = di
    return d, (g, inner_g)


def row_lines_to_well_index(row, col):
    """
    Generates the well index from row and column values.

    Parameters:
        row (int): The row value of the well.
        col (int): The column value of the well.

    Returns:
        str: The well index generated from the row and column values.
    """
    r = chr(row + 96).upper()
    c = str(col) if col > 9 else "0" + str(col)
    return r + c


def unlink_annotations(obj, conn):
    """
    Unlinks the annotations associated with the given object.

    Parameters:
        obj: The object for which to unlink the annotations.
        conn: The connection to the database.

    Returns:
        None.
    """
    to_delete = []
    for ann in obj.listAnnotations():
        to_delete.append(ann.link.id)
    if len(to_delete) > 0:
        conn.deleteObjects("ImageAnnotationLink", to_delete, wait=True)


def delete_annotations(obj, conn):
    """
    Deletes annotations associated with an object.

    Parameters:
        obj (Object): The object for which to delete annotations.
        conn (Connection): The connection to the database.

    Returns:
        None
    """
    to_delete = [ann.id for ann in obj.listAnnotations()]
    if len(to_delete) > 0:
        conn.deleteObjects('Annotation', to_delete, wait=True)


def print_annotation_ids(obj, name, lvl):
    """
    Print the IDs of the annotations belonging to the specified object.

    Parameters:
        obj: The object for which to print the annotation IDs.
        name: The type name of the object.
        lvl: The indentation level for printing.

    Returns:
        None
    """
    ann_ids = [ann.id for ann in obj.listAnnotations()]
    print(f"{2*lvl*' '}{name} '{obj.id}' annotations ids: {ann_ids}")


def append_metadata(
        conn, obj, name, meta, lvl=1, show=False, delete_existing=False):
    """
    Appends metadata to an object.

    Parameters:
        conn (Connection): The database connection.
        obj (Object): The object to append metadata to.
        name (str): The name of the metadata.
        meta (dict): The metadata to append.
        lvl (int, optional): The level of the metadata. Defaults to 1.
        show (bool, optional): Whether to show the appended metadata.
            Defaults to False.
        delete_existing (bool, optional): Whether to delete existing metadata.
            Defaults to False.
    """
    print_obj(obj, 2*lvl)
    if delete_existing:
        delete_annotations(obj, conn)
    map_ann = create_annotation_from_dict(meta, conn, f"{name} Level")
    if map_ann.id not in problematic_ann_ids:
        try:
            obj.linkAnnotation(map_ann)
        except:
            # problematic_ann_ids.append(map_ann.id)
            print(f"Could not link map annotation: {map_ann.id}")
    if show:
        print_annotation_ids(obj, name, lvl)


def append_tags(conn, obj, name, tags, meta, lvl=1, show=False):
    """
    Appends tags to an object.

    Parameters:
        conn (connection): The connection object.
        obj (object): The object to which the tags will be appended.
        name (str): The name of the object.
        tags (list): A list of tags to be appended.
        meta (dict): A dictionary containing the metadata.
        lvl (int, optional): The hierarchical level of the object.
            Defaults to 1.
        show (bool, optional): Whether to display the annotation IDs.
            Defaults to False.
    """
    for tag in tags:
        if tag in meta.keys():
            tag_value = clear_tag_value(meta[tag])
            tag_ann = create_tag(tag, tag_value, conn)
            if tag_ann.id in problematic_ann_ids:
                continue
            try:
                obj.linkAnnotation(tag_ann)
            except:
                problematic_ann_ids.append(tag_ann.id)
                print(f"Could not link tag annotation '{clear_tag_value(tag)}': '{tag_value}' ({tag_ann.id})")
    if show:
        print_annotation_ids(obj, name, lvl)


def link_annotations(obj, mother_objs, name, lvl=1, show=False):
    """
    Generates a link between an object and a list of mother objects by linking
        their annotations.

    Parameters:
        obj (object): The object to link the annotations to.
        mother_objs (list or object): The list of mother objects or a single
            mother object.
        name (str): The type of the object.
        lvl (int, optional): The hierarchical level. Defaults to 1.
        show (bool, optional): Whether to show the annotation ids.
            Defaults to False.
    """
    if type(mother_objs) != list:
        mother_objs = [mother_objs]

    anns = [ann.id for ann in obj.listAnnotations()]
    for mother_obj in mother_objs:
        for ann in mother_obj.listAnnotations():
            if ann.id not in anns and ann.id not in problematic_ann_ids:
                try:
                    obj.linkAnnotation(ann)
                except:
                    # problematic_ann_ids.append(ann.id)
                    print(f"Could not link '{ann.id}'")
    if show:
        print_annotation_ids(obj, name, lvl)


def insert_metadata_level(
        conn, obj, name, meta, tags=[], lvl=1, show=False,
        delete_existing=False, link_anns=[]):
    """
    Inserts metadata at a specified level for an object.

    Parameters:
        conn (connection): The database connection.
        obj (object): The object to insert metadata for.
        name (str): The name of the object hierarchical level.
        meta (str): The metadata to insert.
        tags (list[str], optional): The tags to associate with the metadata.
            Defaults to an empty list.
        lvl (int, optional): The hierarchical level of the metadata.
            Defaults to 1.
        show (bool, optional): Indicates if the metadata should be shown.
            Defaults to False.
        delete_existing (bool, optional): Indicates if existing metadata
            should be deleted. Defaults to False.
        link_anns (list, optional): The annotations to link to the metadata.
            Defaults to an empty list.
    """
    append_metadata(
        conn, obj=obj, meta=meta,
        name=name, lvl=lvl, show=show, delete_existing=delete_existing)
    if len(tags) > 0:
        append_tags(
            conn, obj=obj, name=name, tags=tags,
            meta=meta, lvl=lvl, show=show)
    if len(link_anns) > 0:
        link_annotations(obj, link_anns, name, lvl=lvl, show=show)


def insert_metadata_project(
        conn, name, meta, keys, tags, show=False, delete_existing=False):
    """
    Inserts metadata for a project and its associated datasets and images.

    Parameters:
        conn (Connection): The connection object.
        name (str): The name of the project.
        meta (tuple): A tuple containing the metadata for the project,
            dataset, and image.
        keys (tuple): A tuple containing the keys for the project, dataset,
            and image metadata dictionaries.
        tags (dict): A dictionary containing the tags for different levels
            (project, dataset, image).
        show (bool, optional): Whether to print infos during the process.
            Defaults to False.
        delete_existing (bool, optional): Whether to delete existing metadata.
            Defaults to False.

    Returns:
        None
    """
    project_meta, dataset_meta, image_meta = meta
    project_keys, dataset_keys, image_keys = keys
    for project in conn.getObjects("Project", attributes={"name": name}):
        insert_metadata_level(
            conn, obj=project, meta=project_meta[project_keys[0]],
            name="Project", lvl=1, show=show, delete_existing=delete_existing,
            tags=tags["Project Level"], link_anns=[]
        )

        for dataset in project.listChildren():
            if dataset.name not in dataset_meta.keys():
                print(f"DATASET NAME {dataset.name} NOT IN KEYS: {dataset_meta.keys()}")
                raise Exception(f"DATASET NAME {dataset.name} NOT IN KEYS: {dataset_meta.keys()}")
            if len(dataset_meta) > 0 and dataset.name in dataset_meta.keys():
                insert_metadata_level(  # dataset.name
                    conn, obj=dataset, meta=dataset_meta[dataset.name], #meta=dataset_meta["20230502_DS"],
                    name="Dataset", lvl=2, show=show, link_anns=[project],
                    delete_existing=delete_existing, tags=tags["Dataset Level"]
                )
            elif len(dataset_meta) == 0:
                link_annotations(
                    dataset, [project], "Dataset", lvl=2, show=show)

            for image in dataset.listChildren():
                if image.name not in image_meta.keys():
                    print(f"IMAGE NAME {image.name} NOT IN KEYS: {image_meta.keys()}")
                    raise Exception(f"IMAGE NAME {image.name} NOT IN KEYS: {image_meta.keys()}")
                if len(image_meta) > 0 and image.name in image_meta.keys():
                    insert_metadata_level(
                        conn, obj=image, meta=image_meta[image.name],
                        name="Image", show=show, lvl=3,
                        delete_existing=delete_existing,
                        tags=tags["Image Level"], link_anns=[project, dataset]
                    )
                elif len(image_meta) == 0:
                    link_annotations(
                        image, [project, dataset], "Image", lvl=3, show=show)


def insert_metadata_screen(
        conn, name, meta, keys, tags, show=False, delete_existing=False):
    """
    Inserts metadata for a screen and its children objects into the database.

    Parameters:
        conn (connection): The connection object.
        name (str): The name of the screen.
        meta (tuple): A tuple containing metadata for the screen and its
            children objects.
        keys (tuple): A tuple containing the keys for accessing the metadata.
        tags (dict): A dictionary containing tags for different levels of the
            metadata.
        show (bool, optional): Whether to print infos during the process.
            Defaults to False.
        delete_existing (bool, optional): Whether to delete existing metadata.
            Defaults to False.

    Returns:
        None
    """
    screen_meta, plate_meta, well_meta, image_meta = meta
    screen_keys, plate_keys, well_keys, image_keys = keys
    for screen in conn.getObjects("Screen", attributes={"name": name}):
        insert_metadata_level(
            conn, obj=screen, meta=screen_meta[screen_keys[0]], name="Screen",
            lvl=1, show=show, delete_existing=delete_existing,
            tags=tags["Screen Level"], link_anns=[]
        )

        for plate in screen.listChildren():
            if len(plate_meta) > 0 and plate.name in plate_meta.keys():
                insert_metadata_level(
                    conn, obj=plate, meta=plate_meta[plate.name], name="Plate",
                    lvl=2, show=show, delete_existing=delete_existing,
                    tags=tags["Plate Level"], link_anns=[screen]
                )
            else:
                link_annotations(plate, [screen], "Plate", lvl=2, show=show)

            for well in plate.listChildren():
                well_index = row_lines_to_well_index(well.row+1, well.column+1)
                if len(well_meta[plate.name]) > 0 and well_index in well_meta[plate.name].keys():
                    insert_metadata_level(
                        conn, obj=well, meta=well_meta[plate.name][well_index], show=show,
                        lvl=3, delete_existing=delete_existing, name="Well",
                        tags=tags["Well Level"], link_anns=[screen, plate]
                    )
                else:
                    link_annotations(
                        well, [screen, plate], "Well", lvl=3, show=show)

                continue
                indexes = well.countWellSample()
                for index in range(1, indexes+1):
                    image = well.getImage(index-1)
                    if len(image_meta) > 0 and \
                            well_index in image_meta.keys() and \
                            index in image_meta[well_index].keys():
                        insert_metadata_level(
                            conn, obj=image, delete_existing=delete_existing,
                            tags=tags["Image Level"], name="Image", lvl=4,
                            link_anns=[screen, plate, well], show=show,
                            meta=image_meta[well_index][index],
                        )
                    else:
                        link_annotations(
                            image, [screen, plate, well],
                            "Image", lvl=4, show=show)


def insert_metadata(
        conn, img_type, name, meta, keys, tags,
        show=False, delete_existing=False):
    """
    Insert metadata for different experiment types into the database.

    Parameters:
        conn (connection): The connection object.
        img_type (str): The type of the image ("Project" or "Screen").
        name (str): The name of the project/screen.
        meta (tuple): A tuple containing metadata for the project/screen and
            its children objects.
        keys (tuple): A tuple containing the keys for accessing the metadata
            levels.
        tags (dict): A dictionary containing tags for different levels of the
            metadata.
        show (bool, optional): Whether to print infos during the process.
            Defaults to False.
        delete_existing (bool, optional): Whether to delete existing metadata.
            Defaults to False.
    """
    if img_type == "Project":
        insert_metadata_project(
            conn, name, meta, keys, tags, show, delete_existing)
    elif img_type == "Screen":
        insert_metadata_screen(
            conn, name, meta, keys, tags, show, delete_existing)
