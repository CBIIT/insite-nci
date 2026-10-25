import React, { useState } from "react";
import clsx from "clsx";

const DatasetQuality = ({
  fieldName,
  label,
  onChange,
  imageIndex,
  isRequired,
}) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const enterNumber = (e) => {
    const newVal = e.target.value;
    if (Number(newVal) >= 1 && Number(newVal) <= 5) {
      setValue(newVal);
      onChange(e, imageIndex);
      setError("");
    } else {
      setValue("");
      setError(" Enter number between 1 - 5 !")
    }
  };

  return (
    <div className="col-6 p-2">
      <label
        className={clsx( "form-label", {["required"]: isRequired})}
        htmlFor={fieldName}
      >
        {`${label} (1=unusable, 5 = perfect)`}
        <span style={{color: '#cc044a'}}>{error}</span>
      </label>
      <input
        className="form-control"
        type="number"
        id={fieldName}
        name={fieldName}
        placeholder={`Enter Number between 1 and 5`}
        onChange={enterNumber}
        value={value}
        required={isRequired}
        min="1"
        max="5"
        step="1"
      />
    </div>
  );
};

export default DatasetQuality;
