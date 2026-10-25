import { constructProperty, safeClone } from "../../utils2";

const map2PlateAttributes = {
  "caseID": "caseId",
  "plateID": "id",
  "plateType": "plateType",
  "biosample": ["biosample", "sampleValue", "sampleId"],
  // "experimentalStatus": "specimenTypes",
  // "experimentalStatus": ["specimenType", "label"],
  "preparationMethod": "preparationMethod",
  "otherPreparationDetails": "preparationDetails",
  "intrinsicVariables": "intrinsicVariables",
  "extrinsicVariables": "extrinsicVariables",
  "channelCount": "dimensions",
  "columns": ["dimensions" , "columns"],
  "rows": ["dimensions" , "rows"],
  'stain': "channels",
  'Stain': "channels",
  'molecularEntity': "channels"
};

const drowpdown = [
  "imagingFacility",
  "imagingMethod",
  "principalInvestigator",
  "Preparation Method",
  "organism"
];

const plateLabel2DefaultLabel = {
  preparationMethod: "Default Preparation Method",
  otherPreparationDetails: "Default Preparation Details",
  intrinsicVariables: "Default Intrinsic Variables",
  extrinsicVariable: "Default Extrinsic Variables",
  extrinsicVariables: "Default Extrinsic Variables",
};

const getdropdownVal = (key, dropdownVal) => {
  if (drowpdown.includes(key)) {
    return dropdownVal?.value || '';
  }
  return false;
}

const excludeFields = ["Plate ID"] 

export const getPlateLevelMetadata = (hierarchyItems, form, appendTags) => {
  const platesKeyValue = {};
  const plateMetadata = [];
  const plateIDs = [];

  const tagFields = (appendTags["Plate Level"] || []).map(item => `${item}`.toLowerCase()) || [];
  // retrive plates
  const plates = form.multiwellPlates;
  if (plates && plates.length > 0) {
    plates.forEach((plate) => {
      const plateJsonValue = []
      const hierarchyItemsKey = Object.keys(hierarchyItems);
      for (let key of hierarchyItemsKey) {
        const namespaceJsonValue = {};
        const hierarchyItem = hierarchyItems[key];
        const formFields = hierarchyItem.attributes;
        if (!formFields) {
          return {};
        }
        const namespace = hierarchyItem.namespace;
        const labelMapping = {};
        formFields.forEach((item) => labelMapping[constructProperty(item)] = item);
        const plateLevelAttrs = formFields.map((item) => constructProperty(item));
        plateLevelAttrs.forEach(attr => {
          if (map2PlateAttributes[attr] == "channels") {
            // const channels = plate.channels || [];
            // channels.forEach((ch, index) => {
            //   let key = labelMapping[attr] || attr;
            //   let chItemValue = '';
            //   if(typeof ch[attr] === 'string') {
            //     // return ch[attr]
            //     chItemValue = ch[attr];
            //   }
            //   if(typeof ch[attr] === 'object') {
            //     // namespaceJsonValue[`Channel ${index + 1} - ${key}`] 
            //     chItemValue = ch[attr].label;
            //   }
            //   namespaceJsonValue[`Channel ${index + 1} - ${key}`] = chItemValue;
            //   // append metadata
            //   if (tagFields.includes(`${labelMapping[attr]}`.toLowerCase())) {
            //     if (appendTags["Plate Level"]) {
            //       (appendTags["Plate Level"]).push(`Channel ${index + 1} - ${key}`);
            //     }
            //   }
            // });
            // append form label as key is available
          } else if (map2PlateAttributes[attr]) {
            const key = map2PlateAttributes[attr];
            if (Array.isArray(key)) {
              let value = undefined;
              for (let item of key) {
                value = value ? value[item] : plate[item];
              }
              if (plateLabel2DefaultLabel[attr] || value) {
                let label = labelMapping[attr];
                if (plateLabel2DefaultLabel[attr]) {
                  label = plateLabel2DefaultLabel[attr];
                }
                namespaceJsonValue[label] = value
              }
              namespaceJsonValue.Dimensions = plate.dimensions.value || 0;
            }
            if (typeof key === 'string') {
              let fieldValue = plate[key];
              if (plateLabel2DefaultLabel[attr] || fieldValue) { 
              // get dropdown value 
                const dropdownValue = getdropdownVal(labelMapping[attr], fieldValue);
                if (dropdownValue != undefined) {
                  fieldValue = fieldValue?.value;
                }
                if (attr === "channelCount") {
                  fieldValue = plate.channels.length || 0;
                }
                let label = labelMapping[attr];
                if (plateLabel2DefaultLabel[attr]) {
                  label = plateLabel2DefaultLabel[attr];
                }
                if (!excludeFields.includes(label)) {
                  namespaceJsonValue[label] = fieldValue || '';
                }
              }
            }
          }
        });
        namespaceJsonValue.namespace = namespace;
        namespaceJsonValue.plateID = plate.id;
        if (plate.id) {
          plateIDs.push(plate.id);
        }
        // remove duplicate item
        // const updateNamespaceJsonValue = safeClone(namespaceJsonValue);
        // if (updateNamespaceJsonValue["Plate ID"]) {
        //   delete updateNamespaceJsonValue["Plate ID"];
        // }
        plateJsonValue.push(namespaceJsonValue);
      }
      // append tags
      platesKeyValue[plate.id] = plateJsonValue;
      plateMetadata.push(...plateJsonValue);
    });
  }
  console.log(platesKeyValue);
  const distinctPlateIDs = Array.from(new Set(plateIDs));
  return { plateMetadata, distinctPlateIDs, platesKeyValue };
}
