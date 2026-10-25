import { mapTemplateHierarchy } from "../Json/export/export";

export const getProjectFileMetadata = (hierarchyItems, form, fileData) => {
    hierarchyItems.forEach(({
      fieldName,
    }) => {
        if (form[fieldName]) {
            fileData.append("project_files", form[fieldName]);
        }
    });
    const projectFiles = fileData.getAll("project_files");
    if (projectFiles?.length > 0) {
        const omeroProjectId = form.omeroScreenOrProjectId || null;
        fileData.append("ProjectID", omeroProjectId);
        return projectFiles?.length;
    }
    return 0;
};
/**
 * craete formData to append file to omero
 */
export const exportFileMetadata = (
    form,
    displayFields,
) => {
    const { 
        // hierarchyMapping, 
        fileHiearchyMapping, 
        // appendTags,
    } = mapTemplateHierarchy(displayFields);
    const hierarchies = Object.keys(fileHiearchyMapping);
    const fileData = new FormData();
    let noOfFiles = 0;
    // formData.append("project_annotation_files", file)
    for (let hierarchy of hierarchies) {
        const hierarchyItems = fileHiearchyMapping[hierarchy];
        // screen level metadata
        switch(hierarchy) {
            case "Project Level":
                // append project level files
                const count = getProjectFileMetadata(hierarchyItems, form, fileData);
                if (count > 0) {
                    noOfFiles += count;
                }
                break;
        }
    }
    if (noOfFiles > 0) {
        return fileData
    }
    return null;
};
