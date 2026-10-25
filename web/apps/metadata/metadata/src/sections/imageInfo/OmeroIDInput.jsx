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
import { getImageInfo } from "../../service/Http";

function InfoTooltip() {
  return (
    <Tooltip
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
  imageIndex,
  fieldName
}) => {

  // dispatch to update form state
  const { context } = useFormContext();
  const { dispatch, imageInfos = [] } = context;

  const handleOmeroIdChange = async (name, id) => {
    imageInfos[imageIndex][fieldName] = id;
    imageInfos[imageIndex]['imageName'] = name;
    const imageDetails = await getImageInfo(id);
    console.log(imageDetails);
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
          onChange={(ev) => onChange(ev, imageIndex)}
          value={fieldValue}
          required={true}
        />
      </OmeroIdInputView>
    </div>
  );
};

export default OmeroIDInput;
