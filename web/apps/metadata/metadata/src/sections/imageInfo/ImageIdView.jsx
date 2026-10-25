import React from "react";
import FieldView from "../FormField/FieldView";
import { useFormContext } from "../../FormContextProvider";

const OmeroImageId = ({
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
  omerImageInfoFields = []
}) => {
  // access form state and reducer
  const { context } = useFormContext();
  const { imageInfos = [], dispatch } = context;
  const handleOmeroIdChange = (ev) => {
    console.log(ev);
    if (omerImageInfoFields.length > 0) {

    }
    onChange(ev, imageIndex);
  };

  return (
    <FieldView
      key={fieldIndex}
      inputType={inputType}
      placeholder={placeholder}
      options={options}
      label={label}
      fieldName={fieldName}
      fieldId=''
      handleChange={(props) => handleOmeroIdChange(props)}
      fieldValue={fieldValue}
      required={isRequired}
    />
  );
};

export default OmeroImageId;