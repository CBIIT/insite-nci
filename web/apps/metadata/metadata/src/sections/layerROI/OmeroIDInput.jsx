import React from "react";
import {
  Typography,
  Tooltip,
  IconButton
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { useFormContext } from "../../FormContextProvider";
import OmeroIdInputView from '../suggestion/SuggestionController';
import { updateFormChange } from "../../state/Actions";

function InfoTooltip() {
  return (
    <Tooltip
      sx={{
        paddingTop: 0
      }}
      title={
        <div>
          <Typography>• Refers to OMERO Image IDs</Typography>
          <Typography>• Automatically generated upon successful ingestion </Typography>
        </div>
      }
      arrow
    >
      <IconButton>
        <InfoIcon color="primary" />
      </IconButton>
    </Tooltip>
  );
};

const OmeroIDInput = ({
  onChange,
  fieldValue,
  label,
  placeholder,
  layerIndex,
  fieldName
}) => {

  // dispatch to update form state
  const { context } = useFormContext();
  const { dispatch, layerROIs = [] } = context;

  const handleOmeroIdChange = (name, id) => {
    layerROIs[layerIndex][fieldName] = id;
    layerROIs[layerIndex]['imageName'] = name;
    dispatch(updateFormChange(context));
  };

  return (
    <div className="col-6 p-2">
      <OmeroIdInputView
        title={label}
        objectTypes={["Image"]}
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
          placeholder={placeholder}
          onChange={(ev) => onChange(ev, layerIndex)}
          value={fieldValue}
          required={true}
        />
      </OmeroIdInputView>
    </div>
  );
};

export default OmeroIDInput;
