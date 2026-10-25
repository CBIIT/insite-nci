"use client";
import React from "react";
import { useEffect, useState, useRef } from "react";
// import Accordion from "react-bootstrap/Accordion";
import * as XLSX from "xlsx";
import Dropdown from "react-bootstrap/Dropdown";
import CircularProgress from '@mui/material/CircularProgress';
import Modal from "react-bootstrap/Modal";
import _ from "lodash";
import EmailIcon from "@mui/icons-material/Email";
import axios from "axios";
import {
  downloadFile,
  downloadJson,
  downloadExcel,
  downloadZip,
  // generateExcelExport,
  generateMultiwellDataTemplate,
  loadExcelMetadata,
  getTimestamp,
  // readFile,
  parseMultiplatesFileTxtCSV,
  parseMultiwellFileXlsx,
  formValueMultiplateBatchUpload,
  getFormTemplate,
  // formValueMultiplateMultiTableBatchUpload,
  formatPlateTables,
  safeClone,
  newForm,
  isEmptyObject,
} from "./utils.js";
import { defaultForm, defaultSample, defaultMultiwellPlate } from "./form.js";
import BiosampleView from "./components/Biosample.jsx";
import MutiWellPlateView from "./components/MultiWellPlate.jsx";
import Study from "./components/Study.jsx";
import { generateExcelExport2 } from "./util/GenerateExcel.js";
import { FormContextProvider } from "./FormContextProvider.jsx";
import FormView from "./FormView.jsx";
import { generateJsonMetadata, getMetadataTemplateHierarchy } from "./sections/Json/export/export.js";
import ProgressDialog from "./sections/Progress/Dialog.jsx";
import { 
  getSuggestions, 
  postSubmissionHistory, 
} from "./service/Http.js";
import useSuggestionList from "./sections/suggestion/SuggestionStore.js";
import ReadMEView from "./sections/ReadMe/ReadMeController.jsx";
import useFormData from "./sections/history/HistoryStore.js";
import DynamicSnackbar from "./sections/Snackbar/SnackerView.jsx";
import EmailRecipientsPanel from "./components/EmailRecipientsPanel.jsx";
import { sendEmailNotification } from "./service/email.js";
import { archiveMetadataFiles } from "./sections/utils2.js";
// import { loadExcelMetaData as loadExcelMetaData2 } from "./sections/excel/load/LoadExcel.js";
// import { generateMetadataJson } from "./util/GenerateJson.js";

