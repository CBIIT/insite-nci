import React, { useState } from "react";
import Select from "react-select";
import InfoIcon from "@mui/icons-material/Info";
// import Accordion from "react-bootstrap/Accordion";
import {
  Accordion,
  AccordionSummary, 
  AccordionDetails, 
  Typography,
  Tooltip,
  IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { filteredOptions } from "../utils";
import UniProtView from "../sections/UniProtView/UniProtView";
import * as StyledBtn from './buttons.styled';

// channel view for parent component Biosamples and MultiWellPlate
// parentFormObject -> Biosample or MultipWellPlate

const ChannelView = ({
  handleChannelChangeFn,
  channelIndex,
  copyChannelFn,
  removeChannelFn,
  children,
  channelVal,
  form,
  setForm,
  uniqueChannelId,
  displayFormFields,
  displayFieldOptions = {}
}) => {
    const [expanded, setExpanded] = useState(true);
    function onToggle (){
      setExpanded(!expanded);
    }
    const handleValueChange = (e) => {
      const value = `${e?.target?.value}`.length === 0 ? e.value : `${e.target.value}`;
      handleChannelChangeFn({
        id: "otherStain",
        inputVal: value
      });
    }

    return (
      <>
        <Accordion expanded={expanded} onChange={onToggle}>
          <AccordionSummary
            sx={{ backgroundColor: '#aab1b6e3', color: '#fff' }}
            expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }}/>}
          >
            Channel {channelIndex + 1}
            <div>
              <Tooltip title="Copy">
                <StyledBtn.MuiIconBtn
                  aria-label="copy"
                  size="small"
                  onClick={copyChannelFn}
                >
                  <StyledBtn.CopyIcon fontSize="inherit" />
                </StyledBtn.MuiIconBtn>
              </Tooltip>
              <Tooltip title="Delete">
                <StyledBtn.MuiIconBtn
                  aria-label="delete"
                  size="small"
                  onClick={removeChannelFn}
                >
                  <StyledBtn.DeleteIcon fontSize="inherit" />
                </StyledBtn.MuiIconBtn>
              </Tooltip>
            </div>
            {/* {(copyChannelFn) && (
              <button
                type="button"
                className="btn-close"
                style={{ right: "25px", top: '-2px' }}
                aria-label="copy"
                onClick={copyChannelFn}>
                <i class="bi bi-copy" />
              </button>
            )}
            <button
              type="button"
              className="btn-close btn-close-sm"
              aria-label="close"
              onClick={removeChannelFn}
            >
              <i class="bi bi-trash3-fill" />
            </button> */}
          </AccordionSummary>
          <AccordionDetails>
            <div className="row">
              <div className="col-md mb-3">
                <label className="form-label required">
                  Signal or Contrast Mechanism
                </label>
                <Select
                  options={filteredOptions.getChannelSignalContrastMechanisms(form)}
                  aria-label="Select Signal or Contrast Mechanism"
                  placeholder="Select Signal or Contrast Mechanism"
                  id="signalOrContrastMechanism"
                  onChange={(props) => {
                    handleChannelChangeFn({
                      value: props,
                      name: 'signalOrContrastMechanism',
                      id: 'signalOrContrastMechanism'
                    })}
                  }
                  value={channelVal?.signalOrContrastMechanism}
                  required
                  isClearable
                />
              </div>
              <div className="col-md mb-3">
                <label className="form-label required">
                  Stain
                </label>
                <Select
                  options={
                    displayFieldOptions?.stain ? displayFieldOptions?.stain : filteredOptions.getChannelStains(form)
                  }
                  aria-label="Select Stain"
                  placeholder="Select Stain"
                  id="stain"
                  onChange={(props) => handleChannelChangeFn({
                    value: props,
                    name: 'stain',
                  })}
                  value={channelVal.stain}
                  required
                />
              </div>
              {
                (channelVal?.stain?.value === "Other") && (
                  <div
                    className="col-md mb-3"
                  >
                    <label className="form-label required">
                      Other Stain
                    </label>
                    <input
                      className="form-control"
                      id={`otherStain-${uniqueChannelId}`}
                      name={`otherStain-${uniqueChannelId}`}
                      placeholder="Enter stain value"
                      onChange={(e) => handleValueChange(e)}
                      value={channelVal.otherStain}
                      required
                    />
                  </div>
                )
              }
              
              <div className="mb-3">
                <label className="form-label required">
                  Molecular Entity
                </label>
                {
                  (displayFormFields?.channel?.molecularEntity?.tooltipText) && (
                    <Tooltip
                      title={displayFormFields?.channel?.molecularEntity?.tooltipText || ""}
                    >
                      <IconButton>
                        <InfoIcon color="primary" />
                      </IconButton>
                    </Tooltip>
                  )
                }
                {(displayFormFields?.channel?.molecularEntity?.inputType === 'SHORT_TEXT') ? 
                (
                  <input
                    className="form-control"
                    name={`molecularEntity-${uniqueChannelId}`}
                    placeholder={displayFormFields?.channel?.molecularEntity?.placeholder}
                    required
                    onChange={(props) => handleChannelChangeFn({
                      ...props,
                      value: props?.target?.value,
                      name: 'molecularEntity'})}
                    value={channelVal.molecularEntity}
                  />
                ) : (
                  <textarea
                    className="form-control"
                    name={`molecularEntity-${uniqueChannelId}`}
                    placeholder={displayFormFields?.channel?.molecularEntity?.placeholder}
                    required
                    onChange={(props) => handleChannelChangeFn({
                      ...props,
                      value: props?.target?.value,
                      name: 'molecularEntity'})}
                    value={channelVal.molecularEntity}
                  />
                )}
                    
              </div>
              {
                (displayFormFields?.channel?.proteinOfInterest)
                && (
                  <UniProtView
                    form={form}
                    setForm={setForm}
                    fieldName={`proteinOfInterest-${uniqueChannelId}`}
                    handleChannelChangeFn={handleChannelChangeFn}
                    channelVal={channelVal}
                    channelIndex={channelIndex}
                  />
                )
              }
              {children}
            </div>
          </AccordionDetails>
        </Accordion>
      </>
    );
}

export default ChannelView;
