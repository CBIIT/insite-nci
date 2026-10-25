import _ from "lodash";
import Excel from "exceljs";
import JSZip from "jszip";
import * as XLSX from 'xlsx';
import options from "./options.json";
import { defaultForm, defaultMultiwellPlate, displayType, fieldNameToPropertyMap, formSections, optionsToPropertyMap } from "./form";
import { importVariablesType } from "./util/ImportVariables";
import { generateExcelExport2 } from "./util/GenerateExcel";
import { inputTypes } from "./sections/FormField/FieldTypes";

// add facility id to display the new form with dynamically display form fields
// only facility id 2 and 8 should display old form until complete code migration,
// to new form

export const newForm = [1, 9];

const filePathOptions = (form) => {
  const options = [];
  form.samples?.forEach((biosample, biosampleIndex) => {
    options.push({
      label: `Biosample ${biosampleIndex + 1}`,
      value: `Biosample ${biosampleIndex + 1}`,
      label2: `Biosample (${biosample.sampleId})`,
      sample: biosample
    });
    biosample.specimens.forEach((specimen, specimenIndex) => {
      options.push({
        label: `Biosample ${biosampleIndex + 1} - Specimen ${specimenIndex + 1}`,
        value: `Biosample ${biosampleIndex + 1}`,
        label2: `Biosample / Specimen (${biosample.sampleId}) / (${specimen.specimenId || 'N/A'})`,
        sample: biosample,
        specimen: specimen,
      });
    });
  });
  return options;
}

export const filteredOptions = {
  getFilePathNames: (form) => filePathOptions(form),
  getImagingMethods: (form) => options.imagingMethods?.filter((e) => !form?.imagingFacility?.value || !e.facilityIds || e.facilityIds.includes(+form.imagingFacility?.value)),
  getTissueSubsites: (sample) => options.tissueSubsites?.filter((e) => sample?.tissueSite?.code === e.siteCode),
  getTissueHistologies: (sample) => options.tissueHistologies?.filter((e) => !sample?.tissueSite?.value || sample?.tissueSite?.value === e.tissue),
  getTissueHistologyBehaviors: (sample) => options.tissueHistologyBehaviors?.filter((e) => !sample.tissueHistology?.code || sample.tissueHistology?.code === e.histologyCode),
  getNonHumanTissueSubsites: (sample) => options.nonHumanTissueSubsites.filter((e) => !sample?.tissueSite?.value || sample?.tissueSite?.value === e.tissueSite),
  getNonHumanTissueHistologies: (sample) => options.nonHumanTissueHistologies.filter((e) => !sample?.tissueSite?.value || (sample?.tissueSite?.value === e.tissueSite && sample?.tissueSubsite?.value === e.tissueSubsite)),
  getSpecimenPreparationMethods: (form) => options.specimenPreparationMethods.filter((e) => !form?.imagingFacility?.value || !e.facilityIds || e.facilityIds.includes(+form.imagingFacility?.value)),
  getChannelSignalContrastMechanisms: (form) => options.channelSignalContrastMechanisms.filter((e) => !form?.imagingFacility?.value || !e.facilityIds || e.facilityIds.includes(+form.imagingFacility?.value)),
  getChannelStains: (form) => options.channelStains.filter((e) => !form?.imagingFacility?.value || !e.facilityIds || e.facilityIds.includes(+form.imagingFacility?.value)),
  getPlateBiosamples: (form) => form.samples?.map((biosample, index) => ({ label: `Biosample ${index + 1}${biosample.sampleId && ` (${biosample.sampleId})`}`, value: index + 1, sampleValue: biosample }))
};

// export function safeClone(obj) {
//   // console.log("safe clone");
//   let cloneObj = {};
//   try {
//     cloneObj = structuredClone(obj);
//   } catch (error) {
//     console.warn("structuredClone failed, using fallback", error);
//     cloneObj = cloneDeep(obj); // Use Lodash fallback
//   }
//   return cloneObj;
// };

export function safeClone(obj) {
  // Handle primitives
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  // 1. Try structuredClone
  try {
    return structuredClone(obj);
  } catch (error) {
    console.warn("structuredClone failed, trying lodash _.cloneDeep()", error);
  }

  // 2. Try lodash cloneDeep
  try {
    return _.cloneDeep(obj);
  } catch (error) {
    console.warn("_.cloneDeep failed, using manual fallback", error);
  }

  // 3. Manual recursive fallback
  const manualClone = (value, seen = new WeakMap()) => {
    if (value === null || typeof value !== "object") {
      return value;
    }

    // Circular reference handling
    if (seen.has(value)) {
      return seen.get(value);
    }

    // Date handling
    if (value instanceof Date) {
      return new Date(value);
    }

    // Array handling
    if (Array.isArray(value)) {
      const arr = [];
      seen.set(value, arr);

      value.forEach((item, index) => {
        arr[index] = manualClone(item, seen);
      });

      return arr;
    }

    // Object handling
    const clonedObj = {};
    seen.set(value, clonedObj);

    Object.keys(value).forEach((key) => {
      clonedObj[key] = manualClone(value[key], seen);
    });

    return clonedObj;
  };

  return manualClone(obj);
}

export function deepMapValues(obj, fn, shouldRecurse) {
  if (_.isArray(obj)) {
    return obj.map((item) => deepMapValues(item, fn, shouldRecurse));
  }

  return _.transform(obj, (result, value, key) => {
    if (_.isObject(value) && shouldRecurse(value)) {
      result[key] = deepMapValues(value, fn, shouldRecurse);
    } else {
      result[key] = fn(value, key);
    }
  });
}

export function downloadJson(obj, filename) {
  const contents = JSON.stringify(obj, null, 2);
  const blob = new Blob([contents], { type: "application/json" });
  downloadFile(blob, filename);
  return blob;
}

