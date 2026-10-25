import React, { useEffect, useState } from "react";
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import ReactMarkdown from "react-markdown";
import {
  Box,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
 } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import ReadMeTheme from "./ThemeConfig";

const ReadMeView = ({
  content = "",
  template
}) => {
  const [open, setOpen] = useState(false);
  const [viewTemplate, setView] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  const headerRow = template ? template[0] : [];
  const rows = template ? template.slice(1, template.length) : [];

  const allColumnIndices = headerRow.map((_, i) => i);

  // Initial columns to show (collapsed view)
  const defaultVisible = [0, 1, 7, 8, 9];
  const [visibleColumns, setVisibleColumns] = useState(defaultVisible);
  const isExpanded = visibleColumns.length === allColumnIndices.length;

  const toggleColumns = (index) => {
    let updateColumns = [...visibleColumns]
    if (visibleColumns.includes(index)) {
      updateColumns = updateColumns.filter(num => num !== index);
    } else {
      updateColumns = [...visibleColumns, index];
    }
    setVisibleColumns(updateColumns);
  };

  const hiddenColumns = allColumnIndices.filter(i => !visibleColumns.includes(i));

  return (
    <ReadMeTheme>
      <Button
        onClick={handleClickOpen}
        sx={{
          height: "38px",
          width: "137px",
          background: "#0F4C91",
          borderRadius: "5px",
          color: "#FFF",
          fontFamily: "Lato",
          fontSize: "16px",
          lineHeight: "22px",
        }}
      >
        Help
      </Button>
      <Dialog
        maxWidth="xl"
        open={open}
        keepMounted
        onClose={handleClose}
        aria-describedby="alert-dialog-slide-description"
        slotProps={{
          paper: {
            sx: {
              p: 2,
            },
          },
        }}
      >
        <div class="row">
          <div class="col-md-2">
            <Button
              variant="contained"
              onClick={() => setView(!viewTemplate)}
              sx={{
                backgroundColor: '#3a9df4ff',
              }}
            >
              {(viewTemplate) ? "Hide Template" : "View Template"}
            </Button>
          </div>
          <div class="col-md-1 offset-md-9 text-end">
            <IconButton
              sx={{
                width: 30,
                float: 'right'
              }}
              onClick={handleClose}
            >
              <CloseIcon />
            </IconButton>
          </div>
        </div>
        {
          (viewTemplate) && (
            <Paper sx={{ width: '100%' }}>
              <TableContainer
                sx={{
                  maxHeight: 400, // adjust height
                }}
              >
                <Table stickyHeader aria-label="sticky table">
                  {/* <TableHead>
                    {(headerRow).map(
                      item => (
                        <TableCell
                          sx={{
                            background: "#10477e",
                            color: "#fff",
                            lineHeight: "1",
                            padding: "10px",
                          }}
                        >
                          {item}
                        </TableCell>
                      )
                    )}
                  </TableHead> */}
                  <TableHead>
                    <TableRow>
                      {headerRow.map((item, index) => (
                        <>
                          {
                            visibleColumns.includes(index) && (
                              <Tooltip title="Collapse">
                              <TableCell
                                key={index}
                                sx={{
                                  background: "#10477e",
                                  color: "#fff",
                                  lineHeight: "1",
                                  padding: "10px",
                                  maxWidth: 150,
                                  cursor: "pointer"
                                }}
                                className={item}
                                onClick={() => toggleColumns(index)}
                              >
                                <Box
                                  sx={{
                                    display: "flex", 
                                    justifyContent: "space-between", 
                                    alignItems: "center"
                                  }}
                                >
                                  <span>{item}</span>
                                  {/* <IconButton
                                    size="small"
                                    sx={{
                                      color: "#fff",
                                      width: 20
                                    }}
                                  >
                                    <RemoveIcon />
                                  </IconButton> */}
                                </Box> 
                              </TableCell>
                              </Tooltip>
                            )}
                            {hiddenColumns.includes(index) && (
                              <TableCell
                                key="toggle"
                                sx={{
                                  background: "#10477e",
                                  color: "#fff",
                                  lineHeight: "1",
                                  padding: "10px",
                                  width: 50
                                }}
                              >
                                <Tooltip title="Expand">
                                  <IconButton
                                    onClick={() => toggleColumns(index)}
                                    size="small"
                                    sx={{
                                      color: "#fff",
                                      width: 20
                                    }}
                                  >
                                    <AddIcon />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            )}
                        </>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row, i) => (
                      <TableRow
                        key={i}
                        sx={{
                          backgroundColor: i % 2 === 0 ? '#f5f5f5' : '#ffffff',
                        }}
                        className={`${row[0]}`.toLowerCase()}
                      >
                        {row.map((cell, j) => (
                          <TableCell key={j}>
                            {visibleColumns.includes(j) ? cell : ''}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )
        }
        <ReactMarkdown children={content} skipHtml={false} />
      </Dialog>
    </ReadMeTheme>
  );
}

export default ReadMeView;
