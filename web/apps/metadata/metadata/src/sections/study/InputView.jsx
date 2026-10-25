import React from "react";
import FieldView from "../FormField/FieldView";
import { useFormContext } from "../../FormContextProvider";
import OmeroIDInput from "./OmeroIDInput";
import DatasetInputView from "./DatasetInput";

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
}) => {

  // dispatch to update form state
  const { context } = useFormContext();
  const { optionalFeatures } = context;

  let InputComponent = FieldView;
  const isRequired = `${display}`.toLowerCase() === "required";
  
  if (fieldName === "omeroScreenOrProjectId"
    && optionalFeatures?.omeroObjectSuggestion?.display === "Add") {
    return (
      <OmeroIDInput
        onChange={onChange}
        fieldValue={fieldValue}
        fieldName={fieldName}
      />
    );
  }

  if (fieldName === "datasetUID"
    && optionalFeatures?.populateDatasetByFileName?.display === "Add") {
      return (
        <DatasetInputView
          onChange={onChange}
          fieldValue={fieldValue}
          fieldName={fieldName}
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
      handleChange={onChange}
      fieldValue={fieldValue}
      required={isRequired}
    />
  );
};

export default InputView;
