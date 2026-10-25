import React from "react";
import { Tooltip } from "@mui/material";
import * as StyledBtn from '../buttons.styled';

const HeaderView = ({
  title,
  index,
  copyFn,
  deleteFn,
}) => {
  return (
    <>
      <h2 className="h4 fw-semibold">
        {title} {index}
      </h2>
      <div>
        {(
          <Tooltip title="Copy">
            <StyledBtn.MuiIconBtn
              aria-label="copy"
              size="small"
              onClick={copyFn}
            >
              <StyledBtn.CopyIcon fontSize="inherit" />
            </StyledBtn.MuiIconBtn>
          </Tooltip>
        )}
        {(
          <Tooltip title="Delete">
            <StyledBtn.MuiIconBtn
              aria-label="delete"
              size="small"
              onClick={deleteFn}
            >
              <StyledBtn.DeleteIcon fontSize="inherit" />
            </StyledBtn.MuiIconBtn>
          </Tooltip>
        )}
      </div>
    </>
  );
};

export default HeaderView;