export async function downloadExcel(form, filename, activeSheet = 1, fieldOptions = {}, displayField = {}) {
  // const buffer = await generateExcelExport(form, activeSheet);
  const buffer = await generateExcelExport2(form, activeSheet, fieldOptions, displayField);
  const blob = new Blob([new Uint8Array(buffer)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  downloadFile(blob, filename);
  return blob;
}

export async function downloadZip(form, filename, fieldOptions = {}, displayField = {}) {
  const jsonContents = JSON.stringify(form, null, 2);
  const jsonBlob = new Blob([jsonContents], { type: "application/json" });
  const jsonFilename = filename.replace(/\.zip$/, ".json");

  const excelBuffer = await generateExcelExport2(form, null, fieldOptions, displayField);
  const excelBlob = new Blob([new Uint8Array(excelBuffer)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const excelFilename = filename.replace(/\.zip$/, ".xlsx");

  const zip = new JSZip();
  zip.file(jsonFilename, jsonBlob);
  zip.file(excelFilename, excelBlob);
  const zipBlob = await zip.generateAsync({ type: "blob" });
  downloadFile(zipBlob, filename);
  return { excelBlob, jsonBlob };
}

export function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function getTimestamp() {
  const d = new Date();
  return [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()].join("");
}

export function readFile(file, type = "arrayBuffer") {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => resolve(fileReader.result);
    fileReader.onerror = reject;
    if (type === "arrayBuffer") {
      fileReader.readAsArrayBuffer(file);
    } else if (type === "dataUrl") {
      fileReader.readAsDataURL(file);
    } else {
      fileReader.readAsText(file);
    }
  });
}

// very basic conversion from row/column to excel coordinates (A-Z)
export function excelCoordinatesToRefs(row, column) {
  return `${numberToLetters(column - 1)}${row}`;
}


/**
 * Returns a string containing the letters of the alphabet in order, starting with A and ending with Z.
 * @param {number} num - The index of the letter to retrieve.
 * @returns {string} The requested letter of the alphabet.
 * @example numbersToLetters(1) === "A"
 */
export function numberToLetters(num) {
  let letters = "";
  while (num >= 0) {
    letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[num % 26] + letters;
    num = Math.floor(num / 26) - 1;
  }
  return letters;
}

// very basic conversion from excel coordinates (A-Z) to row/column
export function excelRefsToCoordinates(ref) {
  const [column, row] = ref.split(/(\d+)/).filter(Boolean);
  return [+row, column.charCodeAt(0) - 64];
}

// check object type of value
const returnStringValue = (object) => {
  if (!object) return "";
  if (typeof object === "string") return object;
  return object.value;
}

export async function generateExcelExport(form, activeSheet = null, fieldOptions) {
  const workbook = new Excel.Workbook();
  let errors = [];

  const lookupSheet = workbook.addWorksheet("Lookup");
  const lookupTableStyle = {
    theme: "TableStyleMedium2",
    showFirstColumn: true,
    showRowStripes: true,
  };

  lookupSheet.addTable({
    name: "LookupImagingFacility",
    ref: excelCoordinatesToRefs(1, 1),
    headerRow: true,
    style: lookupTableStyle,
    columns: [{ name: "Imaging Facilities" }],
    rows: options.imagingFacilities.map((e) => [e.label]),
  });

  lookupSheet.addTable({
    name: "LookupPrincipalInvestigator",
    ref: excelCoordinatesToRefs(1, 3),
    headerRow: true,
    style: lookupTableStyle,
    columns: [{ name: "Principal Investigators" }],
    rows: options.principalInvestigators.map((e) => [e.label]),
  });

  lookupSheet.addTable({
    name: "LookupImagingMethod",
    ref: excelCoordinatesToRefs(1, 5),
    headerRow: true,
    style: lookupTableStyle,
    columns: [{ name: "Imaging Methods" }, { name: "Imaging Facilities" }],
    rows: options.imagingMethods
      .map((e) => e.facilityIds?.map((id) => [e.label, options.imagingFacilities.find((f) => f.value === id)?.label]))
      .flat()
      .filter(Boolean)
      .filter(e => !form?.imagingFacility?.value || (e[1] === form?.imagingFacility?.label)),
  });

  lookupSheet.addTable({
    name: "LookupOrganism",
    ref: excelCoordinatesToRefs(1, 8),
    headerRow: true,
    style: lookupTableStyle,
    columns: [{ name: "Organisms" }],
    rows: options.organisms.map((e) => [e.label]),
  });

  lookupSheet.addTable({
    name: "LookupSampleType",
    ref: excelCoordinatesToRefs(1, 10),
    headerRow: true,
    style: lookupTableStyle,
    columns: [{ name: "Biosample Types" }],
    rows: options.sampleTypes.map((e) => [e.label]),
  });

  lookupSheet.addTable({
    name: "LookupTissueType",
    ref: excelCoordinatesToRefs(1, 12),
    headerRow: true,
    style: lookupTableStyle,
    columns: [{ name: "GEM Tissue Types" }],
    rows: options.tissueTypes.map((e) => [e.label]),
  });

  lookupSheet.addTable({
    name: "LookupTissueSite",
    ref: excelCoordinatesToRefs(1, 14),
    headerRow: true,
    style: lookupTableStyle,
    columns: [{ name: "Tissue Sites" }],
    rows: options.tissueSites.map((e) => [e.label]),
  });

  lookupSheet.addTable({
    name: "LookupTissueSubsite",
    ref: excelCoordinatesToRefs(1, 16),
    headerRow: true,
    style: lookupTableStyle,
    columns: [{ name: "Tissue Sites" }, { name: "Tissue Subsites" }],
    rows: options.tissueSubsites.map((e) => [e.siteLabel, e.label]),
  });

  lookupSheet.addTable({
    name: "LookupTissueHealthStatus",
    ref: excelCoordinatesToRefs(1, 19),
    headerRow: true,
    style: lookupTableStyle,
    columns: [{ name: "Tissue Health Statuses" }],
    rows: options.tissueHealthStatuses.map((e) => [e.label]),
  });

  lookupSheet.addTable({
    name: "LookupTissueHistology",
    ref: excelCoordinatesToRefs(1, 21),
    headerRow: true,
    style: lookupTableStyle,
    columns: [{ name: "Tissue Sites" }, { name: "Tissue Histologies" }, { name: "Tissue Histology Behaviors" }],
    rows: options.tissueHistologyBehaviors.map((e) => [e.tissueSiteLabel || "", e.tissueHistologyLabel || "", e.label]),
  });

  lookupSheet.addTable({
    name: "LookupOrganTissueLesion",
    ref: excelCoordinatesToRefs(1, 25),
    headerRow: true,
    style: lookupTableStyle,
    columns: [{ name: "Organ Groups" }, { name: "Organs/Tissues" }, { name: "Lesions" }],
    rows: options.nonHumanTissueHistologies.map((e) => [e.tissueSite, e.tissueSubsite, e.label]),
  });

  lookupSheet.addTable({
    name: "LookupSpecimenLocationMethod",
    ref: excelCoordinatesToRefs(1, 29),
    headerRow: true,
    style: lookupTableStyle,
    columns: [{ name: "Specimen Location Methods" }],
    rows: options.specimenLocationMethods.map((e) => [e.label]),
  });

  lookupSheet.addTable({
    name: "LookupExperimentalStatus",
    ref: excelCoordinatesToRefs(1, 31),
    headerRow: true,
    style: lookupTableStyle,
    columns: [{ name: "Experimental Statuses" }],
    rows: options.specimenTypes.map((e) => [e.label]),
  });

  // console.log(
  //   options.specimenPreparationMethods
  //     .map((e) => e.facilityIds?.map((id) => [e.label, options.imagingFacilities.find((f) => f.value === id)?.label]))
  //     .flat()
  //     .filter(Boolean)
  //     .filter(e => !form?.imagingFacility?.value || (e[1] === form?.imagingFacility?.label))
  // );

  lookupSheet.addTable({
    name: "LookupPreparationMethod",
    ref: excelCoordinatesToRefs(1, 33),
    headerRow: true,
    style: lookupTableStyle,
    columns: [{ name: "Preparation Methods" }, { name: "Imaging Facilities" }],
    rows: options.specimenPreparationMethods
      .map((e) => e.facilityIds?.map((id) => [e.label, options.imagingFacilities.find((f) => f.value === id)?.label]))
      .flat()
      .filter(Boolean)
      .filter(e => !form?.imagingFacility?.value || (e[1] === form?.imagingFacility?.label)),
  });

  lookupSheet.addTable({
    name: "LookupChannelSignalContrastMechanism",
    ref: excelCoordinatesToRefs(1, 36),
    headerRow: true,
    style: lookupTableStyle,
    columns: [{ name: "Signal or Contrast Mechanisms" }, { name: "Imaging Facilities" }],
    rows: options.channelSignalContrastMechanisms
      .map((e) => e.facilityIds?.map((id) => [e.label, options.imagingFacilities.find((f) => f.value === id)?.label])).flat().filter(e => !form?.imagingFacility?.value || (e[1] === form?.imagingFacility?.label)),
  });

  lookupSheet.addTable({
    name: "LookupChannelStain",
    ref: excelCoordinatesToRefs(1, 39),
    headerRow: true,
    style: lookupTableStyle,
    columns: [{ name: "Channel Stains" }, { name: "Imaging Facilities" }],
    rows: options.channelStains.map((e) => e.facilityIds?.map((id) => [e.label, options.imagingFacilities.find((f) => f.value === id)?.label])).flat().filter(e => !form?.imagingFacility?.value || (e[1] === form?.imagingFacility?.label)),
  });

  if (fieldOptions?.cellLine) {
    lookupSheet.addTable({
      name: "LookupCellLine",
      ref: excelCoordinatesToRefs(1, 41),
      headerRow: true,
      style: lookupTableStyle,
      columns: [{ name: "Cell Line" }],
      rows: fieldOptions?.cellLine?.map((e) => [e.value]),
    });
  }

  if (fieldOptions?.molecularentity) {
    lookupSheet.addTable({
      name: "LookupMolecularEntity",
      ref: excelCoordinatesToRefs(1, 43),
      headerRow: true,
      style: lookupTableStyle,
      columns: [{ name: "Molecular Entity" }],
      rows: fieldOptions?.molecularentity?.map((e) => [e.value]),
    });
  }

  lookupSheet.columns = [{"header":"Imaging Facilities","key":"Imaging Facilities","width":100},{"header":"","key":"1","width":10},{"header":"Principal Investigators","key":"Principal Investigators","width":100},{"header":"","key":"3","width":10},{"header":"Imaging Methods","key":"Imaging Methods","width":100},{"header":"Imaging Facilities","key":"Imaging Facilities","width":100},{"header":"","key":"6","width":10},{"header":"Organisms","key":"Organisms","width":100},{"header":"","key":"8","width":10},{"header":"Biosample Types","key":"Biosample Types","width":100},{"header":"","key":"10","width":10},{"header":"GEM Tissue Types","key":"GEM Tissue Types","width":100},{"header":"","key":"12","width":10},{"header":"Tissue Sites","key":"Tissue Sites","width":100},{"header":"","key":"14","width":10},{"header":"Tissue Sites","key":"Tissue Sites","width":100},{"header":"Tissue Subsites","key":"Tissue Subsites","width":100},{"header":"","key":"17","width":10},{"header":"Tissue Health Statuses","key":"Tissue Health Statuses","width":100},{"header":"","key":"19","width":10},{"header":"Tissue Sites","key":"Tissue Sites","width":100},{"header":"Tissue Histologies","key":"Tissue Histologies","width":100},{"header":"Tissue Histology Behaviors","key":"Tissue Histology Behaviors","width":100},{"header":"","key":"23","width":10},{"header":"Organ Groups","key":"Organ Groups","width":100},{"header":"Organs/Tissues","key":"Organs/Tissues","width":100},{"header":"Lesions","key":"Lesions","width":100},{"header":"","key":"27","width":10},{"header":"Specimen Location Methods","key":"Specimen Location Methods","width":100},{"header":"","key":"29","width":10},{"header":"Experimental Statuses","key":"Experimental Statuses","width":100},{"header":"","key":"31","width":10},{"header":"Preparation Methods","key":"Preparation Methods","width":100},{"header":"Imaging Facilities","key":"Imaging Facilities","width":100},{"header":"","key":"34","width":10},{"header":"Signal or Contrast Mechanisms","key":"Signal or Contrast Mechanisms","width":100},{"header":"Imaging Facilities","key":"Imaging Facilities","width":100},{"header":"","key":"37","width":10},{"header":"Channel Stains","key":"Channel Stains","width":100},{"header":"Imaging Facilities","key":"Imaging Facilities","width":100}];

  const parametersSheet = workbook.addWorksheet("Parameters");
  parametersSheet.columns = [
    { header: "Parameter", key: "Parameter", width: 40 },
    { header: "Value", key: "Value", width: 100 },
  ];

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
    rows: [
      ["Imaging Facility", form?.imagingFacility?.label],
      ["Principal Investigator", form?.principalInvestigator?.label],
      ["Project Scientist", form?.projectScientist],
      ["Project Scientist Email", form?.email],
      ["Dataset ID", form?.datasetId],
      ["Imaging Method", form?.imagingMethod?.label],
      ["Imaging Method (Other)", form?.imagingMethodOther?.label],
      ["Study Description", form?.studyDescription],
      ["Supporting Links", form?.supportingLinks],
      ["Number of Biosamples", form?.samples?.length],
    ],
  });

  parametersSheet.getCell(2, 2).dataValidation = {
    type: "list",
    allowBlank: false,
    formulae: [`=INDIRECT("LookupImagingFacility[Imaging Facilities]")`],
  };

  parametersSheet.getCell(3, 2).dataValidation = {
    type: "list",
    allowBlank: false,
    formulae: [`=INDIRECT("LookupPrincipalInvestigator[Principal Investigators]")`],
  };

  parametersSheet.getCell(7, 2).dataValidation = {
    type: "list",
    allowBlank: false,
    formulae: [`=INDIRECT("LookupImagingMethod[Imaging Methods]")`],
    // formulae: [`=D2:D99`],
  };

  // add form options
  // parametersSheet.getCell('D1').value  = 'Available Imaging Methods';
  // parametersSheet.getCell('D2').value  = { formula: `_xlfn.FILTER(INDIRECT("LookupImagingMethod[Imaging Methods]"), INDIRECT("LookupImagingMethod[Imaging Facilities]")=B2)`, shareType: 'array', ref: 'D2:D20' };
  // parametersSheet.getCell('D2').value  = `=INDIRECT("LookupImagingMethod[Imaging Methods]")`;
  // =INDIRECT("TestTable[Key]")

  for (let sampleIndex = 0; sampleIndex < form?.samples?.length; sampleIndex++) {
    let sample = form?.samples[sampleIndex];
    const sampleSheet = workbook.addWorksheet(`Biosample ${sampleIndex + 1}`);
    sampleSheet.columns = [
      { header: "Parameter", key: "Parameter", width: 40 },
      { header: "Value", key: "Value", width: 100 },
    ];

    
    let organismType = "others";
    for (let type in options.organismTypes) {
      if (options.organismTypes[type].includes(sample?.organism?.label)) {
        organismType = type;
      }
    }

    // parse cell line
    const cellLine = sample?.cellLine?.value ? sample?.cellLine?.value : sample?.cellLine;
    // const cellLine = fieldOptions?.cellLine
    //   ? fieldOptions?.cellLine.find((e) => e.value === cellLineValue) : cellLineValue;
    // console.log(cellLine);

    // console.log({organismType}, ["humans, rodentsAndRabbits"].includes(organismType));

    const tissueSiteLabel = {
      humans: "Tissue Site",
      rodentsAndRabbits: "Organ Group",
      others: "Organ/Tissue/Site"
    }[organismType];

    const tissueSubsiteLabel = {
      humans: "Tissue Subsite",
      rodentsAndRabbits: "Organ/Tissue",
      others: "Organ/Tissue Subsite"
    }[organismType];

    const tissueHistologyLabel = {
      humans: "Tissue Histology",
      rodentsAndRabbits: "Lesion",
      others: "Lesion"
    }[organismType];

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
        ["Biosample ID", sample?.sampleId],
        ["Biosample Description", sample?.sampleDescription],
        ["Organism", sample?.organism?.label],
        ["Organism (Other)", sample?.organismOther],
        ["GEM Strain", sample?.gemStrain],
        ["Species or Strain", sample?.speciesOrStrain],
        ["Biosample Type", sample?.sampleType?.label],
        ["Cell Line", cellLine],
        ["Tissue Type", sample?.tissueType?.label],
        [tissueSiteLabel, sample?.tissueSite?.label || sample?.tissueSite],
        [tissueSubsiteLabel, sample?.tissueSubsite?.label || sample?.tissueSubsite],
        ["Tissue Health Status", sample?.tissueHealthStatus?.label],
        [tissueHistologyLabel, sample?.tissueHistology?.label || sample?.tissueHistology],
        ["Tissue Histology Behavior", sample?.tissueHistologyBehavior?.label || sample?.tissueHistologyBehavior],
        ["Other Disease or Condition", sample?.otherDiseaseOrCondition],
        ["Embryo", sample?.embryo],
        ["Embryo Stage", sample?.embryoStage],
        ["Intrinsic Variables", sample?.intrinsicVariables],
        ["Extrinsic Variables", sample?.extrinsicVariables],
        ["Experimental Variables", sample?.experimentalVariables],
        ["Additional Attributes", sample?.additionalNotes],
        ["Number of Specimens", sample?.specimens?.length],
      ],
    });


    sampleSheet.addConditionalFormatting({
      ref: 'B5',
      rules: [
        {
          type: 'expression',
          formulae: [`B4="Other"`],
          style: {
            font: { color: {argb: '000000'} },
            fill: {type: 'pattern', pattern: 'none'}
          },
        }
      ]
    });

    sampleSheet.addConditionalFormatting({
      ref: 'A5:B5',
      rules: [
        {
          type: 'expression',
          formulae: [`B4<>"Other"`],
          style: {
            font: { color: {argb: 'eeeeee'} },
            fill: {type: 'pattern', pattern: 'solid', bgColor: {argb: 'eeeeee'}}
          },
        }
      ]
    });
    
    sampleSheet.getCell(4, 2).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: [`=INDIRECT("LookupOrganism[Organisms]")`],
    };

    sampleSheet.getCell(8, 2).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: [`=INDIRECT("LookupSampleType[Biosample Types]")`],
    };

    if (fieldOptions?.cellLine) {
      sampleSheet.getCell(9, 2).dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: [`=INDIRECT("LookupCellLine[Cell Line]")`],
      };
    }

    sampleSheet.getCell(10, 2).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: [`=INDIRECT("LookupTissueType[GEM Tissue Types]")`],
    };

    if (["humans", "rodentsAndRabbits"].includes(organismType)) {
      sampleSheet.getCell(11, 2).dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: [
          {
            humans: `=INDIRECT("LookupTissueSite[Tissue Sites]")`,
            rodentsAndRabbits: `=INDIRECT("LookupOrganTissueLesion[Organ Groups]")`,
          }[organismType],
        ],
      };

      sampleSheet.getCell(12, 2).dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: [
          {
            humans: `=INDIRECT("LookupTissueSubsite[Tissue Subsites]")`,
            rodentsAndRabbits: `=INDIRECT("LookupOrganTissueLesion[Organs/Tissues]")`,
          }[organismType],
        ],
      };
    }


    sampleSheet.getCell(13, 2).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: [`=INDIRECT("LookupTissueHealthStatus[Tissue Health Statuses]")`],
    };

    if (["humans", "rodentsAndRabbits"].includes(organismType)) {
      sampleSheet.getCell(14, 2).dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: [
          {
            humans: `=INDIRECT("LookupTissueHistology[Tissue Histologies]")`,
            rodentsAndRabbits: `=INDIRECT("LookupOrganTissueLesion[Lesions]")`,
          }[organismType],
        ],
      };
    }

    if (organismType === "humans") {
      sampleSheet.getCell(15, 2).dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: [`=INDIRECT("LookupTissueHistology[Tissue Histology Behaviors]")`],
      };
    }

    // sampleSheet.addTable({
    //   name: `Biosample${sampleIndex + 1}LookupImagingMethod`,
    //   ref: excelCoordinatesToRefs(6, 1),
    //   headerRow: true,
    //   style: lookupTableStyle,
    //   columns: [
    //     {name: 'Available Imaging Methods'},
    //   ],
    //   rows: [
    //     ['=FILTER(INDIRECT("LookupImagingMethod[Imaging Methods]"), INDIRECT("LookupImagingMethod[Imaging Facilities]")=B2)']
    //   ]
    // })

    let exampleSpecimens = [
      {
        specimenLocationMethod: null,
        multiwellPlateType: "",
        multiwellPlateCount: "",
        multiwellPlateChannelCount: "",
        multiwellPlateData: null,
        specimenId: "",
        plateId: "",
        wellCoordinates: "",
        blockId: "",
        slideId: "",
        specimenType: "",
        preparationMethod: "",
        details: "",
        channels: [],
      },
    ];

    for (let specimenIndex = 0; specimenIndex < sample.specimens.length; specimenIndex++) {
      let specimen = sample.specimens[specimenIndex];
      const specimenSheet = workbook.addWorksheet(`Biosample ${sampleIndex + 1} - Specimen ${specimenIndex + 1}`);
      specimenSheet.columns = [
        { header: "Parameter", key: "Parameter", width: 40 },
        { header: "Value", key: "Value", width: 100 },
        { header: "", key: "Extra", width: 100 },
      ];

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
          ["Case ID", sample?.caseId],
          ["Specimen Location Method", specimen?.specimenLocationMethod?.label],
          ["Multiwell Plate Type", specimen?.multiwellPlateType?.label],
          ["Multiwell Plate Count", specimen?.multiwellPlateCount],
          ["Multiwell Plate Channel Count", specimen?.multiwellPlateChannelCount],
          ["Specimen ID", specimen?.specimenId],
          ["Plate ID", specimen?.plateId],
          ["Plate Barcode", specimen?.multiwellPlateBarCode],
          ["Well Coordinates", specimen?.wellCoordinates],
          ["Block ID", specimen?.blockId],
          ["Slide ID", specimen?.slideId],
          ["Specimen Type", specimen?.specimenType?.label],
          ["Preparation Method", specimen?.preparationMethod?.label],
          ["Other Preparation Details", specimen?.preparationDetails],
          ["Intrinsic Variables", specimen?.intrinsicVariables],
          ["Extrinsic Variables", specimen?.extrinsicVariables],
          ["Details", specimen?.details],
          ["Number of Channels", specimen?.channels?.length],
        ],
      });

      specimenSheet.getCell(3, 2).dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: [`=INDIRECT("LookupSpecimenLocationMethod[Specimen Location Methods]")`],
      };

      specimenSheet.getCell(13, 2).dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: [`=INDIRECT("LookupExperimentalStatus[Experimental Statuses]")`],
      };

      specimenSheet.getCell(14, 2).dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: [`=INDIRECT("LookupPreparationMethod[Preparation Methods]")`],
      };

      const rowOffset = 21;
      if (specimen?.channels?.length > 0) {

        specimenSheet.addTable({
          name: `Biosample${sampleIndex + 1}Specimen${specimenIndex + 1}Channels`,
          ref: excelCoordinatesToRefs(rowOffset, 1),
          headerRow: true,
          style: {
            theme: "TableStyleMedium2",
            showFirstColumn: true,
            showRowStripes: true,
          },
          columns: [
            { name: "Channel Signal or Contrast Mechanism", filterButton: false },
            { name: "Stain", filterButton: false, width: 100 },
            { name: "Molecular Entity", filterButton: false, width: 100 },
            { name: "Protein Of Interest", filterButton: false, width: 100 },
          ],
          rows: specimen?.channels?.map((channel) => [
            channel?.signalOrContrastMechanism?.label,
            channel?.stain?.label,
            returnStringValue(channel?.molecularEntity), 
            channel?.proteinOfInterest]) || [],
        });

        for (let i = 0; i < specimen?.channels?.length; i++) {
          specimenSheet.getCell(rowOffset + i + 1, 1).dataValidation = {
            type: "list",
            allowBlank: false,
            formulae: [`=INDIRECT("LookupChannelSignalContrastMechanism[Signal or Contrast Mechanisms]")`],
          };

          specimenSheet.getCell(rowOffset + i + 1, 2).dataValidation = {
            type: "list",
            allowBlank: false,
            formulae: [`=INDIRECT("LookupChannelStain[Channel Stains]")`],
          };

          if (fieldOptions?.molecularentity)
          {
            specimenSheet.getCell(rowOffset + i + 1, 3).dataValidation = {
              type: "list",
              allowBlank: false,
              formulae: [`=INDIRECT("LookupMolecularEntity[Molecular Entity]")`],
            };
          }
        }
      }
    }
  }

  for (let i = 0; i < form.multiwellPlates?.length; i ++) {
    const plate = form.multiwellPlates[i];
    const plateSheet = workbook.addWorksheet(`Plate ${i + 1}`);
    plateSheet.columns = [
      { header: "Parameter", key: "Parameter", width: 20 },
      { header: "Value", key: "Value" },
    ];

    plateSheet.addTable({
      name: `Plate${i + 1}Parameters`,
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
        ["Case ID", plate.caseId],
        ["Plate ID/Barcode", plate.id],
        ["Plate Type", plate.dimensions?.label || ""],
        ["Biosample", plate.biosample?.label || ""],
        ["Experimental Status", plate.specimenType?.label || ""],
        ["Preparation Method", plate.preparationMethod?.label || ""],
        ["Preparation Details", plate.preparationDetails || ""],
        ["Intrinsic Variables", plate.intrinsicVariables || ""],
        ["Extrinsic Variables", plate.extrinsicVariables || ""],
        ["Channel Count", plate.channels?.length || "0"],
      ],
    });

    let biosample = form.samples[plate?.biosample?.value - 1];
    let rowOffset = 14;
    let columnOffset = 0;

    let tables = [
      {
        title: `Plate ${i + 1} - Biosample`,
        name: `Plate${i + 1}Biosample`,
        value: plate?.tables?.biosample?.slice(1) || plate?.biosample?.value || "",
      },
      {
        title: `Plate ${i + 1} - Experimental Status`,
        name: `Plate${i + 1}ExperimentalStatus`,
        value: plate?.specimenType?.value || "",
        options: plate.tables?.experimentalStatus?.slice(1) || options.specimenTypes.map((o) => o.value),
      },
      {
        title: `Plate ${i + 1} - Preparation Method`,
        name: `Plate${i + 1}PreparationMethod`,
        value: plate.tables?.preparationMethod?.slice(1) || plate?.preparationMethod?.value || "",
        options: filteredOptions.getSpecimenPreparationMethods(form).map((o) => o.value),
      },
      {
        title: `Plate ${i + 1} - Other Preparation Details`,
        name: `Plate${i + 1}PreparationDetails`,
        value: plate.tables?.preparationDetails?.slice(1) || plate?.preparationDetails || "",
      },
      {
        title: `Plate ${i + 1} - Intrinsic Variables`,
        name: `Plate${i + 1}IntrinsicVariables`,
        value: plate.tables?.intrinsicVariables?.slice(1) || plate?.intrinsicVariables || biosample?.intrinsicVariables || "",
      },
      {
        title: `Plate ${i + 1} - Extrinsic Variables`,
        name: `Plate${i + 1}ExtrinsicVariables`,
        value: plate.tables?.extrinsicVariables?.slice(1) || plate?.extrinsicVariables || biosample?.extrinsicVariables || "",
      },
    ];

    for (let j = 0; j < +plate?.channels?.length || 0; j++) {
      let channel = plate.channels?.[j];
      // check if molecular entity is object (select input) or string (text input)
      const moleEntityVal = channel?.molecularEntity || "";
      const molecularEntityValue = returnStringValue(moleEntityVal);
      
      tables = tables.concat([
        {
          title: `Channel ${j + 1} - Signal or Contrast Mechanism`,
          name: `Plate${i + 1}Channel${j + 1}SignalOrContrastMechanism`,
          value: plate.tables?.channels?.[j]?.signalOrContrastMechanism?.slice(1) || channel?.signalOrContrastMechanism?.value || "",
          options: filteredOptions.getChannelSignalContrastMechanisms(form).map((o) => o.value),
        },
        {
          title: `Channel ${j + 1} - Stain`,
          name: `Plate${i + 1}Channel${j + 1}Stain`,
          value: getChannelValue(plate.tables?.channels?.[j]?.stain?.slice(1), channel),
          options: filteredOptions.getChannelStains(form).map((o) => o.value),
        },
        {
          title: `Channel ${j + 1} - Molecular Entity`,
          name: `Plate${i + 1}Channel${j + 1}MolecularEntity`,
          value: molecularEntityValue || "",
          formulae: (typeof moleEntityVal === "string")
          ? undefined : [`=INDIRECT("LookupMolecularEntity[Molecular Entity]")`],
        },
        {
          title: `Channel ${j + 1} - Protein of Interest`,
          name: `Plate${i + 1}Channel${j + 1}ProteinOfInterest`,
          value: channel?.proteinOfInterest || "",
        },
      ]);
    }

    for (const table of tables) {
      plateSheet.getCell(rowOffset, columnOffset + 1).value = table.title;
      plateSheet.getCell(rowOffset, columnOffset + 1).font = { bold: true };
      rowOffset++;
      plateSheet.addTable({
        name: table.name,
        ref: excelCoordinatesToRefs(rowOffset, columnOffset + 1),
        ...generateExcelTable(plate.dimensions.rows, plate.dimensions.columns, table.value),
      });
      if (table.options || table.formulae) {
        setValidOptions(
          plateSheet, 
          rowOffset + 1, 2, 
          rowOffset + plate.dimensions.rows, 
          columnOffset + plate.dimensions.columns + 1, 
          table.options,
          table.formulae
        );
      }
      rowOffset += plate.dimensions.rows + 2;
    }
  }

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

