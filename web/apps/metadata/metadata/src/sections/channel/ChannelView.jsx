import React, { useState } from "react";
import {
  Accordion,
  AccordionSummary, 
  AccordionDetails, 
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import options from "./defaultOptions.json";
import { coreFields } from "./defaultField";
import FieldView from "../FormField/FieldView";
import { useFormContext } from "../../FormContextProvider";
import { filteredOptions } from '../../utils';
import HeaderView from "../shared/HeaderView";
import { updateFormChange } from "../../state/Actions";
import { getFormFields } from "../utils/Field";
import { inputTypes } from "../FormField/FieldTypes";
import InputView from "./InputView";

const ChannelAccordianView = ({
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


const ChannelView = ({
  channels = [],
  updateChange,
}) => {
  // access form state
  const { context } = useFormContext();
  const { dispatch } = context;

  // update channels change to parent
  // const updateChannelChange = (index, fieldName, value) => {
  //   const updateChannel = structuredClone(channels[index]);
  //   updateChannel[fieldName] = value;
  //   channels[index] = updateChannel;
  //   updateChange(channels);
  // }

  const updateChannelChange = (index, fieldName, value) => {
    const nextChannels = channels.map((ch, i) =>
      i === index ? { ...ch, [fieldName]: value } : ch
    );
    updateChange(nextChannels);
  };

  // const copyChannel = (index) => {
  //   const copyChannel = structuredClone(channels[index]);
  //   channels.push(copyChannel);
  //   dispatch(updateFormChange(context));
  // }

  const copyChannel = (index) => {
    const nextChannels = [
      ...channels,
      { ...channels[index] }
    ];
    updateChange(nextChannels);
  };

  // const deleteChannel = (index) => {
  //   channels.splice(index, 1);
  //   dispatch(updateFormChange(context));
  // }
  
  const deleteChannel = (index) => {
    const nextChannels = channels.filter((_, i) => i !== index);
    updateChange(nextChannels);
  };

  const handleTextChange = (ev, index, textVal) => {
    const fieldName = ev.target.name;
    const value = textVal || `${ev.target.value}`;
    updateChannelChange(index, fieldName, value);
  }

  // handle dropdown change
  const handleDropdownChange = (value, fieldName, index) => {  
    updateChannelChange(index, fieldName, value);
  };

  // upload default dropdown options
  // override dropdown options
  const channelOptions = {
    ...options,
    signalOrContrastMechanism: filteredOptions.getChannelSignalContrastMechanisms(context),
    channelStains: filteredOptions.getChannelStains(context),
  };

  // drowpdown options
  // configure form fields
  const {
    displayFormFields = {},
    displayFieldOptions = {}
  } = context;

  // assign options and handle functions to fields
  const displayFields = getFormFields(
    { ...channelOptions, ...displayFieldOptions},
    coreFields,
    displayFormFields?.channel
  ).map((field) => {
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

    // if (channelOptions[key])
    // {
    //   return {
    //     ...coreFields[key],
    //     onChange: (value, index) => handleDropdownChange(value, key, index),
    //     options: channelOptions[key]
    //   };
    // }
    // return {
    //     ...coreFields[key],
    //     onChange: handleTextChange,
    // };
  });

  return (
    <>
      {
        channels.map((channel, index) => (
          <ChannelAccordianView>
            <AccordionSummary
              sx={{ backgroundColor: '#aab1b6e3', color: '#fff' }}
              expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }}/>}
            >
              <HeaderView
                title="Channel"
                index={index + 1}
                section={channel}
                copyFn={() => copyChannel(index)}
                deleteFn={() => deleteChannel(index)}
              />
            </AccordionSummary>
            <AccordionDetails>
              <div className="container">
                <div className="d-flex flex-wrap">
                  {/* { displayFields.map(({
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
                        handleChange={(e) => onChange(e, index)}
                        fieldValue={channel[fieldName] || ""}
                        required={display === "Required"}
                      />
                    ))
                  } */}
                  { displayFields.map(({
                      fieldName,
                      label,
                      inputType,
                      options,
                      placeholder,
                      onChange,
                      display
                    }, fieldIndex) => (
                      <InputView
                        // key={fieldIndex}
                        // inputType={inputType}
                        // placeholder={placeholder}
                        // options={options}
                        // label={label}
                        // fieldName={fieldName}
                        // fieldId=''
                        // handleChange={(e) => onChange(e, index)}
                        // fieldValue={channel[fieldName] || ""}
                        // required={display === "Required"}
                        fieldName={fieldName}
                        label={label}
                        inputType={inputType}
                        options={options}
                        placeholder={placeholder}
                        onChange={onChange}
                        display={display}
                        fieldIndex={fieldIndex}
                        channelIndex={index}
                        fieldValue={channel[fieldName] || ""}
                        channel={channel}
                      />
                    ))
                  }
                </div>
              </div>
            </AccordionDetails>
          </ChannelAccordianView>
        ))
      }
    </>
  )
};

export default ChannelView;
