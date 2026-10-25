
import { inputTypes } from "../../FormField/FieldTypes";
import { constructProperty } from "../../utils2";
import { 
  formatSpecimentMetatdata, 
  formatBiosampleMetatdata,
  formatStudyMetatdata
} from "./util";

const map2DatasetLabel = {
  email: "Project Scientist Email",
  imagingFacility: "Imaging Facility",
  imagingMethod: "Imaging Method",
  datasetId: "Dataset/Screen ID",
  screenID: "Dataset/Screen ID",
  principalInvestigator: "Principal Investigator",
  projectScientist: "Project Scientist",
};

/**
 * map to the attributes of the submitted form state
 */
const mapDefaulttAttributes = {
  study: {
    datasetScreenID: "datasetId",
    imagingFacility: ["imagingFacility", "label"],
    principalInvestigator: "principalInvestigator",  
    projectScientist: "projectScientist",
    imagingMethod: ["imagingMethod", "label"],
    supportingLinks: "supportingLinks",
    studyDescription: "studyDescription",
    projectScientistEmail: "email",
    organism: "organism",
    studyDatasetName: "datasetId",
    filePaths: "filePaths",
  },
  biosample: {
    biosampleName: "sampleId",
    sampleId: "sampleId",
    biologicalEntity: "sampleDescription",
    organismNCBITaxonomy: "organismNCBITaxonomy",
    organism: ["organism", "label"],
    biosampleType: ["sampleType", "label"],
    biosampleDescription: "sampleDescription",
    sampleDescription: "sampleDescription",
    coarseInformalTaxonomy: "coarseInformalTaxonomy",
    anatomicalOriginNCIThesaurus: "anatomicalOrigin",
    coarseAnatomicalOrigin: "coarseAnatomicalOrigin",
    cellType: "cellType",
    intrinsicVariables: "intrinsicVariables",
    extrinsicVariables: "extrinsicVariables",
    extrinsicVariableExperimentalTreatment: "extrinsicVariables",
    experimentalVariables: "experimentalVariables",
    experimentalStatus: ["experimentalStatus", "label"],
    cellLine: ['cellLine', 'label'],
    speciesStrain: 'speciesOrStrain',
  },
  specimen: {
    experimentalStatus: ["experimentalStatus", "label"],
    samplePrepProtocol: "samplePrepProtocol",
    specimenPrepDetails: "specimenPrepDetails",
    cmmSpecimenUID: "cmmSpecimenUID"
  }
};

const getMapAttributes = (facilityId, formSection, fields, namespace) => {
  let key = '';
  switch(formSection) {
    case "study":
    case "study component":
      key = "study";
      break;
    case "biosample":
    case "sample":
      key = "biosample";
      break;
    case "specimen":
      key = "specimen";
      break;
    default:
      break;
  }

  if (fields) {
    const attributes = {};
    const hierarchyFields = Object.values(fields[key] || fields[`${key}`.toLowerCase()]);
    if (hierarchyFields && hierarchyFields.length > 0) {
      const mappedFields = hierarchyFields
        .filter(({namespace: fieldNameSpace}) => namespace === fieldNameSpace);
      mappedFields.forEach(({
        inputType,
        inputFieldName,
      }) => {
        if (inputType === inputTypes.DROPDOWN) {
          attributes[inputFieldName] = [inputFieldName, 'label'];
        } else {
          attributes[inputFieldName] = inputFieldName;
        }
      });
    }
    return attributes;
  }

  return mapDefaulttAttributes[key];
};

const getMetadataLabel = (attr, customLabelMapping) => {
  if (map2DatasetLabel[attr]) {
    return map2DatasetLabel[attr];
  }
  return customLabelMapping[attr];
};

/**
* generate metadata based on namespace
*/
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
};

const getSpecimenMetadata = (
  datasetLevelAttrs,
  map2DatasetAttributes,
  form,
  customLabelMapping
) => {
  const metadataObjectList = [];
  const { samples } = form;
  samples.forEach((sample) => {
    const { specimens } = sample;
    specimens.forEach((specimen, index) => {
      // specimen attributes
      const metadataObject = {};
      datasetLevelAttrs.forEach((attr) => {
        const key = map2DatasetAttributes[attr];
        const label = getMetadataLabel(attr, customLabelMapping);
        if (Array.isArray(key)) {
          let value = undefined;
          for (let item of key) {
            value = value ? value[item] : specimen[item];
          }
          if(value) {
            metadataObject[label] = value;
          }
        }
        if (typeof key === 'string') {
          const value = specimen[key] || '';
          metadataObject[label] = value
        }
      });

      const { channels = [] } = specimen;
      channels.forEach((ch, index) => {
        metadataObject[`Channel ${index + 1} - Molecular Entity`] =
          typeof ch.molecularEntity === "object"
              ? (ch.molecularEntity.value || "") : ch.molecularEntity;
        metadataObject[`Channel ${index + 1} - Stain`] = ch.stain
          ? typeof ch.stain === "object"
            ? ch.stain.value || "" : ch.stain : "";
        metadataObject[`Channel ${index + 1} - Signal or Contrast Mechanism`] = (typeof ch.signalOrContrastMechanism === "object")
            ? ch.signalOrContrastMechanism.value : ch.signalOrContrastMechanism || "";
        if (ch?.proteinOfInterest) {
          metadataObject[`Channel ${index + 1} - Protein Of Interest`] = ch?.proteinOfInterest
        }
      });
      metadataObject.omeroDatasetOrPlateID = sample.omeroObjectId || null;
      metadataObjectList.push(metadataObject);
    })
  });
  return metadataObjectList;
};

