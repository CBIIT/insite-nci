
import { inputTypes } from "../../FormField/FieldTypes";
import { constructProperty } from "../../utils2";

// if key is required to change for metadata
const map2ProjectLabel = {
  email: "Project Scientist Email",
  imagingFacility: "Imaging Facility",
  imagingMethod: "Imaging Method",
  datasetId: "Dataset/Screen ID",
  screenID: "Dataset/Screen ID",
  principalInvestigator: "Principal Investigator",
  projectScientist: "Project Scientist",
};

/**
 * map to the attributes of the submitted form field
 * array = dropdown
 * string = input text or other value
 */
const attributesByFacilityId =  {
  9 : {
    dataProvenance: ["imagingFacility", "label"],
    pocEmail: "projectScientistEmail",
    projectPI: ["principalInvestigator", "label"],
    studyDatasetName: "datasetId",
    imagingMethod: "imagingMethod",
    imagingMethodOther: "imagingMethodOther",
    imagingFacility: "imagingFacility",
    studyDescription: "studyDescription",
    supportingLinks: "supportingLinks",
    // facility id 9
    projectName: "projectName",
    studyDatasetId: "datasetId",
    piLabOrBranchInstitute: ["piLabOrBranchInstitute", "label"],
    piEmail: "piEmail",
    projectPOC: "projectScientist",
    cmmProjectAppliaction: "cmmProjectAppliaction",
    dateBiosampleReceived: "dateBiosampleReceived",
    biosampleDescription: "biosampleDescription",
    biosampleLocation: "biosampleLocation",
    samplePrepDoneAtCMM: "samplePrepDoneAtCMM",
    samplePrepStartDate: "samplePrepStartDate",
    sampleLocation: "sampleLocation",
    studyType: "studyType",
    specimenPrepDate: "specimenPrepDate",
    specimenLocation: "specimenLocation",
    projectScientistEmail: "projectScientistEmail",
  }
};

const defaultAttributes = {
  datasetScreenID: "datasetId",
  imagingFacility: ["imagingFacility", "label"],
  principalInvestigator: ["principalInvestigator", "label"],
  projectScientist: "projectScientist",
  imagingMethod: "imagingMethod",
  supportingLinks: "supportingLinks",
  studyDescription: "studyDescription",
  projectScientistEmail: "email",
  organism: "organism",
  studyDatasetName: "datasetId",
};

const getMapAttributes = (facilityId) => {
  if (attributesByFacilityId[facilityId]) {
    return attributesByFacilityId[facilityId];
  }
  return defaultAttributes;
}

const getMetadataLabel = (attr, customLabelMapping) => {
  if (map2ProjectLabel[attr]) {
    return map2ProjectLabel[attr];
  }
  return customLabelMapping[attr];
};

/**
 * process study level metadata
 * @param {*} hierarchyItem 
 * @param {*} form 
 * @returns 
 */
export const getProjectLevelMetadata = (hierarchyItems, form, fields) => {
    // generate metadata based on namespace
    const projectLevelMetadata = [];
    const projectIds = [];
    const hierarchyItemsKey = Object.keys(hierarchyItems);
    
    for (let key of hierarchyItemsKey) {
      const hierarchyItem = hierarchyItems[key];
      const formFields = hierarchyItem.attributes;
      const namespace = hierarchyItem.namespace;
      
      // dynamically append metadata based on fields
      if (fields) {
      const hierarchyFields = Object.values(fields[key] || fields[`${key}`.toLowerCase()]);
      if (hierarchyFields && hierarchyFields.length > 0) {
        const mappedFields = hierarchyFields.filter(
          ({namespace: fieldNameSpace}) => namespace === fieldNameSpace
        );
        const jsonItem = {
          tags: []
        };
        mappedFields
        .filter((item) => item.inputType !== inputTypes.FILE)
        .forEach(({
          label,
          inputType,
          inputFieldName,
          isTag
        }) => {
          let value = undefined;
          if (inputType === inputTypes.DROPDOWN) {
            if (form[inputFieldName]) {
              value = form[inputFieldName]['label']
            }
          } else {
            if (form[inputFieldName]) {
              value = form[inputFieldName];
            }
          }

          if (value) {
            value = String(value);
            jsonItem[label] = value;
            if (isTag == "Yes") jsonItem.tags.push(value);
          }
        })

        // set namespace and omero object id
        jsonItem.omeroScreenProjectId = form.omeroScreenOrProjectId || null;
        if (form?.omeroScreenOrProjectId) {
          projectIds.push(form.omeroScreenOrProjectId);
        }
        jsonItem.namespace = namespace;
        projectLevelMetadata.push(jsonItem)
      }
      continue;
    }

      if (!formFields) {
        return {};
      }

      // create mapping based on namespace
      
      const labelMapping = {};
      formFields.forEach((item) => labelMapping[constructProperty(item)] = item);
      const projectLevelAttrs = formFields.map((item) => constructProperty(item));
      
      const namespaceJsonValue = {};

      const map2ProjectAttributes = getMapAttributes(form?.imagingFacility?.value);

      projectLevelAttrs.forEach((attr) => {
        const key = map2ProjectAttributes[attr];
        // get lebal for attribute
        const label = getMetadataLabel(attr, labelMapping);
        // retrive form value form
        // A. retrive value from dropdown field
        if (Array.isArray(key)) {
          let value = undefined;
          for (let item of key) {
            value = value ? value[item] : form[item];
          }
          if(value) {
            namespaceJsonValue[label] = String(value);
          }
        }
        // B. retrive value from any input field
        if (typeof key === 'string') {
          let fieldValue = form[key];
          if (fieldValue) {
            fieldValue = String(fieldValue || '');
            namespaceJsonValue[label] = fieldValue;
          }
        }
      });

      namespaceJsonValue.omeroScreenProjectId = form.omeroScreenProjectId || 0;
      if (form?.omeroScreenProjectId) {
        projectIds.push(form.omeroScreenProjectId);
      }
      namespaceJsonValue.namespace = namespace;
      projectLevelMetadata.push(namespaceJsonValue)
    }
    const distinctProjectIDs = Array.from(new Set(projectIds));
    return { projectLevelMetadata, distinctProjectIDs };
}