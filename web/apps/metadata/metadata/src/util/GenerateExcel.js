import Excel from "exceljs";
import {
  excelCoordinatesToRefs,
  filteredOptions,
  generateExcelTable,
  setValidOptions,
  createAndPopulateTableTemplate
} from "../utils";
import options from "../options.json";
import { lookup } from './ExcelConfig';

// check object type of value
const returnStringValue = (object) => {
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
  const {tables ={}} = plate;
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

function addLookupTable (lookupSheet, form, fieldOptions) {
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
}

function addParameterSheet (workbook, form) {
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
      ["Omero Screen/Project Id ", form?.omeroScreenProjectId]
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
}

function addSampleSheet(workbook, sampleSheet, sample, sampleIndex, fieldOptions, displayField) {
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
  
  
      for (let specimenIndex = 0; specimenIndex < sample.specimens.length; specimenIndex++) {
        let specimen = sample.specimens[specimenIndex];
        const specimenSheet = workbook.addWorksheet(`Biosample ${sampleIndex + 1} - Specimen ${specimenIndex + 1}`);
        specimenSheet.columns = [
          { header: "Parameter", key: "Parameter", width: 40 },
          { header: "Value", key: "Value", width: 100 },
          { header: "", key: "Extra", width: 100 },
        ];

        const rows = [
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
            ["Experimental Treatment", specimen?.experimentalTreatment],
            ["Number of Channels", specimen?.channels?.length]
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
          rows: rows,
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
  
        const rowOffset = rows.length + 3;

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
            columns: displayField?.channel?.proteinOfInterest ? [
              { name: "Channel Signal or Contrast Mechanism", filterButton: false },
              { name: "Stain", filterButton: false, width: 100 },
              { name: "Molecular Entity", filterButton: false, width: 100 },
              { name: "Protein Of Interest", filterButton: false, width: 100 },
            ] : [
              { name: "Channel Signal or Contrast Mechanism", filterButton: false },
              { name: "Stain", filterButton: false, width: 100 },
              { name: "Molecular Entity", filterButton: false, width: 100 },
            ],
            rows: specimen?.channels?.map((channel) => {
              if (displayField?.channel?.proteinOfInterest) {
                return [
                  channel?.signalOrContrastMechanism?.label,
                  getChannelStainValue(null, channel),
                  returnStringValue(channel?.molecularEntity), 
                  channel?.proteinOfInterest
                ];
              }
              return [
                channel?.signalOrContrastMechanism?.label,
                getChannelStainValue(null, channel),
                returnStringValue(channel?.molecularEntity)
              ];
            }) || [],
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

export function addMultiplateSheet(form, plateSheet, plate, i) {
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
        ["Case ID", plate.caseId || ""],
        ["Plate Name", plate.plateName || ""],
        ["Plate Type", plate.dimensions?.label || ""],
        ["Biosample", plate.biosample?.label || ""],
        // ["Default Experimental Status", plate.specimenType?.label || ""],
        ["Default Preparation Method", plate.preparationMethod?.label || ""],
        ["Default Preparation Details", plate.preparationDetails || ""],
        ["Default Intrinsic Variables", plate.intrinsicVariables || ""],
        ["Default Extrinsic Variables", plate.extrinsicVariables || ""],
        ["Channel Count", plate.channels?.length || "0"],
        ["Omero Plate Id", plate.id]
      ],
    });
    
    let biosample = form.samples[plate?.biosample?.value - 1];
    let rowOffset = 13;
    let columnOffset = 0;
  
    let tables = [
      {
        title: `Plate ${i + 1} - Biosample`,
        name: `Plate${i + 1}Biosample`,
        value: plate?.tables?.biosample?.slice(1) || plate?.biosample?.label || "",
      },
      // {
      //   title: `Plate ${i + 1} - Experimental Status`,
      //   name: `Plate${i + 1}ExperimentalStatus`,
      //   value: plate.tables?.experimentalStatus?.slice(1) || "",
      //   // options: plate.tables?.experimentalStatus?.slice(1) || options.specimenTypes.map((o) => o.value),
      // },
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
    // console.log('tables');
    // console.log(tables);
  
    for (let j = 0; j < +plate?.channels?.length || 0; j++) {
      let channel = plate.channels?.[j];

      // generate channel table template to populate value
      const channelTableTemplate = getTemplateTable(plate);
      const channelValueTableTemplate = plate.channelTableTemplate || channelTableTemplate || null;
      // const channelValueTableTemplate = plate.channelTableTemplate || channel || null
      const channelTable = plate?.tables?.channels?.[j];

      const chSignalVal = getChannelSignalValue(channelTable?.signalOrContrastMechanism, channel, channelValueTableTemplate);
      const channelSignalVal =  typeof(chSignalVal) == 'string' ? chSignalVal : chSignalVal.slice(1);

      const signalTable = (channelSignalVal || channelTable?.signalOrContrastMechanism);

      const chStainVal = getChannelStainValue(plate?.tables?.channels?.[j]?.stain, channel, channelValueTableTemplate);
      const channelStainVal = typeof(chStainVal) == 'string' ? chStainVal : chStainVal.slice(1);
      const stainTable = channelStainVal || channelTable?.stain;

      const chMoleEntyVal = getChannelMolEntityValue(channel, channelValueTableTemplate);
      const channelMolecularEntityVal = typeof(chMoleEntyVal) == 'string' ? chMoleEntyVal : chMoleEntyVal.slice(1);
      const molecularEntityTable = channelMolecularEntityVal || channelTable?.molecularEntity.slice(1);
      const channelTables = [
        {
          title: `Channel ${j + 1} - Signal or Contrast Mechanism`,
          name: `Plate${i + 1}Channel${j + 1}SignalOrContrastMechanism`,
          value: signalTable,
          options: filteredOptions.getChannelSignalContrastMechanisms(form).map((o) => o.value),
        },
        {
          title: `Channel ${j + 1} - Stain`,
          name: `Plate${i + 1}Channel${j + 1}Stain`,
          value: stainTable,
          options: filteredOptions.getChannelStains(form).map((o) => o.value),
        },
        {
          title: `Channel ${j + 1} - Molecular Entity`,
          name: `Plate${i + 1}Channel${j + 1}MolecularEntity`,
          value: molecularEntityTable,
          // formulae: (typeof moleEntityVal === "string")
          // ? undefined : [`=INDIRECT("LookupMolecularEntity[Molecular Entity]")`],
        },
      ];

      // if (channel?.proteinOfInterest) {
      //   channelTables.concat({
      //     title: `Channel ${j + 1} - Protein of Interest`,
      //     name: `Plate${i + 1}Channel${j + 1}ProteinOfInterest`,
      //     value: channel?.proteinOfInterest || "",
      //   });
      // }

      tables = tables.concat(channelTables);
    }
  
    for (const table of tables) {
      plateSheet.getCell(rowOffset, columnOffset + 1).value = table.title;
      plateSheet.getCell(rowOffset, columnOffset + 1).font = { bold: true };
      rowOffset++;
      plateSheet.addTable({
        name: table.name,
        ref: excelCoordinatesToRefs(rowOffset, columnOffset + 1),
        ...generateExcelTable(plate?.dimensions?.rows, plate?.dimensions?.columns, table.value),
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
      // console.log(plate.dimensions.rows);
      // console.log(`${table.name} off set row inde ${rowOffset} `)
    }
}

export async function generateExcelExport2(form, activeSheet = null, fieldOptions, displayField) {
    const workbook = new Excel.Workbook();
    let errors = [];
    const lookupSheet = workbook.addWorksheet("Lookup");
    addLookupTable(lookupSheet, form, fieldOptions);
  
    lookupSheet.columns = lookup.columns;
    addParameterSheet(workbook, form);

    // biosample sheet
    for (let sampleIndex = 0; sampleIndex < form?.samples?.length; sampleIndex++) {
      let sample = form?.samples[sampleIndex];
      const sampleSheet = workbook.addWorksheet(`Biosample ${sampleIndex + 1}`);
      addSampleSheet(workbook, sampleSheet, sample, sampleIndex, fieldOptions, displayField);
    }

    // multiwell sheet
    for (let i = 0; i < form.multiwellPlates?.length; i ++) {
      const plate = form.multiwellPlates[i];
      const plateSheet = workbook.addWorksheet(`Plate ${i + 1}`);
      addMultiplateSheet(form, plateSheet, plate, i);
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