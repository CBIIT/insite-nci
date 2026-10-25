import React, { useState } from "react";
import {
  Accordion,
  AccordionSummary, 
  AccordionDetails, 
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { coreFields } from "./defaultFields";
import { useFormContext } from "../../FormContextProvider";
import { updateFormChange } from "../../state/Actions";
import { getFormFields } from "../utils/Field";
// import FieldView from "../FormField/FieldView";
import { inputTypes } from "../FormField/FieldTypes";
import HeaderView from "../shared/HeaderView";
import InputView from './InputView';

export const keys = ["image", "imageAcquisition", "imageRawData", "imageProcessing"];

const ImageInfoAccordianView = ({
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

const ImageInfo = ({
  
}) => {
  // access form state and reducer
  const { context } = useFormContext();
  const { imageInfos = [], dispatch } = context;

  // update multiplate object values, attribute
  // update all child channel and specimen changes
  // const updateInfoChange = (index, fieldName, newValue) => {
  //   const updateInfo = structuredClone(imageInfos[index]);
  //   updateInfo[fieldName] = newValue;
  //   // update input value
  //   imageInfos[index] = updateInfo;
  //   // dispatch current form state
  //   dispatch(updateFormChange(context));
  // };

  const updateInfoChange = (index, fieldName, newValue) => {
    const nextImages = imageInfos.map((layer, i) =>
      i === index ? { ...layer, [fieldName]: newValue } : layer
    );

    // dispatch updated context; adjust if your context/form shape differs
    dispatch(updateFormChange({
      ...context,
      imageInfos: nextImages,
    }));
  };

  // const copyImage = (index) => {
  //   const copyImage = structuredClone(imageInfos[index]);
  //   imageInfos.push(copyImage)
  //   dispatch(updateFormChange(context));
  // }

  const copyImage = (index) => {
    const copyImage = structuredClone(imageInfos[index]);
    const nextImages = [...imageInfos, copyImage];
    dispatch(updateFormChange({
      ...context,
      imageInfos: nextImages,
    }))
  };

  // const deleteImage = (index) => {
  //   imageInfos.splice(index, 1);
  //   dispatch(updateFormChange(context));
  // }

  const deleteImage = (index) => {
    const nextImages = nextImages.filter((_, i) => i !== index);
    dispatch(updateFormChange({
      ...context,
      imageInfos: nextImages,
    }))
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
        imageInfos?.map((imageInfo, imageInfoIndex) => (
          <ImageInfoAccordianView>
            <AccordionSummary
              sx={{ backgroundColor: '#689cc1e3', color: '#fff' }}
              expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }}/>}
            >
              <HeaderView
                title="Image Info"
                index={imageInfoIndex + 1}
                copyFn={() => copyImage(imageInfoIndex)}
                deleteFn={() => deleteImage(imageInfoIndex)}
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
                        handleChange={(props) => onChange(props, imageInfoIndex)}
                        fieldValue={imageInfo[fieldName] || ""}
                        required={display === "Required"}
                      />
                    ))
                  } */}
                  { displayFields.map((props, fieldIndex) => (
                      <InputView
                        key={fieldIndex}
                        {...props}
                        imageInfo={imageInfo}
                        imageIndex={imageInfoIndex}
                        fieldValue={imageInfo[props.fieldName] || ""}
                      />
                    ))
                  }
                </div>
              </div>
            </AccordionDetails>
            {/* <Accordion.Item key={imageInfoIndex + 1} eventKey={imageInfoIndex}>
              <Accordion.Header className="bg-success-subtle">
                <HeaderView
                  title="Image Info"
                  index={imageInfoIndex + 1}
                  copyFn={() => copyImage(imageInfoIndex)}
                  deleteFn={() => deleteChannel(imageInfoIndex)}
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
                          handleChange={(props) => onChange(props, imageInfoIndex)}
                          fieldValue={imageInfo[fieldName] || ""}
                          required={display === "Required"}
                        />
                      ))
                    }
                  </div>
                </div>
              </Accordion.Body>
            </Accordion.Item> */}
          </ImageInfoAccordianView>
        ))
      }
    </>
  );
}

export default ImageInfo;
