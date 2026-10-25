import { inputTypes } from "../../FormField/FieldTypes";

export const setOmeroObjectId = (
  fromObject,
  screenId,
  projectId,
  datasetId,
  plateId,
  imageId
) => {
  if (screenId || projectId) {
    fromObject.omeroScreenProjectId = screenId || projectId;
    return;
  }
  if (datasetId || plateId) {
    fromObject.omeroObjectId = datasetId || plateId;
    return;
  }
  fromObject.imageId = imageId;
};

// get field value based on input type
export const getFieldValue = (
  inputType,
  inputFieldName,
  obj,
) => {
  let value = undefined;
  if (!obj[inputFieldName]) {
    return null;
  }
  switch(inputType) {
    case inputTypes.DROPDOWN:
      value = obj[inputFieldName]['label']
      break;
    default:
      value = obj[inputFieldName];
    break;
  }
  return value;
};

export const getSectionMetadata = (fields, formValue) => {
  const jsonItem = {
    tags: []
  };
  fields.forEach(({
    label,
    inputType,
    inputFieldName,
    isTag,
    namespace,
  }) => {
    let value = getFieldValue(inputType, inputFieldName, formValue)
    if (value) {
      value = String(value);
      jsonItem[label] = value;
      if (isTag == "Yes") jsonItem.tags.push(value);
    }
    if (!jsonItem.namespace) {
      jsonItem.namespace = namespace;
    }
  });
  return jsonItem;
};

export const formatStudyMetatdata = (form, namespace, key, fields) => {
  const hierarchyFields = Object.values(fields[key] || fields[`${key}`.toLowerCase()]);
  if (hierarchyFields && hierarchyFields.length > 0) {
    const mappedFields = hierarchyFields
      .filter(({namespace: fieldNameSpace}) => namespace === fieldNameSpace);
    const jsonItem = getSectionMetadata(mappedFields, form);
    jsonItem.namespace = namespace;
    return jsonItem;
  }
};

export const formatBiosampleMetatdata = (
  form,
  namespace,
  key,
  fields,
) => {
  const samplesMetadata = [];
  const { samples } = form;
  const hierarchyFields = Object.values(fields[key] || fields[`${key}`.toLowerCase()]);
  if (hierarchyFields && hierarchyFields.length > 0) {
    const mappedFields = hierarchyFields
      .filter(({namespace: fieldNameSpace}) => namespace === fieldNameSpace);
    samples.forEach((sample, index) => {
      const jsonItem = getSectionMetadata(mappedFields, sample);
      jsonItem.omeroDatasetOrPlateID = sample?.omeroObjectId;
      samplesMetadata.push(jsonItem);
    });
  }
  return samplesMetadata;
}

export const formatChannelMetadata = (
  specimen,
  specimenMetadata,
  fields
) => {
  const hierarchyFields = Object.values(fields["channel"]);
  specimen.channels.forEach((ch, index) => {
    hierarchyFields.forEach(({
      label,
      inputType,
      inputFieldName,
      isTag
    }) => {
      let value = getFieldValue(inputType, inputFieldName, ch);
      if (value) {
        value = String(value);
        specimenMetadata[`Channel ${index + 1} -  ${label}`] = value;
        if (isTag == "Yes") specimenMetadata.tags.push(value);
      }
    });
  });
};

export const formatImageMetatdata = (form, key, fields) => {
  const metadataItems = [];
  const hierarchyFields = Object.values(fields[key] || fields[`${key}`.toLowerCase()]);
  if (hierarchyFields && hierarchyFields.length > 0) {
    const { imageInfos = [] } = form;
    imageInfos.forEach((img, index) => {
      const jsonObj = getSectionMetadata(hierarchyFields, img);
      jsonObj.imageID = img.imageId;
      // set namespace
      const namespace = jsonObj.namespace;
      jsonObj.namespace = `${namespace}-${index + 1}`;
      metadataItems.push(jsonObj);
    });
  }
  return metadataItems;
};

export const formatLayerMetatdata = (form, key, fields) => {
  const metadataItems = [];
  const hierarchyFields = Object.values(fields[key] || fields[`${key}`.toLowerCase()]);
  if (hierarchyFields && hierarchyFields.length > 0) {
    const { layerROIs = [] } = form;
    layerROIs.forEach((layer, index) => {
      const jsonObj = getSectionMetadata(hierarchyFields, layer);
      jsonObj.imageID = layer.imageId;
      // set namespace
      const namespace = jsonObj.namespace;
      jsonObj.namespace = `${namespace}-${index + 1}`;
      metadataItems.push(jsonObj);
    });
  }
  return metadataItems;
}

export const formatSpecimentMetatdata = (form, namespace, key, fields) => {
  const metadatas = [];
  const { samples } = form;
  const hierarchyFields = Object.values(fields[key] || fields[`${key}`.toLowerCase()]);
  if (hierarchyFields && hierarchyFields.length > 0) {
    const mappedFields = hierarchyFields
      .filter(({namespace: fieldNameSpace}) => namespace === fieldNameSpace);
    samples.forEach((sample, index) => {
      const { specimens = [] } = sample;
      specimens.forEach(specimen => {
        const jsonItem = getSectionMetadata(mappedFields, specimen);
        formatChannelMetadata(specimen, jsonItem, fields);
        // set namespace and omero object id
        if (sample?.omeroObjectId) {
          jsonItem.omeroDatasetOrPlateID = sample?.omeroObjectId;
        }
        if (specimen?.omeroObjectId) {
          jsonItem.imageID = specimen?.omeroObjectId || null;
        }
        jsonItem.namespace = namespace;
        metadatas.push(jsonItem);
      });
    });
  }
  return metadatas;
};