const getBiosampleMetadata = (
  datasetLevelAttrs,
  map2DatasetAttributes,
  form,
  customLabelMapping,
) => {
  // console.log("getBiosampleMetadata");
  // console.log(projectLevelAttrs);
  const metadataObjectList = [];
  const { samples } = form;
  samples.forEach((sample) => {
    const metadataObject = {};
    datasetLevelAttrs.forEach((attr) => {
      const key = map2DatasetAttributes[attr];
      const label = getMetadataLabel(attr, customLabelMapping);
      if (Array.isArray(key)) {
        let value = undefined;
        for (let item of key) {
          value = value ? value[item] : sample[item];
        }
        if(value) {
          metadataObject[label] = value
        }
      }
      if (typeof key === 'string') {
        const value = sample[key] || '';
        metadataObject[label] = value
      }
    });
    // metadataObject.imageID = sample.sampleId;
    metadataObject.omeroDatasetOrPlateID = sample.omeroObjectId || null;
    metadataObjectList.push(metadataObject);
  });

  // console.log("metadataObjectList");
  // console.log(metadataObjectList);
  return metadataObjectList;
}

/**
* process study level metadata
* @param {*} hierarchyItem 
* @param {*} form 
* @returns 
*/
export const getDatasetLevelMetadata = (
  hierarchyItems,
  form,
  fields,
) => {
    const datasetLevelMetadata = [];
    const datasetIDs = [];
    const hierarchyItemsKey = Object.keys(hierarchyItems);
    
    for (let key of hierarchyItemsKey) {
      const hierarchyItem = hierarchyItems[key];
      const formFields = hierarchyItem.attributes;
      if (!formFields) {
        return {};
      }
      const namespace = hierarchyItem.namespace;
      const labelMapping = {};
      formFields.forEach((item) => labelMapping[constructProperty(item)] = item);
      const datasetLevelAttrs = formFields.map((item) => constructProperty(item));
      let namespaceJsonValue = {};

      const keyLC = `${key}`.toLowerCase();
      let map2DatasetAttributes = getMapAttributes(
        form?.imagingFacility?.value,
        keyLC,
        fields,
        namespace
      );
      if (!map2DatasetAttributes) {
        continue;
      }

      // mapping study 2 Dataset Level
      if (keyLC === "study" || keyLC === "study component") {
        if (fields) {
          const studyMetadata = formatStudyMetatdata(form, namespace, key, fields);
          const { samples } = form;
          samples.forEach((sample) => {
            datasetIDs.push(sample?.omeroObjectId);
            datasetLevelMetadata.push({
              ...studyMetadata,
              omeroDatasetOrPlateID: sample?.omeroObjectId || null,
            });
          });
          
        } else {
          const { samples } = form;
          const exporedDatasetIds = [];
          samples.forEach((sample) => {
            if (!exporedDatasetIds.includes(sample?.omeroObjectId)) {
              namespaceJsonValue = getStudyMetadata(
                datasetLevelAttrs, 
                map2DatasetAttributes, 
                form,
                labelMapping
              );
              namespaceJsonValue.omeroDatasetOrPlateID = sample?.omeroObjectId || 0;
              namespaceJsonValue.namespace = namespace;
              exporedDatasetIds.push(sample?.omeroObjectId);
              datasetLevelMetadata.push(namespaceJsonValue);
            }
          });
          if (form?.omeroDatasetID) {
            namespaceJsonValue = getStudyMetadata(
              datasetLevelAttrs, 
              map2DatasetAttributes, 
              form,
              labelMapping
            );
            namespaceJsonValue.omeroDatasetOrPlateID = form?.omeroDatasetID || 0;
            namespaceJsonValue.namespace = namespace;
            exporedDatasetIds.push(form?.omeroDatasetID);
            datasetIDs.push(form?.omeroDatasetID)
            datasetLevelMetadata.push(namespaceJsonValue);
          }
        }
        
      }

      // mapping biosample 2 Dataset Level
      if (keyLC === "biosample" || keyLC === "sample") {
        if (fields) {
          const items = formatBiosampleMetatdata(form, namespace, key, fields);
          datasetLevelMetadata.push(...items);
        } else {
          const samplesNamespaceJsonValues = getBiosampleMetadata(
            datasetLevelAttrs, 
            map2DatasetAttributes, 
            form,
            labelMapping
          );
          samplesNamespaceJsonValues.forEach(item => {
            item.namespace = namespace;
          });
          datasetLevelMetadata.push(...samplesNamespaceJsonValues);
        }
      }

      // mapping specimen 2 Dataset Level
      if (keyLC === "specimen") {
        if (fields) {
            const items = formatSpecimentMetatdata(form, namespace, key, fields);
            datasetLevelMetadata.push(...items);
          } else {
          // console.log(datasetLevelAttrs);
          // console.log(map2DatasetAttributes);
          const specimensMetadataValues = getSpecimenMetadata(
            datasetLevelAttrs,
            map2DatasetAttributes,
            form,
            labelMapping
          );
          specimensMetadataValues.forEach(item => {
            item.namespace = namespace;
            if(item?.omeroDatasetOrPlateID) {
              datasetIDs.push(item.omeroDatasetOrPlateID);
            }
          });
          datasetLevelMetadata.push(...specimensMetadataValues);
        }
      }
    }
  const distinctDatasetIDs = Array.from(new Set(datasetIDs));
  return { datasetLevelMetadata, distinctDatasetIDs };
}