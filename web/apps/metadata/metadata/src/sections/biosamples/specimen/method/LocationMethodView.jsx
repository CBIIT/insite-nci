import React from "react";
import { useFormContext } from "../../../../FormContextProvider";
import { coreFields } from "./defaultField";
import FieldView from "../../../FormField/FieldView";

const LocationMethodView = ({
  fieldName,
  label,
  inputType,
  placeholder,
  handleChange,
  display,
  specimen,
  options,
  specimenIndex,
  handleTextChange,
}) => {
  const { context } = useFormContext();
  // const { samples = [], dispatch } = context;
  const showAssociateFields = `${specimen[fieldName]?.value}`.toLowerCase() === "block id + slide id";

  // return input if block / slide is not selected
  if (!showAssociateFields) {
    return (
      <FieldView
        inputType={inputType}
        placeholder="Enter Sample Type"
        options={options}
        label={label}
        fieldName={fieldName}
        fieldId=''
        handleChange={handleChange}
        fieldValue={specimen[fieldName] || ""}
        required={display === "Required"}
      />
    );
  }

  const displayFields = Object.keys(coreFields).map((key) => coreFields[key]);

  return (
    <>
      <FieldView
        inputType={inputType}
        placeholder="Enter Sample Type"
        options={options}
        label={label}
        fieldName={fieldName}
        fieldId=''
        handleChange={handleChange}
        fieldValue={specimen[fieldName] || ""}
        required={display === "Required"}
      />
      {
        (showAssociateFields) && (
          <>
            {displayFields.map(({
              fieldName,
              label,
              inputType,
              options,
              placeholder,
              display
            }, fieldIndex) => (
              <FieldView
                key={fieldIndex}
                inputType={inputType}
                placeholder={placeholder}
                options={options}
                label={label}
                fieldName={fieldName}
                fieldId=''
                handleChange={(ev) => handleTextChange(ev, specimenIndex)}
                fieldValue={specimen[fieldName] || ""}
                required={display === "Required"}
              />
              ))
            }
          </>
        )
      }
    </>
  );
};

export default LocationMethodView;
