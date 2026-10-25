import { inputTypes } from '../../FormField/FieldTypes';
import { constructProperty } from '../../utils2';
import { getchannelMetadata } from './Channel';

export async function getSpecimenMetadata(
  sheet,
  displayFieldOptions,
  displayFormFields
) {
  const specimenMetaData = {};
  let count = 0;
  let numberOfChannels = 0;
  const fieldAttributes = {};
  const specimenFields = Object.values(displayFormFields.specimen);
  if (specimenFields && specimenFields.length > 0) {
    specimenFields.forEach(({
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
  
  while (count < 30) {
    const label = sheet.getCell(`A${count}`).value;
    const fieldName = constructProperty(label);
    const textValue = sheet.getCell(`B${count}`).value;
    if (fieldAttributes[fieldName]) {
      if (Array.isArray(fieldAttributes[fieldName])) {
        specimenMetaData[fieldName] = {
          label: textValue,
          value: textValue,
        };
      } else {
        specimenMetaData[fieldName] = textValue;
      }
    }
    if (fieldName === 'numberOfChannels') {
      const regex = /^\d+$/
      if (regex.test(textValue)) {
        numberOfChannels = textValue;
      }
      break;
    }
    count++;
  }

  const channels = [];
  const labelIndex = count + 3;
  for (var i = 1; i < numberOfChannels + 1; i++) {
    const channelIndex = count + 3 + i;
    const channel = await getchannelMetadata(
      labelIndex,
      channelIndex,
      sheet,
      displayFormFields
    );
    channels.push(channel);
  }
  specimenMetaData.channels = channels;

  return specimenMetaData;
}