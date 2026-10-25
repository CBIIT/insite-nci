import React, { useCallback, useState, useEffect } from "react";
import clsx from "clsx";
import Select from "react-select";
import { Tooltip } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { inputTypes } from "./FieldTypes";
import { fieldSchema } from "./FieldValidation";

const FieldView = (props) => {
  // field validation
  fieldSchema.parse(props);

  const {
    inputType = "",
    label = "",
    fieldName = "",
    fieldId = "",
    placeholder = "Enter text",
    handleChange,
    fieldValue,
    required,
    options,
    display = true,
    tooltipText = undefined
  } = props;

  if (!display) {
    return;
  }

  const [localValue, setLocalValue] = useState(fieldValue || "");
  // sync only when external value actually changes (not typing)
  useEffect(() => {
    setLocalValue(fieldValue || "");
  }, [fieldValue]);

  // add tooltips
  const LabelTooltip = useCallback(({ children }) => {
    if (tooltipText) {
      return (
        <>
          {children}
          <Tooltip
            id="field-tooltip"
            title={tooltipText}
            sx={{
              marginLeft: '10px',
              width: '20px',
              marginBottom: '5px',
            }}
          >
            <InfoIcon />
          </Tooltip>
        </>
      );
    }
    // return default view
    return <>{children}</>;
  }, []);

  // unique field name
  const uniqueFieldName = fieldId ? `${fieldName}-${fieldId}` : fieldName;
  if (inputType === inputTypes.FREE_TEXT)
    {
      return (
        <div className="col-6 p-2">
          <label
            className={clsx( "form-label", {["required"]: required})}
            htmlFor={uniqueFieldName}
          >
            {label}
          </label>
          {/* <textarea
            rows="3"
            className="form-control"
            id={uniqueFieldName}
            name={uniqueFieldName}
            placeholder={placeholder}
            onChange={handleChange}
            value={fieldValue}
            required={required || false}
          /> */}
          <textarea
            rows="3"
            className="form-control"
            id={uniqueFieldName}
            name={uniqueFieldName}
            placeholder={placeholder}
            value={localValue}
            onChange={(e) => {
              const val = e.target.value;
              setLocalValue(val);
              handleChange(e);
            }}
            required={required || false}
          />
        </div>
      );
    }

  if (inputType === inputTypes.DROPDOWN)
    {
      return (
        <div className="col-6 p-2">
          <label
            className={clsx( "form-label", {["required"]: required})}
            htmlFor={uniqueFieldName}
          >
            {label}
          </label>
          <Select
            options={options}
            id={uniqueFieldName}
            name={uniqueFieldName}
            value={fieldValue}
            placeholder={placeholder}
            onChange={handleChange}
            required={required || false}
          />
        </div>
      );
    }
  
  if (inputType === inputTypes.FILE)
  {
    return (
      <>
        <div className="col-6 p-2">
          <LabelTooltip>
            <label
              className={clsx( "form-label", {["required"]: required})}
              htmlFor={uniqueFieldName}
            >
              {label}
            </label>
          </LabelTooltip>
          <input
            className="form-control"
            type="file"
            id={uniqueFieldName}
            name={uniqueFieldName}
            onChange={handleChange}
            required={required || false}
          />
        </div>
      </>
    );
  }
  
  // assign string input types
  let inputDataType = "text";
  switch(inputType){
    case inputTypes.EMAIL: 
      inputDataType = "email";
      break;
    case inputTypes.DATE:
      inputDataType = "date"
      break;
    case inputTypes.NUMERIC:
      inputDataType = "number";
      break;
    default:
      break;
  }

  return (
    <>
      <div className="col-6 p-2">
        <LabelTooltip>
          <label
            className={clsx( "form-label", {["required"]: required})}
            htmlFor={uniqueFieldName}
          >
            {label}
          </label>
        </LabelTooltip>
        {/* <input
          className="form-control"
          type={inputDataType}
          id={uniqueFieldName}
          name={uniqueFieldName}
          placeholder={placeholder || `Enter ${label}`}
          onChange={handleChange}
          value={fieldValue}
          required={required || false}
        /> */}
        <input
          className="form-control"
          type={inputDataType}
          id={uniqueFieldName}
          name={uniqueFieldName}
          placeholder={placeholder || `Enter ${label}`}
          value={localValue}
          onChange={(e) => {
            const val = e.target.value;
            setLocalValue(val);        // ✅ keeps cursor stable
            handleChange(e);           // ✅ update global state
          }}
          required={required || false}
        />
      </div>
    </>
  );
}

export default FieldView;
