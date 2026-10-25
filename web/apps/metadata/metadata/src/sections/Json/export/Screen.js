import { constructProperty } from "../../utils2";


/**
 * map to the attributes of the submitted form state
 */
const map2StudyAttributes = {
  "datasetScreenID": "datasetId",
  "imagingFacility": "imagingFacility",
  "principalInvestigator": "principalInvestigator",  
  "projectScientist": "projectScientist",
  "imagingMethod": "imagingMethod",
  "supportingLinks": "supportingLinks",
  "studyDescription": "studyDescription",
  "projectScientistEmail": "email",
  "organism": "organism"
};

const map2ScreenLabel = {
  email: "Project Scientist Email",
  imagingFacility: "Imaging Facility",
  imagingMethod: "Imaging Method",
  datasetId: "screenID",
  screenID: "screenID",
  principalInvestigator: "Principal Investigator",
  projectScientist: "Project Scientist",
};

const drowpdown = [
  "imagingFacility",
  "imagingMethod",
  "principalInvestigator",
  "Preparation Method",
  "organism"
];

/**
 * process study level metadata
 * @param {*} hierarchyItem 
 * @param {*} form 
 * @returns 
 */
export const getScreenLevelMetadata = (hierarchyItems, form) => {
  const screen_levelMetadata = [];
  const screenIDs = [];
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
    const screenLevelAttrs = formFields.map((item) => constructProperty(item));
    const namespaceJsonValue = {};
    screenLevelAttrs.forEach(attr => {
      if (map2StudyAttributes[attr]) {
        let value = form[map2StudyAttributes[attr]];
        if (value) {
          if (drowpdown.includes(attr)) {
            if (map2ScreenLabel[attr]) {
              const label = map2ScreenLabel[attr];
              namespaceJsonValue[label] = value.label;
            } else {
              namespaceJsonValue[label[attr]] = value.label;
            }
          } else {
            if (labelMapping[attr]) {
              namespaceJsonValue[labelMapping[attr]] = value;
            } else {
              if (map2ScreenLabel[attr]) {
                const label = map2ScreenLabel[attr];
                namespaceJsonValue[label] = value;
              } else {
                namespaceJsonValue[labelMapping[attr]] = value;
              }
            }
          }
        }
      }
    });

    // namespaceJsonValue.screenID = form.datasetId || 0;
    namespaceJsonValue.namespace = namespace;
    // namespaceJsonValue.screenID = form.datasetId;
    // if (namespaceJsonValue["Dataset / Screen ID"]) {
    //   delete namespaceJsonValue["Dataset / Screen ID"];
    // }
    namespaceJsonValue.omeroScreenProjectId = form.omeroScreenProjectId || '';
    if (form?.omeroScreenProjectId) {
      screenIDs.push(form.omeroScreenProjectId);
    }
    screen_levelMetadata.push(namespaceJsonValue);
  }
  const distinctScreenIDs = Array.from(new Set(screenIDs));
  return { screen_levelMetadata, distinctScreenIDs };
};
