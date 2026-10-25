import { inputTypes } from "../../FormField/FieldTypes";
import { keys as imageInfoKeys} from "../../imageInfo/ImageInfo";
import { excelCoordinatesToRefs } from "../../utils2";
import { assignLookUpTable } from "./GenerateExcel2";

export function addImageInfo(
  imageInfoSheet,
  imageInfo,
  index,
  displayFields
) {
  imageInfoSheet.columns = [
    { header: "Parameter", key: "Parameter", width: 40 },
    { header: "Value", key: "Value", width: 100 },
  ];

  // filter fields replate to image info 
  const imageInfoFields = imageInfoKeys.reduce((acc, key) => {
    acc = { ...displayFields[key], ...acc };
    return acc;
  }, []);

  const dropDownFields = {};
  const imageInfoParameters = Object.keys(imageInfoFields).map(
    (key, index) => {
      const field = imageInfoFields[key];
      if(field.inputType === inputTypes.DROPDOWN) {
        dropDownFields[field.fieldName] = {
          index: index,
        }
        return [field.label, imageInfo[field.fieldName]?.label || ""];
      }
      return [field.label, imageInfo[field.fieldName] || ""];
    }
  ).filter(item => item);

  imageInfoSheet.addTable({
    name: `ImageInfo${index + 1}Parameters`,
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
    rows: imageInfoParameters
  });

  // assign lookup table
  assignLookUpTable(dropDownFields, imageInfoSheet);
}