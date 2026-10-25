import { getFormTemplate, readFile } from "../../utils2";
import { getStudyMetadata } from "./Study";
import Excel from "exceljs";
import options from '../generate/options2.json';
import { getSampleMetadata } from "./Biosample";
import { getImageInfo } from "./ImageInfo";
import { getLayer } from "./layer";

export async function loadExcelMetaData(
  file,
  displayFieldOptions,
  displayFormFields,
) {
  const workbook = new Excel.Workbook();
  const arrayBuffer = await readFile(file);
  let errors = [];
  
  await workbook.xlsx.load(arrayBuffer);

  const parametersSheet = workbook.getWorksheet("Parameters");
  const imagingFacilityValue = parametersSheet.getCell("B2").value;
  const imagingFacility = options.imagingFacility.find((e) => e.label === imagingFacilityValue);
  if (!imagingFacility) {
    errors.push("Parameters sheet does not have a valid imaging facility");
  }
  // study parameter
  const study = await getStudyMetadata(
    parametersSheet, 
    displayFieldOptions, 
    displayFormFields
  );
  console.log(study);
  let form = { ...study };
  // retrive form options from template
  // const { formFieldOptions = undefined } = await getFormTemplate(imagingFacility.value);
  // add biosample
  const samples = []
  for (var i = 0; i < study.numberOfBiosamples; i++) {
    const sampleSheet = workbook.getWorksheet(`Biosample ${i + 1}`);
    const sample = await getSampleMetadata(
      workbook,
      sampleSheet,
      displayFieldOptions,
      i + 1,
      displayFormFields
    );
    // form['samples']
    samples.push(sample);
  }

  // retrive image info
  const imageInfos = [];
  if (study.numberOfImageInformation) {
    for (var i = 0; i < study.numberOfImageInformation; i++) {
      const imageInfoSheet = workbook.getWorksheet(`Image Info ${i + 1}`);
      const image = await getImageInfo(
        imageInfoSheet,
        displayFieldOptions,
        displayFormFields
      );
      imageInfos.push(image);
    }
    form.imageInfos = imageInfos;
  }

  const layers = [];
  if (study.numberOfLayerROI) {
    for (var i = 0; i < study.numberOfLayerROI; i++) {
      const layerSheet = workbook.getWorksheet(`Layer ROI ${i + 1}`);
      const layer = await getLayer(
        layerSheet,
        displayFieldOptions,
        displayFormFields
      );
      layers.push(layer);
    }
    form.layerROIs = layers;
  }

  form.samples = samples;
  return form;
}

