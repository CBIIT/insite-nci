import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Popper,
  Paper,
  ClickAwayListener,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
 } from '@mui/material';

const SuggestionView = ({
  searchQuery,
  items,
  title,
  handleChange,
  children,
}) => {
  const [selectedItem, setSelect] = useState(null);
  // const filterSuggestionItems = (`${searchQuery}`.length > 0)
  //   ? items.filter(({ object_id }) => `${object_id}`.includes(searchQuery)) : [];

  const onSelectRow = (id, name) => {
    setSelect(id);
    handleChange(id, name);
  };

  useEffect(() => {
    if (selectedItem !== searchQuery) {
      setSelect(null);
    }
  }, [searchQuery]);

  const anchorRef = useRef(null);
  // select query value to close suggesiton box
  const handleClickAway = () => {
    setSelect(searchQuery);
  };

  return (
    <div>
      <label className="form-label required" htmlFor="datasetId">
        {title}
      </label>
      {children}
      <div>
        <div ref={anchorRef} style={{ opacity: '0', height: 0}}></div>
        <Popper
          open={(items?.length > 0 && !selectedItem)}
          anchorEl={anchorRef.current}
          placement="bottom-start"
        >
          <ClickAwayListener onClickAway={handleClickAway}>
            <TableContainer component={Paper}
              sx={{ 
                m: 0,
                width: '420px',
                maxHeight: "400px"
               }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableCell
                    sx={{
                      maxWidth: 75, 
                      backgroundColor: '#d3deeaff',
                      borderBottom: '1px solid #000',
                    }}
                  >
                    ID
                  </TableCell>
                  <TableCell
                    sx={{
                      maxWidth: 110,
                      backgroundColor: '#d3deeaff',
                      borderBottom: '1px solid #000',
                    }}
                  >
                    Object Type
                  </TableCell>
                  <TableCell
                    sx={{
                      maxWidth: 180,
                      backgroundColor: '#d3deeaff',
                      borderBottom: '1px solid #000',
                    }}
                  >
                    Name
                  </TableCell>
                  {/* <TableCell sx={{ maxWidth: 75 }}>Group</TableCell> */}
                </TableHead>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow
                      key={index}
                      hover
                      onClick={() => onSelectRow(item?.object_id, item?.object_name)}
                      sx={{
                        cursor: 'pointer',
                        backgroundColor: index % 2 === 0 ? '#f2f2f2' : '#ffffff',
                        '&:hover': {
                          backgroundColor: '#d9d9d9',
                        }
                      }}
                    >
                      <TableCell>{item?.object_id}</TableCell>
                      <TableCell>{item?.object_type}</TableCell>
                      <TableCell sx={{
                          maxWidth: 220,
                          minWidth: 200,
                          wordBreak: 'break-word',
                          whiteSpace: 'normal',
                        }}
                      >
                        {item?.object_name}
                      </TableCell>
                      {/* <TableCell>{item?.group_name}</TableCell> */}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </ClickAwayListener>
        </Popper>
      </div>
    </div>
  );
};

export default SuggestionView;
