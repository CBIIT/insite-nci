import React from "react";
import FieldView from "../../FormField/FieldView";
import LocationMethodView from "./method/LocationMethodView";

const InputView = ({
    fieldName,
    label,
    inputType,
    options,
    placeholder,
    onChange,
    display,
    specimen,
    specimenIndex,
    handleTextChange,
    tooltipText
}) => {
    let InputComponent = FieldView;

    if (fieldName === "specimenLocationMethod") {
      InputComponent = LocationMethodView;
    }

    return (
      <InputComponent
        inputType={inputType}
        placeholder={placeholder}
        options={options}
        label={label}
        fieldName={fieldName}
        fieldId=''
        handleChange={(props) => onChange(props, specimenIndex)}
        fieldValue={specimen[fieldName] || ""}
        required={display === "Required"}
        specimen={specimen}
        specimenIndex={specimenIndex}
        handleTextChange={handleTextChange}
        tooltipText={tooltipText}
      />
    );
}

export default InputView;
