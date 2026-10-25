import { constructProperty } from "../../utils2";
import { 
  formatBiosampleMetatdata, 
  formatImageMetatdata, 
  formatLayerMetatdata, 
  formatSpecimentMetatdata,
  formatStudyMetatdata
} from "./util";

const mapDefaulttAttributes = {
  study: {
    datasetUID: "datasetUID",
    supportingLinks: "supportingLinks",
    studyDescription: "studyDescription",
    imagingMethod: ["imagingMethod", "label"],
    dateBiosampleReceived: "dateBiosampleReceived",
    biosampleDescription: "biosampleDescription",
    biosampleLocation: "biosampleLocation",
    samplePrepDoneAtCMM: ["samplePrepDoneAtCMM", "label"],
    samplePrepStartDate: "samplePrepStartDate",
    sampleLocation: "sampleLocation",
    studyType: "studyType",
    specimenPrepDate: "specimenPrepDate",
    specimenLocation: "specimenLocation"  
  },
  sample: {
    "biosampleNameIDImageID": ["biosample", "sampleValue", "sampleId"],
    specimenID: "specimenId",
    specimenId: "specimenId",
    "biosampleDescription": "sampleDescription",
    "organism": ["organism", "value"],
    "speciesStrain": "speciesOrStrain",
    "cellLine": "cellLine",
    "biosampleType": ["sampleType", "value"],
    "extrinsicVariables" : "extrinsicVariables",
    "experimentalVariables": "experimentalVariables",
    "preparationMethod": ["preparationMethod", "value"],
    "otherPreparationDetails": "preparationDetails",
    "experimentalStatus": "specimenTypes",
    "gemTissueType": ["sampleValue", "gemStrain"],
    "specimenLocationMethod": ["specimenLocationMethod", 'label'],
    "channelIndexContent": "channelIndexContent",
    "channelIndexStain": "channelIndexStain",
    "location": "location",
    "caseID": "caseId",
    "biosample": ["biosample", "label"],
    "intrinsicVariables": "intrinsicVariables",
    "channelCount": "dimensions",
    'molecularEntity': "molecularEntity",
    "biosampleName": "sampleId",
  },
  specimen: {
    "biosampleNameIDImageID": ["biosample", "sampleValue", "sampleId"],
    "biosampleDescription": "sampleDescription",
    "organism": ["organism", "value"],
    "speciesStrain": "speciesOrStrain",
    "cellLine": "cellLine",
    "biosampleType": ["sampleType", "value"],
    "extrinsicVariables" : "extrinsicVariables",
    "experimentalVariables": "experimentalVariables",
    "preparationMethod": ["preparationMethod", "value"],
    "otherPreparationDetails": "preparationDetails",
    "experimentalStatus": "specimenTypes",
    experimentalTreatment: "experimentalTreatment",
    experimentalTreatments: "experimentalTreatment",
    "gemTissueType": ["sampleValue", "gemStrain"],
    "specimenId": "specimenId",
    specimenLocationMethod: ["specimenLocationMethod", "label"],
    "channelIndexContent": "channelIndexContent",
    "channelIndexStain": "channelIndexStain",
    "location": "location",
    "caseID": "caseId",
    "biosample": ["biosample", "label"],
    "intrinsicVariables": "intrinsicVariables",
    "channelCount": "dimensions",
    'molecularEntity': "molecularEntity",
    "biosampleName": "sampleId",
    fileName: "fileName",
    signalOrContrastMechanism: "signalOrContrastMechanism"
  },
}

const map2DatasetLabel = {};

const getMetadataLabel = (attr, customLabelMapping) => {
  if (map2DatasetLabel[attr]) {
    return map2DatasetLabel[attr];
  }
  return customLabelMapping[attr];
};

const getMapAttributes = (facilityId, formSection) => {
  let key = '';
  switch(`${formSection}`.toLowerCase()) {
    case "biosample":
    case "sample":
      key = "sample";
      break;
    case "specimen":
      key = "specimen";
      break;
    case "study":
    case "study component":
      key = "study";
      break;
    default:
      break;
  }
  // console.log(`formSection ${formSection} key ${key}`);
  return mapDefaulttAttributes[key] || {};
};

