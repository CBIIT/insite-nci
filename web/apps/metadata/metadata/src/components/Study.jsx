import React, { useEffect, useState } from "react";
import Select from "react-select";
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
import { filteredOptions, hideField, safeClone } from "../utils";
import options from "../options.json";
import {
  defaultForm,
} from "../form";
import clsx from "clsx";
import OmeroIdInputViwe from '../sections/suggestion/SuggestionController';

const Study = ({
  form,
  mergeForm,
  setDisplayFormFields,
  display,
  displayFieldOptions,
  omeroProjectOrScreenID,
  omeroDatasetID,
  optionalFeatures,
}) => {
  const [expanded, setExpanded] = useState(true);
  function handleChange(name, value) {
    // update display fields 
    if (name === "imagingFacility") {
      const { value: imageFacilityId, dirName } = value;
      setDisplayFormFields(imageFacilityId, dirName);
    }
    let formBase = name === "imagingFacility" ? safeClone(defaultForm) : safeClone(form);
    let newForm = { ...formBase, [name]: value };
    mergeForm(newForm);
  }

  function handleOmeroIdChange (name, id) {
    const updateForm = safeClone(form);
    updateForm['omeroScreenProjectId'] = id;
    updateForm['datasetId'] = name;
    mergeForm(updateForm);
  }

  function updateFilePath(filePathIndex, key, value) {
    const newFilePaths = [...form.filePaths];
    newFilePaths[filePathIndex][key] = value;
    mergeForm({ filePaths: newFilePaths });
  }

  function removeFilePath(filePathIndex) {
    const newFilePaths = [...form.filePaths].filter((e, i) => i !== filePathIndex);
    mergeForm({ filePaths: newFilePaths });
  }

  function addFilePath() {
    const addPathObject = { name: "", path: "" };
    if (form.filePaths && form.filePaths.length > 0) {
      const newFilePaths = [...form.filePaths, addPathObject];
      mergeForm({ filePaths: newFilePaths });
    } else {
      mergeForm({ filePaths:  [addPathObject] });
    }
  }

  function onToggle (){
    setExpanded(!expanded);
  }

  // set omero dataset id
  useEffect(() => {
    // console.log("omeroDatasetID");
    // console.log(omeroDatasetID);
    if (omeroProjectOrScreenID) {
      if (!form.omeroProjectOrScreenID) {
        handleChange("omeroScreenProjectId", Number(omeroProjectOrScreenID));
      }
    }
    else if (omeroDatasetID) {
      if (!form.omeroDatasetID) {
        handleChange("omeroDatasetID", Number(omeroDatasetID));
      }
    }

    // if (process.env.NODE_ENV !== "development") {
    //   getSuggestions(["Screen", "Project"]).then(res => {
    //     console.log(res);
    //   });
    // }
  }, [form.imagingFacility]);

  function InfoTooltip() {
    return (
      <Tooltip
        title={
          <div>
            <Typography>• Refers to OMERO Dataset/Screen-level object IDs</Typography>
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

  return (
    <>
      <Accordion expanded={expanded} onChange={onToggle}>
        <AccordionSummary
          sx={{ backgroundColor: 'info.main', color: '#fff' }}
          expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }} />}
        >
          <h2 className="h4 fw-semibold">Study Information</h2>
        </AccordionSummary>
        {/* <Accordion.Header className="bg-info-subtle">
          <h2 className="h4 fw-semibold">Study Information</h2>
        </Accordion.Header> */}
        <AccordionDetails>
          <div className="row">
            <div className="col-md mb-3">
              <label className="form-label required" htmlFor="imagingFacility">
                Imaging Facility
              </label>
              <Select
                name="imagingFacility"
                data-label={`Imaging Facility`}
                options={options.imagingFacilities}
                aria-label="Select Imaging Facility"
                placeholder="Select Imaging Facility"
                onChange={(v) => handleChange("imagingFacility", v)}
                value={form.imagingFacility}
                required
              />
            </div>
            <div className="col-md mb-3">
              <label className="form-label required" htmlFor="principalInvestigator">
                Principal Investigator
              </label>
              <Select
                name="principalInvestigator"
                data-label={`Principal Investigator`}
                options={options.principalInvestigators}
                aria-label="Select Principal Investigator"
                placeholder="Select Principal Investigator"
                onChange={(v) => handleChange("principalInvestigator", v)}
                value={form.principalInvestigator}
                required
              />
            </div>
          </div>
          <div className="row" >
            {
              (display?.projectName)
              && (
                <div className="col-md mb-3">
                  <label className="form-label" htmlFor="projectName">
                    Project Name
                  </label>
                  <input
                    className="form-control"
                    type="text"
                    id="projectName"
                    name="projectName"
                    placeholder="Enter Project Name"
                    value={form.projectName}
                  />
                </div>
              )
            }
            {
              (display?.projectName)
              && (
                <div className="col-md mb-3">
                  <label className="form-label " htmlFor="piLabOrBranchInstitute">
                    PI lab or branch, institute
                  </label>
                  <input
                    className="form-control"
                    type="text"
                    id="piLabOrBranchInstitute"
                    name="piLabOrBranchInstitute"
                    placeholder="Enter PI lab or branch, institute"
                    value={form.labOrInstitude}
                  />
                </div>
              )
            }
            {
              (display?.piEmail)
              && (
                <div className="col-md mb-3">
                  <label className="form-label" htmlFor="piEmail">
                    PI Email
                  </label>
                  <input
                    className="form-control"
                    type="email"
                    id="piEmail"
                    name="piEmail"
                    placeholder="Enter PI email"
                    value={form.piEmail}
                  />
                </div>
              )
            }
          </div>

          <div className="row">
            <div className="col-md mb-3">
              <label className="form-label required" htmlFor="projectScientist">
                Project Scientist
              </label>
              <input
                className="form-control"
                id="projectScientist"
                name="projectScientist"
                data-label={`Project Scientist`}
                placeholder="Enter LAST NAME, FIRST NAME"
                onChange={(ev) => handleChange("projectScientist", ev.target.value)}
                value={form.projectScientist}
                required
              />
            </div>
            <div className="col-md mb-3">
              <label className="form-label required" htmlFor="email">
                Project Scientist Email
              </label>
              <input
                className="form-control"
                type="email"
                id="email"
                name="email"
                data-label={`Project Scientist Email`}
                placeholder="Enter Scientist Email"
                onChange={(ev) => handleChange("email", ev.target.value)}
                value={form.email}
                required
              />
            </div>
          </div>
          
          <div className="row">
            <div className="col-md mb-3">
              <label
                className= {
                  clsx("form-label",
                    {["required"]: display?.datasetId?.display == 'Required'})
                }
                htmlFor="datasetId"
              >
                {display?.datasetId?.label || "Study/Dataset Name"}
              </label>
              <input
                className="form-control"
                id="datasetId"
                name="datasetId"
                data-label={`Dataset / Screen ID`}
                type="text"
                placeholder="Enter Study/Dataset Name"
                onChange={(ev) => handleChange("datasetId", ev.target.value)}
                value={form.datasetId}
                required={display?.datasetId?.display == 'Required'}

              />
            </div>
            {
            (optionalFeatures?.omeroObjectSuggestion) ? (
              <div style={{
                position: 'relative',
                 maxWidth: "450px"
              }}>
                <OmeroIdInputViwe
                  title="Omero Project or Screen ID"
                  objectTypes={["Screen", "Project"]}
                  searchQuery={form.omeroScreenProjectId}
                  handleChange={(id, name) => {
                    // handleChange("omeroScreenProjectId", id);
                    // console.log("dataset name");
                    // console.log(name)
                    // handleChange("datasetId", name);
                    handleOmeroIdChange(name, id);
                  }}
                >
                  <InfoTooltip />
                  <input
                    className="form-control"
                    id="omeroScreenProjectId"
                    name="omeroScreenProjectId"
                    type="number"
                    min="0"
                    placeholder="Enter Dataset/Screen ID"
                    onChange={(ev) => handleChange("omeroScreenProjectId", ev.target.value)}
                    value={form.omeroScreenProjectId}
                  />
                </OmeroIdInputViwe>
              </div>
            ) : (
            <div className="col-md mb-3">
              <label className="form-label" htmlFor="datasetId">
                Omero Project or Screen ID
              </label>
              <InfoTooltip />
              <input
                className="form-control"
                id="omeroScreenProjectId"
                name="omeroScreenProjectId"
                type="number"
                min="0"
                placeholder="Enter Dataset/Screen ID"
                onChange={(ev) => handleChange("omeroScreenProjectId", ev.target.value)}
                value={form.omeroScreenProjectId}
              />
            </div>

            )
          }
            
            <div className="col-md mb-3">
              <label className="form-label required" htmlFor="imagingMethod">
                Imaging Method
              </label>
              <Select
                options={filteredOptions.getImagingMethods(form)}
                name="imagingMethod"
                value={form.imagingMethod}
                data-label={`Imaging Method`}
                onChange={(v) => handleChange("imagingMethod", v)}
                aria-label="Select Imaging Method"
                placeholder="Select Imaging Method"
                required
              />
            </div>
            {
              (form?.imagingMethod?.value === "Other") && (
                <div className="col-md mb-3">
                  <label className="form-label required" htmlFor="imagingMethodOther">
                    Imaging Method (Other)
                  </label>
                  <input
                    className="form-control"
                    id="imagingMethodOther"
                    name="imagingMethodOther"
                    data-label={`Imaging Method (Other)`}
                    placeholder="Enter Imaging Method"
                    required={form?.imagingMethod?.value === "Other"}
                    onChange={(ev) => handleChange("imagingMethodOther", ev.target.value)}
                    value={form.imagingMethodOther}
                  />
                </div>
              )
            }
          </div>

          <div className="row">
            {
              (!display || display?.studyDescription) && (
                <div className="col-md mb-3">
                  <label className="form-label" htmlFor="studyDescription">
                    Study Description
                  </label>
                  <textarea
                    className="form-control"
                    id="studyDescription"
                    name="studyDescription"
                    placeholder="Enter brief description of the imaging study"
                    onChange={(ev) => handleChange("studyDescription", ev.target.value)}
                    value={form.studyDescription}
                  />
                </div>
              )
            }
            {
              (!display || display?.supportingLinks) && (
                <div className="col-md mb-3">
                  <label className="form-label" htmlFor="supportingLinks">
                    Supporting Links
                  </label>
                  <textarea
                    className="form-control"
                    id="supportingLinks"
                    name="supportingLinks"
                    placeholder="Enter links to supporting documents"
                    onChange={(ev) => handleChange("supportingLinks", ev.target.value)}
                    value={form.supportingLinks}
                  />
                </div>
              )
            }
          </div>

          <div className="row">
            {
              (display?.biosampleDescription) && (
                <div className="col-md mb-3">
                  <label className="form-label" htmlFor="biosampleDescription">
                    Biosample description
                  </label>
                  <textarea
                    className="form-control"
                    id="biosampleDescription"
                    name="biosampleDescription"
                    placeholder="Enter text"
                    onChange={(ev) => handleChange("biosampleDescription", ev.target.value)}
                    value={form.biosampleDescription}
                  />
                </div>
              )
            }
          </div>

          <div className="row">
            <div className="col-md mb-3">
              <label className="form-label d-block" htmlFor="filePaths">
                File Paths
              </label>
              {
                form?.filePaths?.map((filePath, filePathIndex) => (
                  <div className="input-group mb-3" key={filePathIndex}>
                    <Select
                      options={filteredOptions.getFilePathNames(form)}
                      value={filePath.name}
                      onChange={(v) => updateFilePath(filePathIndex, "name", v)}
                      aria-label="Select item"
                      placeholder="Select item"
                    />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter file path"
                      value={filePath.path}
                      onChange={(ev) => updateFilePath(filePathIndex, "path", ev.target.value)}
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => removeFilePath(filePathIndex)}>
                      <i className="bi bi-trash" />
                    </button>
                  </div>
                ))
              }
              <button type="button" className="btn btn-outline-primary" onClick={addFilePath}>Add File Path</button>
            </div>
          </div>
        </AccordionDetails>
      </Accordion>
    </>
  );
}

export default Study;
