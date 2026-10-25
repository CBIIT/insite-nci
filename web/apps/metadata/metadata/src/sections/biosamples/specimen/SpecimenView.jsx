import React, { useState } from "react";
// import { Accordion } from "react-bootstrap";
import {
  Accordion,
  AccordionSummary, 
  AccordionDetails, 
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import defaultOptions from "./defaultOptions.json";
import { useFormContext } from "../../../FormContextProvider";
import { filteredOptions } from "../../../utils";
import { coreFields, getOmeroObjectFields } from "./defaultField";
import InputView from "./InputView";
import ChannelView from "../../channel/ChannelView";
import { updateFormChange } from "../../../state/Actions";
import { defaultChannel } from "../../../form";
import { getFormFields, getOptions } from "../../utils/Field";
import { inputTypes } from "../../FormField/FieldTypes";
import HeaderView from "../../shared/HeaderView";

const SpecimenAccordianView = ({
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
}

const SpecimenView = ({
  specimens = [],
  sample,
  sampleIndex,
}) => {
  // access form state and reducer
  const { context } = useFormContext();
  const { dispatch, samples = [] } = context;

  // update multiplate object values, attribute
  // update all child channel and specimen changes 
  // const updateSpecimenChange = (index, fieldName, value) => {
  //   const updateSpecimen = structuredClone(specimens[index]);
  //   updateSpecimen[fieldName] = value;
  //   // update value based on variable imutability
  //   specimens[index] = updateSpecimen;
  //   // dispatch to update form state & reload value to form view
  //   dispatch(updateFormChange(context));
  // };
  // Update a single specimen field (immutable)
  const updateSpecimenChange = (index, fieldName, value) => {
    const nextSpecimens = specimens.map((s, i) =>
      i === index ? { ...s, [fieldName]: value } : s
    );

    // update samples at root
    const nextSamples = structuredClone(samples);
    nextSamples[sampleIndex] = {
      ...samples[sampleIndex],
      specimens: nextSpecimens,
    };

    // dispatch updated context (keep shape your app expects)
    dispatch(updateFormChange({
      ...context,
      samples: nextSamples,
    }));
  };

  // const copySpecimen = (index) => {
  //   const copyChannel = structuredClone(specimens[index]);
  //   specimens.push(copyChannel)
  //   dispatch(updateFormChange(context));
  // }

  // Copy (duplicate) a specimen (immutable)
  const copySpecimen = (index) => {
    const original = specimens[index] || {};
    // shallow copy the specimen; deep copy if specimen has nested refs you will mutate later
    const copied = { ...original, 
      // ensure nested arrays are new copies to avoid shared references
      specimens: undefined, // if specimen has nested 'specimens' rename/remove as appropriate
      channels: original.channels ? original.channels.map(ch => ({ ...ch })) : undefined
    };

    const nextSpecimens = [...specimens, copied];
    dispatch(updateFormChange({ ...context, specimens: nextSpecimens }));
  };

  // const deleteSpecimen = (index) => {
  //   specimens.splice(index, 1);
  //   dispatch(updateFormChange(context));
  // }

  // Delete a specimen (immutable)
  const deleteSpecimen = (index) => {
    const nextSpecimens = specimens.filter((_, i) => i !== index);
    dispatch(updateFormChange({ ...context, specimens: nextSpecimens }));
  };

  // const handleUpdateChannel = (channels, specimenIndex) => {
  //   updateSpecimenChange(specimenIndex, "channels", channels);
  // }

  // When channels are updated elsewhere, use the updateSpecimenChange helper
  const handleUpdateChannel = (channels, specimenIndex) => {
    // channels should be a new array already (immutable). If not, clone it first:
    // const safeChannels = Array.isArray(channels) ? channels.map(c => ({ ...c })) : channels;
    updateSpecimenChange(specimenIndex, "channels", channels);
  };

  // handle add Channel
  const handleAddChannel = (parentIndex) => {
    // add new channel
   if (!specimens[parentIndex]?.channels) {
      updateSpecimenChange(parentIndex, "channels", [defaultChannel]);
    } else {
      const updateChannels = [ ...specimens[parentIndex].channels, defaultChannel];
      updateSpecimenChange(parentIndex, "channels", updateChannels);
    }
  };

  const handleTextChange = (ev, index) => {
    const fieldName = ev.target.name;
    const value = `${ev.target.value}`;
    updateSpecimenChange(index, fieldName, value);
  };

  const handleDropdownChange = (value, fieldName, index) => {
    updateSpecimenChange(index, fieldName, value);
  };

  // drowpdown options
  // configure form fields
  const {
    displayFormFields = {},
    displayFieldOptions = {},
    imagingFacility
  } = context;

  const displayOptions = getOptions({
    ...defaultOptions,
    preparationMethod: filteredOptions.getSpecimenPreparationMethods(context)
    }, 
    displayFieldOptions
  );

  // set formFields dropdown options
  const displayFields1 = getFormFields(
    displayOptions,
    getOmeroObjectFields(imagingFacility?.value || 0),
    displayFormFields?.specimen
  ).map(field => {
      if (field.inputType === inputTypes.DROPDOWN) {
        const { fieldName } = field;
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
        specimens.map((specimen, specimenIndex) => (
          <SpecimenAccordianView>
            <AccordionSummary
              sx={{ backgroundColor: 'text.secondary', color: '#fff' }}
              expandIcon={<ExpandMoreIcon  sx={{ color: '#fff' }} />}
            >
              <HeaderView
                title="Specimen"
                index={specimenIndex + 1}
                copyFn={() => copySpecimen(specimenIndex)}
                deleteFn={() => deleteSpecimen(specimenIndex)}
              />
            </AccordionSummary>
            <AccordionDetails>
              <div className="container">
                <div className="d-flex flex-wrap">
                {
                  displayFields1.map((props, fieldIndex) => (
                    <InputView
                      {...props}
                      handleTextChange={handleTextChange}
                      specimen={specimen}
                      specimenIndex={specimenIndex}
                      key={fieldIndex}
                    />
                  ))
                }
                </div>
              </div>
              <ChannelView
                parentIndex={specimenIndex}
                updateChange={(channels) => handleUpdateChannel(channels, specimenIndex)}
                channels={specimen?.channels}
              />
              <div className="container">
                <button
                  type="button"
                  className="btn btn-outline-primary mb-1"
                  onClick={(ev) => handleAddChannel(specimenIndex)}
                >
                  Add Channel
                </button>
              </div>
            </AccordionDetails>
          </SpecimenAccordianView>
        ))
      }
    </>
  );
};

export default SpecimenView;
