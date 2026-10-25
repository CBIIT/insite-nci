import { inputTypes } from "../../FormField/FieldTypes";
import { keys as layerKeys} from "../../layerROI/LayerView";
import { excelCoordinatesToRefs } from "../../utils2";
import { assignLookUpTable } from "./GenerateExcel2";

export function addLayer(
  layerSheet,
  layer,
  index,
  displayFields
) {
  layerSheet.columns = [
    { header: "Parameter", key: "Parameter", width: 40 },
    { header: "Value", key: "Value", width: 100 },
  ];

  // filter fields replate to image info 
  const layerFields = layerKeys.reduce((acc, key) => {
    acc = { ...displayFields[key], ...acc };
    return acc;
  }, []);
  // assign lookup table by index
  const dropDownFields = {};
  const layerParameters = Object.keys(layerFields).map(
    (key, fieldIndex) => {
      const field = layerFields[key];
      if(field.inputType === inputTypes.DROPDOWN) {
        dropDownFields[field.fieldName] = {
          index: fieldIndex,
        }
        return [field.label, layer[field.fieldName]?.label || ""];
      }
      return [field.label, layer[field.fieldName] || ""];
    }
  ).filter(item => item);

  layerSheet.addTable({
    name: `LayerROI${index + 1}Parameters`,
    ref: excelCoordinatesToRefs(1, 1),
    headerRow: true,
    style: {
      theme: "TableStyleMedium2",
      showFirstColumn: true,
      showRowStripes: true,
    },
    columns: [
      { name: "Parameter", filterButton: false },
      { name: "Value", filterButton: false },
    ],
    rows: layerParameters
  });

  // assign lookup table
  assignLookUpTable(dropDownFields, layerSheet);
}