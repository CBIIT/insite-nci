import React from "react";
import FieldView from "../FormField/FieldView";
import SampleTypeView from "./sampleType/SampleType";
import Organism from "./organism/Organism";
import Thesaurus from "./NciThesaurus/Thesaurus";
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
    sample,
    sampleIndex,
}) => {
    // dispatch to update form state
    const { context } = useFormContext();
    const { optionalFeatures } = context;

    if (fieldName === "omeroObjectId"
      && optionalFeatures?.omeroObjectSuggestion?.display === "Add") {
      return (
        <OmeroIDInput
          label={label}
          onChange={onChange}
          fieldValue={sample[fieldName]}
          fieldName={fieldName}
          sample={sample}
          sampleIndex={sampleIndex}
        />
      );
    }

    let InputComponent = FieldView;

    if (!fieldName) {
      return (
        <p>
          field name missing in sample {sampleIndex} field label {label}
        </p>
      )
    }

    if (fieldName === "anatomicalOriginNCIThesaurus") {
      InputComponent = Thesaurus;
    }

    if (fieldName === "sampleType") {
      InputComponent = SampleTypeView;
    }

    if (fieldName === "organismNCBITaxonomy") {
      InputComponent = Organism;
    }

    const isRequired = `${display}`.toLowerCase() === "required";
    return (
      <InputComponent
        inputType={inputType}
        placeholder={placeholder}
        options={options}
        label={label}
        fieldName={fieldName}
        fieldId=''
        handleChange={(props) => onChange(props, sampleIndex)}
        fieldValue={sample[fieldName] || ""}
        required={isRequired}
        sample={sample}
        sampleIndex={sampleIndex}
      />
    );
}

export default InputView;
