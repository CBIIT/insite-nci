import * as React from 'react';
import { useFormCtx } from './FormBuilder';

const TextField = ({
  name,
  label,
  rows = 4,
  placeholder,
}) => {
  const { form, setField } = useFormCtx();
  const value = form[name] ?? '';

  return (
    <div className="col-6 p-2">
      <label
        style={{
          display: 'grid',
          gap: 6,
        }}
      >
        {label && <span>{label}</span>}
        <input
          className="form-control"
          name={name}
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setField(name, e.target.value)}
        />
      </label>
    </div>
  );
};

export default TextField;
