import React, { useState } from "react";
import Select from "react-select";
// import Accordion from "react-bootstrap/Accordion";
import {
  Accordion,
  AccordionSummary, 
  AccordionDetails, 
  Typography,
  Tooltip,
  IconButton,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import options from "../options.json";
import {
  defaultChannel,
  defaultSpecimen,
} from "../form";
import {
  downloadFile,
  filteredOptions,
  generateMultiwellDataTemplate,
  getTimestamp,
  loadMultiwellData, 
  safeClone,
} from "../utils";
import ChannelView from "./Channel";
import FieldView from "../sections/FormField/FieldView";
import { inputTypes } from "../sections/FormField/FieldTypes";
import * as StyledBtn from './buttons.styled';
import clsx from "clsx";

const displayOmeroImageId = (facilityId) => [8].includes(facilityId);
const hideAddChannelbutton = (facilityId) => [2].includes(facilityId);
const SpecimenAccordianView = ({
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
}

const Specimen = ({
  specimens,
  handleSampleChange,
  copySpecimen,
  displayFormFields,
  withConfirmation,
  form,
  display,
  setForm,
  sampleIndex = 0,
  displayFieldOptions
}) => {
  async function downloadMultiwellDataTemplate(sampleIndex, specimenIndex) {
    const sample = form.samples[sampleIndex];
    const specimen = sample.specimens[specimenIndex];
    const buffer = await generateMultiwellDataTemplate(form, sample, specimen);
    const filename = [form?.imagingFacility?.abbreviation, "multiwell-data-template", getTimestamp(), ".xlsx"]
      .filter(Boolean)
      .join("-")
      .replace(/\s+/g, "-")
      .toLowerCase();
    downloadFile(new Blob([new Uint8Array(buffer)]), filename);
  }

  function InfoTooltip() {
    return (
      <Tooltip
        title={
          <div>
            <Typography>• Refers to OMERO Image/Plate-level object IDs</Typography>
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

  async function uploadMultiwellData(sampleIndex, specimenIndex, ev) {
    const file = ev.target?.files?.[0];
    if (!file) return;
    const multiwellPlateData = await loadMultiwellData(file);
    handleSpecimenChange(sampleIndex, specimenIndex, "multiwellPlateData", multiwellPlateData);
    ev.target.value = null;
  }

  function handleChannelChange(sampleIndex, specimenIndex, channelIndex, name, value) {
    const newChannels = [...form.samples[sampleIndex].specimens[specimenIndex].channels];
    newChannels[channelIndex][name] = value;
    handleSpecimenChange(sampleIndex, specimenIndex, "channels", newChannels);
  }

  function addChannel(sampleIndex, specimenIndex) {
    // new channels should be a clone of the first channel
    const channels = form.samples[sampleIndex].specimens[specimenIndex].channels;
    const newChannel = safeClone(channels[0] || defaultChannel);
    const newChannels = [...channels, newChannel];
    handleSpecimenChange(sampleIndex, specimenIndex, "channels", newChannels);
  }

  function removeChannel(sampleIndex, specimenIndex, channelIndex) {
    const channels = form.samples[sampleIndex].specimens[specimenIndex].channels;
    const newChannels = channels.filter((e, i) => i !== channelIndex);
    handleSpecimenChange(sampleIndex, specimenIndex, "channels", newChannels);
  }

  function removeSpecimen(sampleIndex, specimenIndex) {
    const specimens = form.samples[sampleIndex].specimens;
    const newSpecimens = specimens.filter((e, i) => i !== specimenIndex);
    handleSampleChange(sampleIndex, "specimens", newSpecimens);
  }

  function handleSpecimenChange(sampleIndex, specimenIndex, name, value) {
    const newSpecimens = [...form.samples[sampleIndex].specimens];
    const newSpecimen = newSpecimens[specimenIndex];
    newSpecimen[name] = value;

    // handle special cases - reset dependent fields

    switch (name) {
      case "specimenLocationMethod":
        newSpecimen.multiwellPlateType = "";
        newSpecimen.multiwellPlateCount = "";
        newSpecimen.multiwellPlateChannelCount = "";
        newSpecimen.specimenId = "";
        newSpecimen.plateId = "";
        newSpecimen.wellCoordinates = "";
        newSpecimen.blockId = "";
        newSpecimen.slideId = "";
        newSpecimen.specimenType = "";
        newSpecimen.preparationMethod = "";
        newSpecimen.details = "";
        newSpecimen.channels = [];
        break;
    }

    handleSampleChange(sampleIndex, "specimens", newSpecimens);
  }

  return (
      <>
        {specimens.map((specimen, specimenIndex) => (
          <SpecimenAccordianView>
            <AccordionSummary
              sx={{ backgroundColor: 'text.secondary', color: '#fff' }}
              expandIcon={<ExpandMoreIcon  sx={{ color: '#fff' }} />}
            >
              Specimen {specimenIndex + 1}
              <div>
                <Tooltip title="Copy">
                  <StyledBtn.MuiIconBtn
                    aria-label="copy"
                    size="small"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      copySpecimen(sampleIndex, specimenIndex);
                    }}
                  >
                    <StyledBtn.CopyIcon fontSize="inherit" />
                  </StyledBtn.MuiIconBtn>
                </Tooltip>
                <Tooltip title="Delete">
                  <StyledBtn.MuiIconBtn
                    aria-label="delete"
                    size="small"
                    onClick={(ev) => { ev.stopPropagation(); withConfirmation(() => removeSpecimen(sampleIndex, specimenIndex)) }}
                  >
                    <StyledBtn.DeleteIcon fontSize="inherit" />
                  </StyledBtn.MuiIconBtn>
                </Tooltip>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              {
                (display?.caseID) && (
                  <div className="row">
                    <FieldView
                      inputType={inputTypes.SHORT_TEXT}
                      label="Case ID"
                      fieldName="caseId"
                      fieldId={`${sampleIndex}-${specimenIndex}`}
                      placeholder="Enter Case ID"
                      handleChange={(ev) => handleSpecimenChange(sampleIndex, specimenIndex, "caseId", ev.target.value)}
                      fieldValue={specimen.caseId}
                    />
                  </div>
                )
              }
              <div className="row">
                <div className="col-md mb-3">
                  <label
                    className="form-label required"
                    htmlFor={`specimenLocationMethod-${sampleIndex}-${specimenIndex}`}>
                    Specimen Location Method
                  </label>
                  <Select
                    name={`Specimen Location Method ${sampleIndex +1 }-${specimenIndex +1}`}
                    options={options.specimenLocationMethods}
                    aria-label="Select Specimen Location Method"
                    placeholder="Select Specimen Location Method"
                    onChange={(v) =>
                      handleSpecimenChange(
                        sampleIndex, 
                        specimenIndex, 
                        "specimenLocationMethod", 
                        v,
                      )
                    }
                    value={specimen.specimenLocationMethod}
                    required
                  />
                </div>
                {
                  (display?.specimenID) && (
                    <div
                      className="col-md mb-3"
                      hidden={
                        specimen?.specimenLocationMethod
                        ?.value === "Multiwell plate ID + well coordinates"
                      }
                    >
                      <label
                        className={clsx(
                          'form-label',
                          display?.specimenID?.display === "Required" && 'required',
                        )}
                        htmlFor={`specimenId-${sampleIndex}-${specimenIndex}`}
                      >
                        Specimen ID
                      </label>
                      {
                        (display?.specimenID?.tooltipText) && (
                          <Tooltip
                            title={display?.specimenID?.tooltipText}
                          >
                            <IconButton>
                              <InfoIcon color="primary" />
                            </IconButton>
                          </Tooltip>
                        )
                      }
                      <input
                        className="form-control"
                        id={`specimenId-${sampleIndex}-${specimenIndex}`}
                        name={`specimenId-${sampleIndex}-${specimenIndex}`}
                        placeholder="Enter Specimen ID"
                        onChange={(ev) =>
                          handleSpecimenChange(sampleIndex, specimenIndex, "specimenId", ev.target.value)
                        }
                        value={specimen.specimenId}
                        required={display?.specimenID?.display === "Required"}
                      />
                    </div>
                  )
                }
                {
                  (display?.fileName) && (
                    <div
                      className="col-md mb-3"
                      hidden={
                        specimen?.specimenLocationMethod
                        ?.value === "Multiwell plate ID + well coordinates"
                      }
                    >
                      <label
                        className={clsx(
                          'form-label',
                          'required',
                        )}
                        htmlFor={`specimenId-${sampleIndex}-${specimenIndex}`}
                      >
                        {display?.fileName?.label}
                      </label>
                      {
                        (display?.fileName?.tooltipText) && (
                          <Tooltip
                            title={display?.fileName?.tooltipText}
                          >
                            <IconButton>
                              <InfoIcon color="primary" />
                            </IconButton>
                          </Tooltip>
                        )
                      }
                      <input
                        className="form-control"
                        id={`specimenId-${sampleIndex}-${specimenIndex}`}
                        name={`specimenId-${sampleIndex}-${specimenIndex}`}
                        placeholder="Enter Image File Name"
                        onChange={(ev) =>
                          handleSpecimenChange(sampleIndex, specimenIndex, "fileName", ev.target.value)
                        }
                        value={specimen.fileName}
                        required={display?.fileName?.display === "Required"}
                      />
                    </div>
                  )
                }
                { displayOmeroImageId(form?.imagingFacility?.value) && (
                  <div className="col-md mb-3">
                    <label className="form-label" htmlFor={`sampleId-${sampleIndex}`}>
                      Omero Dataset/Image ID
                    </label>
                    <InfoTooltip />
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      name={`omeroObjectId-${sampleIndex}`}
                      id={`omeroObjectId-${sampleIndex}`}
                      placeholder="Enter Omero Image ID"
                      onChange={(ev) => handleSpecimenChange(sampleIndex, specimenIndex, "omeroObjectId", ev.target.value)}
                      value={specimen?.omeroObjectId}
                    />
                  </div>
                )}
                <div
                  className="col-md mb-3"
                  hidden={
                    specimen?.specimenLocationMethod
                      ?.value !== "Multiwell plate ID + well coordinates"
                  }>
                  <label
                    className="form-label required"
                    htmlFor={`multiwellPlateType-${sampleIndex}-${specimenIndex}`}
                  >
                    Plate Type
                  </label>
                  <Select
                    options={options.multiwellPlateTypes}
                    aria-label="Select Plate Type"
                    placeholder="Select Plate Type"
                    onChange={(v) =>
                      handleSpecimenChange(sampleIndex, specimenIndex, "multiwellPlateType", v)
                    }
                    value={specimen.multiwellPlateType}
                    required={
                      specimen?.specimenLocationMethod
                        ?.value === "Multiwell plate ID + well coordinates"
                    }
                  />
                </div>
              </div>
              <div className="row">
                <div
                  className="col-md mb-3"
                  hidden={
                    specimen?.specimenLocationMethod
                      ?.value !== "Multiwell plate ID + well coordinates"
                  }>
                  <label
                    className="form-label"
                    htmlFor={`multiwellPlateBarCode-${sampleIndex}-${specimenIndex}`}>
                    Plate Barcode
                  </label>
                  <input
                    className="form-control"
                    id={`multiwellPlateBarCode-${sampleIndex}-${specimenIndex}`}
                    name={`multiwellPlateBarCode-${sampleIndex}-${specimenIndex}`}
                    placeholder="Enter Multiwell Plate BarCode"
                    onChange={(ev) =>
                      handleSpecimenChange(
                        sampleIndex,
                        specimenIndex,
                        "multiwellPlateBarCode",
                        ev.target.value
                      )
                    }
                    value={specimen.multiwellPlateBarCode}
                  />
                </div>
              </div>

              <div className="row">
                <div
                  className="col-md mb-3"
                  hidden={
                    specimen?.specimenLocationMethod
                      ?.value !== "Multiwell plate ID + well coordinates"
                  }>
                  <label
                    className="form-label required"
                    htmlFor={`multiwellPlateCount-${sampleIndex}-${specimenIndex}`}>
                    Number of Plates
                  </label>
                  <input
                    className="form-control"
                    type="number"
                    min={1}
                    id={`multiwellPlateCount-${sampleIndex}-${specimenIndex}`}
                    name={`multiwellPlateCount-${sampleIndex}-${specimenIndex}`}
                    placeholder="Enter Number of Plates"
                    onChange={(ev) =>
                      handleSpecimenChange(
                        sampleIndex,
                        specimenIndex,
                        "multiwellPlateCount",
                        ev.target.value
                      )
                    }
                    value={specimen.multiwellPlateCount || ""}
                    required={
                        specimen?.specimenLocationMethod
                        ?.value === "Multiwell plate ID + well coordinates"
                    }
                  />
                </div>

                <div
                  className="col-md mb-3"
                  hidden={
                    specimen?.specimenLocationMethod
                      ?.value !== "Multiwell plate ID + well coordinates"
                  }>
                  <label
                    className="form-label required"
                    htmlFor={`multiwellPlateChannelCount-${sampleIndex}-${specimenIndex}`}>
                    Number of Channels
                  </label>
                  <input
                    className="form-control"
                    type="number"
                    min={1}
                    max={5}
                    id={`multiwellPlateChannelCount-${sampleIndex}-${specimenIndex}`}
                    name={`multiwellPlateChannelCount-${sampleIndex}-${specimenIndex}`}
                    placeholder="Enter Number of Channels"
                    onChange={(ev) =>
                      handleSpecimenChange(
                        sampleIndex,
                        specimenIndex,
                        "multiwellPlateChannelCount",
                        ev.target.value
                      )
                    }
                    value={
                        specimen.multiwellPlateChannelCount || ""
                    }
                    required={
                        specimen?.specimenLocationMethod
                        ?.value === "Multiwell plate ID + well coordinates"
                    }
                  />
                </div>
              </div>

              <div className="row">
                <div
                  className="col-md mb-3"
                  hidden={
                    specimen?.specimenLocationMethod
                      ?.value !== "Block ID + Slide ID"
                  }>
                  <label className="form-label" htmlFor={`blockId-${sampleIndex}-${specimenIndex}`}>
                    Block ID
                  </label>
                  <input
                    className="form-control"
                    id={`blockId-${sampleIndex}-${specimenIndex}`}
                    name={`blockId-${sampleIndex}-${specimenIndex}`}
                    placeholder="Enter Block ID"
                    onChange={(ev) =>
                      handleSpecimenChange(sampleIndex, specimenIndex, "blockId", ev.target.value)
                    }
                    value={specimen.blockId}
                  />
                </div>

                <div
                  className="col-md mb-3"
                  hidden={
                    specimen?.specimenLocationMethod
                      ?.value !== "Block ID + Slide ID"
                  }>
                  <label className="form-label" htmlFor={`slideId-${sampleIndex}-${specimenIndex}`}>
                    Slide ID
                  </label>
                  <input
                    className="form-control"
                    id={`slideId-${sampleIndex}-${specimenIndex}`}
                    name={`slideId-${sampleIndex}-${specimenIndex}`}
                    placeholder="Enter Slide ID"
                    onChange={(ev) =>
                      handleSpecimenChange(sampleIndex, specimenIndex, "slideId", ev.target.value)
                    }
                    value={specimen.slideId}
                  />
                </div>
              </div>

              <div className="row">
                {
                  (display?.experimentalStatus) && (
                    <div className="col-md mb-3" >
                      <label
                        className="form-label"
                        htmlFor={`specimenType-${sampleIndex}-${specimenIndex}`}>
                          Experimental Status
                      </label>
                      <Select
                        options={options.specimenTypes}
                        aria-label="Select Specimen Type"
                        placeholder="Select Test, Control or N/A"
                        onChange={(v) =>
                        handleSpecimenChange(sampleIndex, specimenIndex, "specimenType", v)
                        }
                        value={specimen.specimenType}
                      />
                    </div>
                  )
                }

                {
                  (display?.experimentalTreatment) && (
                    <FieldView
                      inputType={inputTypes.SHORT_TEXT}
                      label="Experimental Treatment"
                      fieldName="experimentalTreatment"
                      fieldId={`${sampleIndex}-${specimenIndex}`}
                      placeholder="Enter experimental treatment"
                      handleChange={(ev) => handleSpecimenChange(sampleIndex, specimenIndex, "experimentalTreatment", ev.target.value)}
                      fieldValue={specimen.experimentalTreatment}
                    />
                  )
                }
              </div>
              <div className="row">
                <div className="col-md mb-3">
                  {/* Note that lcpg does not have any preparation methods, this field is not required */}
                  <label
                    className="form-label required"
                    htmlFor={`preparationMethod-${sampleIndex}-${specimenIndex}`}>
                    Preparation Method
                  </label>
                  <Select
                    multiple
                    name={`Preparation Method ${sampleIndex +1 }-${specimenIndex +1}`}
                    options={displayFieldOptions?.preparationMethod || filteredOptions.getSpecimenPreparationMethods(form)}
                    aria-label="Select Preparation Method"
                    placeholder="Select Preparation Method"
                    onChange={(v) =>
                      handleSpecimenChange(sampleIndex, specimenIndex, "preparationMethod", v)
                    }
                    value={specimen.preparationMethod}
                    required={
                      form.samples[sampleIndex]?.specimens[specimenIndex]?.specimenLocationMethod
                        ?.value !== "Multiwell plate ID + well coordinates"
                    }
                  />
                </div>
                {
                  (display?.otherPrepDetails) && (
                    <FieldView
                      inputType={inputTypes.FREE_TEXT}
                      label="Other Preparation Details"
                      fieldName="preparationDetails"
                      fieldId={`${sampleIndex}-${specimenIndex}`}
                      placeholder="Enter other preparation details (e.g. FRAP)"
                      handleChange={(ev) => handleSpecimenChange(sampleIndex, specimenIndex, "preparationDetails", ev.target.value)}
                      fieldValue={specimen.preparationDetails}
                    />
                  )
                }
              </div>

              <div className="row">
                {
                  (display?.intrinsicVariables) && (
                    <FieldView
                      inputType={inputTypes.FREE_TEXT}
                      label="Intrinsic Variables"
                      fieldName="intrinsicVariables"
                      fieldId={`${sampleIndex}-${specimenIndex}`}
                      placeholder="Enter any relevant intrinsic alterations (e.g. genetic mutation, genotype, phenotype)"
                      handleChange={(ev) => handleSpecimenChange(sampleIndex, specimenIndex, "intrinsicVariables", ev.target.value)}
                      fieldValue={specimen.intrinsicVariables}
                    />
                  )
                }
                {
                  (display?.extrinsicVariables) && (
                    <FieldView
                      inputType={inputTypes.FREE_TEXT}
                      label="Extrinsic Variable - Experimental Treatment"
                      fieldName="extrinsicVariables"
                      fieldId={`${sampleIndex}-${specimenIndex}`}
                      placeholder="Enter experimental treatments to which the biospecimen was exposed (e.g. reagents such as siRNA, chemical compounds, drugs etc)"
                      handleChange={(ev) => handleSpecimenChange(sampleIndex, specimenIndex, "extrinsicVariables", ev.target.value)}
                      fieldValue={specimen.extrinsicVariables}
                    />
                  )
                }
              </div>
              <div className="row">
                {
                  (display?.otherKeyDetails) && (
                    <FieldView
                      inputType={inputTypes.FREE_TEXT}
                      label="Other Key Details"
                      fieldName="details"
                      fieldId={`${sampleIndex}-${specimenIndex}`}
                      placeholder="Enter other details"
                      handleChange={(ev) => handleSpecimenChange(sampleIndex, specimenIndex, "details", ev.target.value)}
                      fieldValue={specimen.details}
                    />
                  )
                }
              </div>
              <div className="row">
                {
                  (display?.specimenPrepDetails) && (
                    <FieldView
                      inputType={inputTypes.SHORT_TEXT}
                      label="Specimen prep details"
                      fieldName="specimenPrepDetails"
                      fieldId={`${sampleIndex}-${specimenIndex}`}
                      placeholder="Enter prep details"
                      handleChange={(ev) => handleSpecimenChange(sampleIndex, specimenIndex, "specimenPrepDetails", ev.target.value)}
                      fieldValue={specimen.cmmSpecimenUID}
                    />
                  )
                }
                {
                  (display?.cmmSpecimenUID) && (
                    <FieldView
                      inputType={inputTypes.SHORT_TEXT}
                      label="CMM specimen UID"
                      fieldName="cmmSpecimenUID"
                      fieldId={`${sampleIndex}-${specimenIndex}`}
                      placeholder="Enter specimen UID"
                      handleChange={(ev) => handleSpecimenChange(sampleIndex, specimenIndex, "cmmSpecimenUID", ev.target.value)}
                      fieldValue={specimen.cmmSpecimenUID}
                    />
                  )
                }
              </div>

              <>
                {specimen.channels.map((channel, channelIndex) => (
                  <ChannelView
                    key={`channel-view-${sampleIndex}-${specimenIndex}-${channelIndex}`}
                    form={form}
                    setForm={setForm}
                    displayFormFields={displayFormFields}
                    displayFieldOptions={displayFieldOptions}
                    parentComponent ='biosample'
                    channelIndex={channelIndex}
                    copyChannelFn={(ev) => {
                      ev.stopPropagation();
                      handleSpecimenChange(
                        sampleIndex,
                        specimenIndex,
                        "channels",
                        [...specimen.channels, safeClone(channel)])
                    }}
                    removeChannelFn={(ev) => {
                      ev.stopPropagation();
                      withConfirmation(() =>
                        removeChannel(sampleIndex, specimenIndex, channelIndex)
                      )
                    }}
                    handleChannelChangeFn={(v) => {
                      const { name, value = '' } = v;
                      // remove id
                      
                      handleChannelChange(
                        sampleIndex,
                        specimenIndex,
                        channelIndex,
                        name,
                        value,
                      )
                    }}
                    channelVal={channel}
                    uniqueChannelId={`${sampleIndex}-${specimenIndex}-${channelIndex}`}
                  >
                  </ChannelView>
                ))}
              </>
              
              <div className="d-flex flex-wrap justify-content-between">
                <div
                  hidden={
                    form.samples[sampleIndex]?.specimens[specimenIndex]?.specimenLocationMethod
                      ?.value !== "Multiwell plate ID + well coordinates"
                  }>
                  <button
                    type="button"
                    className="btn btn-outline-primary mb-1 me-1"
                    onClick={(ev) => downloadMultiwellDataTemplate(sampleIndex, specimenIndex)}>
                    Download Multiwell Data Template
                  </button>
                  <label className="btn btn-outline-primary mb-1 me-1">
                    Upload Multiwell Data
                    <input
                      type="file"
                      className="visually-hidden"
                      onChange={(ev) => uploadMultiwellData(sampleIndex, specimenIndex, ev)}
                      accept=".xlsx"
                    />
                  </label>
                  {form.samples[sampleIndex]?.specimens[specimenIndex]?.multiwellPlateData &&
                    !form.samples[sampleIndex]?.specimens[specimenIndex]?.multiwellPlateData?.error && (
                      <div className="d-inline-block fw-semibold mb-1 me-1">
                        Multiwell Data Loaded Successfully
                      </div>
                    )}
                  {form.samples[sampleIndex]?.specimens[specimenIndex]?.multiwellPlateData &&
                    form.samples[sampleIndex]?.specimens[specimenIndex]?.multiwellPlateData?.error && (
                      <div className="d-inline-block fw-semibold mb-1 me-1 text-danger">
                        Please Ensure Multiwell Data is in Correct Format
                      </div>
                    )}
                </div>
                {(!hideAddChannelbutton(form?.imagingFacility?.value)) && (
                  <button
                    type="button"
                    className="btn btn-outline-primary mb-1"
                    onClick={(ev) => addChannel(sampleIndex, specimenIndex)}
                    disabled={specimen?.samples?.length < 2}
                    hidden={
                      form.samples[sampleIndex]?.specimens[specimenIndex]?.specimenLocationMethod
                        ?.value === "Multiwell plate ID + well coordinates"
                    }>
                    Add Channel
                  </button>
                )}
                
              </div>
            </AccordionDetails>
          </SpecimenAccordianView>
        ))}
      </>
  );
}

export default Specimen;
