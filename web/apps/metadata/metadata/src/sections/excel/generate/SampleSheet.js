
import options from "./options2.json";
import { excelCoordinatesToRefs } from "../../utils2";
import { coreFields as sampleFields } from "../../biosamples/defaultField";
import { coreFields as sampleTypeFields } from "../../biosamples/sampleType/defaultField";
import { addSpecimen } from "./SpecimenSheet";
import { inputTypes } from "../../FormField/FieldTypes";
import { assignLookUpTable } from "./GenerateExcel2";

const tissueSite = {
  humans: "Tissue Site",
  rodentsAndRabbits: "Organ Group",
  others: "Organ/Tissue/Site"
};

const tissueSubsite = {
  humans: "Tissue Subsite",
  rodentsAndRabbits: "Organ/Tissue",
  others: "Organ/Tissue Subsite"
};

const tissueHistology = {
  humans: "Tissue Histology",
  rodentsAndRabbits: "Lesion",
  others: "Lesion"
};

export function addSampleSheet (
  workbook,
  sampleSheet,
  sample,
  sampleIndex,
  fieldOptions,
  displayField
) {
  sampleSheet.columns = [
    { header: "Parameter", key: "Parameter", width: 40 },
    { header: "Value", key: "Value", width: 100 },
  ];

  let organismType = "others";
  for (let type in options.organismType) {
    if (options.organismType[type].includes(sample?.organism?.label)) {
      organismType = type;
    }
  }

  // parse cell line
  // add sample types if any
  const cellLine = sample?.cellLine?.value || sample?.cellLine;

  const tissueSiteLabel = tissueSite[organismType];
  const tissueSubsiteLabel = tissueSubsite[organismType];
  const tissueHistologyLabel = tissueHistology[organismType];

  // dynamically add field value
  const displayFields = { ...sampleFields, ...sampleTypeFields, ...displayField?.biosample };

  const dropDownFields = {};
  const sampleParameters = Object.keys(displayFields).map(
    (key, index) => {
      const field = displayFields[key];
      if(field.inputType === inputTypes.DROPDOWN) {
        dropDownFields[field.fieldName] = {
          index: index,
          options: fieldOptions[field.fieldName]
        }
        return [field.label, sample[field.fieldName]?.label || ""];
      }
      return [field.label, sample[field.fieldName] || ""];
    }
  ).filter(item => item);

  sampleSheet.addTable({
    name: `Biosample${sampleIndex + 1}Parameters`,
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
      ...sampleParameters,
      ["Number of Specimens", sample?.specimens?.length || 0]
    ],
  });

  // provide styles
  console.log(dropDownFields);
  assignLookUpTable(dropDownFields, sampleSheet);

  // add all specimen
  sample?.specimens?.forEach((specimen, index) => {
    addSpecimen(
      workbook,
      index,
      sample,
      specimen,
      displayField,
      sampleIndex,
      fieldOptions
    );
  });
  
}