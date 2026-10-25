import React from "react";
import FieldView from "../FormField/FieldView";
import OmeroImageId from "./ImageIdView";
import DatasetQuality from "./DatasetQuality";
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
  imageIndex,
  imageInfo,
}) => {
  if (!imageInfo) {
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
          imageIndex={imageIndex}
          fieldName={fieldName}
          fieldValue={imageInfo[fieldName] || ""}
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
    return (
      <DatasetQuality
        fieldName={fieldName}
        label={label}
        onChange={onChange}
        imageIndex={imageIndex}
        isRequired={isRequired}
      />
    );
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
      handleChange={(props) => onChange(props, imageIndex)}
      fieldValue={fieldValue}
      required={isRequired}
    />
  );
}
export default InputView;
