import React from "react";
import {
  Typography,
  Tooltip,
  IconButton
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { useFormContext } from "../../FormContextProvider";
import OmeroIdInputView from '../suggestion/SuggestionController';
import { onInputValueChange } from "../../state/Actions";

function InfoTooltip() {
  return (
    <Tooltip
      sx={{
        paddingTop: 0
      }}
      title={
        <div>
          <Typography>• Refers to OMERO Project or Screen-level object IDs</Typography>
          <Typography>• Automatically generated upon successful ingestion </Typography>
          <Typography>• Only Numeric (Optional value)</Typography>
        </div>
      }
      arrow
    >
      <IconButton>
        <InfoIcon color="primary" />
      </IconButton>
    </Tooltip>
  );
}

const OmeroIDInput = ({
  onChange,
  fieldValue,
  fieldName
}) => {

  // dispatch to update form state
  const { context } = useFormContext();
  const { dispatch } = context;

  const handleOmeroIdChange = (name, id) => {
    console.log(name);
    dispatch(onInputValueChange({
      [fieldName]: id,
      "projectName": name,
    }));
  };

  return (
    <div className="col-6 p-2">
      <OmeroIdInputView
        title="Omero Project or Screen ID"
        objectTypes={["Screen", "Project"]}
        searchQuery={fieldValue}
        handleChange={(id, name) => {
          handleOmeroIdChange(name, id);
        }}
      >
        <InfoTooltip />
        <input
          className="form-control"
          id={fieldName}
          name={fieldName}
          type="number"
          min="0"
          placeholder="Enter Project/Screen ID"
          onChange={(ev) => onChange(ev)}
          value={fieldValue}
          required={true}
        />
      </OmeroIdInputView>
    </div>
  );
};

export default OmeroIDInput;