// map study to image level
const getStudyMetadata = (
  datasetLevelAttrs,
  map2DatasetAttributes,
  form,
  customLabelMapping
) => {
  const metadata = {};
  datasetLevelAttrs.forEach((attr) => {
    const key = map2DatasetAttributes[attr];
    const label = getMetadataLabel(attr, customLabelMapping);
    if (Array.isArray(key)) {
      let value = undefined;
      for (let item of key) {
        value = value ? value[item] : form[item];
      }
      if(value) {
        metadata[label] = value
      }
    }

    if (typeof key === 'string') {
      const value = form[key];
      if (key === "filePaths") {
        if (value && value?.length > 0) {
          value.forEach((item, index) => {
            const objectName = item?.name?.label2;
            const sampleId = item?.name?.sample?.sampleId;
            const specimenId = item?.name?.specimen?.specimenId;
            if (sampleId && specimenId) {
              const filePathLabel = `FilePath (Server Path) : ${objectName}`;
              metadata[filePathLabel] = item?.path;
            }
            if (!specimenId && sampleId) {
              const filePathLabel = `FilePath: ${objectName}`;
              metadata[filePathLabel] = item?.path;
            }
          });
        }
      } else {
        metadata[label] = value;
      }
    }
  });
  return metadata;
}

const getStudyMetaDataItems = (
  datasetLevelAttrs,
  map2DatasetAttributes,
  form,
  customLabelMapping
) => {
  const studyMetaData = [];
  const { samples = [] } = form;
  samples.forEach((sample) => {
    const { specimens = [] } = sample;
    specimens.forEach((specimen) => {
      const metadata = getStudyMetadata(
        datasetLevelAttrs,
        map2DatasetAttributes,
        form,
        customLabelMapping
      );
      metadata.imageID = specimen?.omeroObjectId;
      studyMetaData.push(metadata);
    });
  });
  return studyMetaData;
}

const getBiosampleMetadata = (
  datasetLevelAttrs,
  map2DatasetAttributes,
  form,
  customLabelMapping
) => {
  const { samples } = form;
  const sampleMetaData = [];
  samples.forEach((sample, index) => {
    const metadata = {};
    const { specimens } = sample;
      // const specimen = specimens[0];
    specimens.forEach(specimen => {
      datasetLevelAttrs.forEach((attr) => {
        const key = map2DatasetAttributes[attr];
        const label = getMetadataLabel(attr, customLabelMapping);

        // value of dropdown input
        if (Array.isArray(key)) {
          let value = undefined;
          for (let item of key) {
            value = value ? value[item] : sample[item];
          }
          if(value) {
            value = String(value);
            metadata[label] = value;
          }
        }

        // value of text input
        if (typeof key === 'string') {
          const value = String(sample[key] || '');
          metadata[label] = value;
        }
      });
      metadata.imageID = specimen?.omeroObjectId || null;
      sampleMetaData.push(metadata);
    })
  });
  return sampleMetaData;
};

const getChannelMetadata = (
  specimen,
  specimenMetadata
) => {
  specimen.channels.forEach((ch, index) => {
    specimenMetadata[`Channel ${index + 1} - Molecular Entity`] =
      typeof ch.molecularEntity === "object"
          ? (ch.molecularEntity.value || "") : ch.molecularEntity;
    specimenMetadata[`Channel ${index + 1} - Stain`] = ch.stain
      ? typeof ch.stain === "object"
        ? ch.stain.value || "" : ch.stain : "";
    specimenMetadata[`Channel ${index + 1} - Signal or Contrast Mechanism`] = 
      typeof ch.signalOrContrastMechanism === "object"
        ? ch.signalOrContrastMechanism.value : ch.signalOrContrastMechanism || "";
    if (ch?.proteinOfInterest) {
      specimenMetadata[`Channel ${index + 1} - Protein Of Interest`] = ch?.proteinOfInterest
    }
  });
};

const getSpecimenMetadata = (
  datasetLevelAttrs,
  map2DatasetAttributes,
  form,
  customLabelMapping
) => {
  const { samples } = form;
  const specimenMetaData = [];
  const keys = Object.keys(map2DatasetAttributes);
  samples.forEach((sample, index) => {
    const { specimens } = sample;
    specimens.forEach((specimen) => {
      const metadata = {};
      datasetLevelAttrs.forEach((attr) => {
        let matches = keys.filter(str =>
          str.toLowerCase().includes(attr.toLowerCase())
        );
        if (matches.length > 0) {
          const match = matches[0];
          const key = map2DatasetAttributes[match];
          const label = getMetadataLabel(attr, customLabelMapping);

          // value of dropdown input
          if (Array.isArray(key)) {
            let value = undefined;
            for (let item of key) {
              value = value ? value[item] : specimen[item];
            }
            if(value) {
              metadata[label] = value
            }
          }

          // value of text input
          if (typeof key === 'string') {
            const value = specimen[key];
            if (value?.label) {
              metadata[label] = String(value?.label  || '');
            }
            if(typeof value  === 'string') {
              metadata[label] = String(value || '');
            }
          }
        }
      });
      // channel metadata
      getChannelMetadata(specimen, metadata);
      metadata.imageID = specimen?.omeroObjectId || null;
      specimenMetaData.push(metadata);
    });
  });
  return specimenMetaData;
};