export async function generateMultiwellDataTemplate(form, sample, specimen) {
  // console.log({ form, sample, specimen });

  const workbook = new Excel.Workbook();
  const parametersSheet = workbook.addWorksheet("Parameters");
  parametersSheet.columns = [
    { header: "Parameter", key: "Parameter", width: 40 },
    { header: "Value", key: "Value", width: 100 },
  ];
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
    rows: [
      ["Imaging Facility", form?.imagingFacility?.label],
      ["Principal Investigator", form?.principalInvestigator?.label],
      ["Project Scientist", form?.projectScientist],
      ["Dataset ID", form?.datasetId],
      ["Imaging Method", form?.imagingMethod?.label],
      ["Biosample ID", sample?.sampleId],
      ["Specimen Location Method", specimen?.specimenLocationMethod?.value],
      ["Multiwell Plate Type", +specimen?.multiwellPlateType?.value],
      ["Multiwell Plate Count", +specimen?.multiwellPlateCount],
      ["Multiwell Plate Channel Count", +specimen?.multiwellPlateChannelCount],
    ],
  });

  for (let i = 0; i < +specimen?.multiwellPlateCount || 0; i++) {
    const plateSheet = workbook.addWorksheet(`Plate ${i + 1}`);
    const tableSize = +specimen?.multiwellPlateType?.value || 0;
    const tableDimensions = {
      384: { rows: 16, columns: 24 },
      96: { rows: 8, columns: 12 },
      24: { rows: 2, columns: 12 },
      12: { rows: 3, columns: 4 },
      6: { rows: 2, columns: 3 },
    }[tableSize];

    let rowOffset = 1;
    let tables = [
      {
        title: `Plate ${i + 1} - Experimental Status`,
        name: `Plate${i + 1}ExperimentalStatus`,
        value: specimen?.specimenType?.value || "",
        options: options.specimenTypes.map((o) => o.value),
      },
      {
        title: `Plate ${i + 1} - Preparation Method`,
        name: `Plate${i + 1}PreparationMethod`,
        value: specimen?.preparationMethod?.value || "",
        options: filteredOptions.getSpecimenPreparationMethods(form).map((o) => o.value),
      },
    ];
    
    for (let j = 0; j < +specimen?.multiwellPlateChannelCount || 0; j++) {

      const moleEntityVal = specimen?.channels?.[0]?.molecularEntity || "";
      // console.log("specimen");
      const molecularEntityValue = returnStringValue(moleEntityVal);

      tables = tables.concat([
        {
          title: `Channel ${j + 1} - Signal or Contrast Mechanism`,
          name: `Plate${i + 1}Channel${j + 1}SignalOrContrastMechanism`,
          value: specimen?.channels?.[0]?.signalOrContrastMechanism?.value || "",
          options: filteredOptions.getChannelSignalContrastMechanisms(form).map((o) => o.value),
        },
        {
          title: `Channel ${j + 1} - Stain`,
          name: `Plate${i + 1}Channel${j + 1}Stain`,
          value: specimen?.channels?.[0]?.stain?.value || "",
          options: filteredOptions.getChannelStains(form).map((o) => o.value),
        },
        {
          title: `Channel ${j + 1} - Molecular Entity`,
          name: `Plate${i + 1}Channel${j + 1}MolecularEntity`,
          value: molecularEntityValue || "",
          formulae: (typeof moleEntityVal === "string")
            ? undefined : [`=INDIRECT("LookupMolecularEntity[Molecular Entity]")`], 
        },
        {
          title: `Channel ${j + 1} - Protein Of Interest`,
          name: `Plate${i + 1}Channel${j + 1}ProteinOfInterest`,
          value: specimen?.channels?.[0]?.proteinOfInterest?.value || "",
        },
      ]);
    }

    for (const table of tables) {
      plateSheet.getCell(rowOffset, 1).value = table.title;
      plateSheet.getCell(rowOffset, 1).font = { bold: true };
      rowOffset++;
      plateSheet.addTable({
        name: table.name,
        ref: excelCoordinatesToRefs(rowOffset, 1),
        ...generateExcelTable(tableDimensions.rows, tableDimensions.columns, table.value),
      });
      if (table.options || table.formulae) {
        setValidOptions(
          plateSheet, 
          rowOffset + 1, 2, 
          rowOffset + tableDimensions.rows, 
          tableDimensions.columns + 1, 
          table.options,
          table.formulae
        );
      }
      rowOffset += tableDimensions.rows + 2;
    }
  }
  return await workbook.xlsx.writeBuffer();
}

