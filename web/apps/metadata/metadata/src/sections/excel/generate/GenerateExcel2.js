import Excel from "exceljs";
import {
  excelCoordinatesToRefs,
  createAndPopulateTableTemplate
} from "../../utils2";
// import options from "../../options.json";
import options from "./options2.json";
import { lookup, lookUpTableKeyValue, lookupTables } from './ExcelConfig2';
import { inputTypes } from "../../FormField/FieldTypes";
import { coreFields as studyCoreFields } from "../../study/defaultField";
import { addSampleSheet } from "./SampleSheet";
import { addImageInfo } from "./ImageSheet";
import { addLayer } from "./LayerSheet";

// check object type of value
export const returnStringValue = (object) => {
  if (!object) return "";
  if (typeof object === "string") return object;
  return object.value;
}

// preprocess form data
export function getChannelStainValue (value, channel, tableTemple = undefined) {
  // set value for other stain
  const { otherStain = undefined } = channel;
  const stainVal = otherStain ? otherStain : channel?.stain?.value;
  
  // multiplate - batch import - addMultiwellPlate
  const tableVal = (stainVal?.length > 0) ? createAndPopulateTableTemplate(tableTemple, stainVal) : undefined;
  return tableVal || value || stainVal || "";
}

// select table with max number of well with the values
// feature 
function getMaxValueTable (plate) {
  const {tables = {}} = plate;
  let maxVal = 0;
  let maxValueTable = '';
  for (const [key, table] of Object.entries(tables)) {
    let noOfValInTbl = 0;
    if (table) {
      const rows = table.length;
      for (let i = 1; i < rows; i++) {
        const cols = table[i].length;
        for (let j = 1; j < cols; j++) {
          const val = table[i][j];
          if (val && `${val}`.length > 0) noOfValInTbl += 1;
        }
      }
      // select table
      if (maxVal < noOfValInTbl) {
        maxVal = noOfValInTbl;
        maxValueTable = key;
      }
    }
  }
  if (maxVal === 0) return false;
  return tables[maxValueTable];
}

function getTemplateTable (plate) {
  const maxValTable = getMaxValueTable(plate);
  if (!maxValTable) return false;
  const template = createAndPopulateTableTemplate(maxValTable);
  return template;
}

export function getChannelMolEntityValue (channel, tableTemple = undefined) {
  // set value for molecular entity
  // check if molecular entity is object (select input) or string (text input)
  const moleEntityVal = channel?.molecularEntity || "";
  const molecularEntityValue = returnStringValue(moleEntityVal);
  // multiplate - batch import - addMultiwellPlate
  const tableVal = (molecularEntityValue?.length > 0) ? 
    createAndPopulateTableTemplate(tableTemple, molecularEntityValue) : undefined;
  return tableVal || molecularEntityValue || ""
}

export function getChannelSignalValue (fromTableValue, channel, tableTemple = undefined) {
  const value = channel?.signalOrContrastMechanism?.value;
  // multiplate - batch import - addMultiwellPlate
  const tableVal = value?.length > 0 ? createAndPopulateTableTemplate(tableTemple, value) : undefined;
  return tableVal || fromTableValue || value || "";
}

// get table options
const getOptionsValues = (form, table) => {

  if (table.name === "LookupChannelStain") {
    const rows = options.channelStains
      .map((e) => e.facilityIds?.map((id) => [
        e.label,
        options.imagingFacility.find((f) => f.value === id)?.label
      ]))
      .flat()
      .filter(e => !form?.imagingFacility?.value || (e[1] === form?.imagingFacility?.label));
    if (rows.length === 0) {
      return [[]]
    }
    return rows;
  }
  if (table.name === "LookupChannelSignalContrastMechanism") {
    return options.channelSignalContrastMechanisms
      .map((e) => e.facilityIds?.map((id) => [e.label, options.imagingFacility
        .find((f) => f.value === id)?.label]))
        .flat()
        .filter(e => !form?.imagingFacility?.value || (e[1] === form?.imagingFacility?.label));
  }

  if (table.name === "LookupPreparationMethod") {
    return options.specimenPreparationMethods
      .map((e) => e.facilityIds?.map((id) => [e.label, options.imagingFacility.find((f) => f.value === id)?.label]))
      .flat()
      .filter(Boolean)
      .filter(e => !form?.imagingFacility?.value || (e[1] === form?.imagingFacility?.label));
  }

  if (table.name === "LookupImagingMethod") {
    return options.imagingMethods
      .map((e) => e.facilityIds?.map((id) => [e.label, options.imagingFacility.find((f) => f.value === id)?.label]))
      .flat()
      .filter(Boolean)
      .filter(e => !form?.imagingFacility?.value || (e[1] === form?.imagingFacility?.label));
  }
  
  return (options[table.property])
    ?.reduce((acc, item) => {
      // generate lookup table row based on nuber of columns 
      const items = table.columns.reduce((acc, col) => {
        acc.push(item[col.field]);
        return acc;
      }, []);
      // one field
      acc.push(items);
      return acc;
    }, []) || [[]];
}

const getDynamicFieldOptions = (key, fieldOptions) => {
  return fieldOptions?.[key]?.map((e) => [e.value]);
}

