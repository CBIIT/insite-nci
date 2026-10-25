import { inputTypes } from "../../FormField/FieldTypes";

export const coreFields = {
  cellLine: {
    label: "Cell Line",
    inputType: inputTypes.SHORT_TEXT,
    fieldName: "cellLine",
    placeholder: "Enter Cell Line",
    value: "cell line",
    display: "Required"
  },
  tissueHealthStatus: {
    label: "Tissue Health Status",
    inputType: inputTypes.DROPDOWN,
    fieldName: "tissueHealthStatus",
    placeholder: "Select Tissue Health Status",
    value: "tissue",
    display: "Required"
  },
  embryoStage: {
    label: "Embryo Stage",
    inputType: inputTypes.SHORT_TEXT,
    fieldName: "embryoStage",
    placeholder: "Select Embryo Stage",
    value: "embryo",
    display: "Required",
  },
}