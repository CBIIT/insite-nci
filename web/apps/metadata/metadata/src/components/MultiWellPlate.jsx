import React, { useEffect, useState } from "react";
import Select from "react-select";
// import Accordion from "react-bootstrap/Accordion";
import {
  Accordion,
  AccordionSummary, 
  AccordionDetails, 
  Typography,
  Tooltip, IconButton 
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoIcon from "@mui/icons-material/Info";
import options from "../options.json";
import { filteredOptions, safeClone } from "../utils";
import ChannelView from "./Channel.jsx";
import { 
  defaultChannel
} from "../form.js";
import * as StyledBtn from './buttons.styled';
import PlateValidation from "./validation/PlateValidation.jsx";
import OmeroIdInputViwe from '../sections/suggestion/SuggestionController';

const PlateAccordianView = ({
  children
}) => {
  const [expanded, setExpanded] = useState(true);
  function onToggle (){
    setExpanded(!expanded);
  }
  return (
    <Accordion expanded={expanded} onChange={onToggle}>
      {children}
    </Accordion>
  )
};

const isDisplayFormField = (field, displayConfiguration) => {
  if (!displayConfiguration) {
    return true;
  }
  const wellObj = displayConfiguration?.multiwell || {};
  if (wellObj[field]?.display === "Add" || wellObj[field]?.display === "Required") {
      return true;
    }
  return false;
}

const MutiWellPlateView = ({
  form,
  mergeForm,
  plateId,
  withConfirmation,
  downloadExcelMetadata,
  importExcelMetadata,
  displayFormFields,
  displayFieldOptions,
  optionalFeatures,
}) => {
  // console.log(displayFormFields);
  function handleMultiwellPlateChange(multiwellPlateIndex, name, value) {
    const newMultiwellPlates = [...form.multiwellPlates];
    const newMultiwellPlate = newMultiwellPlates[multiwellPlateIndex];
    newMultiwellPlate[name] = value;
    mergeForm({ multiwellPlates: newMultiwellPlates });
  }

  function addMultiwellChannel(multiwellPlateIndex) {
    const channels = form.multiwellPlates[multiwellPlateIndex].channels;
    const newChannel = safeClone(defaultChannel);
    const newChannels = [...channels, newChannel];
    handleMultiwellPlateChange(multiwellPlateIndex, "channels", newChannels);
  }

  function copyChannel(multiwellPlateIndex, channel) {
    const copyChannel = safeClone(channel);
    const allChannels = [...form.multiwellPlates[multiwellPlateIndex].channels, copyChannel];
    handleMultiwellPlateChange(multiwellPlateIndex, "channels", allChannels);
  }

  function handleMultiwellChannelChange(multiwellPlateIndex, channelIndex, name, value) {
    const newChannels = [...form.multiwellPlates[multiwellPlateIndex].channels];
    newChannels[channelIndex][name] = value;
    handleMultiwellPlateChange(multiwellPlateIndex, "channels", newChannels);
  }

  function handleOmeroIdChange (multiwellPlateIndex, name, id) {
      const updateForm = safeClone(form);
      const updataPlate = updateForm.multiwellPlates[multiwellPlateIndex];
      updataPlate['id'] = id;
      updataPlate['plateName'] = name;
      mergeForm(updateForm);
    }

  function removeMultiwellPlate(multiwellPlateIndex) {
    const newMultiwellPlates = [...form.multiwellPlates].filter((e, i) => i !== multiwellPlateIndex);
    mergeForm({ multiwellPlates: newMultiwellPlates });
  }

  function removeMultiwellChannel(multiwellPlateIndex, channelIndex) {
    const channels = form.multiwellPlates[multiwellPlateIndex].channels;
    const newChannels = channels.filter((e, i) => i !== channelIndex);
    handleMultiwellPlateChange(multiwellPlateIndex, "channels", newChannels);
  }

  function InfoTooltip() {
    return (
      <Tooltip
        title={
          <div>
            <Typography variant="body2">• Only Numeric</Typography>
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

  return (
    <>
      {form.multiwellPlates?.map((multiwellPlate, multiwellPlateIndex) => (
        <>
          <PlateValidation plate={multiwellPlate} />
          <PlateAccordianView>
            <AccordionSummary
              sx={{ backgroundColor: 'text.disabled', color: '#fff' }}
              expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }}/>}
            >
              <h2 className="h4 fw-semibold">Multiwell Plate {multiwellPlateIndex + 1}</h2>
              {/* <button
                type="button"
                className="btn-close btn-close-sm"
                aria-label="close"
                onClick={(ev) => withConfirmation(() => removeMultiwellPlate(multiwellPlateIndex))}>
                <i class="bi bi-trash3-fill" />
              </button> */}
              <Tooltip title="Delete">
                <StyledBtn.MuiIconBtn
                  aria-label="delete"
                  size="small"
                  onClick={(ev) => withConfirmation(() => removeMultiwellPlate(multiwellPlateIndex))}
                >
                  <StyledBtn.DeleteIcon fontSize="inherit" />
                </StyledBtn.MuiIconBtn>
              </Tooltip>
            </AccordionSummary>
            <AccordionDetails>
              <div className="row">
                {
            (optionalFeatures?.omeroObjectSuggestion) ? (
              <div style={{
                position: 'relative',
                maxWidth: "450px"
              }}>
                <OmeroIdInputViwe
                  title="Plate ID (Omero Plate ID)"
                  objectTypes={["Plate"]}
                  searchQuery={multiwellPlate.id}
                  handleChange={(id, name) => {
                    // handleMultiwellPlateChange(multiwellPlateIndex, "id", id);
                    // handleMultiwellPlateChange(multiwellPlateIndex, "plateName", name);
                    handleOmeroIdChange(multiwellPlateIndex, name, id)
                  }}
                >
                  <InfoTooltip />
                   <input
                    className="form-control"
                    type="number"
                    id={`multiwellPlateId-${multiwellPlateIndex}`}
                    name={`multiwellPlateId-${multiwellPlateIndex}`}
                    placeholder="Enter Omero Plate ID"
                    onChange={(ev) => handleMultiwellPlateChange(multiwellPlateIndex, "id", ev.target.value)}
                    value={multiwellPlate.id}
                  />
                </OmeroIdInputViwe>
              </div>
            ) : (
              <div className="col-md mb-3">
                <label className="form-label" htmlFor={`multiwellPlateId-${multiwellPlateIndex}`}>
                  Plate ID (Omero Plate ID)
                </label>
                <InfoTooltip />
                <input
                  className="form-control"
                  type="number"
                  id={`multiwellPlateId-${multiwellPlateIndex}`}
                  name={`multiwellPlateId-${multiwellPlateIndex}`}
                  placeholder="Enter Omero Plate ID"
                  onChange={(ev) => handleMultiwellPlateChange(multiwellPlateIndex, "id", ev.target.value)}
                  value={multiwellPlate.id}
                />
              </div>
            )}
                <div className="col-md mb-3">
                  <label className="form-label" htmlFor={`multiwellPlateId-${multiwellPlateIndex}`}>
                    Plate Name
                  </label>
                  <input
                    className="form-control"
                    type="text"
                    id={`multiwellPlateId-${multiwellPlateIndex}`}
                    name={`multiwellPlateId-${multiwellPlateIndex}`}
                    placeholder="Enter Plate Name"
                    onChange={(ev) => handleMultiwellPlateChange(multiwellPlateIndex, "plateName", ev.target.value)}
                    value={multiwellPlate.plateName}
                  />
                </div>
                <div className="col-md mb-3">
                  <label
                    className="form-label required"
                    htmlFor={`multiwellPlateDimensions-${multiwellPlateIndex}`}>
                    Plate Type
                  </label>
                  <Select
                    options={options.multiwellPlateTypes}
                    aria-label="Select Plate Type"
                    placeholder="Select Plate Type"
                    onChange={(v) => handleMultiwellPlateChange(multiwellPlateIndex, "dimensions", v)}
                    value={form.multiwellPlates[multiwellPlateIndex].dimensions}
                    required
                  />
                </div>
              </div>
              <div className="row">
              </div>
              <div className="row">
                <div className="col-md mb-3">
                  <label
                    className="form-label"
                    htmlFor={`multiWellBiosample-${multiwellPlateIndex}`}>
                    Biosample
                  </label>
                  <Select
                    options={filteredOptions.getPlateBiosamples(form)}
                    aria-label="Select default biosample"
                    placeholder="Select default biosample"
                    onChange={(v) => handleMultiwellPlateChange(multiwellPlateIndex, "biosample", v)}
                    value={form.multiwellPlates[multiwellPlateIndex].biosample}
                    isClearable
                  />
                </div>
                <div className="col-md mb-3">
                  <label
                    className="form-label"
                    htmlFor={`multiwellPlateCaseId-${multiwellPlateIndex}`}>
                    Case ID
                  </label>
                  <input
                    className="form-control"
                    type="text"
                    id={`multiwellPlateCaseId-${multiwellPlateIndex}`}
                    name={`multiwellPlateCaseId-${multiwellPlateIndex}`}
                    placeholder="Enter Case ID"
                    onChange={(ev) =>
                      handleMultiwellPlateChange(multiwellPlateIndex, "caseId", ev.target.value)
                    }
                    value={form.multiwellPlates[multiwellPlateIndex].caseId}
                  />
                </div>
                {
                  (isDisplayFormField("experimentalStatus", displayFormFields))
                    && (
                      <div className="col-md mb-3">
                        <label
                          className="form-label"
                          htmlFor={`multiWellSpecimenType-${multiwellPlateIndex}`}>
                          Experimental Status
                        </label>
                        <Select
                          options={options.specimenTypes}
                          aria-label="Select Specimen Type"
                          placeholder="Select Test, Control or N/A"
                          onChange={(v) => handleMultiwellPlateChange(multiwellPlateIndex, "specimenType", v)}
                          value={form.multiwellPlates[multiwellPlateIndex].specimenType}
                          isClearable
                        />
                      </div>
                  )
                }
              </div>
              <div className="row">
                {
                  (isDisplayFormField("preparationMethod", displayFormFields))
                  && (
                    <div className="col-md mb-3">
                      {/* Note that lcpg does not have any preparation methods, this field is not required */}
                      <label className="form-label" htmlFor={`multiWellPreparationMethod-${multiwellPlateIndex}`}>
                        Preparation Method
                      </label>
                      <Select
                        multiple
                        options={
                          displayFieldOptions?.preparationMethod ? displayFieldOptions?.preparationMethod : filteredOptions.getSpecimenPreparationMethods(form)
                        }
                        aria-label="Select Default Preparation Method"
                        placeholder="Select default preparation method"
                        onChange={(v) => handleMultiwellPlateChange(multiwellPlateIndex, "preparationMethod", v)}
                        value={form.multiwellPlates[multiwellPlateIndex].preparationMethod}
                        isClearable
                      />
                    </div>
                  )
                }
                {
                  (isDisplayFormField("otherPreparationDetails", displayFormFields))
                  && (
                    <div className="col-md mb-3">
                      <label className="form-label" htmlFor={`multiWellPreparationDetails-${multiwellPlateIndex}`}>
                        Other Preparation Details
                      </label>
                      <textarea
                        rows="1"
                        className="form-control"
                        id={`multiWellPreparationDetails-${multiwellPlateIndex}`}
                        name={`multiWellPreparationDetails-${multiwellPlateIndex}`}
                        placeholder="Enter other preparation details (e.g. FRAP)"
                        onChange={(ev) =>
                          handleMultiwellPlateChange(multiwellPlateIndex, "preparationDetails", ev.target.value)
                        }
                        value={form.multiwellPlates[multiwellPlateIndex].preparationDetails}
                      />
                    </div>
                  )
                }
              </div>
              <div className="row">
                {
                  (isDisplayFormField("intrinsicVariables", displayFormFields))
                  && (
                   <div className="col-md mb-3">
                     <label className="form-label" htmlFor={`multiWellIntrinsicVariables-${multiwellPlateIndex}`}>
                       Intrinsic Variables
                     </label>
                     <textarea
                       rows="3"
                       className="form-control"
                       name={`multiWellIntrinsicVariables-${multiwellPlateIndex}`}
                       id={`multiWellIntrinsicVariables-${multiwellPlateIndex}`}
                       placeholder="Enter any relevant intrinsic alterations (e.g. genetic mutation, genotype, phenotype)"
                       onChange={(ev) =>
                         handleMultiwellPlateChange(multiwellPlateIndex, "intrinsicVariables", ev.target.value)
                       }
                       value={form.multiwellPlates[multiwellPlateIndex].intrinsicVariables}
                     />
                   </div>
                  )
                }
                {
                  (isDisplayFormField("extrinsicVariables", displayFormFields))
                  && (
                    <div className="col-md mb-3">
                      <label className="form-label" htmlFor={`multiWellExtrinsicVariables-${multiwellPlateIndex}`}>
                        Extrinsic Variables - Experimental Treatment
                      </label>
                      <textarea
                        rows="3"
                        className="form-control"
                        name={`multiWellExtrinsicVariables-${multiwellPlateIndex}`}
                        id={`multiWellExtrinsicVariables-${multiwellPlateIndex}`}
                        placeholder="Enter experimental treatments to which the biospecimen was exposed (e.g. reagents such as siRNA, chemical compounds, drugs etc)"
                        onChange={(ev) =>
                          handleMultiwellPlateChange(multiwellPlateIndex, "extrinsicVariables", ev.target.value)
                        }
                        value={form.multiwellPlates[multiwellPlateIndex].extrinsicVariables}
                      />
                    </div>
                  )
                }
              </div>
                {multiwellPlate.channels.map((channel, channelIndex) => (
                  <ChannelView
                    key={`multiwell-channel-view-${multiwellPlateIndex}-${channelIndex}`}
                    form={form}
                    displayFormFields={displayFormFields}
                    displayFieldOptions={displayFieldOptions}
                    channelIndex={channelIndex}
                    copyChannelFn={(ev) => {
                      ev.stopPropagation();
                      copyChannel(
                        multiwellPlateIndex,
                        channel
                      )
                    }}
                    removeChannelFn={
                      () => withConfirmation(() => removeMultiwellChannel(multiwellPlateIndex, channelIndex))
                    }
                    channelVal={channel}
                    handleChannelChangeFn={(v) => {
                      const { name, value = '' } = v;
                      handleMultiwellChannelChange(
                        multiwellPlateIndex,
                        channelIndex,
                        name,
                        value,
                      )
                    }}
                    uniqueChannelId={`${multiwellPlateIndex}-${channelIndex}`}
                  >
                  </ChannelView>
                ))}
              <div className="d-flex flex-wrap justify-content-between">
                <button
                  type="button"
                  className="btn btn-outline-primary mb-1"
                  onClick={(ev) => addMultiwellChannel(multiwellPlateIndex)}>
                  Add Channel
                </button>
                <div>
                  <button
                    type="button"
                    className="btn btn-outline-primary mb-1 me-1"
                    onClick={ev => downloadExcelMetadata(2 + form.samples?.length + multiwellPlateIndex)}>
                    Download Multiwell Data Template
                  </button>
                  <label className="btn btn-outline-primary mb-1">
                    Upload Multiwell Data
                    <input
                      type="file"
                      className="visually-hidden"
                      onChange={importExcelMetadata}
                      accept=".xlsx"
                    />
                  </label>
                </div>
              </div>
            </AccordionDetails>
          </PlateAccordianView>
        </>
      ))}
    </>
  )
}

export default MutiWellPlateView;
