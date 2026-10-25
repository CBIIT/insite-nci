import React, { useState } from "react";
import {
  Accordion,
  AccordionSummary, 
  AccordionDetails, 
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useFormContext } from "../../FormContextProvider";
import { getOmeroObjectFields } from "./defaultField";
import options from "./defaultOptions.json";
import { updateFormChange } from "../../state/Actions";
import InputView from "./InputView";
import { defaultSpecimen } from "../../form";
import SpecimenView from "./specimen/SpecimenView";
import { getFormFields, getOptions } from "../utils/Field";
import { inputTypes } from "../FormField/FieldTypes";
import HeaderView from "../shared/HeaderView";

const SampleAccordianView = ({
  children
}) => {
  const [expanded, setExpanded] = useState(true);
  function onToggle (){
    setExpanded(!expanded);
  }
  
  return (
    <Accordion expanded={expanded} onChange={onToggle}>
      {children}
    </Accordion>
  )
};

const BiosampleView = ({

}) => {
  // access form state and reducer
  const { context } = useFormContext();
  const { samples = [], dispatch, optionalFeatures } = context;

  // update multiplate object values, attribute
  // update all child channel and specimen changes
  // const updateSampleChange = (index, fieldName, newValue) => {
  //   const updateSample = structuredClone(samples[index]);
  //   updateSample[fieldName] = newValue;
  //   // update input value
  //   samples[index] = updateSample;
  //   // dispatch current form state
  //   dispatch(updateFormChange(context));
  // };

  // update multiplate object values, attribute
  // update all child channel and specimen changes
  const updateSampleChange = (index, fieldName, newValue) => {
    const nextSamples = samples.map((s, i) =>
      i === index ? { ...s, [fieldName]: newValue } : s
    );
    dispatch(updateFormChange({ ...context, samples: nextSamples }));
  };

  const addSpecimen = (index) => {
    const newSpecimen = { ...defaultSpecimen }; // or structuredClone(defaultSpecimen) if it contains nested objects

    const nextSamples = samples.map((s, i) => {
      if (i !== index) return s;
        const nextSpecimens = [...(s.specimens || []), newSpecimen];
        return { ...s, specimens: nextSpecimens };
    });
    dispatch(updateFormChange({ ...context, samples: nextSamples }));
  };

  const copySample = (index) => {
    const s = samples[index];
    const copySample = structuredClone(samples[index]);
    const nextSamples = [...samples, copySample];
    dispatch(updateFormChange({ ...context, samples: nextSamples }));
  };

  const deleteSample = (index) => {
    const nextSamples = samples.filter((_, i) => i !== index);
    dispatch(updateFormChange({ ...context, samples: nextSamples }));
  };
  
  const handleTextChange = (ev, index) => {
    const fieldName = ev.target.name;
    const value = `${ev.target.value}`;
    updateSampleChange(index, fieldName, value);
  };

  const handleDropdownChange = (value, fieldName, index) => {
    updateSampleChange(index, fieldName, value);
  };

  // drowpdown options 
  // configure form fields
  const {
    displayFormFields = {},
    displayFieldOptions = {},
    imagingFacility
  } = context;
  const displayOptions = getOptions(options, displayFieldOptions);
  
  // set formFields dropdown options
  const displayFields = getFormFields(
    displayOptions,
    getOmeroObjectFields(imagingFacility?.value || 0),
    displayFormFields?.biosample,
  ).map(field => {
      const { fieldName, label } = field;
      if (field.inputType === inputTypes.DROPDOWN) {
        return {
          ...field,
          onChange: (value, index) => handleDropdownChange(value, fieldName, index),
        }
      } 
      return {
        ...field,
        onChange: handleTextChange,
      }
    }
  );

  return (
    <>
      {
        samples?.map((sample, sampleIndex) => {
          return (
            <SampleAccordianView>
              <AccordionSummary
                sx={{ backgroundColor: 'success.main', color: '#fff' }}
                expandIcon={<ExpandMoreIcon  sx={{ color: '#fff' }}/>}
              >
                <HeaderView
                  title="Biosample"
                  index={sampleIndex + 1}
                  copyFn={() => copySample(sampleIndex)}
                  deleteFn={() => deleteSample(sampleIndex)}
                />
                </AccordionSummary>
                <AccordionDetails>
                  <div className="container">
                    <div className="d-flex flex-wrap">
                      { displayFields.map((props, fieldIndex) => (
                          <InputView
                            key={fieldIndex}
                            {...props}
                            sample={sample}
                            sampleIndex={sampleIndex}
                          />
                        ))
                      }
                    </div>
                  </div>
                  
                  <SpecimenView
                    specimens={sample.specimens}
                    sample={sample}
                    sampleIndex={sampleIndex}
                  />
                  
                  <div className="d-flex flex-wrap justify-content-between">
                    <div>
                      {(optionalFeatures?.addSpecimen?.display === "Add") && (
                        <button
                          type="button"
                          className="btn btn-outline-primary mb-1 me-1"
                          onClick={(ev) => addSpecimen(sampleIndex)}>
                          Add Specimen
                        </button>
                      )}
                    </div>
                  </div>
                </AccordionDetails>
            </SampleAccordianView>
        )})
      }
    </>
  );
};

export default BiosampleView;