export default function SubmitMetadata({
  projectId,
  datasetId,
  screenId,
  plateId,
  imageId,
  groupId,
  omeroObjectIds
}) {
  // const [isLoggedIn, setLoggedIn] = useState(process.env.NODE_ENV === "development");
  const [alerts, setAlerts] = useState([]);
  const [file, setFile] = useState(null);
  const [isUploading, setUploading] = useState(false);
  const [isPageLoading , setPageLoading] = useState(false);
  const [isSuggestionListLoading, setSuggestionListLoading] = useState(false);
  const [showSubmitEmailReview, setShowSubmitEmailReview] = useState(false);
  const [pendingEmailSettings, setPendingEmailSettings] = useState(null);

  const [form, setForm] = useState(safeClone(defaultForm));
  const mergeForm = (obj) => setForm((form) => ({ ...form, ...obj }));
  const processedForm = safeClone(form); //  deepMapValues(structuredClone(form), (v) => (v?.value || v), (v) => v?.value === undefined || !Array.isArray(v));
  processedForm.imagingFacilityName = form.imagingFacility?.label;
  processedForm.imagingFacilityAbbreviation = form.imagingFacility?.abbreviation;

  const [displayFormFields, setDisplayFields] = useState(undefined);
  const [optionalFeatures, setOptionalFeatures] = useState(undefined);
  const [displayFieldOptions, setFieldOptions] = useState(undefined);

  const [snackText, setSnackText] = useState("");
  const [severity, setSeverity] = useState("");

  const [formState, ] = useFormData();

  const fetchSuggestions = async (showSuggest = false, imageFacilityId) => {
    let omeroObjTypes = ["Screen", "Plate"];
    const frm = formState?.formData || form;
    const imgFacilityId = imageFacilityId || frm.imagingFacility?.value;
    if (imgFacilityId !== 2) {
      omeroObjTypes = ["Project", "Dataset"];
    }
    
    if (optionalFeatures?.omeroObjectSuggestion || showSuggest) {
      setSuggestionListLoading(true);
      try {
        const data = await getSuggestions(omeroObjTypes);
        if (data) {
          action.setSuggestionList(data);
        }
      } finally {
        setSuggestionListLoading(false); // Ensures loading is false even if there's an error
      }
    }
  };

  // global event
  // display form fields based on faculty template
  function setDisplayFormFields(imageFacilityId, dirName) {
    getFormTemplate(imageFacilityId, dirName).then((response) => {
      if (response) {
        // template is present for facility
        // displayFormFields - display all the fields in temple sheet1
        // formFieldOptions - display any drop down options / select fields from template sheet2
        // optionalFormFeatures - any optional features like button specific to facility from template sheet3
        const { displayFormFields, formFieldOptions, optionalFormFeatures } = response;

        setDisplayFields(displayFormFields);
        setFieldOptions(formFieldOptions);
        setOptionalFeatures(optionalFormFeatures);
        fetchSuggestions(optionalFormFeatures.omeroObjectSuggestion, imageFacilityId);
      } else {
        // template is not present for facility display all fields
        setDisplayFields(undefined);
        setFieldOptions(undefined);
        setOptionalFeatures(undefined);
      }
    });

  };

  useEffect(() => {
    if (formState) {
      const frm = formState.formData;
      const facility = frm.imagingFacility
      const facId = facility?.value;
      const dirName = facility?.dirName || undefined;
      setDisplayFormFields(facId, dirName);
      // async function updateForm () {
      //   await getFormTemplate(facId, dirName);
      // }
      // updateForm();
      setForm(frm);
    }
  }, [formState])

  function handleReset(ev) {
    setForm(safeClone(defaultForm));
  }

  async function getHierarchy(form) {
    // todo: fetch these from "/static/hierarchy/*.xlsx" - we want to rename these to match the facilityId
    // const [facilityHierarchy, setFierarchy] = useState(null);
    const hierarchies = await getMetadataTemplateHierarchy(form);
    return hierarchies;
  }

  /**
   * Transform the raw metadata into an object acceptable by the OMERO-import script.
   * This version takes a hierarchy mapping as a parameter so that the caller can supply it.
   *
   * @param {Object} raw - The raw metadata object.
   * @param {Object} hierarchyMapping - The hierarchy object which defines:
   *         - module names (e.g. "Biosample", "Specimen", "Channel")
   *         - each module's attributes with properties:
   *             - attribute: the human-readable name
   *             - metadataLevel: where it belongs (e.g. "Well Level" or "Image Level")
   *             - addTag: a boolean that determines if the attribute should be added as a tag.
   * @param {Object} [attributeKeyMap=defaultAttributeKeyMap] - (Optional) Mapping from the hierarchy attribute names to raw object keys.
   * @returns {Object} The transformed metadata object.
   */

const appendMetadata = async (jsonObjects) => {
  setUploading(true);
  setAlerts([]);
  let success = false;
  try {
    for (const item of jsonObjects) {
      // build your body once per item
      const reqBody = JSON.stringify(item);
      const endpoint = `api/submit`;
      setUploading(true);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: reqBody,
      });

      if (response.ok) {
        success = true;
        setAlerts([{ id: Date.now(), type: "success", message: "Metadata appended successfully." }]);
      }
      else {
        success = false;
        setAlerts([{ id: Date.now(), type: "danger", message: "Metadata submission failed." }]);
      }
    }

  } catch (e) {
    console.error(e);
    setAlerts([{
      id: Date.now(),
      type: "danger",
      message: e.message || "Metadata submission failed."
    }]);
  } finally {
    setUploading(false);
  }
  return success;
};

  async function submitJsonMetadata() {
    const jsonMetadata = await generateJsonMetadata(processedForm);
    if (groupId) {
      jsonMetadata.groupId = groupId;
    }
    console.log(jsonMetadata?.keyValueByPlate);
    let wellObjects = [];
    if (!isEmptyObject(jsonMetadata?.keyValueByPlate)) {
      wellObjects = (jsonMetadata?.keyValueByPlate || []).map((item) => {
        return {
          multiWell_tags: item?.wellsKeyValue
        };
      });
    }
    
    if(jsonMetadata.keyValueByPlate) {
      delete jsonMetadata.keyValueByPlate;
    }
    const jsonObjects = [jsonMetadata, ...wellObjects];
    const isSuccess = await appendMetadata(jsonObjects);
    await archiveFiles(async () => {
      const excelBuffer = await generateExcelExport2(processedForm, 1, displayFieldOptions, displayFormFields);
      return {
        excelBlob: new Blob(
          [new Uint8Array(excelBuffer)],
          { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
        ),
        jsonBlob: new Blob([JSON.stringify(jsonMetadata, null, 2)], { type: "application/json" }),
        jsonMetadata,
      };
    });
    return isSuccess;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    window.scrollTo(0, 0);

    /** @type HTMLFormElement */
    const formEl = ev.target;
    const invalidFields = Array.from(formEl.elements).filter((field) => !field.checkValidity());
    // check invalid fields
    invalidFields.forEach((field) => {
      console.log(`Invalid field name: ${field.name}`);
    });

    const invalids = Array.from(formEl.elements).filter(
      (field) => field.tagName !== 'BUTTON' && !field.checkValidity()
    );

    const isValid = formEl.checkValidity();
    if (!isValid) {
      invalids.forEach(item => console.log(item));
      const invalidFields = invalids.map((f, index) => `(${index + 1}) ${f.dataset.label || f.name || f.id || '[unnamed field]'} `);
      setAlerts([{ id: Date.now(), type: "danger", message: `Please fill out required fields ${invalidFields}` }]);
      formEl.reportValidity();
      return;
    } else {
      setAlerts([]);
    }

    if (Number(processedForm.imagingFacility?.value) === 9) {
      setShowSubmitEmailReview(true);
      return;
    }
    await completeSubmit();
  }

  async function completeSubmit(emailSettings = null) {
    const isSuccess = await submitJsonMetadata();
    if (isSuccess) {
      try {
        setUploading(true);
        const emailForm = emailSettings ? { ...processedForm, ...emailSettings } : processedForm;
        await sendEmailNotification(emailForm, displayFieldOptions, displayFormFields);
        setSnackText("Email notification sent successfully.");
        setSeverity("success");
      } catch (error) {
        console.error("Email notification failed:", error);
        setSnackText(`Email notification failed: ${error.message}`);
        setSeverity("error");
      } finally {
        setUploading(false);
      }
    }
  }

  function confirmEmailReview(emailSettings) {
    setPendingEmailSettings(emailSettings);
    setShowSubmitEmailReview(false);
    mergeForm(emailSettings);
  }

  async function submitAfterEmailReviewExit() {
    if (!pendingEmailSettings) return;
    const emailSettings = pendingEmailSettings;
    setPendingEmailSettings(null);
    await completeSubmit(emailSettings);
  }

  async function archiveFiles(buildFiles) {
    try {
      const { excelBlob, jsonBlob, jsonMetadata } = await buildFiles();
      const formDatasetId = String(processedForm.datasetId || "").trim();
      const archiveObjectIds = {
        projectIDs: [
          ...(omeroObjectIds?.projectIDs || []),
          processedForm.omeroScreenOrProjectId,
        ].filter(Boolean),
        datasetIDs: [
          ...(omeroObjectIds?.datasetIDs || []),
          processedForm.omeroDatasetID,
          ...(processedForm.samples || []).map((sample) => sample.omeroObjectId),
          /^\d+$/.test(formDatasetId) ? formDatasetId : null,
        ].filter(Boolean),
      };
      await archiveMetadataFiles(excelBlob, jsonBlob, jsonMetadata, archiveObjectIds);
    } catch (error) {
      console.error(error);
      setAlerts((currentAlerts) => [...currentAlerts, {
        id: Date.now(),
        type: "warning",
        message: `The action completed, but the server metadata archive failed: ${error.message}`,
      }]);
    }
  }

  async function downloadJsonMetadata() {
    const timestamp = getTimestamp();
    const filename =
      ["metadata", _.snakeCase(processedForm.imagingFacilityName || ""), _.snakeCase(processedForm.datasetId || ""), timestamp]
        .filter(Boolean)
        .join("_") + ".json";
    const jsonMetadata = await generateJsonMetadata(processedForm);
    const jsonBlob = downloadJson(jsonMetadata, filename);
    await archiveFiles(async () => {
      const excelBuffer = await generateExcelExport2(processedForm, 1, displayFieldOptions, displayFormFields);
      return {
        excelBlob: new Blob(
          [new Uint8Array(excelBuffer)],
          { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
        ),
        jsonBlob,
        jsonMetadata,
      };
    });
  }

  async function downloadExcelMetadata(activeSheet = 1, form) {
    const timestamp = getTimestamp();
    const filename =
      ["metadata", _.snakeCase(processedForm.imagingFacilityName || ""), _.snakeCase(processedForm.datasetId || ""), timestamp]
        .filter(Boolean)
        .join("_") + ".xlsx";
    const submissionForm = form || processedForm;
    const excelBlob = await downloadExcel(submissionForm, filename, activeSheet, displayFieldOptions, displayFormFields);
    await archiveFiles(async () => {
      const jsonMetadata = await generateJsonMetadata(processedForm);
      return {
        excelBlob,
        jsonBlob: new Blob([JSON.stringify(jsonMetadata, null, 2)], { type: "application/json" }),
        jsonMetadata,
      };
    });
  }

  async function downloadAllMetadata() {
    const timestamp = getTimestamp();
    const filename =
      ["metadata", _.snakeCase(processedForm.imagingFacilityName || ""), _.snakeCase(processedForm.datasetId || ""), timestamp]
        .filter(Boolean)
        .join("_") + ".zip";
    const files = await downloadZip(processedForm, filename, displayFieldOptions, displayFormFields);
    await archiveFiles(async () => ({
      ...files,
      jsonMetadata: await generateJsonMetadata(processedForm),
    }));
  }

  async function importExcelMetadata(event) {
    setPageLoading(true);

    const file = event.target?.files?.[0];
    event.target.value = null;
    if (!file) return;
    const { metadata } = await loadExcelMetadata(file);
    if (newForm.includes(metadata?.imagingFacility?.value)) {
      const {
        displayFormFields,
        optionalFormFeatures,
        formFieldOptions,
      } = metadata;
      setDisplayFields(displayFormFields);
      setFieldOptions(formFieldOptions);
      setOptionalFeatures(optionalFormFeatures);
      setFile(file);
    }

    if (metadata?.errors?.length) {
      setAlerts([
        {
          id: Date.now(),
          type: "danger",
          message: (
            <>
              Please correct the following errors
              <ul className="mb-0">
                {metadata.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </>
          ),
        },
      ]);
    }
    setDisplayFormFields( 
      metadata?.imagingFacility?.value,
      metadata?.imagingFacility?.dirName
    );

    // set plate id from path param
    const formData = safeClone(metadata);
    if (plateId && formData?.multiwellPlates?.length > 0) {
      formData.multiwellPlates[0].id = plateId;
    }
    setForm(formData);
    setPageLoading(false);
  }

  function addSample() {
    const newSample = safeClone(defaultSample);
    const clonedFields = [
      "organism",
      "organismOther",
      "gemStrain",
      "speciesOrStrain",
      "sampleType",
      "cellLine",
      "tissueType",
      "tissueSite",
      "tissueSubsite",
      "tissueHealthStatus",
      "tissueHistology",
      "tissueHistologyBehavior",
      "otherDiseaseOrCondition",
      "intrinsicVariables",
      "extrinsicVariables",
      "experimentalVariables",
    ];

    if (form.samples.length > 0) {
      for (const field of clonedFields) {
        newSample[field] = form.samples[0][field];
      }
    }

    if (datasetId || plateId) {
      newSample.omeroObjectId = datasetId || plateId;
    }

    const newSamples = [...form.samples, newSample];
    mergeForm({ samples: newSamples });
  }

  function addMultiwellPlate() {
    const newMultiwellPlate = safeClone(defaultMultiwellPlate);
    if (plateId) {
      newMultiwellPlate.plateId = plateId;
      newMultiwellPlate.id = plateId;
    }
    const newMultiwellPlates = safeClone([...form.multiwellPlates, newMultiwellPlate]);
    mergeForm({ multiwellPlates: newMultiwellPlates });
  }

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

  async function withConfirmation(callback) {
    const confirmation = window.confirm("Please confirm you wish to delete this item.");
    if (confirmation) {
      callback();
    }
  }

  function uploadMultiPlatesFile(event) {
    const file = event.target.files[0];
    if (file) {
      const fileName = file.name;
      const fileExtension = `${fileName}`.split(".").pop().toLowerCase();
      // xlsx file upload
      const reader = new FileReader();
      if (fileExtension === "xlsx") {
        // parseMultiwellFileXlsx(file).then(({ dictionary, plateIdTables }) => {
        //   const updateForm = {
        //     ...form,
        //     multiwellPlates: formValueMultiplateBatchUpload(dictionary),
        //   };

        //   // iterate over each multiplate well
        //   const multiWellPlatesTables = formatPlateTables(plateIdTables);
        //   setForm(
        //     safeClone({
        //       ...form,
        //       multiwellPlates: multiWellPlatesTables,
        //     })
        //   );
        // });
        // console.log("retrive file from xlxs")
        // reader.onload = (e) => {
        //   const data = e.target.result;
        //   const workbook = XLSX.read(data, { type: 'binary' });
        //   const sheetName = workbook.SheetNames[0];
        //   const worksheet = workbook.Sheets[sheetName];
        //   // Convert to tab-delimited text
        //   const text = XLSX.utils.sheet_to_txt(worksheet, { FS: '\t' });
        //   console.log(text);
        // }
        // reader.readAsText(file);
      } else {
        // txt and csv file upload
        reader.onload = (e) => {
          const content = e.target.result;
          const { plateIdToValues: multiPlates, plateIdTables } = parseMultiplatesFileTxtCSV(content, file);
          const multiWellPlatesTables = formatPlateTables(plateIdTables);
          const updateForm = {
            ...form,
            multiwellPlates: multiWellPlatesTables,
          };
          setForm(safeClone(updateForm));
        };
        reader.readAsText(file);
      }
    }
  };

  // useEffect(() => {
  //   console.log(form);
  //   console.log(optionalFeatures);
  // }, [form]);

  const [state, action] = useSuggestionList();

  const handleImageFacilitychange = (name, value) => {
    const isImageFacility = ["imagingFacility", "dataProvenance"].includes(name);
    if (isImageFacility) {
      const {
        value: imageFacilityId,
        dirName = undefined,
      } = value;

      let newForm = {
        ...safeClone(defaultForm),
        imagingFacility: value,
        dataProvenance: value
      };
      mergeForm(newForm);
      setDisplayFormFields(imageFacilityId,  dirName);
    } else {
      let formBase = safeClone(form);
      let newForm = { ...formBase, [name]: value };
      mergeForm(newForm);
    }
  };

  useEffect(() => {
    console.log('form data');
    console.log(form);
    console.log(optionalFeatures);
  } , [form]);

  if (isPageLoading) {
    return (
      <div className="bg-light py-5 h-100">
          <div className="container">
            <CircularProgress /> {' Loading...'}
          </div>
      </div>
    );
  }

  const onFormSave = (event) => {
    event.preventDefault();
    const res = postSubmissionHistory(form, 'save');
    if (res) {
      setSnackText("Form Save Successfully !");
      setSeverity("success");
    } else {
      setSnackText("Error: Unable to save the form. Please try downloading the Excel form.");
      setSeverity("error");
    }
  };

  // remove after complete migration to new form
  const displayNewTemplate = newForm.includes(form?.imagingFacility?.value);
  return (
    <FormContextProvider>
      <div className="bg-light">
        <div className="bg-light container">
          <div class="row">
            <div class="col-md-2 offset-md-10 text-end">
              <ReadMEView imagingFacility={form?.imagingFacility} /> 
            </div>
          </div>
        </div>
      </div>
      {!displayNewTemplate && (
        <div className="bg-light py-5 h-100">
          <div className="container">
            <div className="row">
              <div className="col">
                {alerts.map((alert, index) => (
                  <div
                    className={`alert alert-${alert.type} alert-dismissible fade show`}
                    role="alert"
                    key={index}
                  >
                    {alert.message}
                    <button
                      type="button"
                      className="btn-close"
                      data-bs-dismiss="alert"
                      aria-label="Close"
                      onClick={() => setAlerts(alerts.filter((e) => e.id !== alert.id))}></button>
                  </div>
                ))}

                <div className="d-flex justify-content-between align-items-end mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <label className="btn btn-outline-primary me-2">
                      <input
                        type="file"
                        className="visually-hidden"
                        accept=".xlsx"
                        onChange={importExcelMetadata}
                      />
                      Import Excel File
                    </label>
                  </div>
                  <div className="text-muted fw-semibold">
                    <span className="text-danger">*</span> indicates required fields
                  </div>
                </div>
                
                <form id="submission-form" onReset={handleReset} onSubmit={handleSubmit} noValidate>
                  {/* <Accordion defaultActiveKey="0" className="mb-3" alwaysOpen> */}
                    <Study
                      form={form}
                      mergeForm={mergeForm}
                      display={displayFormFields?.studyComponent || displayFormFields?.study}
                      displayFieldOptions={displayFieldOptions}
                      setDisplayFormFields={setDisplayFormFields}
                      optionalFeatures={optionalFeatures}
                      omeroProjectOrScreenID={projectId || screenId}
                      omeroDatasetID={datasetId}
                    />

                    <BiosampleView
                      form={form}
                      omeroObjectId={datasetId || plateId}
                      imageId={imageId}
                      setForm={setForm}
                      mergeForm={mergeForm}
                      withConfirmation={withConfirmation}
                      downloadMultiwellDataTemplate={downloadMultiwellDataTemplate}
                      display={displayFormFields?.biosample}
                      displayFormFields={displayFormFields}
                      optionalFormFeatures={optionalFeatures}
                      displayFieldOptions={displayFieldOptions}
                      importExcelMetadata={importExcelMetadata}
                    />

                    <MutiWellPlateView
                      form={form}
                      plateId={plateId}
                      mergeForm={mergeForm}
                      withConfirmation={withConfirmation}
                      downloadExcelMetadata={downloadExcelMetadata}
                      importExcelMetadata={importExcelMetadata}
                      downloadMultiwellDataTemplate={downloadMultiwellDataTemplate}
                      displayFieldOptions={displayFieldOptions}
                      optionalFeatures={optionalFeatures}
                      displayFormFields={displayFormFields}
                    />
                  {/* </Accordion> */}

                  <div className="d-flex flex-wrap justify-content-between">
                    <div>
                      <button type="button" className="btn btn-outline-primary me-1 mb-1" onClick={addSample}>
                        Add Biosample
                      </button>
                      <button type="button" className="btn btn-outline-primary me-1 mb-1" onClick={addMultiwellPlate}>
                        Add Multiwell Plate
                      </button>

                      {optionalFeatures?.importExtrinsicVariablesButton?.display === "Add" && (
                        <label className="btn btn-outline-primary mb-1">
                          Import Variables
                          <input
                            type="file"
                            className="visually-hidden"
                            accept=".txt"
                            onChange={(e) => uploadMultiPlatesFile(e)}
                            onClick={(e) => {
                              e.target.value = null;
                            }}
                          />
                        </label>
                      )}
                    </div>

                    <div className="d-flex flex-wrap  justify-content-between">
                      <button type="reset" className="btn btn-outline-danger me-1 mb-1">
                        Reset
                      </button>
                      <Dropdown>
                        <Dropdown.Toggle variant="outline-dark" className="btn me-1 mb-1" id="download-options">
                          Download
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item as="button" type="button" onClick={downloadAllMetadata}>
                            All (.zip)
                          </Dropdown.Item>
                          <Dropdown.Item as="button" type="button" onClick={downloadExcelMetadata}>
                            Excel format (.xlsx)
                          </Dropdown.Item>
                          <Dropdown.Item as="button" type="button" onClick={downloadJsonMetadata}>
                            Json format (.json)
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                      <div className="mb-1 mx-2">
                        <EmailRecipientsPanel
                          form={processedForm}
                          updateRecipients={mergeForm}
                          defaultRecipients={form?.email ? [ form?.email ]: []}
                          groupId={groupId}
                          projectIds={[
                            ...(omeroObjectIds?.projectIDs || []),
                            processedForm.omeroScreenOrProjectId,
                          ].filter(Boolean)}
                          submitReviewOpen={showSubmitEmailReview}
                          onConfirmSubmit={confirmEmailReview}
                          onCancelSubmit={() => setShowSubmitEmailReview(false)}
                          onSubmitReviewExited={submitAfterEmailReviewExit}
                        />
                      </div>
                      <button type="submit" className="btn btn-primary mb-1">
                        Submit
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <ProgressDialog
        isOpen={isUploading}
      />
    
      <ProgressDialog
        isOpen={isSuggestionListLoading}
        message="Loading ..."
      />

      <DynamicSnackbar
        text={snackText}
        severity={severity}
      />

      {(!isPageLoading && displayNewTemplate) && (
        <FormView
          imgFacility={form?.imagingFacility}
          optionalFeatures={optionalFeatures}
          importExcelMetadata={importExcelMetadata}
          handleImageFacilitychange={handleImageFacilitychange}
          displayFormFields={displayFormFields}
          displayFieldOptions={displayFieldOptions}
          downloadAllMetadata={downloadAllMetadata}
          mergeForm={mergeForm}
          file={file}
          onFormSave={onFormSave}
          groupId={groupId}
          omeroObjectIds={omeroObjectIds}
        />
      )}
    </FormContextProvider>
  );
}
