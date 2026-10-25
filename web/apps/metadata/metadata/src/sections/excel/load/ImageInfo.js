import { inputTypes } from '../../FormField/FieldTypes';
import { constructProperty } from '../../utils2';

export async function getImageInfo(
  sheet,
  displayFieldOptions,
  displayFormFields,
) {

  let count = 0;
  const fieldAttributes = {};
  const imageFields = Object.values(displayFormFields.image);
  if (imageFields && imageFields.length > 0) {
    imageFields.forEach(({
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

  const imageMetaData = {};
  const noOfFields = imageFields.length;
  while (noOfFields + 5 > count) {
    const label = sheet.getCell(`A${count}`).value;
    const fileName = constructProperty(label);
    const textValue = sheet.getCell(`B${count}`).value;
    if (fieldAttributes[fileName]) {
      if (Array.isArray(fieldAttributes[fileName])) {
        imageMetaData[fileName] = {
          label: textValue,
          value: textValue,
        };
      } else {
        imageMetaData[fileName] = textValue;
      }
    }
    count++;
  }

  return imageMetaData;
}