import _ from "lodash";
import * as XLSX from 'xlsx';
import { displayType } from "../../../form";
// import { constructProperty } from "../../utils2";
import { getProjectLevelMetadata } from "./Project";
import { getDatasetLevelMetadata } from "./Dataset";
import { getScreenLevelMetadata } from "./Screen";
import { getPlateLevelMetadata } from "./Plate";
import { getWellLevelMetadata } from "./Well";
import { getImageLevelMetadata } from "./Image";
import { inputTypes } from "../../FormField/FieldTypes";

// const stringValue = (str) => `${str}`.toLowerCase().replace(/\s/g, "");
export const mapTemplateHierarchy = (displayFields = {}) => {
  const sections = Object.keys(displayFields);
  const appendTags = {};
  const hierarchyMapping = {};
  const fileHiearchyMapping = {};
  sections.forEach((item) => {
    const section = displayFields[item];
    Object.keys(section).forEach((key) => {
      const field = section[key];
      const { 
        omeroHierarchy,
        label,
        inputType
      }= field;
      // file higherarchy mapping
      if (inputType === inputTypes.FILE) {
        if (!fileHiearchyMapping[omeroHierarchy]) {
          fileHiearchyMapping[omeroHierarchy] = [];
        }
        (fileHiearchyMapping[omeroHierarchy]).push(field);
        return
      }

      // map fields 2 higherarchy 
      if (!hierarchyMapping[omeroHierarchy]) {
          hierarchyMapping[omeroHierarchy] = [];
        }
      (hierarchyMapping[omeroHierarchy]).push(field); 
      // append tag item
      if (field.isTag === "Yes") {
        if (!appendTags[omeroHierarchy]) {
          appendTags[omeroHierarchy] = [];
        }
        (appendTags[omeroHierarchy]).push(label);
      }

    });
  });
  return { hierarchyMapping, fileHiearchyMapping, appendTags };
}

export async function getMetadataTemplateHierarchy (form) {
  const facilityId = form.imagingFacility.value;
  const dirName = form.imagingFacility.dirName;
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
  const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const formFieldsData = sheetData.map((row, index) => {
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
  }).filter((row, index) => (index > 0 && row.length > 5 && row[1] !== "N/A"));
  // const formFieldsData = sheetData.filter((row, index) => (index > 0 && row.length > 5));
  const displayIndex = 5;
  const hierarchyItems = formFieldsData.filter((row) => (row[displayIndex]
      && (row[displayIndex] === displayType.Required
        || row[displayIndex] === displayType.Add 
        || row[displayIndex] === displayType.Metadata)));
  // genearte object for hierarchy
  // source: ['Study', 'Study type', 'Screen Level', 'No']
  // target {attribute: "Study type", metadataLevel: "Screen Level", addTag: false}
  if (hierarchyItems.length > 0) {
    const appendTags = {};
    const levelIndex = 7;
    const formFieldIndex = 1;
    const hierarchyMapModuleIndex = 6;
    const appendTagIndex = 8;
    // append tags
    hierarchyItems.forEach((row, index) => {
      // check to add tag
      if (('Yes' === row[appendTagIndex])) {
        if (!appendTags[row[levelIndex]]) {
          appendTags[row[levelIndex]] = [];
        }
        appendTags[row[levelIndex]].push(row[formFieldIndex]);
      }
    });

    const namespaceIndex = 9;
    const hierarchyMapping = hierarchyItems.reduce(
      (acc, row) => {
        const key = `${row[hierarchyMapModuleIndex]}`;
        //.replace(/\W/g, '');
        const namespace = `${row[levelIndex]}`;
        if (namespace.includes('N/A') || namespace.includes('n/a')) {
          return acc;
        }
        //.replace(/\W/g, '');
        if (!acc[namespace]) {
          acc[namespace] = {};
        }
        let targetItem = acc[namespace][key];
        if (!targetItem) {
          targetItem = {
            namespace: row[namespaceIndex],
            attributes: []
          };
        }
        targetItem.attributes.push(row[formFieldIndex]);
        acc[namespace][key] = targetItem;
      return acc;
    }, {});
    return { hierarchyMapping, appendTags };
  }
  return {};
};

/**
 * generate json metadata based on hierarchy
 * @param {*} fields - dynamic form
 * @param {*} form 
 */
export async function generateJsonMetadata(form, fields = undefined) {
  const { hierarchyMapping, appendTags } = await getMetadataTemplateHierarchy(form);
  const hierarchies = Object.keys(hierarchyMapping);
  const jsonMetadata = {};
  for (let hierarchy of hierarchies) {
    const hierarchyItems = hierarchyMapping[hierarchy];
    // screen level metadata
    switch(hierarchy) {
      case "Screen Level":
        const { 
          screen_levelMetadata: studyMetadata, 
          distinctScreenIDs,
        } = getScreenLevelMetadata(hierarchyItems, form);
        jsonMetadata["screen_tags"] = studyMetadata;
        jsonMetadata["screen_ids"] = distinctScreenIDs;
        break;
      case "Project Level":
        // console.log("project level");
        // console.log(hierarchyItems);
        const {
          projectLevelMetadata: projectMetadata,
          distinctProjectIDs,
        } = getProjectLevelMetadata(hierarchyItems, form, fields)
        jsonMetadata['project_tags'] = projectMetadata;
        jsonMetadata["project_ids"] = distinctProjectIDs;
        break;
      case "Dataset Level":
        const { datasetLevelMetadata, distinctDatasetIDs } = getDatasetLevelMetadata(hierarchyItems, form, fields);
        jsonMetadata['dataset_tags'] = datasetLevelMetadata;
        jsonMetadata['dataset_ids'] = distinctDatasetIDs;
        break;
      case "Plate Level":
        const { plateMetadata, distinctPlateIDs, platesKeyValue } = getPlateLevelMetadata(hierarchyItems, form, appendTags);

        jsonMetadata['plate_tags'] = plateMetadata;
        jsonMetadata['plate_ids'] = distinctPlateIDs;
        jsonMetadata['multiPlate_tags'] = platesKeyValue;
        break;
      case "Well Level":
        const keyValueByPlate = getWellLevelMetadata(hierarchyItems, form, appendTags);
        // const { wellMetadata, wellsKeyValue } = getWellLevelMetadata(hierarchyItems, form, appendTags);
        // jsonMetadata['well_tags'] = wellMetadata;
        // jsonMetadata['multiWell_tags'] = wellsKeyValue;
        jsonMetadata['keyValueByPlate'] = keyValueByPlate;
        // const wells_tags = []
        // keyValueByPlate.forEach(item => wells_tags.push(...item.wellMetadata));
        // jsonMetadata["well_tags"] = wells_tags;
        break;
      case "Image Level":
        const { imageMetadata, distinctImageIDs } = getImageLevelMetadata(hierarchyItems, form, appendTags, fields);
        jsonMetadata['image_tags'] = imageMetadata;
        jsonMetadata['image_ids'] = distinctImageIDs;
        break;
      default:
        break;
    }
  }
  return {...jsonMetadata, append_tags: appendTags };
};
