import React, { useContext, useEffect, useReducer, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Box,
} from '@mui/material';
import { TableContext } from "./ContextProvider";
import reducer from "./state/Reducer";
import { onRadioSeclect } from "./state/Actions";
import CellView from "./CellView";
import PaginationThemeProvider from "./PaginationTheme";

export default function TableView ({
  columns = [],
  rows,
  loading = false,
  error = false,
  searchTerm = "",
  submitted = false,
  onRowClick = () => {},
  dataKey = "id",
  noRecordsMsg,
}) {
  const initState = (initailState) => ({
    ...initailState,
    selectedRows: [],
  });
  /**
  * Initailize useReducer state
  * 1. table: state
  * 2. dispatch: dispatch action (as redux action) to update pagination state
  */
  const [table, dispatch] = useReducer(reducer, {}, initState);

  /**
  * use context to provide table state to wrapper component
  */
  const tableContext = useContext(TableContext);

  useEffect(() => {
    /**
    * set table context
    * 1. provide table state to other components
    * 2. provide table dispatch action to other components
    */
    const { setContext } = tableContext;
    setContext({ ...table, dispatch });
  }, [table]);

  // Table actions
  // on radio select
  const onRadioSelectHandler = (event, row) => {
    event.stopPropagation();
    const selectedId = row[dataKey];
    dispatch(onRadioSeclect([selectedId]));
  };

  const cellView = (col, row) => {
    return (
      <CellView
        column={col}
        row={row}
        table={table}
        dataKey={dataKey}
        onRadioSelectHandler={onRadioSelectHandler}
      />
    );
  }

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page when rows per page changes
  };

  // Slice the data based on current page and rowsPerPage
  const paginatedData = rows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
    
  return (
    <>
      <div className="position-relative">
        <TableContainer component={Paper}>
        <Table className="table table-hover mvh-50">
          <TableHead className="position-sticky top-0">
            <TableRow>
              {columns.map((col, colIndex) => <TableCell key={colIndex} className="fw-semibold">{col.label}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {(rows.length === 0) && (
              <TableRow>
                {
                  (noRecordsMsg) ? (
                    <>
                     {noRecordsMsg}
                    </>
                  ) : (
                  <span colSpan="5" className="text-center">
                    {loading ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : error ? (
                      <span className="text-danger">{error}</span>
                    ) : !searchTerm ? (
                      "Please provide query"
                    ) : submitted ? (
                      "No results were found"
                    ) : (
                      "Please search to see results"
                    )}
                  </span>
                  )
                }
              </TableRow>
            )}
            {
              paginatedData.map((row, index) => (
                <TableRow
                  key={index}
                  className="cursor-pointer"
                  onClick={onRowClick(row)}
                >
                  {
                    columns.map((col, colIndex) => (
                      <TableCell className={col.field} key={colIndex}>{cellView(col, row)}</TableCell>
                    ))
                  }
                </TableRow>
              ))
            }
          </TableBody>
          
        </Table>
        </TableContainer>
        <div className="row">
          <PaginationThemeProvider>
            <TablePagination
              rowsPerPageOptions={[5, 10, 15, 20, 25]}
              component="div"
              count={rows?.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </PaginationThemeProvider>
        </div>
      </div>
    </>
  )
}
