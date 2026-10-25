import React from "react";
import FieldView from "../FormField/FieldView";
import UniProtView from "./components/UniProtView/UniProtView";

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
  channel,
  channelIndex
}) => {
    let InputComponent = FieldView;

    if (!fieldName) {
      return (
        <p> field name missing in channel - field label {label} </p>
      );
    }

    if (fieldName === "proteinOfInterest") {
      return (
        <UniProtView
          fieldName={fieldName}
          channelVal={channel}
          handleChannelChangeFn={
            (props, value) => onChange(props, channelIndex, value)
          }
        />
      )
    }

    const isRequired = `${display}`.toLowerCase() === "required";
    return (
      <InputComponent
        key={fieldIndex}
        inputType={inputType}
        placeholder={placeholder}
        options={options}
        label={label}
        fieldName={fieldName}
        fieldId=''
        handleChange={(props) => onChange(props, channelIndex)}
        fieldValue={fieldValue}
        required={isRequired}
      />
    );
}
export default InputView;
