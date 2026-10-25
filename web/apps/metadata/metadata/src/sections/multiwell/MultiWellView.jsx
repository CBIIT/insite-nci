import React from "react";
import { Accordion } from "react-bootstrap";
import { updateFormChange } from "../../state/Actions";
import { useFormContext } from "../../FormContextProvider";
import { coreFields } from "./defaultField";
import FieldView from "../FormField/FieldView";
import options from "./defaultOptions.json";
import ChannelView from "../channel/ChannelView";
import { defaultChannel } from "../../form";
import HeaderView from "../shared/HeaderView";

const MultiwellPlateView = ({
  
}) => {
  // access form state and reducer
  const { context } = useFormContext();
  const { multiwellPlates = [], dispatch } = context;

  // update multiplate object values, attribute
  // update all child channel changes 
  const updateMultiWellPlateChange = (index, fieldName, value) => {
    const updateMultiwellPlate = structuredClone(multiwellPlates[index]);
    updateMultiwellPlate[fieldName] = value;
    multiwellPlates[index] = updateMultiwellPlate;
    // dispatch to update form state
    dispatch(updateFormChange({
      ...context,
      multiwellPlates,
    }));
  };

  // handle input value change
  const handleMultiplateTextChange = (ev, index) => {
    const fieldName = ev.target.name;
    const value = `${ev.target.value}`;
    updateMultiWellPlateChange(index, fieldName, value);
  };

  // handle dropdown change
  const handleDrowpdownChange = (value, fieldName, index) => {  
    updateMultiWellPlateChange(index, fieldName, value);
  };

  // handle add Channel
  const handleAddChannel = (parentIndex) => {
    // add new channel
    if (!multiwellPlates[parentIndex]?.channels) {
      updateMultiWellPlateChange(parentIndex, "channels", [defaultChannel]);
    } else {
      const updateChannels = [ ...multiwellPlates[parentIndex].channels, defaultChannel];
      updateMultiWellPlateChange(parentIndex, "channels", updateChannels);
    }
  };

  // update channel
  const handleUpdateChannel = (channels, parentIndex) => {
    updateMultiWellPlateChange(parentIndex, "channels", channels);
  }

  // assign options and handle functions to fields
  const displayFields = Object.keys(coreFields).map((key) => {
    const field = coreFields[key];
    if (options[key]) {
      // assign dropdown change
      return {
        ...coreFields[key],
        options: options[key],
        onChange: (value, index) => handleDrowpdownChange(value, key, index),
      };
    }
    // assign input change
    return {
        ...coreFields[key],
        onChange: handleMultiplateTextChange,
    };
  });

  return (
    <>
      {
        multiwellPlates?.map((plate, mltPltIndex) => (
          <Accordion key={mltPltIndex + 1}>
            <Accordion.Item key={mltPltIndex + 1} eventKey={mltPltIndex}>
              <Accordion.Header className="bg-primary-subtle">
                <HeaderView
                  title="Multiwell Plate"
                  index={mltPltIndex + 1}
                  copyFn={() => console.log("on click copy")}
                  deleteFn={() => console.log("on delete")}
                />
              </Accordion.Header>
              <Accordion.Body>
                <div className="container">
                  <div className="d-flex flex-wrap">
                    { displayFields.map(({
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
                          handleChange={(props) => onChange(props, mltPltIndex)}
                          fieldValue={plate[fieldName] || ""}
                          required={display === "Required"}
                        />
                      ))
                    }
                  </div>
                </div>
                <ChannelView
                  parentIndex={mltPltIndex}
                  updateChange={(channels) => handleUpdateChannel(channels, mltPltIndex)}
                  channels={plate.channels}
                />
                <div className="d-flex flex-wrap justify-content-between">
                  <button
                    type="button"
                    className="btn btn-outline-primary mb-1"
                    onClick={() => handleAddChannel(mltPltIndex)}
                  >
                    Add Channel
                  </button>
                </div>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        ))
      }
    </>
  )
};

export default MultiwellPlateView;
