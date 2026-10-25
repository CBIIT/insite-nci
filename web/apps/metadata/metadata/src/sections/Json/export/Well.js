import { constructProperty } from "../../utils2";

// array indicates the position of the value in form state
const map2WellAttributes = {
  "biosampleName": ["biosample", "sampleValue", "sampleId"],
  "sampleId": ["biosample", "sampleValue", "sampleId"],
  "biosampleDescription": ["biosample", "sampleValue", "sampleDescription"],
  "organism": ["biosample", "sampleValue", "organism", "value"],
  "speciesStrain": ["biosample", "sampleValue", "speciesOrStrain"],
  "cellLine": ["biosample", "sampleValue", "cellLine"],
  "biosampleType": ["biosample", "sampleValue", "sampleType", "value"],
  // "intrinsicVariables" : ["biosample", "sampleValue", "intrinsicVariables"],
  // "extrinsicVariables" : ["biosample", "sampleValue", "extrinsicVariables"],
  // "experimentalVariables": ["biosample", "sampleValue", "experimentalVariables"],
  "preparationMethod": ["preparationMethod" , "label"],
  "otherPreparationDetails": "preparationDetails",
  "gemTissueType": ["sampleValue", "gemStrain"],
  "specimenID": "specimenID",
  "specimenLocationMethod": "specimenLocationMethod",
  "channelIndexContent": "channelIndexContent",
  "channelIndexStain": "channelIndexStain",
  "location": "location",
  // "signalOrContrastMechanism": "signalOrContrastMechanism",
  "caseID": "caseId",
  "plateID": "id",
  "plateType": "plateType",
  "biosample": ["biosample", "label"],
  "channelCount": "dimensions",
  // 'stain': "channels",
  // 'Stain': "channels",
  // 'molecularEntity': "channels"
}

