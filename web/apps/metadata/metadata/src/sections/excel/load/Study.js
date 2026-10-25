import { inputTypes } from '../../FormField/FieldTypes';
import { constructProperty } from '../../utils2';
import options from '../../study/defaultOptions.json';
import { coreFields } from '../../study/defaultField';

export function getStudyMetadata(
  sheet,
  displayFieldOptions,
  displayFormFields
) {
  let index = 2;
  const studyMetaData = {};
  console.log('upload study param');
  console.log(displayFormFields);
  let numberOfBiosamples = 0;
  const studyFields = {
    ...coreFields,
    ...displayFormFields?.study,
    ...displayFormFields?.studyComponent,
  };
  const keys = Object.keys(studyFields);
  while (index < keys.length + 5){
    const property = sheet.getCell(`A${index}`).value;
    if(!property || property.length === 0) {
      break;
    }
    const key = constructProperty(property);

    if (
      key === 'numberOfBiosamples' ||
      key === 'numberOfImageInformation' ||
      key === 'numberOfLayerROI'
    ) {
      studyMetaData[key] = sheet.getCell(`B${index}`).value;
    }

    if (studyFields[key]) {
      const value = sheet.getCell(`B${index}`).value;
      const field = studyFields[key];
      if (field.inputType === inputTypes.DROPDOWN) {
        // console.log(`key ${key} ${field.inputType} value ${value}`);
        if (options[key]) {
          studyMetaData[key] = options[key].find((e) => e.label === value)
        }
        if (displayFieldOptions[key]) {
          studyMetaData[key] = displayFieldOptions[key].find((e) => e.label === value);
        }
      } else {
        // console.log(`key ${key} ${field.inputType} value ${value}`);
        studyMetaData[key] = value;
      }
    }
    index++;
  }

  return studyMetaData;
}