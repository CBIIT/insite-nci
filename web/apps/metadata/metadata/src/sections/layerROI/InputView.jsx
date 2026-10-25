import React from "react";
import FieldView from "../FormField/FieldView";
import { useFormContext } from "../../FormContextProvider";
import OmeroIDInput from "./OmeroIDInput";

const InputView = ({
  fieldName,
  label,
  inputType,
  options,
  placeholder,
  onChange,
  display,
  fieldIndex,
  fieldValue,
  layerIndex,
  layer
}) => {
  if (!layer) {
    return null;
  }
  // dispatch to update form state
  const { context } = useFormContext();
  const { optionalFeatures } = context;

  if (fieldName === "imageId"
    && optionalFeatures?.omeroObjectSuggestion?.display === "Add") {
    return (
      <OmeroIDInput
        placeholder={placeholder}
        label={label}
        onChange={onChange}
        layerIndex={layerIndex}
        fieldValue={layer[fieldName] || ''}
        fieldName={fieldName}
      />
    );
  }

  let InputComponent = FieldView;
  if (!fieldName) {
    return (
      <p> field name missing in image - field label {label} </p>
    );
  }
  // if (fieldName === 'imageId') {
  //   return (
  //     <OmeroImageId
  //       key={fieldIndex}
  //       omerImageInfoFields={omerImageInfoFields}
  //       inputType={inputType}
  //       placeholder={placeholder}
  //       options={options}
  //       label={label}
  //       fieldName={fieldName}
  //       fieldId=''
  //       onChange={onChange}
  //       fieldValue={fieldValue}
  //       required={isRequired}
  //     />
  //   )
  // }
  
  const isRequired = `${display}`.toLowerCase() === "required";
  if (fieldName === "datasetQuality") {
    <DatasetQuality
      fieldName={fieldName}
      label={label}
      onChange={onChange}
      imageIndex={layerIndex}
      isRequired={isRequired}
    />
  }

  return (
    <InputComponent
      key={fieldIndex}
      inputType={inputType}
      placeholder={placeholder}
      options={options}
      label={label}
      fieldName={fieldName}
      fieldId=''
      handleChange={(props) => onChange(props, layerIndex)}
      fieldValue={fieldValue}
      required={isRequired}
    />
  );
}
export default InputView;
