import { inputTypes } from "../../FormField/FieldTypes";
import options from "./defaultOptions.json";

export const coreFields = {
  imageID: {
    label: "Omero Image ID",
    inputType: inputTypes.NUMERIC,
    fieldName: "omeroObjectId",
    inputFieldName: "omeroObjectId",
    placeholder: "Enter Omero Image ID",
    display: "Add",
    tooltipText: 'Provide Omero Image Id',
    displayFacilities: [8, 9],
  },
  // specimenLocationMethod: {
  //   label: "Specimen Location Method",
  //   inputType: inputTypes.DROPDOWN,
  //   fieldName: "specimenLocationMethod",
  //   placeholder: "Select Specimen Location Method",
  //   display: "Required"
  // },
  // preparationMethod: {
  //   label: "Preparation Method",
  //   inputType: inputTypes.DROPDOWN,
  //   fieldName: "preparationMethod",
  //   placeholder: "Select Specimen Location Method",
  //   display: "Required"
  // },
};

// display omero input fields based on facility
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
