import { inputTypes } from '../../FormField/FieldTypes';
import { constructProperty } from '../../utils2';

export async function getLayer(
  sheet,
  displayFieldOptions,
  displayFormFields
) {

  let count = 0;
  const fieldAttributes = {};
  const layerFields = Object.values(displayFormFields.layer);
  if (layerFields && layerFields.length > 0) {
    layerFields.forEach(({
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

  const layer = {};
  const noOfFields = layerFields.length;
  while (noOfFields + 5 > count) {
    const label = sheet.getCell(`A${count}`).value;
    const fileName = constructProperty(label);
    const textValue = sheet.getCell(`B${count}`).value;
    if (fieldAttributes[fileName]) {
      if (Array.isArray(fieldAttributes[fileName])) {
        layer[fileName] = {
          label: textValue,
          value: textValue,
        };
      } else {
        layer[fileName] = textValue;
      }
    }
    count++;
  }

  return layer;
}
