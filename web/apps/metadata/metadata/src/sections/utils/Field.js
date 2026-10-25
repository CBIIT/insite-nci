import { inputTypes } from "../FormField/FieldTypes";

export const getOptions = (defaultOptions, templateOptions) => {
  return {
    ...defaultOptions,
    ...templateOptions
  };
};

export const getFormFields = (
  options,
  coreFields,
  templateFields,
) => {
  const displayFields = { ...coreFields, ...templateFields };
  // console.log(displayFields);
  return Object.keys(displayFields).map((key) => {
    const field = displayFields[key];
    // console.log(field);
    // dropdown input fields
    if (field.inputType === inputTypes.DROPDOWN && options[key]) {
      return {
        ...displayFields[key],
        options: options[key],
      };
    }
    return {
      ...displayFields[key],
    };
  });
}
