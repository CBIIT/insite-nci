import React, { useState } from "react";
import Select from "react-select";
// import Accordion from "react-bootstrap/Accordion";
import {
  Accordion,
  AccordionSummary, 
  AccordionDetails, 
  Typography,
  Tooltip,
  IconButton
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import clsx from "clsx";
import { filteredOptions, safeClone } from "../utils";
import options from "../options.json";
import { defaultSpecimen } from "../form";
import Organism from '../sections/Organism/Organism';
import FieldView from "../sections/FormField/FieldView";
import { inputTypes } from "../sections/FormField/FieldTypes";
import Specimen from "./Specimen";
import * as StyledBtn from './buttons.styled';
import BiosampleValidation from "./validation/SampleValidation";

const SampleAccordianView = ({
  children
}) => {
  const [expanded, setExpanded] = useState(true);
  function onToggle () {
    setExpanded(!expanded);
  }
  
  return (
    <Accordion expanded={expanded} onChange={onToggle}>
      {children}
    </Accordion>
  )
};

// hide omero input to facility 
const hideOmeroInput = [1, 2];

const BiosampleView = ({
  form,
  setForm,
  mergeForm,
  withConfirmation,
  displayFormFields = undefined,
  display,
  displayFieldOptions = {},
  omeroObjectId,
  imageId
}) => {

  const facilityId = form?.imagingFacility?.value || null;

  function InfoTooltip() {
    return (
      <Tooltip
        title={
          <div>
            <Typography>• Refers to OMERO Dataset/Plate-level object IDs</Typography>
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

  function handleSampleChange(sampleIndex, name, value) {
    const newSamples = [...form.samples];
    const newSample = newSamples[sampleIndex];
    newSample[name] = value;
    // handle special cases - reset dependent fields
    switch (name) {
      case "organism":
        newSample.organismOther = "";
        newSample.gemStrain = "";
        newSample.speciesOrStrain = "";
        newSample.sampleType = "";
        newSample.cellLine = "";
        newSample.tissueType = "";
        newSample.tissueSite = "";
        newSample.tissueSubsite = "";
        newSample.tissueHealthStatus = "";
        newSample.tissueHistology = "";
        newSample.tissueHistologyBehavior = "";
        newSample.otherDiseaseOrCondition = "";
        break;
      case "sampleType":
        newSample.cellLine = "";
        newSample.tissueType = "";
        newSample.tissueSite = "";
        newSample.tissueSubsite = "";
        newSample.tissueHealthStatus = "";
        newSample.tissueHistology = "";
        newSample.tissueHistologyBehavior = "";
        newSample.otherDiseaseOrCondition = "";
        break;
      case "tissueSite":
        newSample.tissueSubsite = "";
        newSample.tissueHealthStatus = "";
        newSample.tissueHistology = "";
        newSample.tissueHistologyBehavior = "";
        newSample.otherDiseaseOrCondition = "";
        break;
      case "tissueSubsite":
        newSample.tissueHealthStatus = "";
        newSample.tissueHistology = "";
        newSample.tissueHistologyBehavior = "";
        newSample.otherDiseaseOrCondition = "";
        break;
      case "tissueHealthStatus":
        newSample.tissueHistology = "";
        newSample.tissueHistologyBehavior = "";
        newSample.otherDiseaseOrCondition = "";
        break;
      case "tissueHistology":
        newSample.tissueHistologyBehavior = "";
        break;
    }
    mergeForm({ samples: newSamples });
  }

  function addSpecimen(sampleIndex) {
    const specimens = form.samples[sampleIndex].specimens;
    const newSpecimen = safeClone(defaultSpecimen);
    // new specimens should clone specific fields from the first specimen
    const clonedFields = ["specimenLocationMethod", "specimenType", "preparationMethod"];
    
    if (specimens.length > 0) {
      for (const field of clonedFields) {
        newSpecimen[field] = specimens[0][field];
      }
    }
    const newSpecimens = [...specimens, newSpecimen];
    newSpecimen.omeroObjectId = imageId;
    handleSampleChange(sampleIndex, "specimens", newSpecimens);
  }

  function copySpecimen(sampleIndex, specimenIndex) {
    const specimens = form.samples[sampleIndex].specimens;
    const cloneSpecimen = safeClone(specimens[specimenIndex]);
    const newSpecimens = [...specimens, cloneSpecimen];
    handleSampleChange(sampleIndex, "specimens", newSpecimens);
  }

  function removeSample(sampleIndex) {
    const newSamples = [...form.samples].filter((e, i) => i !== sampleIndex);
    mergeForm({ samples: newSamples });
  };

  return (
    <>
      {form.samples?.map((sample, sampleIndex) => (
        <>
        <BiosampleValidation sample={sample} />
        <SampleAccordianView>
          <AccordionSummary
            sx={{ backgroundColor: 'success.main', color: '#fff' }}
            expandIcon={<ExpandMoreIcon  sx={{ color: '#fff' }}/>}
          >
            <h2 className="h4 fw-semibold">Biosample {sampleIndex + 1} </h2>
            <div>
              <Tooltip title="Copy">
                <StyledBtn.MuiIconBtn
                  aria-label="copy"
                  size="small"
                  onClick={(ev) => { ev.stopPropagation(); mergeForm({ samples: [...form.samples, safeClone(sample)] }) }}
                >
                  <StyledBtn.CopyIcon fontSize="inherit" />
                </StyledBtn.MuiIconBtn>
              </Tooltip>
              <Tooltip title="Delete">
                <StyledBtn.MuiIconBtn
                  aria-label="delete"
                  size="small"
                  onClick={(ev) => { ev.stopPropagation(); withConfirmation(() => removeSample(sampleIndex)) }}
                >
                  <StyledBtn.DeleteIcon fontSize="inherit" />
                </StyledBtn.MuiIconBtn>
              </Tooltip>
            </div>
          </AccordionSummary>
          <AccordionDetails>
            <div className="row">
              <div className="col-md mb-3">
                <label className="form-label required" htmlFor={`sampleId-${sampleIndex}`}>
                  Biosample Name or Id
                </label>
                <input
                  type="text"
                  className="form-control"
                  name={`sampleId-${sampleIndex}`}
                  data-label={`Biosample Name or Id-${sampleIndex + 1}`}
                  id={`sampleId-${sampleIndex}`}
                  placeholder="Enter Biosample Name or Id"
                  onChange={(ev) => handleSampleChange(sampleIndex, "sampleId", ev.target.value)}
                  value={form.samples[sampleIndex].sampleId}
                  required
                />
              </div>

              {
                (!hideOmeroInput.includes(facilityId)) && (
                  <div className="col-md mb-3">
                    <label className="form-label" htmlFor={`sampleId-${sampleIndex}`}>
                      Omero Dataset ID
                    </label>
                    <InfoTooltip />
                    <input
                      type="number"
                      className="form-control"
                      name={`omeroObjectId-${sampleIndex}`}
                      id={`omeroObjectId-${sampleIndex}`}
                      placeholder="Enter Omero Dataset ID"
                      min="0"
                      onChange={(ev) => handleSampleChange(sampleIndex, "omeroObjectId", ev.target.value)}
                      value={form.samples[sampleIndex].omeroObjectId}
                    />
                  </div>
                )
              }
              {/* {
                (displayFormFields?.biosample?.imageID) && (
                  <div className="col-md mb-3">
                    <label className="form-label" htmlFor={`sampleId-${sampleIndex}`}>
                      Image ID
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name={`sampleId-${sampleIndex}`}
                      id={`sampleId-${sampleIndex}`}
                      placeholder="Enter Omero image ID"
                      onChange={(ev) => handleSampleChange(sampleIndex, "imageID", ev.target.value)}
                      value={form.samples[sampleIndex].imageID}
                      required
                    />
                  </div>
                )
              } */}

              <div className="col-md mb-3">
                <label className="form-label required" htmlFor={`sampleDescription-${sampleIndex}`}>
                  Biosample Description
                </label>
                <input
                  className="form-control"
                  name={`sampleDescription-${sampleIndex}`}
                  data-label={`Biosample Description-${sampleIndex + 1}`}
                  id={`sampleDescription-${sampleIndex}`}
                  placeholder="Enter Biosample Description"
                  onChange={(ev) => handleSampleChange(sampleIndex, "sampleDescription", ev.target.value)}
                  value={form.samples[sampleIndex].sampleDescription}
                  required
                />
              </div>
            </div>

            <div className="row">
              <Organism
                form={form}
                display={display}
                sampleIndex={sampleIndex}
                handleSampleChange={handleSampleChange}
                displayFieldOptions={displayFieldOptions}
              />
              <div
                className="col-md mb-3"
                hidden={
                  (displayFormFields && !displayFormFields?.biosample?.sampleType)
                  || ["Bacteria", "Yeast"].includes(form?.samples[sampleIndex]?.organism?.value)
                }
              >
                <label
                  className="form-label required"
                  htmlFor={`sampleType-${sampleIndex}`}
                >
                  Biosample Type
                </label>
                <Select
                  options={
                    displayFieldOptions?.biosampleType
                      ? displayFieldOptions?.biosampleType : options.sampleTypes
                  }
                  name={`Biosample Type-${sampleIndex + 1}`}
                  data-label={`Biosample Type-${sampleIndex + 1}`}
                  aria-label="Select Biosample Type"
                  placeholder="Select Biosample Type"
                  onChange={(value) => handleSampleChange(sampleIndex, "sampleType", value)}
                  value={sample?.sampleType}
                  required={
                    !["Bacteria", "Yeast"].includes(form?.samples[sampleIndex]?.organism?.value)
                  }
                />
              </div>
            </div>
            

            <div className="row">
              <div className="col-md mb-3" hidden={form?.samples[sampleIndex]?.organism?.value !== "Other"}>
                <label className="form-label required" htmlFor={`organismOther-${sampleIndex}`}>
                  Organism (Other)
                </label>
                <input
                  className="form-control"
                  id={`organismOther-${sampleIndex}`}
                  name={`organismOther-${sampleIndex}`}
                  data-label={`Organism Other -${sampleIndex + 1}`}
                  placeholder="Enter Organism"
                  required={sample?.organism?.value === "Other"}
                  onChange={(ev) => handleSampleChange(sampleIndex, "organismOther", ev.target.value)}
                  value={form.samples[sampleIndex].organismOther}
                />
              </div>

              <div
                className="col-md mb-3"
                hidden={form?.samples[sampleIndex]?.organism?.value !== "GEM (Genetically modified mouse)"}>
                <label className="form-label required" htmlFor={`gemStrain-${sampleIndex}`}>
                  GEM Model/Strain
                </label>
                <input
                  className="form-control"
                  id={`gemStrain-${sampleIndex}`}
                  name={`gemStrain-${sampleIndex}`}
                  data-label={`GEM Model/Strain-${sampleIndex + 1}`}
                  placeholder="Enter GEM Strain"
                  // required={
                  //   form?.samples[sampleIndex]?.organism?.value === "GEM (Genetically modified mouse)"
                  // }
                  onChange={(ev) => handleSampleChange(sampleIndex, "gemStrain", ev.target.value)}
                  value={form.samples[sampleIndex].gemStrain}
                />
              </div>

              <div
                className="col-md mb-3"
                hidden={
                  (displayFormFields && !displayFormFields?.biosample?.tissueType) ||
                    !(
                      form?.samples[sampleIndex]?.organism?.value === "GEM (Genetically modified mouse)" &&
                      form?.samples[sampleIndex]?.sampleType?.value === "Tissue"
                  )
                }>
                <label className="form-label" htmlFor={`tissueType-${sampleIndex}`}>
                  GEM Tissue Type
                </label>
                <Select
                  options={options.tissueTypes}
                  name={`tissueType-${sampleIndex}`}
                  data-label={` GEM Tissue Type -${sampleIndex + 1}`}
                  aria-label="Select GEM Details"
                  placeholder="Select GEM Details"
                  onChange={(value) => handleSampleChange(sampleIndex, "tissueType", value)}
                  value={form.samples[sampleIndex].tissueType}
                />
              </div>

              <div
                className="col-md mb-3"
                hidden={
                  (displayFormFields && !displayFormFields?.biosample?.speciesStrain) ||
                  ["Human", "GEM (Genetically modified mouse)"].includes(
                    form?.samples[sampleIndex]?.organism?.value)
                }
              >
                <label
                  className={clsx("form-label")}
                  htmlFor={`speciesOrStrain-${sampleIndex}`}
                >
                  Species/Strain
                </label>
                <input
                  className="form-control"
                  id={`speciesOrStrain-${sampleIndex}`}
                  name={`speciesOrStrain-${sampleIndex}`}
                  data-label={`Species/Strain -${sampleIndex+1}`}
                  placeholder="Enter Species/Strain"
                  // required={
                  //   (displayFormFields && !displayFormFields?.biosample?.speciesStrain) && 
                  //   !["Human", "GEM (Genetically modified mouse)"].includes(
                  //     form?.samples[sampleIndex]?.organism?.value
                  //   )
                  // }
                  onChange={(ev) => handleSampleChange(sampleIndex, "speciesOrStrain", ev.target.value)}
                  value={form.samples[sampleIndex].speciesOrStrain}
                />
              </div>

              <div
                className="col-md mb-3"
                hidden={!["Embryo"].includes(form?.samples[sampleIndex]?.sampleType?.value)}
              >
                <label className="form-label required" htmlFor={`embryoStage-${sampleIndex}`}>
                  Embryo Stage
                </label>

                <input
                  className="form-control"
                  name={`embryoStage-${sampleIndex}`}
                  data-label={`Embryo Stage -${sampleIndex+1}`}
                  id={`embryoStage-${sampleIndex}`}
                  placeholder="Enter Embryo Stage"
                  onChange={(ev) => handleSampleChange(sampleIndex, "embryoStage", ev.target.value)}
                  value={form.samples[sampleIndex].embryoStage}
                />
              </div>
            </div>

            <div className="row">
              <div
                className="col-md mb-3"
                hidden={!["Cell Line"].includes(form?.samples[sampleIndex]?.sampleType?.value)}
              >
                <label className="form-label required" htmlFor={`cellLine-${sampleIndex}`}>
                  Cell Line
                </label>
                {displayFieldOptions?.cellLine ?
                  (
                    <Select
                      options={displayFieldOptions?.cellLine}
                      aria-label="Select Cell Line Type"
                      placeholder="Select Cell Line Typee"
                      value={form.samples[sampleIndex].cellLine}
                      onChange={(v) => {
                        handleSampleChange(sampleIndex, "cellLine", v)}
                      }
                      name={`cellLine-${sampleIndex}`}
                      data-label={`Cell Line -${sampleIndex+1}`}
                      required={["Cell Line"].includes(form?.samples[sampleIndex]?.sampleType?.value)}
                    />
                  ) : (
                    <input
                      className="form-control"
                      id={`cellLine-${sampleIndex}`}
                      name={`cellLine-${sampleIndex}`}
                      placeholder="Enter Cell Line"
                      data-label={`Cell Line -${sampleIndex+1}`}
                      required={["Cell Line"].includes(form?.samples[sampleIndex]?.sampleType?.value)}
                      onChange={(ev) => handleSampleChange(sampleIndex, "cellLine", ev.target.value)}
                      value={form.samples[sampleIndex].cellLine}
                    />
                  )
                }
              </div>
            </div>

            <div className="row">
              {form?.samples[sampleIndex]?.sampleType?.value === "Tissue" &&
                options?.organismTypes.humans.includes(form?.samples[sampleIndex]?.organism?.value) && (
                  <>
                    <div className="col-md mb-3">
                      <label className="form-label required" htmlFor={`tissueSite-${sampleIndex}`}>
                        Tissue Site
                      </label>
                      <Select
                        options={options.tissueSites}
                        name={`tissueSite-${sampleIndex}`}
                        data-label={`Tissue Site -${sampleIndex+1}`}
                        aria-label="Select Tissue Site"
                        placeholder="Select Tissue Site"
                        onChange={(value) => handleSampleChange(sampleIndex, "tissueSite", value)}
                        value={form.samples[sampleIndex].tissueSite}
                        required={form?.samples[sampleIndex]?.sampleType?.value === "Tissue"}
                      />
                    </div>

                    <div
                      className="col-md mb-3"
                    >
                      <label className="form-label required" htmlFor={`tissueSubsite-${sampleIndex}`}>
                        Tissue Subsite
                      </label>
                      <Select
                        options={filteredOptions.getTissueSubsites(form?.samples[sampleIndex])}
                        name={`tissueSubsite-${sampleIndex}`}
                        data-label={`Tissue Subsite -${sampleIndex+1}`}
                        aria-label="Select Tissue Subsite"
                        placeholder="Select Tissue Subsite"
                        onChange={(value) => handleSampleChange(sampleIndex, "tissueSubsite", value)}
                        value={form.samples[sampleIndex].tissueSubsite}
                      />
                    </div>
                  </>
                )}

              {options?.organismTypes.rodentsAndRabbits.includes(
                form?.samples[sampleIndex]?.organism?.value
              ) && (
                  <>
                    <div
                      className="col-md mb-3"
                      hidden={form?.samples[sampleIndex]?.sampleType?.value !== "Tissue"}>
                      <label className="form-label required" htmlFor={`tissueSite-${sampleIndex}`}>
                        Organ Group
                      </label>
                      <Select
                        options={options.nonHumanTissueSites}
                        name={`tissueSite-${sampleIndex}`}
                        data-label={`Organ Group -${sampleIndex+1}`}
                        aria-label="Select Organ Group"
                        placeholder="Select Organ Group"
                        onChange={(value) => handleSampleChange(sampleIndex, "tissueSite", value)}
                        value={form.samples[sampleIndex].tissueSite}
                        required={form?.samples[sampleIndex]?.sampleType?.value === "Tissue"}
                      />
                    </div>

                    <div
                      className="col-md mb-3"
                      hidden={form?.samples[sampleIndex]?.sampleType?.value !== "Tissue"}>
                      <label className="form-label" htmlFor={`tissueSubsite-${sampleIndex}`}>
                        Organ/Tissue
                      </label>
                      <Select
                        options={filteredOptions.getNonHumanTissueSubsites(form?.samples[sampleIndex])}
                        name={`tissueSubsite-${sampleIndex}`}
                        aria-label="Select Organ/Tissue"
                        placeholder="Select Organ/Tissue"
                        onChange={(value) => handleSampleChange(sampleIndex, "tissueSubsite", value)}
                        value={form.samples[sampleIndex].tissueSubsite}
                      />
                    </div>
                  </>
                )}

              {options?.organismTypes.others.includes(form?.samples[sampleIndex]?.organism?.value) && (
                <div
                  className="col-md mb-3"
                  hidden={form?.samples[sampleIndex]?.sampleType?.value !== "Tissue"}>
                  <label className="form-label required" htmlFor={`tissueSite-${sampleIndex}`}>
                    Organ/Tissue/Site
                  </label>
                  <input
                    className="form-control"
                    id={`tissueSite-${sampleIndex}`}
                    name={`tissueSite-${sampleIndex}`}
                    data-label={`Organ/Tissue/Site -${sampleIndex+1}`}
                    placeholder="Enter Organ/Tissue/Site"
                    required={form?.samples[sampleIndex]?.sampleType?.value === "Tissue"}
                    onChange={(ev) => handleSampleChange(sampleIndex, "tissueSite", ev.target.value)}
                    value={form.samples[sampleIndex].tissueSite}
                  />
                </div>
              )}
            </div>

            <div className="row">
              <div
                className="col-md mb-3"
                hidden={form?.samples[sampleIndex]?.sampleType?.value !== "Tissue"}>
                <label className="form-label required" htmlFor={`tissueHealthStatus-${sampleIndex}`}>
                  Tissue Health Status
                </label>
                <Select
                  options={options.tissueHealthStatuses}
                  name={`tissueHealthStatus-${sampleIndex}`}
                  data-label={`Tissue Health Status -${sampleIndex+1}`}
                  aria-label="Select Tissue Health Status"
                  placeholder="Select Tissue Health Status"
                  onChange={(value) => handleSampleChange(sampleIndex, "tissueHealthStatus", value)}
                  value={form.samples[sampleIndex].tissueHealthStatus}
                  required={form?.samples[sampleIndex]?.sampleType?.value === "Tissue"}
                />
              </div>
            </div>

            <div className="row">
              <div
                className="col-md mb-3"
                hidden={form?.samples[sampleIndex]?.tissueHealthStatus?.value !== "Other disease/condition"}>
                <label className="form-label required" htmlFor={`otherDiseaseOrCondition-${sampleIndex}`}>
                  Other Disease/Condition
                </label>
                <input
                  className="form-control"
                  id={`otherDiseaseOrCondition-${sampleIndex}`}
                  name={`otherDiseaseOrCondition-${sampleIndex}`}
                  placeholder="Enter Other Disease/Condition"
                  required={form?.samples[sampleIndex]?.organism?.value === "Other disease/condition"}
                  onChange={(ev) =>
                    handleSampleChange(sampleIndex, "otherDiseaseOrCondition", ev.target.value)
                  }
                  value={form.samples[sampleIndex].otherDiseaseOrCondition}
                />
              </div>
            </div>

            <div className="row">
              {
                (display?.coarseInformalTaxonomy) && (
                  <FieldView
                    inputType={inputTypes.SHORT_TEXT}
                    label="Anatomical Origin (NCI thesaurus)"
                    data-label="anatomicalOrigin"
                    fieldId={`${sampleIndex}`}
                    placeholder="Enter Anatomical Origin"
                    handleChange={(ev) => handleSampleChange(sampleIndex, "anatomicalOrigin", ev.target.value)}
                    fieldValue={sample?.anatomicalOrigin}
                  />
                )
              }
              {
                (display?.coarseInformalTaxonomy) && (
                  <FieldView
                    inputType={inputTypes.SHORT_TEXT}
                    label="Coarse / Informal Taxonomy"
                    data-label="coarseInformalTaxonomy"
                    fieldId={`${sampleIndex}`}
                    placeholder="Enter Coarse or Informal Taxonomy"
                    handleChange={(ev) => handleSampleChange(sampleIndex, "coarseInformalTaxonomy", ev.target.value)}
                    fieldValue={sample?.coarseInformalTaxonomy}
                  />
                )
              }
              {
                (display?.cellType) && (
                  <FieldView
                    inputType={inputTypes.SHORT_TEXT}
                    label="Cell Type"
                    data-label="cellType"
                    fieldId={`${sampleIndex}`}
                    placeholder="Enter Cell Type"
                    handleChange={(ev) => handleSampleChange(sampleIndex, "cellType", ev.target.value)}
                    fieldValue={sample?.cellType}
                  />
                )
              }
            </div>

            {form?.samples[sampleIndex]?.tissueHealthStatus?.value === "Neoplasm" && (
              <>
                {options?.organismTypes.humans.includes(form?.samples[sampleIndex]?.organism?.value) && (
                  <>
                    <div className="row">
                      <div
                        className="col-md mb-3"
                        hidden={form?.samples[sampleIndex]?.tissueHealthStatus?.value !== "Neoplasm"}>
                        <label className="form-label required" htmlFor={`tissueHistology-${sampleIndex}`}>
                          Tissue Histology
                        </label>
                        <Select
                          options={filteredOptions.getTissueHistologies(sample)}
                          aria-label="Select Tissue Histology"
                          placeholder="Select Tissue Histology"
                          onChange={(value) => handleSampleChange(sampleIndex, "tissueHistology", value)}
                          value={form.samples[sampleIndex].tissueHistology}
                          required={form?.samples[sampleIndex]?.tissueHealthStatus?.value === "Neoplasm"}
                        />
                      </div>
                      <div
                        className="col-md mb-3"
                        hidden={form?.samples[sampleIndex]?.tissueHealthStatus?.value !== "Neoplasm"}>
                        <label className="form-label" htmlFor={`tissueHistologyBehavior-${sampleIndex}`}>
                          Tissue Histology Behavior
                        </label>
                        <Select
                          options={filteredOptions.getTissueHistologyBehaviors(sample)}
                          aria-label="Select Tissue Histology Behavior"
                          placeholder="Select Tissue Histology Behavior"
                          onChange={(value) =>
                            handleSampleChange(sampleIndex, "tissueHistologyBehavior", value)
                          }
                          value={form.samples[sampleIndex].tissueHistologyBehavior}
                        />
                      </div>
                    </div>
                  </>
                )}

                {options?.organismTypes.rodentsAndRabbits.includes(
                  form?.samples[sampleIndex]?.organism?.value
                ) && (
                    <>
                      <div className="row">
                        <div
                          className="col-md mb-3"
                          hidden={form?.samples[sampleIndex]?.tissueHealthStatus?.value !== "Neoplasm"}>
                          <label className="form-label required" htmlFor={`tissueHistology-${sampleIndex}`}>
                            Lesion
                          </label>
                          <Select
                            options={filteredOptions.getNonHumanTissueHistologies(sample)}
                            aria-label="Select Lesion"
                            placeholder="Select Lesion"
                            onChange={(value) => handleSampleChange(sampleIndex, "tissueHistology", value)}
                            value={form.samples[sampleIndex].tissueHistology}
                            required={form?.samples[sampleIndex]?.tissueHealthStatus?.value === "Neoplasm"}
                          />
                        </div>
                      </div>
                    </>
                  )}

                {options?.organismTypes.others.includes(form?.samples[sampleIndex]?.organism?.value) && (
                  <>
                    <div className="row">
                      <div
                        className="col-md mb-3"
                        hidden={form?.samples[sampleIndex]?.tissueHealthStatus?.value !== "Neoplasm"}>
                        <label className="form-label required" htmlFor={`tissueHistology-${sampleIndex}`}>
                          Lesion
                        </label>
                        <input
                          className="form-control"
                          id={`tissueHistology-${sampleIndex}`}
                          name={`tissueHistology-${sampleIndex}`}
                          placeholder="Enter Lesion"
                          required={form?.samples[sampleIndex]?.tissueHealthStatus?.value === "Neoplasm"}
                          onChange={(ev) =>
                            handleSampleChange(sampleIndex, "tissueHistology", ev.target.value)
                          }
                          value={form.samples[sampleIndex].tissueHistology}
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            <div className="row">
            {
              (display?.intrinsicVariables) && (
                <div className="col-md mb-3">
                  <label className="form-label" htmlFor={`intrinsicVariables-${sampleIndex}`}>
                    Intrinsic Variables
                  </label>
                  <textarea
                    rows="3"
                    className="form-control"
                    name={`intrinsicVariables-${sampleIndex}`}
                    id={`intrinsicVariables-${sampleIndex}`}
                    placeholder="Enter any relevant intrinsic alterations (e.g. genetic mutation, genotype, phenotype)"
                    onChange={(ev) => handleSampleChange(sampleIndex, "intrinsicVariables", ev.target.value)}
                    value={form.samples[sampleIndex].intrinsicVariables}
                  />
                </div>
              )
            }
            {
              (display?.extrVarExpTreatment || display?.extrinsicVariables) && (
                <div className="col-md mb-3">
                  <label className="form-label" htmlFor={`extrinsicVariables-${sampleIndex}`}>
                    Extrinsic Variable - Experimental Treatment
                  </label>
                  <textarea
                    rows="3"
                    className="form-control"
                    name={`extrinsicVariables-${sampleIndex}`}
                    id={`extrinsicVariables-${sampleIndex}`}
                    placeholder="Enter experimental treatments to which the biospecimen was exposed (e.g. reagents such as siRNA, chemical compounds, drugs etc)"
                    onChange={(ev) => handleSampleChange(sampleIndex, "extrinsicVariables", ev.target.value)}
                    value={form.samples[sampleIndex].extrinsicVariables}
                  />
                </div>
              )
            }

              {/* <div
                className="col-md mb-3"
                hidden={(displayFormFields && !displayFormFields?.biosample?.extrVarExpTreatment)}
              >
                <label className="form-label" htmlFor={`extrinsicVariables-${sampleIndex}`}>
                  Extrinsic Variable - Experimental Treatment
                </label>
                <textarea
                  rows="3"
                  className="form-control"
                  name={`extrinsicVariables-${sampleIndex}`}
                  id={`extrinsicVariables-${sampleIndex}`}
                  placeholder="Enter experimental treatments to which the biospecimen was exposed (e.g. reagents such as siRNA, chemical compounds, drugs etc)"
                  onChange={(ev) => handleSampleChange(sampleIndex, "extrinsicVariables", ev.target.value)}
                  value={form.samples[sampleIndex].extrinsicVariables}
                />
              </div> */}
            </div>

            <div className="row">

              <div
                className="col-md mb-3"
                hidden={(displayFormFields && !displayFormFields?.biosample?.expVariables)}
              >
                <label className="form-label" htmlFor={`experimentalVariables-${sampleIndex}`}>
                  Experimental Variables
                </label>
                <textarea
                  rows="3"
                  className="form-control"
                  name={`experimentalVariables-${sampleIndex}`}
                  id={`experimentalVariables-${sampleIndex}`}
                  placeholder="Describe what was intentionally varied (e.g. time) between multiple entries in this study"
                  onChange={(ev) => handleSampleChange(sampleIndex, "experimentalVariables", ev.target.value)}
                  value={form.samples[sampleIndex].experimentalVariables}
                />
              </div>

              {/* <div
                className="col-md mb-3"
                hidden={(displayFormFields && !displayFormFields?.biosample?.additionalAttr)}
              >
                <label className="form-label" htmlFor={`additionalNotes-${sampleIndex}`}>
                  Additional Attributes
                </label>
                <textarea
                  rows="3"
                  className="form-control"
                  name={`additionalNotes-${sampleIndex}`}
                  id={`additionalNotes-${sampleIndex}`}
                  placeholder="Enter additional attributes"
                  onChange={(ev) => handleSampleChange(sampleIndex, "additionalNotes", ev.target.value)}
                  value={form.samples[sampleIndex].additionalNotes}
                />
              </div> */}
            </div>

            {/* <pre>{JSON.stringify(form.samples[sampleIndex], null, 2)}</pre> */}

            { /* Refactor Specimen */}
            <Specimen
              specimens={sample.specimens}
              handleSampleChange={handleSampleChange}
              copySpecimen={copySpecimen}
              displayFormFields={displayFormFields}
              withConfirmation={withConfirmation}
              displayFieldOptions={displayFieldOptions}
              form={form}
              display={displayFormFields?.specimen}
              setForm={setForm}
              sampleIndex={sampleIndex}
            />

            <div className="d-flex flex-wrap justify-content-between">
              <div>
                <button
                  type="button"
                  className="btn btn-outline-primary mb-1 me-1"
                  onClick={(ev) => addSpecimen(sampleIndex)}>
                  Add Specimen
                </button>
                {/* <button
                  type="button"
                  className="btn btn-outline-primary mb-1"
                  onClick={(ev) => addSpecimen(sampleIndex)}>
                  Add Multiwell Plate
                </button> */}
              </div>
            </div>
          </AccordionDetails>
        </SampleAccordianView>
        </>
      ))}
    </>
  )
}

export default BiosampleView;
