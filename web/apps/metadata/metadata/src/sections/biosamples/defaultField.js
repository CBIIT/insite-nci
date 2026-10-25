import { inputTypes } from "../FormField/FieldTypes";
import options from "./defaultOptions.json";

export const coreFields = {
  omeroScreenOrProjectId: {
    label: "Omero Dataset ID",
    inputType: inputTypes.NUMERIC,
    fieldName: "omeroObjectId",
    inputFieldName: "omeroObjectId",
    placeholder: "Enter Omero Dataset ID",
    display: "Add",
    displayFacilities: [1, 8, 9],
  },
  // sampleId: {
  //   label: "Omero Image / Dataset ID",
  //   inputType: inputTypes.NUMERIC,
  //   fieldName: "sampleId",
  //   placeholder: "Enter Omero Image ID",
  //   display: "Add"
  // },
  // sampleDescription: {
  //   label: "Biosample Description",
  //   inputType: inputTypes.SHORT_TEXT,
  //   fieldName: "sampleDescription",
  //   placeholder: "Enter Biosample Description",
  //   display: "Required"
  // },
  // organism: {
  //   label: "Organism",
  //   inputType: inputTypes.DROPDOWN,
  //   fieldName: "organism",
  //   placeholder: "Select Organism",
  //   display: "Required",
  // },
  // sampleType: {
  //   label: "Biosample Type",
  //   inputType: inputTypes.DROPDOWN,
  //   fieldName: "sampleType",
  //   placeholder: "Select Biosample Type",
  //   display: "Required",
  // },
  // speciesOrStrain: {
  //   label: "Species/Strain",
  //   inputType: inputTypes.SHORT_TEXT,
  //   fieldName: "speciesStrain",
  //   placeholder: "Enter Species/Strain",
  //   display: "Required"
  // },
  // experimentalVariables: {
  //   label: "Experimental Variables",
  //   inputType: inputTypes.FREE_TEXT,
  //   fieldName: "experimentalVariables",
  //   placeholder: "Describe what was intentionally varied (e.g. time) between multiple entries in this study",
  //   display: "Add"
  // },
};

export const getOmeroObjectFields = (facilityId) => {
  const keys = Object.keys(coreFields);
  const fields = {};
  keys.forEach((key) => {
    const field = coreFields[key];
    if(field?.displayFacilities?.includes(facilityId)) {
      fields[key] = field;
    }
  });
  return fields;
}
