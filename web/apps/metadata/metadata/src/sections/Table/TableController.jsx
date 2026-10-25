import React, { forwardRef, useContext, useEffect, useImperativeHandle } from "react";
import Table from "./Table";
import { TableContext } from "./ContextProvider";
import { actionTypes, onClearRadioSeclect } from "./state/Actions";

const TableController = forwardRef((props, ref) => {
  const {
    tableConfig,
    rows,
    setSelectedValue = () => {},
    setSelectedSearchResult = () => {}
  } = props;

  const tableContext = useContext(TableContext);
  const { context } = tableContext;
  const { currAction, selectedRows = [], dispatch} = context;

  // clear selected row or item
  const clearSelectedVal = () => {
    dispatch(onClearRadioSeclect());
  }

  useImperativeHandle(ref, () => {
    return {
      clearSelectedVal,
    }
  });
  
  // update value based on table action
  useEffect(() => {
    if (currAction === actionTypes.ON_ROW_SELECT_RADIO)
    {
      const value = selectedRows.length === 1
          ? selectedRows[0] : '';
      setSelectedValue(value);
      setSelectedSearchResult(value);
    }
  }, [currAction]);

  return (
    <Table
      columns={tableConfig.columns}
      rows={rows}
      dataKey={tableConfig.dataKey}
    />
  );
});

TableController.displayName = 'TableController';

export default TableController;