function getValueByIncludedKey(obj, target) {
  const t = String(target).toLowerCase();
  for (const [key, value] of Object.entries(obj)) {
    const keyLC = String(key).toLowerCase();
    if (keyLC.includes(t)) return value;   // return on first match
  }
  return undefined; // no match
}

export async function loadExcelMetadata(file) {

  const workbook = new Excel.Workbook();
  const arrayBuffer = await readFile(file);
  let errors = [];
  
  await workbook.xlsx.load(arrayBuffer);

  const parametersSheet = workbook.getWorksheet("Parameters");

  let imagingFacilityValue = parametersSheet.getCell("B2").value;
  let count = 0;
  // check for facility id
  while(count < 10) {
    const key = parametersSheet.getCell(`A${count}`).value;
    const fileName = constructProperty(key);
    if (fileName === "imagingFacility") {
      imagingFacilityValue = parametersSheet.getCell(`B${count}`).value;
    }
    count++;
  }

  const imagingFacility = options.imagingFacilities.find((e) => e.label === imagingFacilityValue);
  if (!imagingFacility) {
    errors.push("Parameters sheet does not have a valid imaging facility");
  }
  // retrive form options from template
  const {
    displayFormFields,
    optionalFormFeatures,
    formFieldOptions = undefined
  } = await getFormTemplate(imagingFacility.value, imagingFacility.dirName);

  if (newForm.includes(imagingFacility?.value)) {
    return {
      metadata: {
        imagingFacility,
        displayFormFields,
        optionalFormFeatures,
        formFieldOptions
      },
      formFieldOptions
    };
  }
  const principalInvestigatorValue = parametersSheet.getCell("B3").value;
  const principalInvestigator = options.principalInvestigators.find((e) => e.label === principalInvestigatorValue);
  if (!principalInvestigator) {
    errors.push("Parameters sheet does not have a valid principal investigator");
  }

  const projectScientist = parametersSheet.getCell("B4").value;
  const email = parametersSheet.getCell("B5").value;

  const datasetId = parametersSheet.getCell("B6").value;
  const imagingMethodValue = parametersSheet.getCell("B7").value;
  const imagingMethod = options.imagingMethods.find((e) => e.label === imagingMethodValue && e.facilityIds?.includes(imagingFacility?.value));
  if (!imagingMethod) {
    errors.push("Parameters sheet does not have a valid imaging method");
  }

  const imagingMethodOther = parametersSheet.getCell("B8").value;

  const studyDescription = parametersSheet.getCell("B9").value;
  const supportingLinks = parametersSheet.getCell("B10").value;

  const omeroScreenProjectId = parametersSheet.getCell("B12").value;
  // console.log(omeroScreenProjectId);

  const sampleCount = +parametersSheet.getCell("B11").value;
  const samples = [];

  for (let i = 0; i < sampleCount; i++) {
    const sampleSheet = workbook.getWorksheet(`Biosample ${i + 1}`);
    const sampleId = sampleSheet.getCell("B2").value;
    const sampleDescription = sampleSheet.getCell("B3").value;
    const organismValue = sampleSheet.getCell("B4").value;
    const organism = options.organisms.find((e) => e.label === organismValue);
    if (!organism) {
      errors.push(`Biosample ${i + 1} sheet does not have a valid organism`);
    }

    const organismOther = sampleSheet.getCell("B5").value;
    const gemStrain = sampleSheet.getCell("B6").value;
    const speciesOrStrain = sampleSheet.getCell("B7").value;

    const sampleTypeValue = sampleSheet.getCell("B8").value;
    const sampleType = options.sampleTypes.find((e) => e.label === sampleTypeValue);
    if (!sampleType) {
      errors.push(`Biosample ${i + 1} sheet does not have a valid sample type`);
    }
    const cellLineValue = sampleSheet.getCell("B9").value;
    
    const cellLine = formFieldOptions?.cellLine
      ? formFieldOptions?.cellLine.find((e) => e.value === cellLineValue) : cellLineValue;
    // const cellLine = sampleSheet.getCell("B9").value;
    const tissueTypeValue = sampleSheet.getCell("B10").value;
    const tissueType = options.tissueTypes.find((e) => e.label === tissueTypeValue);
    if (sampleType === 'Tissue' && !tissueType) {
      errors.push(`Biosample ${i + 1} sheet does not have a valid tissue type`);
    }

    let organismType = null;
    for (let type in options.organismTypes) {
      if (options.organismTypes[type].includes(organismValue)) {
        organismType = type;
      }
    }

    const tissueSiteValue = sampleSheet.getCell("B11").value;
    const tissueSiteOptions = {
      humans: options.tissueSites,
      rodentsAndRabbits: options.nonHumanTissueSites,
    }[organismType];
    const tissueSite = tissueSiteOptions?.find((e) => e.label === tissueSiteValue);
    if (sampleType?.value === 'Tissue' && !tissueSite) {
      errors.push(`Biosample ${i + 1} sheet does not have a valid tissue site`);
    }

    const tissueSubsiteValue = sampleSheet.getCell("B12").value;
    const tissueSubsiteOptions = {
      humans: options.tissueSubsites,
      rodentsAndRabbits: options.nonHumanTissueSubsites,
    }[organismType];
    const tissueSubsite = tissueSubsiteOptions?.find((e) => e.label === tissueSubsiteValue);
    console.log({tissueSubsite, sampleType, tissueSite })
    if (sampleType?.value === 'Tissue' && !tissueSubsite) {
      errors.push(`Biosample ${i + 1} sheet does not have a valid tissue subsite`);
    }

    const tissueHealthStatusValue = sampleSheet.getCell("B13").value;
    const tissueHealthStatus = options.tissueHealthStatuses.find((e) => e.label === tissueHealthStatusValue);
    if (sampleType === 'Tissue' && !tissueHealthStatus) {
      errors.push(`Biosample ${i + 1} sheet does not have a valid tissue health status`);
    }

    const tissueHistologyValue = sampleSheet.getCell("B14").value;
    const tissueHistologyOptions = {
      humans: options.tissueHistologies,
      rodentsAndRabbits: options.nonHumanTissueHistologies,
    }[organismType];
    const tissueHistology = tissueHistologyOptions?.find((e) => e.label === tissueHistologyValue) ?? tissueHistologyValue;

    const tissueHistologyBehaviorValue = sampleSheet.getCell("B15").value;
    const tissueHistologyBehavior = options.tissueHistologyBehaviors.find((e) => e.label === tissueHistologyBehaviorValue);

    const otherDiseaseOrCondition = sampleSheet.getCell("B16").value;
    const embryo = sampleSheet.getCell("B17").value;
    const embryoStage = sampleSheet.getCell("B18").value;
    const intrinsicVariables = sampleSheet.getCell("B19").value;
    const extrinsicVariables = sampleSheet.getCell("B20").value;
    const experimentalVariables = sampleSheet.getCell("B21").value;
    const additionalNotes = sampleSheet.getCell("B22").value;

    const specimenCount = +sampleSheet.getCell("B23").value;
    const specimens = [];

    for (let j = 0; j < specimenCount; j++) {
      const specimenSheet = workbook.getWorksheet(`Biosample ${i + 1} - Specimen ${j + 1}`);
      const caseId = specimenSheet.getCell("B2").value;
      const specimenLocationMethodValue = specimenSheet.getCell("B3").value;
      const specimenLocationMethod = options.specimenLocationMethods.find((e) => e.label === specimenLocationMethodValue);

      const multiwellPlateTypeValue = specimenSheet.getCell("B4").value;
      const multiwellPlateType = options.multiwellPlateTypes.find((e) => e.label === multiwellPlateTypeValue);
      const multiwellPlateCount = +specimenSheet.getCell("B5").value;
      const multiwellPlateChannelCount = +specimenSheet.getCell("B6").value;

      const specimenId = specimenSheet.getCell("B7").value;
      const plateId = specimenSheet.getCell("B8").value;
      const multiwellPlateBarCode = specimenSheet.getCell("B9").value;
      const wellCoordinates = specimenSheet.getCell("B10").value;
      const blockId = specimenSheet.getCell("B11").value;
      const slideId = specimenSheet.getCell("B12").value;
      const specimenTypeValue = specimenSheet.getCell("B13").value;
      const specimenType = options.specimenTypes.find((e) => e.label === specimenTypeValue);
      const preparationMethodValue = specimenSheet.getCell("B14").value;
      const preparationMethod = options.specimenPreparationMethods.find((e) => e.label === preparationMethodValue);
      const preparationDetails = specimenSheet.getCell("B15").value;
      const intrinsicVariables = specimenSheet.getCell("B16").value;
      const extrinsicVariables = specimenSheet.getCell("B17").value;
      const details = specimenSheet.getCell("B18").value;
      const experimentalTreatment = specimenSheet.getCell("B19").value;
      const channelCount = +specimenSheet.getCell("B20").value;

      const channels = [];

      for (let k = 0; k < channelCount; k++) {
        const rowOffset = 23;
        const signalOrContrastMechanismValue = specimenSheet.getCell(rowOffset + k, 1).value;
        // const signalOrContrastMechanism = options.channelSignalContrastMechanisms.find((e) => e.label === signalOrContrastMechanismValue);
        const signalOrContrastMechanism = {
          value: signalOrContrastMechanismValue,
          label: signalOrContrastMechanismValue
        }

        const stainValue = specimenSheet.getCell(rowOffset + k, 2).value;
        // const stain = options.channelStains.find((e) => e.label === stainValue);
        const stain = {
          value: stainValue,
          label: stainValue
        };

        const moleEntityVal = specimenSheet.getCell(rowOffset + k, 3).value;
        const moleEntityOption = {
          value: moleEntityVal,
          label: moleEntityVal
        };
        // set dropdown or string
        const molecularEntity = formFieldOptions?.molecularEntity
        ? moleEntityOption : moleEntityVal;
        // const molecularEntity = specimenSheet.getCell(rowOffset + k, 3).value;
        const proteinOfInterest = specimenSheet.getCell(rowOffset + k, 4).value;
        const channel = {
          signalOrContrastMechanism,
          stain,
          molecularEntity,
          proteinOfInterest
        };

        channels.push(channel);
      }

      const specimen = {
        caseId,
        specimenLocationMethod,
        multiwellPlateType,
        multiwellPlateCount,
        multiwellPlateChannelCount,
        specimenId,
        plateId,
        multiwellPlateBarCode,
        wellCoordinates,
        blockId,
        slideId,
        specimenType,
        preparationMethod,
        preparationDetails,
        intrinsicVariables,
        extrinsicVariables,
        details,
        experimentalTreatment,
        channels,
      };

      specimens.push(specimen);
    }

    const sample = {
      sampleId,
      sampleDescription,
      organism,
      organismOther,
      gemStrain,
      speciesOrStrain,
      sampleType,
      cellLine,
      tissueType,
      tissueSite,
      tissueSubsite,
      tissueHealthStatus,
      tissueHistology,
      tissueHistologyBehavior,
      otherDiseaseOrCondition,
      embryo,
      embryoStage,
      intrinsicVariables,
      extrinsicVariables,
      experimentalVariables,
      additionalNotes,
      specimens,
    };

    samples.push(sample);
  }

  // load plates
  const multiwellPlates = [];
  const offsetIndex = -1; // remove experimental status
  workbook.eachSheet(function(worksheet, sheetId) {
    const plateRegex = /Plate (\d+)/;
    const match = worksheet.name.match(plateRegex);
    if (match) {
      const plateIndex = match[1] - 1;
      const plate = {
        caseId: worksheet.getCell("B2").value,
        plateName: worksheet.getCell("B3").value,
        dimensions: options.multiwellPlateTypes.find((e) => e.label === worksheet.getCell("B4").value),
        biosample: filteredOptions.getPlateBiosamples({samples}).find((e) => e.label === worksheet.getCell("B5").value),
        // specimenType: options.specimenTypes.find((e) => e.label === worksheet.getCell("B6").value),
        preparationMethod: options.specimenPreparationMethods.find((e) => e.label === worksheet.getCell(`B${7+offsetIndex}`).value),
        preparationDetails: worksheet.getCell(`B${8+offsetIndex}`).value,
        intrinsicVariables: worksheet.getCell(`B${9+offsetIndex}`).value,
        extrinsicVariables: worksheet.getCell(`B${10+offsetIndex}`).value,
        id: worksheet.getCell(`B${12+offsetIndex}`).value,
        channels: [],
        tables: {}
      };

      const tables = {};
      for (const tableName in worksheet.tables) {
        tables[tableName] = getTableData(worksheet, tableName);
      }
      plate.tables.biosample = getValueByIncludedKey(tables, `Plate${plateIndex + 1}Biosample`);
      plate.tables.experimentalStatus = getValueByIncludedKey(tables, `Plate${plateIndex + 1}ExperimentalStatus`);
      plate.tables.preparationMethod = getValueByIncludedKey(tables, `Plate${plateIndex + 1}PreparationMethod`);
      plate.tables.preparationDetails = getValueByIncludedKey(tables, `Plate${plateIndex + 1}PreparationDetails`);
      plate.tables.intrinsicVariables = getValueByIncludedKey(tables, `Plate${plateIndex + 1}IntrinsicVariables`);
      plate.tables.extrinsicVariables = getValueByIncludedKey(tables, `Plate${plateIndex + 1}ExtrinsicVariables`);

      // plate.tables.biosample = tables[`Plate${plateIndex + 1}Biosample`];
      // plate.tables.experimentalStatus = tables[`Plate${plateIndex + 1}ExperimentalStatus`];
      // plate.tables.preparationMethod = tables[`Plate${plateIndex + 1}PreparationMethod`];
      // plate.tables.preparationDetails = tables[`Plate${plateIndex + 1}PreparationDetails`];
      // plate.tables.intrinsicVariables = tables[`Plate${plateIndex + 1}IntrinsicVariables`];
      // plate.tables.extrinsicVariables = tables[`Plate${plateIndex + 1}ExtrinsicVariables`];
      plate.tables.channels = [];
      
      const numChannels = +worksheet.getCell(`B${11+offsetIndex}`).value || 0;
      for (let i = 0; i < numChannels; i ++) {
        const signalOrContrastMechanism = getValueByIncludedKey(
          tables,
          `Channel${i + 1}SignalOrContrastMechanism`.toLocaleLowerCase()
        );
        console.log(signalOrContrastMechanism);
        const stain = getValueByIncludedKey(tables, `Channel${i + 1}Stain`);
        const molecularEntity = getValueByIncludedKey(tables, `Channel${i + 1}MolecularEntity`);
        const proteinOfInterest = getValueByIncludedKey(tables, `Channel${i + 1}ProteinOfInterest`);
        const signalOrContrastValue = findPlateValue(signalOrContrastMechanism);
        const stainValue = findPlateValue(stain);
        const moleEntityValue = findPlateValue(molecularEntity);
        const channel = {
          signalOrContrastMechanism: options.channelSignalContrastMechanisms.find((e) => e.label === signalOrContrastValue),
          stain: options.channelStains.find((e) => e.value === stainValue),
          molecularEntity: formFieldOptions?.molecularentity
            ? formFieldOptions?.molecularentity.find((e) => e.value === moleEntityValue) : moleEntityValue,
          proteinOfInterest: proteinOfInterest ? proteinOfInterest[1][1] : "",
        }
        plate.channels[i] = channel;
        plate.tables.channels[i] = { signalOrContrastMechanism, stain, molecularEntity }
        
      }

      multiwellPlates[plateIndex] = plate;
    }
  })

  return {
    metadata: {
      imagingFacility,
      principalInvestigator,
      projectScientist,
      email,
      datasetId,
      imagingMethod,
      imagingMethodOther,
      studyDescription,
      supportingLinks,
      samples,
      multiwellPlates,
      errors,
      omeroScreenProjectId,
    },
    formFieldOptions
  };
}

