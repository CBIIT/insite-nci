import { inputTypes } from "../FormField/FieldTypes";

export const coreFields = {
  signalOrContrastMechanism: {
    label: "Signal or Contrast Mechanism",
    inputType: inputTypes.DROPDOWN,
    fieldName: "signalOrContrastMechanism",
    placeholder: "Select Signal or Contrast Mechanism",
    display: "Required"
  },
  stain: {
    label: "Stain",
    inputType:  inputTypes.DROPDOWN,
    fieldName: "stain",
    placeholder: "Select Stain",
    display: "Required"
  },
  molecularEntity: {
    label: "Molecular Entity",
    inputType:  inputTypes.FREE_TEXT,
    fieldName: "molecularEntity",
    placeholder: "Enter Molecular Entity",
    display: "Required"
  },
};