export const getWellLevelMetadata = (hierarchyItems, form, appendTags) => {
  const tagFields = appendTags["Well Level"] || [];
  const keyValueByPlate = [];
  const hierarchyItemsKey = Object.keys(hierarchyItems);
  const namespaceMetadata = {};
  const distinctNamespaces = [];
  for (let key of hierarchyItemsKey) {
    const hierarchyItem = hierarchyItems[key];
    const formFields = hierarchyItem.attributes;
    if (!formFields) {
      return {};
    }
    const labelMapping = {};
    formFields.forEach((item) => labelMapping[constructProperty(item)] = item);
    namespaceMetadata[hierarchyItem.namespace] = labelMapping;
    distinctNamespaces.push(hierarchyItem.namespace);
  }

  if (form.multiwellPlates && form.multiwellPlates.length === 0) {
    return {};
  }
  form.multiwellPlates.forEach((plate) => {

    const wellsKeyValue = {};
    const wellMetadata = [];
    const rows = plate.dimensions?.rows || 0;
    const cols = plate.dimensions?.columns || 0;

    const { tables = {} } = plate;

    // set well specific values from tables
    const statusTable = tables?.experimentalStatus;
    const extrinsicVar = tables?.extrinsicVariables;
    const intrinsicVar = tables?.intrinsicVariables;
    const biosampleTable = tables?.biosample;
    const experimentalStatusTable = tables?.experimentalStatus;

    const preparationDetailsTable = tables?.preparationDetails;
    const preparationMethodTable = tables?.preparationMethod;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          for (let namespace of distinctNamespaces) {
            const well = {};
            for (const[key, value] of Object.entries(namespaceMetadata[namespace])) {
              
              const formKey = map2WellAttributes[key];
              if (Array.isArray(formKey)) {
                let fieldValue = undefined;
                // const biosample = plate.biosample;
                for (let item of formKey) {
                  fieldValue = fieldValue ? fieldValue[item] : plate[item];
                }
                if(fieldValue) {
                  well[value] = fieldValue;
                }
              } 
              
              // assign location
              if (formKey === "location") {
                const rowLetter = String.fromCharCode(65 + r); // 0 -> A, 1 -> B, etc.
                const location = `${rowLetter}${c + 1}`;
                well.location = location;
                well.rowIndex = r;
                well.colIndex = c;
              }

              // map to plate attr
              const plateKey = map2WellAttributes[key];
              if (typeof formKey === 'string') {
                // check for plate data
                if (plate[plateKey]) {
                  well[value] = plate[plateKey];
                }
              }

              // intrinsic / extrinsic / experimental table values
              // console.log(`check attribute ${key}`);
              // if (key === 'experimentalVariables' && statusTable) {
              //     const status = statusTable[r+1][c+1];
              //     if (status) {
              //         well["Experimental Status"] = status
              //     }
              // }
              if (namespace.includes('plate')) {
                if (key === 'extrinsicVariables' && extrinsicVar) {
                    const extVar = extrinsicVar[r+1][c+1];
                    if (extVar) {
                        well["Extrinsic Variables"] = extVar;
                    }
                }
                if (key === 'intrinsicVariables' && intrinsicVar) {
                    const intraVar = intrinsicVar[r+1][c+1];
                    if (intraVar) {
                        well["Intrinsic Variables"] = intraVar;
                    }
                }
                if (key === 'otherPreparationDetails' &&  preparationDetailsTable) {
                    const prepDetail = preparationDetailsTable[r+1][c+1];
                    if (prepDetail) {
                        well["Other Preparation Details"] = prepDetail;
                    }
                }
                if (key === 'preparationMethod' && preparationMethodTable) {
                    const prepMethod = preparationMethodTable[r+1][c+1];
                    if (prepMethod) {
                        well["Preparation Method"] = prepMethod;
                    }
                }
              }
            }

            if (namespace.includes('channel')) {
              // For each channel on the plate, add its info as additional keys.
              // const channelTables = tables.channels;
              if (plate.channels && plate.channels.length > 0) {
                plate.channels.forEach((channel, index) => {
                  const molecularEntityTable = channel.molecularEntity;
                  const molecularEntity = molecularEntityTable?.[r+1]?.[c+1]
                    || channel.molecularEntity.value || channel.molecularEntity || "";
                  const moleEntityLabel = `Channel ${index + 1} - Content`
                  well[moleEntityLabel] = molecularEntity;

                  if (tagFields.includes("Molecular Entity")
                    && !tagFields.includes(moleEntityLabel)) {
                    tagFields.push(moleEntityLabel);
                  }

                  const strainTable = channel?.stain;
                  const strain = strainTable?.[r+1]?.[c+1] || channel.stain.value || channel.stain || "";
                  const stainLabel = `Channel ${index + 1} - Stain`;
                  well[stainLabel] = strain;
                  
                  const rowLetter = String.fromCharCode(65 + r); // 0 -> A, 1 -> B, etc.
                  const location = `${rowLetter}${c + 1}`;
                  well.location = location;
                  well.rowIndex = r;
                  well.colIndex = c;

                  if (tagFields.includes("Stain")
                    && !tagFields.includes(stainLabel)) {
                    tagFields.push(stainLabel);
                  }
                  // well[`Channel ${index + 1} - content`] =
                  //   typeof channel.molecularEntity === "object"
                  //       ? channel.molecularEntity.value || "" : channel.molecularEntity;
                  // well[`Channel ${index + 1} - stain`] = channel.stain
                  //   ? typeof channel.stain === "object"
                  //     ? channel.stain.value || ""
                  //     : channel.stain
                  //   : "";
                  // Additional channel fields can be appended as needed.
                });
              }
            }

            // append specimen
            if (namespace.includes('specimen')){
              continue;
              // const biosample = plate?.biosample?.sampleValue;
              // const specimens = biosample?.specimens || [];
              // specimens.forEach((sp, index) => {
              //   const preparationMethod = sp["preparationMethod"]?.value || undefined;
              //   if (preparationMethod) {
              //     well[`Speciment ${index + 1} - Preparation Method`] = preparationMethod;
                  
              //   }
              //   const specimenLocationMethod = sp["specimenLocationMethod"]?.value || undefined;
              //   if (specimenLocationMethod) {
              //     well[`Speciment ${index + 1} - Location Method`] = specimenLocationMethod;
              //   }
              //   if(sp.specimenID) {
              //     well[`Speciment ${index + 1} - Specimen ID`] = sp?.specimenID;
              //   }
              // });
            }

            // add plate id
            well.plateID = plate.id;
            well.namespace = namespace;
            if (well["Plate ID"]) {
              delete well["Plate ID"];
            }

            // append tags
            const tagValues = [];
            tagFields.forEach((item) => {
              if (well[item]) {
                tagValues.push(well[item]);
              }
            });
            if (tagValues.length > 0) {
              well.tags = tagValues;
            }
            // wellInfo["plateID"] = plate.id;
            // wellInfo[namespace] = well;
            wellMetadata.push(well)
            if (!wellsKeyValue[well.location]) {
              wellsKeyValue[well.location] = [];
            }
            (wellsKeyValue[well.location]).push(well);
            if (!wellsKeyValue.plateID) {
              wellsKeyValue.plateID = plate.id;
            }
          }
        }
    }
    keyValueByPlate.push({ wellsKeyValue });
  });
  // return { wellMetadata, wellsKeyValue };
  return keyValueByPlate;
};