function getSheetValues(sheet, startRow, startColumn, endRow, endColumn) {
  const values = [];
  for (let r = startRow; r <= endRow; r++) {
    values.push([]);
    for (let c = startColumn; c <= endColumn; c++) {
      values[r - startRow].push(sheet.getCell(r, c).value);
    }
  }
  return values;
}

export function setValidOptions(sheet, startRow, startColumn, endRow, endColumn, options, formulae = undefined) {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startColumn; c <= endColumn; c++) {
      sheet.getCell(r, c).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: formulae || [`"${options.join()}"`],
      };
    }
  }
}

function getTableData(worksheet, tableName, topOffset = 0, leftOffset = 0) {
  const table = worksheet.tables[tableName];
  const [upperLeft, lowerRight] = table.table.tableRef.split(":");
  const upperLeftCoords = excelRefsToCoordinates(upperLeft);
  const lowerRightCoords = excelRefsToCoordinates(lowerRight);
  const tableData = getSheetValues(worksheet, upperLeftCoords[0] + topOffset, upperLeftCoords[1] + leftOffset, lowerRightCoords[0], lowerRightCoords[1]);
  return tableData;
}

export function generateExcelTable(rows, columns, defaultValue = "") {
  const columnHeaders = generateRange(0, columns, false);
  const rowHeaders = generateRange("A", "Z", true).slice(0, rows);
  return {
    headerRow: true,
    style: {
      theme: "TableStyleMedium2",
      showFirstColumn: true,
      showRowStripes: true,
    },
    columns: columnHeaders.map((e) => ({ name: e === 0 ? " " : e?.toString() })),
    rows: Array.isArray(defaultValue) ? defaultValue : generateMatrix(rows, columns, defaultValue).map((row, i) => [rowHeaders[i], ...row]),
  };
}

