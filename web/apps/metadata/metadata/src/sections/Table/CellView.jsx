import React from "react";
import { cellTypes } from "./ColumnTypes";

const CellView = ({
  column,
  row,
  table,
  dataKey,
  onRadioSelectHandler
}) => {

  // radio field
  if (column.type === cellTypes.RADIO) {
    return (
      <input
        className="form-check-input"
        type="radio"
        name="proteinId"
        checked={table?.selectedRows?.includes(row[dataKey])}
        onChange={(event) => onRadioSelectHandler(event, row)}
      />
    ) 
  }

  // list view
  if (column.type === cellTypes.LIST) {
    const items = row[column.field];
    return (
      <ul className="mb-0 ps-3 text-muted">
        {items.map((name, index) => (
          <li key={index}>{name}</li>
        ))}
      </ul>
    );
  }

  // list view
  if (column.type === cellTypes.CUSTOM_ELEM) {
    // const item = row[column.field];
    const { CustomElem } = column;
    if (CustomElem) {
      return (
        <CustomElem {...row} />
      );
    }
  }


  return  (
    <p>
      {row[column.field]}
    </p>
  );
};

export default CellView;
