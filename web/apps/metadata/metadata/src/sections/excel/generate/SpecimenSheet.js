import { excelCoordinatesToRefs } from "../../utils2";
import { coreFields as specimenFields } from "../../biosamples/specimen/defaultField";
import { addChannel } from "./ChannelSheet";
import { inputTypes } from "../../FormField/FieldTypes";
import { assignLookUpTable } from "./GenerateExcel2";

export function addSpecimen (
  workbook,
  specimenIndex,
  sample,
  specimen,
  displayField,
  sampleIndex,
  fieldOptions
) {
  const specimenSheet = workbook
    .addWorksheet(`Biosample ${sampleIndex + 1} - Specimen ${specimenIndex + 1}`);
    
  specimenSheet.columns = [
    { header: "Parameter", key: "Parameter", width: 40 },
    { header: "Value", key: "Value", width: 100 },
    { header: "", key: "Extra", width: 100 },
  ];

  // dynamically add biosample fields
  const displayFields = { ...specimenFields, ...displayField?.specimen };
  const dropDownFields = {};
  const specimenParameters = Object.keys(displayFields).map(
    (key, index) => {
      const field = displayFields[key];
      if(field.inputType === inputTypes.DROPDOWN) {
        // 1 position occupy by case id
        dropDownFields[field.fieldName] = {
          index: index + 1,
          options: fieldOptions[field.fieldName]
        }
        return [field.label, specimen[field.fieldName]?.label || ""];
      }
      return [field.label, specimen[field.fieldName] || ""];
    }
  );

  specimenSheet.addTable({
    name: `Biosample${sampleIndex + 1}Specimen${specimenIndex + 1}Parameters`,
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
    rows: [
      // ["Biosample ID", sample?.sampleId],
      ...specimenParameters,
      ["Number of Channels", specimen?.channels?.length || 0]
    ],
  });

  // add lookup table
  // assign lookup table to study sheet
  assignLookUpTable(dropDownFields, specimenSheet);

  // add channels
  const rowOffset = specimenParameters.length + 5;
  if (specimen?.channels?.length > 0) {
    addChannel(
      specimenSheet,
      specimen,
      sampleIndex,
      specimenIndex,
      rowOffset,
      fieldOptions,
      displayField
    );
  }
};