function generateRange(start, end, isAlpha = false) {
  let range = [];
  if (isAlpha) {
    for (let i = start.charCodeAt(0); i <= end.charCodeAt(0); i++) {
      range.push(String.fromCharCode(i));
    }
  } else {
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
  }
  return range;
}

function generateMatrix(rows, columns, fillValue) {
  let matrix = [];
  for (let i = 0; i < rows; i++) {
    matrix.push([]);
    for (let j = 0; j < columns; j++) {
      matrix[i].push(fillValue);
    }
  }
  return matrix;
}

export async function loadMultiwellData(file) {
  if (!file) return null;
  const workbook = new Excel.Workbook();
  const arrayBuffer = await readFile(file);
  await workbook.xlsx.load(arrayBuffer);

  const parametersSheet = workbook.getWorksheet("Parameters");
  const multiwellPlateType = +parametersSheet.getCell("B9").value;
  const multiwellPlateCount = +parametersSheet.getCell("B10").value;
  const multiwellPlateChannelCount = +parametersSheet.getCell("B11").value;

  if (!multiwellPlateType || !multiwellPlateCount || !multiwellPlateChannelCount) {
    throw new Error("Invalid multiwell plate data");
  }

  let values = {};

  for (let i = 0; i < multiwellPlateCount; i++) {
    const plateSheet = workbook.getWorksheet(`Plate ${i + 1}`);
    const tableDimensions = {
      384: { rows: 16, columns: 24 },
      96: { rows: 8, columns: 12 },
    }[multiwellPlateType];

    let rowOffset = 3;
    let tables = [
      {
        name: `Plate${i + 1}ExperimentalStatus`,
      },
      {
        name: `Plate${i + 1}PreparationMethod`,
      },
    ];

    for (let j = 0; j < multiwellPlateChannelCount; j++) {
      tables = tables.concat([
        {
          name: `Plate${i + 1}Channel${j + 1}SignalOrContrastMechanism`,
        },
        {
          name: `Plate${i + 1}Channel${j + 1}Stain`,
        },
        {
          name: `Plate${i + 1}Channel${j + 1}MolecularEntity`,
        },
        {
          name: `Plate${i + 1}Channel${j + 1}ProteinOfInterest`,
        },
      ]);
    }

    for (const table of tables) {
      const tableValues = getSheetValues(plateSheet, rowOffset, 2, rowOffset + tableDimensions.rows - 1, 1 + tableDimensions.columns);
      values[table.name] = tableValues;
      rowOffset += tableDimensions.rows + 3;
    }
  }
  return values;
}

// create table template for Channel inputs for batch upload
// replace the template value on input change
export function createAndPopulateTableTemplate(table = [[]], value = '') {
  if (!table) {
    return undefined;
  }
  const tableTemplate = safeClone(table);
  // return undefined if tabletemplate or placeholder value is not available
  if (tableTemplate.length === 0 || tableTemplate[0].length === 0) {
    return undefined;
  }
  const rows = tableTemplate.length;
  for (let i = 1; i < rows; i++) {
    const cols = tableTemplate[i].length;
    for (let j = 1; j < cols; j++) {
      const val = tableTemplate[i][j];
      // add placeholder value
      if (val && `${val}`.length > 0 && value.length === 0)
      {
        tableTemplate[i][j] = "N/A";
      }
      // add placeholder value
      if (val && `${val}`.length > 0 && value.length > 0) {
        tableTemplate[i][j] = value;
      }
    }
  }
  // remove column indexes
  // tableTemplate.shift();
  return tableTemplate;
};

export const getPlateChannelValues = (tables) => {
  const channels = []
  const tableKeys = Object.keys(tables);
  let count = 1;
  let checkChannelValue = true;
  while (checkChannelValue) {
    const channel = {};
    tableKeys.forEach(key => {
      const keyLC = `${key}`.toLowerCase();
      const chIndexLebal = `channel${count}`;
      if (keyLC.includes(chIndexLebal)) {
        const channelField = `${key}`.replace(chIndexLebal, '');
        const table = tables[key];
        const chFieldVal = findPlateValue(table);
        if (chFieldVal) {
          const fieldName = (channelField[0]).toLowerCase().concat(channelField.slice(1));
          if (["signalOrContrastMechanism", "stain"].includes(fieldName)) {
            channel[fieldName] = { label: chFieldVal, value: chFieldVal };
          } else {
            channel[fieldName] = chFieldVal;
          }
        }
      }
    });
  
    if (Object.keys(channel).length > 0) {
      channels.push(channel);
    } else {
      checkChannelValue = false;
    }
    count += 1;
  }

  return channels;
}


