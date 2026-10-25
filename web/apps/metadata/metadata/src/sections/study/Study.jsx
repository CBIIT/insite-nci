import React, { useState } from "react";
import {
  Accordion,
  AccordionSummary, 
  AccordionDetails, 
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useFormContext } from "../../FormContextProvider";
import { onInputValueChange, uploadFile } from "../../state/Actions";
import options from "./defaultOptions.json";
import { coreFields } from "./defaultField";
import { getFormFields, getOptions } from "../utils/Field";
import { inputTypes } from "../FormField/FieldTypes";
import InputView from "./InputView";

const StudyView = ({
  handleImageFacilitychange
}) => {
  // dispatch to update form state
  const { context } = useFormContext();
  const { dispatch } = context;

  const [expanded, setExpanded] = useState(true);

  // handle input value change
  const handleTextChange = (ev) => {
    const fieldName = ev.target.name;
    dispatch(onInputValueChange({
      [fieldName]: ev.target.value
    }));
  };

  // handle dropdown change
  const handleDrowpdownChange = (value, fieldName) => {
    if (fieldName === "imagingFacility"){
      handleImageFacilitychange(fieldName, value);
    }else {
      dispatch(onInputValueChange({
        [fieldName]: value
      }));
    }
  };

  // handle file upload
  const handleFileUpload = (ev) => {
    const fieldName = ev.target.name;
    if (ev.target.files && ev.target.files.length > 0) {
      const file = ev.target.files[0]
      const payload = {
        [fieldName]: file,
      };
      dispatch(uploadFile(
        payload
      ));
    }
  }

  // configure form fields
  const {
    displayFormFields = {},
    displayFieldOptions = {}
  } = context;
  console.log(context);
  // set options
  const displayOptions = getOptions(options, displayFieldOptions);

  // set formFields dropdown options
  const displayFields = getFormFields(
    displayOptions,
    coreFields,
    displayFormFields?.studyComponent || displayFormFields?.study
  ).map(field => {
      const { fieldName, label } = field;
      if (field.inputType === inputTypes.DROPDOWN) {
        return {
          ...field,
          onChange: (value) => handleDrowpdownChange(value, fieldName),
        };
      }
      if (field.inputType === inputTypes.FILE) {
        return {
          ...field,
          onChange: (event) => handleFileUpload(event),
        };
      }
      return {
        ...field,
        onChange: handleTextChange,
      };
    }
  );

  function onToggle (){
    setExpanded(!expanded);
  };
  
  // console.log(context["omeroScreenOrProjectId"]);

  return (
    <>
      <Accordion expanded={expanded} onChange={onToggle}>
        <AccordionSummary
          sx={{ backgroundColor: 'info.main', color: '#fff' }}
          expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }} />}
        >
          <h2 className="h4 fw-semibold">Study Information</h2>
        </AccordionSummary>
         <AccordionDetails>
            <div className="container">
              <div className="d-flex flex-wrap">
                { displayFields.map((props, fieldIndex) => (
                    <InputView
                      key={fieldIndex}
                      {...props}
                      fieldValue={
                        context[props.fieldName] || ""
                      }
                    />
                  ))
                }
              </div>
            </div>
         </AccordionDetails>
      </Accordion>
    </>
  );
};

export default StudyView;
