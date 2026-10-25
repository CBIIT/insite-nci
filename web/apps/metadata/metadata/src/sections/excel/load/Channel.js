import { inputTypes } from '../../FormField/FieldTypes';
import { constructProperty } from '../../utils2';
import options from '../generate/options2.json';

export async function getchannelMetadata(
  labelIndex,
  rowOffset,
  sheet,
  displayFormFields
) {
  const displayFields = { ...displayFormFields?.channel };
  const keys = Object.keys(displayFields || {});

  const channel = {};
  keys.forEach((key, index) => {
    const label = sheet.getCell(labelIndex, index + 1).value;
    const fieldName = constructProperty(label);
    const value = sheet.getCell(rowOffset, index + 1).value;
    let count = 0;
    while (count < keys.length) {
      count++;
      if (displayFields[fieldName]) {
        const field = displayFields[fieldName];
        if (field.inputType === inputTypes.DROPDOWN) {
          channel[fieldName] = {
            label: value,
            value: value
          }
        } else {
          channel[fieldName] = value;
        }
        break;
      }
    }
  });
  return channel
  // const signalOrContrastMechanism = {
  //   label: sheet.getCell(rowOffset, 1).value,
  //   value: sheet.getCell(rowOffset, 1).value,
  // };
  // const stain = {
  //   label: sheet.getCell(rowOffset, 2).value,
  //   value: sheet.getCell(rowOffset, 2).value, 
  // }
  // console.log("load");
  // console.log(stain);
  // const molecularEntity = sheet.getCell(rowOffset, 3).value;  // 
  // return {
  //   signalOrContrastMechanism,
  //   stain,
  //   molecularEntity,
  // };
}