// format multiplate tables
export function formatPlateTables(plateIdTables) {
  let addMultiWellTables = [];
  for (const [plateId, tables] of Object.entries(plateIdTables)) {
    let formatTablesValue = {};
    let dimension;
    for (const [table, values] of Object.entries(tables)) {
      const { formatedValues, plateDim } = formValueMultiplateMultiTableBatchUpload(values, table, formatTablesValue);
      formatTablesValue = {
        ...formatTablesValue,
        ...formatedValues
      };
      dimension = plateDim;
    }

    // select any table as template for channel inputs
    // the table values will be update with the channel inputs
    const tableTemplateKey = Object.keys(formatTablesValue)[0];
    const keys = Object.keys(formatTablesValue);
    const plateVariables = {};
    // for (let i = 0; i < keys.length; i++) {
      // const key = keys[i];
      // const tbl = formatTablesValue[key];
      // Process key and value
      // plateVariables[key] = findPlateValue(tbl);
    // }

    // channel values
    const channels = getPlateChannelValues(formatTablesValue);
    // omero plate id if exist

    addMultiWellTables.push({
      ...defaultMultiwellPlate,
      caseId: '',
      id: findPlateValue(formatTablesValue['omeroPlateID']),
      plateName: plateId,
      tables: formatTablesValue,
      dimensions: dimension,
      extrinsicVariables: plateVariables.extrinsicVariables || '',
      intrinsicVariables: plateVariables.intrinsicVariables || '',
      preparationMethod: {
        "value": plateVariables?.preparationMethod, 
        "label": plateVariables?.preparationMethod
      },
      preparationDetails: plateVariables.otherPreparationDetails
        || plateVariables.preparationDetails,
      channelTableTemplate: createAndPopulateTableTemplate(formatTablesValue[tableTemplateKey]),
      channels : channels || []
    });
  }
  return addMultiWellTables;
}

// multipwell Plates file parsing for xlsx file
export async function parseMultiwellFileXlsx (file) {
  if (!file) return null;

  const workbook = new Excel.Workbook();
  const arrayBuffer = await readFile(file);
  await workbook.xlsx.load(arrayBuffer);
  const fileName = `${file.name}`.split(".")[0];
  const worksheet = workbook.getWorksheet(fileName);

  const alphaNumericPattern = /^[a-zA-Z0-9]+$/;
  const dictionary = {};
  const tableIndex = {};
  const plateIdTables = {};
  worksheet?.eachRow((row, rowNumber) => {
    // initialize table with column index
    if (rowNumber == 1) {
      row.values.forEach((key, index) => {
        if (index > 2) tableIndex[index] = key;
      });
      return;
    }
    const value = row.values.slice(1, 4);
    const plateId = value[0];
    const wellId = value[1];
    const sample = value[2];
  
    Object.keys(tableIndex).forEach((key) => {
      // initialized table to plate ID
      if (!plateIdTables[plateId]) {
        plateIdTables[plateId] = {};
      }
      const table = tableIndex[key];
      const tableName = (table[0]).toLowerCase().concat(table.slice(1));
      if (!plateIdTables[plateId][tableName]) {
        plateIdTables[plateId][tableName] = {};
      }
      plateIdTables[plateId][tableName][wellId] = row.values[key];
    });

    if (alphaNumericPattern.test(wellId))
      {
        if (!dictionary[plateId]) {
          dictionary[plateId] = {[wellId]: sample };
        } else {
          dictionary[plateId][wellId] = sample;
        }
      }
  });
  
  return { dictionary, plateIdTables};
}

const plateIdToTables = (row, dictionary, index, tableName) => {
  const plateId = row[0];
  const wellId = row[1];
  const value = (row[index]);

  if (!plateId) { 
    return;
  }

  // check if well position is alphanumeric
  const alphaNumericPattern = /^[a-zA-Z0-9]+$/;
  if (!alphaNumericPattern.test(wellId)) return;

  if(!dictionary[plateId]) {
    dictionary[plateId] = {};
  }

  if (!dictionary[plateId][tableName]) {
    dictionary[plateId][tableName] = {[wellId]: value };
  } else {
    dictionary[plateId][tableName][wellId] = value;
  }
}

const multiWellPlatesKeyValePair = (row, dictionary, index = 2) => {
  const plateId = row[0];
  const wellId = row[1];
  const sampleValue = row[index];

  // console.log(row);

  // check if well position is alphanumeric
  const alphaNumericPattern = /^[a-zA-Z0-9]+$/;
  if (!alphaNumericPattern.test(wellId)) return;

  if (!dictionary[plateId]) {
    dictionary[plateId] = {[wellId]: sampleValue };
  } else {
    dictionary[plateId][wellId] = sampleValue;
  }
}

// multipwell Plates file parsing for .txt and CSV file
export function parseMultiplatesFileTxtCSV (content, file) {
  const lines = content.split('\n');
  const inclusiveVariables = Object.keys(importVariablesType).map(
    key => `${importVariablesType[key]}`.toLowerCase().replace(/\s+/, "")); 

  const columns = `${lines[0]}`.split("\t").map(col=> col.replace("\r", ""));
  
  const variables = `${lines[0]}`.split("\t").filter(col => inclusiveVariables
    .includes(`${col}`.toLowerCase()));

  // set value with index
  const wellPlateIndexes = [];
  const plateIds = [];

  // multiwell plate data
  const multiColumnValues = {};
  const plateIdTables = {};
  columns.forEach((col, colIndex) => {

    if (colIndex < 2) {
      return;
    }

    const tableName = (`${lines[0]}`.split("\t")[colIndex]).trim();

    if (file.type === 'text/plain')
      {
        if (lines.length > 0) {
          lines.forEach((line, index) => {
            var row = `${line}`.replace("\r", "").split("\t");
            plateIdToTables(row, plateIdTables, colIndex, tableName);
          });
        }
      }
    if (file.type === 'text/csv')
      {
        lines.forEach((line, index) => {
          var row = `${line}`.replace("\r", "").split(",");
          plateIdToTables(row, plateIdTables, colIndex, tableName);
        });
      }
  });

  const plateIdToValues = {};
  if (file.type === 'text/plain')
  {
    if (lines.length > 0) {
      
      lines.forEach((line, index) => {
        var row = `${line}`.split("\t");
        multiWellPlatesKeyValePair(row, plateIdToValues);
      });
      return { plateIdToValues, plateIdTables };
    }
  }
  if (file.type === 'text/csv')
  {
    lines.forEach((line, index) => {
      var row = `${line}`.replace("\r", "").split(",");
      multiWellPlatesKeyValePair(row, plateIdToValues);
    });
    return { plateIdToValues, plateIdTables };
  }
  return { plateIdToValues, plateIdTables };
}

export const generatePlateTables = (plateValue, plateDim, table = "extrinsicVariables") => {
  const { rows, columns } = plateDim;

  const columnHeaders = generateRange(0, columns, false)
    .map((value, index) => (index == 0) ? '' : `${value}`);
  const rowHeaders = generateRange("A", "Z", true).slice(0, rows);
  rowHeaders.unshift("");

  // initialize empty biosample table
  const tableValues = Array.from({ length: rows + 1 }, () => Array.from({ length: columns + 1}, () => ''));
  // column label
  tableValues[0] = columnHeaders;
  // row label
  tableValues.forEach((val, index) => tableValues[index][0] = rowHeaders[index]);
  
  // assign table values
  for (let i = 0; i < rowHeaders.length; i++ )
  {
    if (`${rowHeaders[i]}`.trim().length == 0)
    {
      continue;
    }
    for (let j = 0; j < columnHeaders.length; j++)
    {
      // construct keys to extract sample/plate value
      const key = rowHeaders[i].concat(columnHeaders[j]);
      if(!plateValue[key]) {
        continue;
      }

      // assign plate value to table
      tableValues[i][j] = plateValue[key];
    }
  }

  // tables
  const tableName = (table[0]).toLowerCase().concat(table.slice(1));
  return {
    
    [tableName]: tableValues
  };
}

const getPlateTypes = (multiPlateValues) => {
  const wells = Object.keys(multiPlateValues).sort();
  const lastWellId = wells[wells.length - 1];
  const lastRowHeader = `${lastWellId}`.replace(/[^a-zA-Z]/g, '');
  const lastColHeader = `${lastWellId}`.replace(/[^0-9]/g, '');

  const plateTypes = [
    { maxRowHeader: 66, maxColHeader: 3 }, // 6 wells plate
    { maxRowHeader: 67, maxColHeader: 4 }, // 12 wells plate
    { maxRowHeader: 68, maxColHeader: 6 }, // 24 wells plate
    { maxRowHeader: 72, maxColHeader: 12 } // 96 wells plate
  ]
  // dim equal or less return plate type 
  plateTypes.forEach(({ maxRowHeader, maxColHeader}, index) => {
    if (lastRowHeader.charCodeAt(0) <= maxRowHeader
      && lastColHeader <= maxColHeader)
      {
        return options.multiwellPlateTypes[index];
      }
  });
  // return 386 well plate type
  return options.multiwellPlateTypes[4];
}

export const formValueMultiplateMultiTableBatchUpload = (tableVales, table) => {
  const plateDim = getPlateTypes(tableVales);
  return { formatedValues: generatePlateTables(tableVales, plateDim, table), plateDim};
}


export const formValueMultiplateBatchUpload = (multiPlatesObject) => {
  const plateIds = Object.keys(multiPlatesObject).filter(id => `${id}`.length > 0);
  return plateIds.map((plateId, index) => {
    const plateDim = getPlateTypes(multiPlatesObject[plateId]);
    // retrive all the tables for platesIds
    const tables = generatePlateTables(multiPlatesObject[plateId], plateDim);
    const plateValues = tables[0];
    const importVariables =  findPlateValue(plateValues);

    return {
      ...defaultMultiwellPlate,
      caseId: '',
      plateName: plateId,
      id: null,
      tables: tables,
      plateTemplate: plateValues,
      dimensions: plateDim,
      channels : []
    }});
}

