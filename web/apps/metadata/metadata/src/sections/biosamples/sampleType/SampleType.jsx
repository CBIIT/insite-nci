import React from "react";
import FieldView from "../../FormField/FieldView";
import { coreFields } from "./defaultField";
import defaultOptions from "./defaultOptions.json";
import { useFormContext } from "../../../FormContextProvider";
import { updateFormChange } from "../../../state/Actions";
import { inputTypes } from "../../FormField/FieldTypes";

const SampleTypeView = ({
  fieldName,
  label,
  inputType,
  placeholder,
  handleChange,
  display,
  sample,
  options,
  sampleIndex,
  required
}) => {
    // access form state and reducer
    const { context } = useFormContext();
    const { samples = [], dispatch } = context;

    const type = `${sample[fieldName]?.value}`.toLowerCase();
    const sampleTypeOptions = {
      ...defaultOptions
    };

    // update multiplate object values, attribute
    // update all child channel and specimen changes 
    const updateSampleChange = (fieldName, value) => {
      const updateSample = structuredClone(sample);
      updateSample[fieldName] = value;
      samples[sampleIndex] = updateSample;
      // dispatch to update form state
      dispatch(updateFormChange({
        ...context,
        updateSample,
      }));
    };

    // input text change
    const handleTextChange = (ev) => {
      const fieldName = ev.target.name;
      const value = `${ev.target.value}`;
      updateSampleChange(fieldName, value);
    };
  
    // handle dropdown change
    const handleDropdownChange = (value, fieldName) => {
      updateSampleChange(fieldName, value);
    };

    const displayFields = Object.keys(coreFields).map((key) => {
      if (coreFields[key].value === type) {
        if (sampleTypeOptions[key])
          {
            return {
              ...coreFields[key],
              onChange: (value) => handleDropdownChange(value, key),
              options: sampleTypeOptions[key]
            };
          }
        return {
            ...coreFields[key],
            onChange: handleTextChange,
        };
      }
    }).filter(item => item);

    const fieldValue = (sample, fieldName, inputType) => {
      if (inputType === inputTypes.DROPDOWN) {
        const dropdownVal = defaultOptions
          .tissueHealthStatus.filter(item => item.value === sample[fieldName]?.value);
        return dropdownVal;
      }
      return sample[fieldName] || "";
    }

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
          fieldValue={sample[fieldName] || ""}
          required={required}
        />
        {displayFields.map(({
          fieldName,
          label,
          inputType,
          options,
          placeholder,
          onChange,
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
              handleChange={(props) => onChange(props)}
              fieldValue={fieldValue(sample, fieldName, inputType)}
              required={display === "Required"}
            />
          ))
        }
      </>
    );
}

export default SampleTypeView;
