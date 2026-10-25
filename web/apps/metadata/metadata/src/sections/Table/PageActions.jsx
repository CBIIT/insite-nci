import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, IconButton } from '@mui/material';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';

function PageActions(props) {
  const {
    count, page, rowsPerPage,
    onPageChange,
    showFirstButton, showLastButton,
    disabled
  } = props;

  const totalPages = Math.max(1, Math.ceil(count / rowsPerPage));
  const go = (p) => onPageChange?.(null, Math.min(Math.max(p, 0), totalPages - 1));

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {showFirstButton && (
        <IconButton onClick={() => go(0)} disabled={disabled || page === 0} aria-label="first page">
          <FirstPageIcon />
        </IconButton>
      )}

      {/* Prev */}
      <IconButton onClick={() => go(page - 1)} disabled={disabled || page === 0} aria-label="previous page">
        <KeyboardArrowLeft />
      </IconButton>

      {/* Page selector in the middle */}
      {/* <FormControl size="small" sx={{ minWidth: 90 }}> */}
        {/* <InputLabel>Page</InputLabel> */}
        <Select
          label="Page"
          value={Math.min(page + 1, totalPages)}
          onChange={(e) => go(Number(e.target.value) - 1)}
        >
          {Array.from({ length: totalPages }, (_, i) => (
            <MenuItem key={i} value={i + 1}>{i + 1}</MenuItem>
          ))}
        </Select>
      {/* </FormControl> */}

      {/* Next */}
      <IconButton
        onClick={() => go(page + 1)}
        disabled={disabled || page >= totalPages - 1}
        aria-label="next page"
      >
        <KeyboardArrowRight />
      </IconButton>

      {showLastButton && (
        <IconButton
          onClick={() => go(totalPages - 1)}
          disabled={disabled || page >= totalPages - 1}
          aria-label="last page"
        >
          <LastPageIcon />
        </IconButton>
      )}
    </Box>
  );
}

export default PageActions;