const constructProperty = (name) => {
  // console.log(name);
  if (!name) return name;
  const strArray = `${name}`.replace(/[^a-zA-Z0-9]/g, " ").split(" ");
  if (strArray.length > 0) {
    let propteryName = "";
    strArray.forEach((item, index) => {
      if (index === 0){
        propteryName += `${item}`.toLowerCase();
      } else {
        // console.log(`${item.charAt(0)}`.toUpperCase())
        propteryName += `${item.charAt(0)}`.toUpperCase()
          .concat(item.slice(1));
      }
    });
    // console.log(propteryName);
    return propteryName;
  }
  return name;
}

// hide options based on template value
export const getSampleTypeOptions = (hideOptions) => {
  const { biosample } = hideOptions;
  const { sampleTypes } = options;
  if (!biosample) {
    return sampleTypes;
  }
  const removeOptions = Object.keys(biosample);
  const displayOptions = sampleTypes.filter(({value}) => !removeOptions.includes(value));

  return displayOptions;
};

/**
 * 
 * @param {*} fields 
 * @param {*} mappingObject 
 * @returns an object map to section properties used for
 * hide/display the form fields and options
 */
function mapToPropertiesByExcel(fields) {
  const labelIndex = 1;
  const inputTypeIndex = 4;
  const displayIndex = 5;
  const omeroHierarchyIndex = 7;
  const tagIndex = 8;
  const namespaceIndex = 9;
  const tooltipMsgIndex = 10;
  const placeholderMsgIndex = 11;
  const displayFields = fields.reduce((acc, item) => {
    const formSection = constructProperty(item[0]);
    if (!acc[formSection]) {
      acc[formSection] = {};
    }
    const inputFieldName = constructProperty(item[labelIndex]);
    const placeholderTextFromExcel = item[placeholderMsgIndex];

    const placeholderText =  placeholderTextFromExcel
      || (item[inputTypeIndex] === inputTypes.DROPDOWN
      ? `Select ${item[labelIndex]}` : `Enter ${item[labelIndex]}`);
    const field = {
      label: item[labelIndex],
      inputType: item[inputTypeIndex], 
      fieldName: inputFieldName,
      inputFieldName: inputFieldName,
      display: item[displayIndex],
      placeholder: placeholderText,
      tooltipText: item[tooltipMsgIndex],
      omeroHierarchy: item[omeroHierarchyIndex],
      isTag: item[tagIndex],
      namespace: item[namespaceIndex],
      placeHolderText: item[placeholderMsgIndex] || ''
    };
    acc[formSection][inputFieldName] = field;
    return acc;
  }, {});
  return displayFields;
}

/**
 * 
 * @param {*} fields 
 * @param {*} mappingObject 
 * @returns an object map to section properties used for
 * hide/display the form fields and options
 */

function mapToProperties(attributes, fields, mappingObject, facilityId) {
  const propNames = attributes.map(item => constructProperty(item));

  const labelIndex = 1;
  const inputTypeIndex = 4;
  const displayIndex = 5;
  const omeroHierarchyIndex = 7;
  const tagIndex = 8;
  const namespaceIndex = 9;
  const bssAliasIndex = 11;
  const tooltipMsgIndex = propNames.indexOf('tooltip') || 100;;
  const placeholderTextIndex = propNames.indexOf('placeholder') || 100;
  // avoid mapping for facilities
  const isExcelMap = newForm.includes(facilityId);
  const displayFields = fields.reduce((acc, item) => {
    const formSection = constructProperty(item[0]);
    if (!acc[formSection]) {
      acc[formSection] = {};
    }
    const fieldName2PropKey = mappingObject[formSection];
    const sectionKey = constructProperty(item[labelIndex]);
    const inputFieldName = constructProperty(item[labelIndex]);
    // console.log(sectionKey);
    if (isExcelMap || (fieldName2PropKey && fieldName2PropKey[sectionKey]))
    {
      const property = isExcelMap ? inputFieldName : fieldName2PropKey[sectionKey];
      if(typeof property === 'string')
      {
        // hide/display fields
        // acc[formSection][property] = true;
        // acc[formSection][property] = item[1];
        const placeholderText = item[placeholderTextIndex] || (item[inputTypeIndex] === inputTypes.DROPDOWN
         ? `Select ${item[labelIndex]}` : `Enter ${item[labelIndex]}`);
        const field = {
          label: item[labelIndex],
          inputType: item[inputTypeIndex], 
          fieldName: property,
          inputFieldName: inputFieldName,
          display: item[displayIndex],
          placeholder: placeholderText,
          tooltipText: item[tooltipMsgIndex],
          omeroHierarchy: item[omeroHierarchyIndex],
          isTag: item[tagIndex],
          namespace: item[namespaceIndex],
          bssKey: item[bssAliasIndex] || null
        };
        acc[formSection][property] = field;
      } else {
        // hide/display field options
        const { field, value } = property;
        acc[formSection][value] = field;
      }
    } 
    return acc;
  }, {});
  return displayFields;
}

const getFormFieldOptionsFromTemplate = (workbook) => {

  // display options
  const sheetName = workbook.SheetNames[1];
  if (sheetName != "FormOptions") return null;

  const worksheet = workbook.Sheets[sheetName];
  const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  const fieldOptions = sheetData[0].reduce((acc, el, index) => {
    if (`${el}`.length === 0) return acc;
    const key = `${el}`.replace(/[^a-zA-Z0-9]/g, " ");
    const field = constructProperty(key);
    // key[0].toLowerCase() + key.slice(1)
    const values = sheetData.map(d => d[index]);
    acc[field] = values.filter((item, idx) => {
      if (idx > 0 && item !== undefined && `${item}`.length > 0) return item;
    }).map((item) => ({label: item, value: item}));
    return acc;
  }, {});
  return fieldOptions;
}

const getOptionalFormFeature = (workbook) => {

  // display optional feature for each facilities
  const sheetName = workbook.SheetNames[2];
  if (sheetName != "OptionalFeature") return null;

  const worksheet = workbook.Sheets[sheetName];
  const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  const optionalFormFeatures = sheetData.filter((row, index) => (index > 0))
    // .filter((row, index) => (index > 0 && row[2] === displayType.Add))
    // .map((item) => ({ label: item[0], id: item[1] }));
    .reduce((acc, el, index) => {
      const field = el[1];
      acc[field] = {
        label: el[0],
        display: el[2]
      };
      return acc;
    }, {});

  return optionalFormFeatures;
}

export async function getFormTemplate (facilityId, dirName) {
  let fileName = `Facility_ID_${facilityId}`;
  if (dirName) {
    fileName = `Facility_ID_${facilityId}_${dirName}`;
  }
  const baseUrl = `/static/metadata/template/${fileName}.xlsx`;
  const response = await fetch(baseUrl);
  if (!response.ok) {
    return false;
  }

  const arrayBuffer = await response.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);
  const workbook = XLSX.read(data, { type: 'array' });
  // first sheet - display fields 
  const firstSheetName = workbook.SheetNames[0];

  // form field 
  const worksheet = workbook.Sheets[firstSheetName];
  let sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  sheetData = sheetData.map((row, index) => {
    const indexes = []
    row.forEach((item, itemIndex) => {
      indexes.push(itemIndex);
    })
    const rowItems = [];
    for (let i = 0; i < row.length; i++) {
      let value = 'N/A';
      if (indexes.includes(i)) {
        value = row[i]
      }
      rowItems.push(value);
    }
    return rowItems;
  });
  // filter row with form attributes
  const sectionTypes = [];
  for (let key in formSections){
    sectionTypes.push(`${formSections[key]}`.toLowerCase());
  }
  let formSection = '';
  // set form section to each form field
  const formFieldsData = sheetData.filter(
    (row, index) => (index > 0 && row.length > 5 && row[1] !== "N/A"))
    .map((item) => {
      const type = `${item[0]}`.toLowerCase().trim();
      const isValid = item[0] && sectionTypes.includes(type);
      if (isValid){
        formSection = type;
      }
      item[0] = formSection;
      return item;
    });
  // get facility specific filter display form fields from xlxs tmeplate file
  const displayFields = formFieldsData.filter((row) => (row[5]
    && (row[5] === displayType.Required
      || row[5] === displayType.Add)));
  // const hideFields = formFieldsData.filter((row) => (row[5]
  //   && (row[5] === displayType.Drop)));
  // get form fields
  const attributes = sheetData[0];

  let displayFormFields = mapToProperties(attributes, displayFields, fieldNameToPropertyMap, facilityId);
  // if (newForm.includes(facilityId)) {
  //   displayFormFields = mapToPropertiesByExcel(displayFields);
  // } 
  // const hideOptions = mapToProperties(hideFields, optionsToPropertyMap);
  // get facility specific options for form field 
  const formFieldOptions = getFormFieldOptionsFromTemplate(workbook);

  // get facility specific optional features
  const optionalFormFeatures = getOptionalFormFeature(workbook);

  return { displayFormFields, formFieldOptions, optionalFormFeatures};
};

// preprocess form data
export function getChannelValue (table, channel) {
  return table || channel?.stain?.value || "";
}

// find plate value
// function findPlateValue (table = [[]]) {
//   const rows = table.length;
//   const cols = table[0].length;
//   // avoid header row and column
//   for (var i = 1; i < rows; i++ ) {
//     for (var j = 1; j < cols; j++) {
//       if (table[i][j] !== null && `${table[i][j]}`.length > 0)
//       {
//         return `${table[i][j]}`;
//       }
//     }
//   }
// }

function findPlateValue(table = [[]]) {
  try {
    if (!Array.isArray(table) || table.length === 0) return null;

    // Handle missing/invalid first row safely
    const cols = Array.isArray(table[0]) ? table[0].length : 0;

    // Skip header row/col
    for (let i = 1; i < table.length; i++) {
      const row = Array.isArray(table[i]) ? table[i] : [];
      // In case rows are ragged, use the larger length
      const maxCols = Math.max(cols, row.length);
      for (let j = 1; j < maxCols; j++) {
        const cell = row[j];
        if (cell != null && String(cell).trim().length > 0) {
          return String(cell);
        }
      }
    }

    return null;
  } catch (err) {
    console.error('findPlateValue error:', err);
    return null;
  }
}

export function isEmptyObject(obj) {
  return obj && typeof obj === "object" && !Array.isArray(obj) && Object.keys(obj).length === 0;
}