function addLookupTable (lookupSheet, form, fieldOptions) {
  const lookupTableStyle = {
    theme: "TableStyleMedium2",
    showFirstColumn: true,
    showRowStripes: true,
  };

  // add lookuptable
  let position = 1;
  lookupTables.forEach((table, index) => {
    // configure table columns
    const cols = table?.columns?.map((col) => ({
      name: col.name,
    })) || [];
    const rows = getOptionsValues(form, table);
    
    // set the table position
    console.log(table.name);
    lookupSheet.addTable({
      name: table.name,
      ref: excelCoordinatesToRefs(1, position),
      headerRow: true,
      style: lookupTableStyle,
      columns: cols,
      rows: rows,
    });
    // set position for next lookUp table
    // adjust position for multi columns table 
    position = position + table?.columns?.length + 1;
  });

  // set columns
  const columns = lookupTables.reduce((acc, tbl) => {
    const lookUpColumn =  tbl?.columns?.map((item) => ({
      header: item.name,
      key: tbl.key,
      width: tbl.width,
    }));
    const spacerColumn = {
      header: "",
      key: "10",
      width: 10
    }
    acc = [...acc, ...lookUpColumn, spacerColumn];
    return acc;
  }, []);

  // add lookup table based on template
  const lookUpFields = Object.keys(fieldOptions);
  lookUpFields.forEach((field) => {
    // configure table columns
    const cols = [{
      name: field,
    }];
    const optionsRow = getDynamicFieldOptions(field, fieldOptions);
    columns.push([
      {
        header: `Lookup${field}Template`,
        key: `${field}`,
        width: 50,
      },
      {
        header: "",
        key: "10",
        width: 10
      }
    ]);
    // set the table position
    lookupSheet.addTable({
      name: `Lookup${field}Template`,
      ref: excelCoordinatesToRefs(1, position),
      headerRow: true,
      style: lookupTableStyle,
      columns: cols,
      rows: optionsRow,
    });
    position = position + 2;
  });
  
  // set all the columns for the lookup table
  lookupSheet.columns = columns;
}

export const assignLookUpTable = (sectionDropDownFields, sheet) => {
  // assign lookup table to study sheet
  Object.keys(sectionDropDownFields).forEach((lookupKey, index) => {
    console.log(lookupKey)
    const position = sectionDropDownFields[lookupKey].index + 2;
    let lookUpTable = lookUpTableKeyValue[lookupKey];
    console.log(lookUpTable);
    if(!lookUpTable) {
      lookUpTable = [`=INDIRECT("Lookup${lookupKey}Template[${lookupKey}]")`];
    }
    sheet.getCell(position, 2).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: lookUpTable,
    };
  });
}

function addParameterSheet (workbook, form, displayField, fieldOptions = {}) {
  const parametersSheet = workbook.addWorksheet("Parameters");
  parametersSheet.columns = [
    { header: "Parameter", key: "Parameter", width: 40 },
    { header: "Value", key: "Value", width: 100 },
  ];

  // study components 
  // displayField find index to assign lookup table
  const displayFields = { 
    // ...studyCoreFields, 
    ...displayField?.studyComponent,
    ...displayField?.study
  };
  const dropDownFields = {};
  const studyParameters = Object.keys(displayFields).map(
    (key, index) => {
      const field = displayFields[key];
      if(field.inputType === inputTypes.DROPDOWN) {
        dropDownFields[field.fieldName] = {
          index: index,
          name: field.label,
          options: fieldOptions ? fieldOptions[field?.fieldName] : [],
        }
        return [field.label, form[field.fieldName]?.label || ""];
      }
      return [field.label, form[field.fieldName] || ""];
    }
  );
  studyParameters.push(
    ["Number of Biosamples", form.samples.length || 0]
  );

  if (form?.imageInfos?.length > 0) {
    studyParameters.push(
      ["Number of Image Information", form.imageInfos.length || 0]
    )
  }

  if (form?.layerROIs?.length > 0) {
    studyParameters.push(
      ["Number of Layer ROI", form.layerROIs.length || 0]
    )
  }  
  
  parametersSheet.addTable({
    name: "parameters",
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
    rows: studyParameters,
  });

  // assign lookup table to study sheet
  assignLookUpTable(dropDownFields, parametersSheet);
}

export async function generateExcelExport2(form, activeSheet = null, fieldOptions, displayFields) {
    const workbook = new Excel.Workbook();
    let errors = [];
    const lookupSheet = workbook.addWorksheet("Lookup");
    addLookupTable(lookupSheet, form, fieldOptions);
    addParameterSheet(workbook, form, displayFields, fieldOptions);

    // biosample sheet
    form?.samples?.forEach((sample, index) => {
      const sampleSheet = workbook
        .addWorksheet(`Biosample ${index + 1}`);
      addSampleSheet(
        workbook,
        sampleSheet,
        sample, 
        index,
        fieldOptions,
        displayFields
      );
    });

    // image info
    form?.imageInfos?.forEach((imageInfo, index) => {
      const imageInfoSheet = workbook
        .addWorksheet(`Image Info ${index + 1}`);
      addImageInfo(
        imageInfoSheet,
        imageInfo,
        index + 1,
        displayFields
      );
    });

    // layer ROI
    form?.layerROIs?.forEach((layer, index) => {
      const layerSheet = workbook
        .addWorksheet(`Layer ROI ${index + 1}`);
      addLayer(
        layerSheet,
        layer,
        index,
        displayFields
      );
    });
  
    workbook.views = [
      {
        x: 0,
        y: 0,
        width: 10000,
        height: 20000,
        firstSheet: 0,
        activeTab: activeSheet ?? 1,
        visibility: "visible", // Set activeTab to 0
      },
    ];
  
  return await workbook.xlsx.writeBuffer();
}