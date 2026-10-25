import React, { useState } from "react";
import {
  Accordion,
  AccordionSummary, 
  AccordionDetails, 
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useFormContext } from "../../FormContextProvider";
import { updateFormChange } from "../../state/Actions";
import { getFormFields } from "../utils/Field";
import FieldView from "../FormField/FieldView";
import { inputTypes } from "../FormField/FieldTypes";
import HeaderView from "../shared/HeaderView";
import { coreFields } from "./defaultFields";
import InputView from "./InputView";

export const keys = [
  "layer",
  "layersRoisImageProcessing",
  "layersRoisDetails",
  "layersRoisMetadata"
];

const LayerAccordianView = ({
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

const LayerROI = ({
  
}) => {
  // access form state and reducer
  const { context } = useFormContext();
  const { layerROIs = [], dispatch } = context;

  // update multiplate object values, attribute
  // update all child channel and specimen changes
  // const updateInfoChange = (index, fieldName, newValue) => {
  //   const updateLayer = structuredClone(layerROIs[index]);
  //   updateLayer[fieldName] = newValue;
  //   // update input value
  //   layerROIs[index] = updateLayer;
  //   // dispatch current form state
  //   dispatch(updateFormChange(context));
  // };

  // Immutable update: replace one layer's field
  const updateInfoChange = (index, fieldName, newValue) => {
    const nextLayers = layerROIs.map((layer, i) =>
      i === index ? { ...layer, [fieldName]: newValue } : layer
    );

    // dispatch updated context; adjust if your context/form shape differs
    dispatch(updateFormChange({
      ...context,
      layerROIs: nextLayers,
    }));
  };

  // const copyLayer = (index) => {
  //   const copyLayer= structuredClone(layerROIs[index]);
  //   layerROIs.push(copyLayer)
  //   dispatch(updateFormChange(context));
  // }
  const copyLayer = (index) => {
    const copyLayer= structuredClone(layerROIs[index]);
    const nextLayers = [...layerROIs, copyLayer];
    dispatch(updateFormChange({
      ...context,
      layerROIs: nextLayers,
    }))
  };

  // const deleteLayer = (index) => {
  //   layerROIs.splice(index, 1);
  //   dispatch(updateFormChange(context));
  // }
  const deleteLayer = (index) => {
    const nextLayers = layerROIs.filter((_, i) => i !== index);
    dispatch(updateFormChange({
      ...context,
      layerROIs: nextLayers,
    }));
  }

  const handleTextChange = (ev, index) => {
    const fieldName = ev.target.name;
    const value = `${ev.target.value}`;
    updateInfoChange(index, fieldName, value);
  };

  const handleDropdownChange = (value, fieldName, index) => {
    updateInfoChange(index, fieldName, value);
  };

  // drowpdown options 
  // configure form fields
  const {
    displayFormFields = {},
    displayFieldOptions = {}
  } = context;
  // filter fields replate to image info 
  const imageInfoFields = keys.reduce((acc, key) => {
    acc = { ...displayFormFields[key], ...acc };
    return acc;
  }, []);

  const displayFields = getFormFields(
    displayFieldOptions,
    coreFields,
    imageInfoFields
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
        layerROIs?.map((layer, layerIndex) => (
          <LayerAccordianView>
            <AccordionSummary
              sx={{ backgroundColor: '#14416f', color: '#fff' }}
              expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }}/>}
            >
              <HeaderView
                title="Layer RIO"
                index={layerIndex + 1}
                copyFn={() => copyLayer(layerIndex)}
                deleteFn={() => deleteLayer(layerIndex)}
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
                        handleChange={(props) => onChange(props, layerIndex)}
                        fieldValue={layer[fieldName] || ""}
                        required={display === "Required"}
                      />
                    ))
                  } */}
                  { displayFields.map((props, fieldIndex) => (
                      <InputView
                        key={fieldIndex}
                        {...props}
                        layerIndex={layerIndex}
                        layer={layer}
                        fieldValue={layer[props.fieldName] || ""}
                      />
                    ))
                  }
                </div>
              </div>
            </AccordionDetails>
            {/* <Accordion.Item key={layerIndex + 1} eventKey={layerIndex}>
              <Accordion.Header className="bg-info-subtle">
                <HeaderView
                  title="Layer RIO"
                  index={layerIndex + 1}
                  copyFn={() => copyLayer(layerIndex)}
                  deleteFn={() => deleteLayer(layerIndex)}
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
                          handleChange={(props) => onChange(props, layerIndex)}
                          fieldValue={layer[fieldName] || ""}
                          required={display === "Required"}
                        />
                      ))
                    }
                  </div>
                </div>
              </Accordion.Body>
            </Accordion.Item> */}
          </LayerAccordianView>
        ))
      }
    </>
  );
}

export default LayerROI;
