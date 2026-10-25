import { inputTypes } from "../FormField/FieldTypes";
import options from "./defaultOptions.json";

export const coreFields = {
  caseId: {
    label: "Case ID",
    inputType: inputTypes.NUMERIC,
    fieldName: "caseId",
    placeholder: "Enter Case ID",
    display: "Add"
  },
  plateID: {
    label: "Plate ID",
    inputType: inputTypes.NUMERIC,
    fieldName: "plateID",
    placeholder: "Enter Plate ID/Barcode",
    display: "Required"
  },
  plateType: {
    label: "Plate Type",
    inputType: inputTypes.DROPDOWN,
    fieldName: "plateType",
    placeholder: "Select Plate Type",
    display: "Required",
  },
  biosample: {
    label: "Biosample",
    inputType: inputTypes.DROPDOWN,
    fieldName: "biosample",
    placeholder: "Select Default Biosample",
    display: "Add"
  },
  experimentalStatus: {
    label: "Experimental Status",
    inputType: inputTypes.DROPDOWN,
    fieldName: "experimentalStatus",
    placeholder: "Select Test, Control or N/A",
    display: "Add",
    options: options.experimentalStatus,
  },
  preparationMethod: {
    label: "Preparation Method",
    inputType: inputTypes.DROPDOWN,
    fieldName: "preparationMethod",
    placeholder: "Select Default Preparation Method",
    display: "Add"
  },
  otherPreparationMethod: {
    label: "Other Preparation Method",
    inputType: inputTypes.FREE_TEXT,
    fieldName: "otherPreparationMethod",
    placeholder: "Select Default Preparation Method",
    display: "Add"
  },
  intrinsicVariables: {
    label: "Intrinsic Variables",
    inputType: inputTypes.SHORT_TEXT,
    fieldName: "intrinsicVariables",
    placeholder: "Enter any relevant intrinsic alterations (e.g. genetic mutation, genotype, phenotype)",
    display: "Add"
  },
  extrinsicVariables: {
    label: "Extrinsic Variables - Experimental Treatment",
    inputType: inputTypes.SHORT_TEXT,
    fieldName: "intrinsicVariables",
    placeholder: "Enter experimental treatments to which the biospecimen was exposed (e.g. reagents such as siRNA, chemical compounds, drugs etc)",
    display: "Add"
  },
};