const appendTagValues = (appendTags, metadataItems) => {
  const fields = appendTags["Image Level"];
  const tags = [];
  const keys = Object.keys(metadataItems);
  keys.forEach((attr) => {
    fields.forEach((str) => {
      const field = str.toLowerCase();
      const metadataLabel = attr.toLowerCase();
      if (metadataLabel.includes(field)) {
        const value = metadataItems[attr];
        if (value) {
          tags.push(value);
          return;
        }
      }
    });
  });
  return tags;
}

export const getImageLevelMetadata = (
  hierarchyItems, 
  form, 
  appendTags, 
  fields,
) => {
  const imageMetadata = [];
  // img id - map to parent 
  const imageIDs = [];
  const hierarchyItemsKey = Object.keys(hierarchyItems);
  // console.log(form);

  for (let key of hierarchyItemsKey) {
    const keyLC = `${key}`.toLowerCase();
    const map2DatasetAttributes = getMapAttributes(form?.imagingFacility?.value, keyLC);

    const hierarchyItem = hierarchyItems[key];
    const formFields = hierarchyItem.attributes;
    if (!formFields) {
      return {};
    }
    const namespace = hierarchyItem.namespace;
    const labelMapping = {};
    formFields.forEach((item) => labelMapping[constructProperty(item)] = item);
    const datasetLevelAttrs = formFields.map((item) => constructProperty(item));

    // mapp study 2 image level
    if (keyLC == 'study' || keyLC === "study component") {
      const studyMetadataValues = getStudyMetaDataItems(
        datasetLevelAttrs, 
        map2DatasetAttributes,
        form,
        labelMapping,
      );
      // console.log(studyMetadataValues);
      studyMetadataValues.forEach(item => {
        item.namespace = namespace;
        imageIDs.push(item?.imageID || null);
        item.namespace = namespace;
        const tags = appendTagValues(appendTags, item);
        item.tags = tags;
      });
      imageMetadata.push(...studyMetadataValues);
    } 

    // mapping biosample 2 Image Level'
    if (keyLC == 'specimen') {
      if (fields) {
        const items = formatSpecimentMetatdata(form, namespace, key, fields);
        imageMetadata.push(...items);

      } else {
        const specimenMetadataValues = getSpecimenMetadata(
          datasetLevelAttrs, 
          map2DatasetAttributes,
          form,
          labelMapping,
        );
        // console.log('specimenMetadataValues');
        // console.log(specimenMetadataValues);
        specimenMetadataValues.forEach(item => {
          item.namespace = namespace;
          imageIDs.push(item?.imageID || null);
          const tags = appendTagValues(appendTags, item);
          item.tags = tags;
        });
        imageMetadata.push(...specimenMetadataValues);
      }
    }
    
    if (keyLC === "biosample" || keyLC == "sample") {
      if (fields) {
        // const items = formatBiosampleMetatdata(form, namespace, key, fields);
        // items.forEach(item => {
        //   if (item?.imageID) {
        //     imageIDs.push(item?.imageID);
        //   }
        // });
        // imageMetadata.push(...items);
      } else {
        const sampleMetadataValues = getBiosampleMetadata(
          datasetLevelAttrs,
          map2DatasetAttributes,
          form,
          labelMapping,
        );
        sampleMetadataValues.forEach(item => {
          item.namespace = namespace;
          imageIDs.push(item?.imageID || null);
          const tags = appendTagValues(appendTags, item);
          item.tags = tags;
        });
        imageMetadata.push(...sampleMetadataValues);
      }
    }
    
    if (keyLC === "image") {
      const imagesMetadataValues = formatImageMetatdata(form, key, fields);
      imagesMetadataValues.forEach((item) => {
        if (item?.imageID) imageIDs.push(item?.imageID || null)
      });
      imageMetadata.push(...imagesMetadataValues);
    }
    
    if (keyLC === "layer") {
      const layersMetadataValues = formatLayerMetatdata(form, key, fields);
      layersMetadataValues.forEach((item) => {
        if (item?.imageID) imageIDs.push(item?.imageID || null)
      });
      imageMetadata.push(...layersMetadataValues);
    }
  }

  // map study 2 images (one to many)
  // dynamic form
  for (let key of hierarchyItemsKey) {
    if (fields) {
      const keyLC = `${key}`.toLowerCase();
      if (keyLC == 'study' || keyLC === "study component") {
        const hierarchyItem = hierarchyItems[key];
        const namespace = hierarchyItem.namespace;
        const item = formatStudyMetatdata(
          form, namespace, key, fields
        );
        imageIDs.forEach((id) => {
          imageMetadata.push({
            ...item,
            imageID: id,
          });
        });
      }
    }
  }

  const distinctImageIDs = Array.from(new Set(imageIDs));
  return { imageMetadata, distinctImageIDs };
};