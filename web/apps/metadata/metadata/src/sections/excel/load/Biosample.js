import { inputTypes } from '../../FormField/FieldTypes';
import { constructProperty } from '../../utils2';
import { getSpecimenMetadata } from './Specimen';

export async function getSampleMetadata(
  workbook,
  sheet,
  displayFieldOptions,
  sampleIndex,
  displayFormFields
) {
  const sampleMetaData = {};
  let count = 0;

  const fieldAttributes = {};
  const biosampleFields = Object.values(displayFormFields.biosample);
  if (biosampleFields && biosampleFields.length > 0) {
    biosampleFields.forEach(({
      inputType,
      inputFieldName,
    }) => {
      if (inputType === inputTypes.DROPDOWN) {
        fieldAttributes[inputFieldName] = [inputFieldName, 'label'];
      } else {
        fieldAttributes[inputFieldName] = inputFieldName;
      }
    });
  }

  let numberOfSpecimens = 0;
  while (count < 30) {
    const label = sheet.getCell(`A${count}`).value;
    const fileName = constructProperty(label);
    const textValue = sheet.getCell(`B${count}`).value;
    if (fieldAttributes[fileName]) {
      if (Array.isArray(fieldAttributes[fileName])) {
        sampleMetaData[fileName] = {
          label: textValue,
          value: textValue,
        };
      } else {
        sampleMetaData[fileName] = textValue;
      }
    }
    if (fileName === 'numberOfSpecimens') {
      numberOfSpecimens = textValue;
      break;
    }
    count++;
  }
  // add specimen
  const specimens = []
  for (var i = 0; i < numberOfSpecimens; i++) {
    const specimenSheet = workbook.getWorksheet(`Biosample ${sampleIndex} - Specimen ${i + 1}`);
    const specimen = await getSpecimenMetadata(
      specimenSheet,
      displayFieldOptions,
      displayFormFields
    );
    specimens.push(specimen);
  }
  sampleMetaData.specimens = specimens;
  return sampleMetaData;
}