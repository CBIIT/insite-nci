"use client";

import React, { useEffect, useReducer, useState } from "react";
import _ from "lodash";
import Dropdown from "react-bootstrap/Dropdown";
import reducer from "./state/Reducers";
import { useFormContext } from "./FormContextProvider";
import { defaultForm } from "./form";
import StudyView from "./sections/study/Study";
import { 
  addMultiWellPlate,
  addRecipient,
  addSample,
  addSection,
  onUploadForm,
  resetForm,
  updateFormChange,
} from "./state/Actions";
import MultiwellPlateView from "./sections/multiwell/MultiWellView";
import { Accordion } from "react-bootstrap";
import BiosampleView from "./sections/biosamples/BiosampleView";
import ImageInfo from "./sections/imageInfo/ImageInfo";
import LayerROI from "./sections/layerROI/LayerView";
import {
  archiveMetadataFiles,
  downloadExcel,
  downloadJson,
  downloadZip, 
  generateExcelBlob,
  getTimestamp, 
  readFile,
  safeClone,
} from "./sections/utils2";
import { loadExcelMetaData } from "./sections/excel/load/LoadExcel";
import { generateJsonMetadata } from "./sections/Json/export/export.js";
import ProgressDialog from "./sections/Progress/Dialog";
import { exportFileMetadata } from "./sections/File/Export.js";
import { appendFileMetadata, getImageIds, postSubmissionHistory } from "./service/Http.js";
import useFormData from "./sections/history/HistoryStore.js";
import DynamicSnackbar from "./sections/Snackbar/SnackerView.jsx";
import useSuggestionList from "./sections/suggestion/SuggestionStore.js";
import { importBSSJSON } from "./sections/utils/ImportBSSJSON.js";
import EmailRecipientsPanel from "./components/EmailRecipientsPanel.jsx";
import { Tooltip } from "@mui/material";
import { sendEmailNotification } from "./service/email.js";

export default function FormView({
  imgFacility,
  optionalFeatures,
  handleImageFacilitychange,
  displayFormFields,
  displayFieldOptions,
  importExcelMetadata,
  file,
  groupId,
  omeroObjectIds,
}) {
  const [alerts, setAlerts] = useState([]);
  const [isUploading, setUploading] = useState(false);
  const [isPageLoading , setPageLoading] = useState(false);
  const [showSubmitEmailReview, setShowSubmitEmailReview] = useState(false);
  const [pendingEmailSettings, setPendingEmailSettings] = useState(null);

  const initFormState = () => (
    safeClone({
        ...defaultForm,
        imagingFacility: imgFacility,
        dataProvenance: imgFacility,
        imagingFacilityName: imgFacility?.label,
        imagingFacilityAbbreviation: imgFacility?.abbreviation
      }
    ));

  /**
  * Initailize useReducer state
  * 1. form: state
  * 2. dispatch: dispatch action (as redux action) to update pagination state
  */
  const [form, dispatch] = useReducer(reducer, {}, initFormState);

  /**
  * use context to provide form state to wrapper component
  */
  const formContext = useFormContext();
  useEffect(() => {
    /**
    * set context on form state change
    * set display fields / options
    */
    const { setContext } = formContext;
    setContext({
      ...form,
      displayFormFields,
      displayFieldOptions,
      optionalFeatures,
      dispatch
    });
    console.log(form);
  }, [form, displayFieldOptions]);


  // update form value from excel
  useEffect(() => {
    if(file) {
      loadExcelMetaData(
        file,
        displayFieldOptions,
        displayFormFields
      ).then(response => {
        dispatch(updateFormChange(response));
      });
    }
  }, [file]);

  function handleReset(ev) {
    dispatch(resetForm());
  }

  const appendMetadata = async (jsonObjects) => {
    setUploading(true);
    setAlerts([]);
    let success = true;
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
          setAlerts([{ id: Date.now(), type: "success", message: "Metadata appended successfully." }]);
        }
        else {
          setAlerts([{ id: Date.now(), type: "danger", message: "Metadata submission failed." }]);
          success = false;
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
    const jsonMetadata = await generateJsonMetadata(form, displayFormFields);
    if (groupId) {
      jsonMetadata.groupId = groupId;
    }
    // append plate wells per http call
    const wellObjects = (jsonMetadata?.keyValueByPlate || []).map(({
      // wellMetadata,
      wellsKeyValue
    }) => ({
      // "well_tags": wellMetadata,
      "multiWell_tags": wellsKeyValue
    }));
    // append metadata
    const jsonObjects = [jsonMetadata, ...wellObjects];
    let isSuccess = await appendMetadata(jsonObjects);

    // append file
    const appendFiles = exportFileMetadata(form, displayFormFields);
    if (appendFiles) {
      isSuccess = await appendFileMetadata(appendFiles);
    }
    await archiveFiles(async () => ({
      excelBlob: await generateExcelBlob(form, 1, displayFieldOptions, displayFormFields),
      jsonBlob: new Blob([JSON.stringify(jsonMetadata, null, 2)], { type: "application/json" }),
      jsonMetadata,
    }));
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
      const invalidFields = invalids.map((f, index) => `(${index + 1}) ${f.dataset.label || f.name || f.id || '[unnamed field]'} `);
      setAlerts([{ id: Date.now(), type: "danger", message: `Please fill out required fields ${invalidFields}` }]);
      formEl.reportValidity();
      return;
    } else {
      setAlerts([]);
    }
    // submitJsonMetadata();

    if (Number(form.imagingFacility?.value) === 9) {
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
        const emailForm = emailSettings ? { ...form, ...emailSettings } : form;
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
    // const action = isSuccess ? 'submit - success' : 'submit - failed';
    // const res = postSubmissionHistory(form, action);
  }

  function confirmEmailReview(emailSettings) {
    setPendingEmailSettings(emailSettings);
    setShowSubmitEmailReview(false);
    addRecipientHandler(emailSettings);
  }

  async function submitAfterEmailReviewExit() {
    if (!pendingEmailSettings) return;
    const emailSettings = pendingEmailSettings;
    setPendingEmailSettings(null);
    await completeSubmit(emailSettings);
  }

  function addMultiwellPlateHandler() {
    dispatch(addMultiWellPlate(form));
  }

  function addSampleHandler() {
    dispatch(addSample(form));
  }

  function handleAddSection (section) {
    dispatch(addSection(form, section))
  }

  async function importBSSHandler(event) {
    const { bssUpdateForm: updateForm, nofiticationMsg } = await importBSSJSON(event, displayFormFields, form);
    setSnackText(nofiticationMsg)
    dispatch(onUploadForm(updateForm));
  }

  async function archiveFiles(buildFiles) {
    try {
      const { excelBlob, jsonBlob, jsonMetadata } = await buildFiles();
      const formDatasetId = String(form.datasetId || "").trim();
      const archiveObjectIds = {
        projectIDs: [
          ...(omeroObjectIds?.projectIDs || []),
          form.omeroScreenOrProjectId,
        ].filter(Boolean),
        datasetIDs: [
          ...(omeroObjectIds?.datasetIDs || []),
          ...(form.samples || []).map((sample) => sample.omeroObjectId),
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

  async function downloadExcelMetadata() {
    const timestamp = getTimestamp();
    const filename =
      [
        "metadata",
        _.snakeCase(form.imagingFacilityName || ""),
        _.snakeCase(form.datasetId || ""),
        timestamp,
      ]
        .filter(Boolean)
        .join("_") + ".xlsx";
    const excelBlob = await downloadExcel(form, filename, 1, displayFieldOptions, displayFormFields);
    await archiveFiles(async () => {
      const jsonMetadata = await generateJsonMetadata(form, displayFormFields);
      return {
        excelBlob,
        jsonBlob: new Blob([JSON.stringify(jsonMetadata, null, 2)], { type: "application/json" }),
        jsonMetadata,
      };
    });
  }

  async function downloadJsonMetadata() {
    const timestamp = getTimestamp();
    const filename =
      [
        "metadata",
        _.snakeCase(form.imagingFacilityName || ""),
        _.snakeCase(form.datasetId || ""),
        timestamp,
      ]
        .filter(Boolean)
        .join("_") + ".json";
    
    const jsonMetadata = await generateJsonMetadata(form, displayFormFields);
    const jsonBlob = downloadJson(jsonMetadata, filename);
    await archiveFiles(async () => ({
      excelBlob: await generateExcelBlob(form, 1, displayFieldOptions, displayFormFields),
      jsonBlob,
      jsonMetadata,
    }));
  }

  async function downloadAllMetadata() {
    const timestamp = getTimestamp();
    const filename =
      [
        "metadata",
        _.snakeCase(form.imagingFacilityName || ""),
        _.snakeCase(form.datasetId || ""),
        timestamp,
      ]
        .filter(Boolean)
        .join("_") + ".zip";
    const files = await downloadZip(form, filename, displayFieldOptions, displayFormFields);
    await archiveFiles(async () => ({
      ...files,
      jsonMetadata: await generateJsonMetadata(form, displayFormFields),
    }));
  };

  // upload form from history
  const [formState, ] = useFormData();
  useEffect(() => {
    if (formState) {
      const frm = formState.formData;
      // const facility = frm.imagingFacility
      // const facId = facility?.value;
      // const dirName = facility?.dirName || undefined;
      dispatch(onUploadForm(frm));
    }
  }, [formState]);

  const [snackText, setSnackText] = useState("");
  const [severity, setSeverity] = useState("");
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

  // image id suggestion list
  const { context } = formContext;
  const { samples = [], omeroScreenOrProjectId } = context;
  const [state, action] = useSuggestionList();

  useEffect(() => {
    const projectId = omeroScreenOrProjectId;
    let reqBody = {};
    // get images based on project
    if (projectId) {
      reqBody = {
        projectId
      };
      getImageIds(reqBody).then(res => {
        action.setImageList(res);
      });
    } else {
      // get images based on dataset ids
      const datasetIds = []; 
      samples.forEach((sp) => {
        datasetIds.push(sp.omeroObjectId);
      });
      if (datasetIds.length > 0) {
        reqBody = {
          datasetIds
        };
        getImageIds(reqBody).then(res => {
          action.setImageList(res);
        });
      }
    }
  }, [samples, omeroScreenOrProjectId]);

  // add email notification
  function addRecipientHandler(recipients) {
    dispatch(addRecipient(recipients));
  }

  return (
    <div className="bg-light py-5 h-100">
      <ProgressDialog
        isOpen={isUploading}
        message={"Processing submission..."}
      />
      <div className="container">
        <div className="row">
          <div className="col">
            {alerts.map((alert, index) => (
              <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert" key={index}>
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
              {/* <label className="btn btn-outline-primary me-2">
                <input type="file" className="visually-hidden" accept=".xlsx" onChange={importExcelMetadata} />
                Import Excel File
              </label> */}
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
            <form onReset={handleReset} onSubmit={handleSubmit} noValidate>
              <Accordion defaultActiveKey="0" className="mb-3" alwaysOpen>
                <StudyView
                  handleImageFacilitychange={handleImageFacilitychange}
                />
              </Accordion>
              <BiosampleView /> 
              <MultiwellPlateView />
              <ImageInfo />
              <LayerROI />
              <div className="d-flex flex-wrap justify-content-between">
                <div>
                  <button type="button" className="btn btn-outline-primary me-1 mb-1" onClick={addSampleHandler}>
                    Add Biosample
                  </button>
                  {
                    (optionalFeatures?.addMultiwellPlate?.display === "Add") && (
                      <button
                        type="button"
                        className="btn btn-outline-primary me-1 mb-1"
                        onClick={addMultiwellPlateHandler}
                      >
                        Add Multiwell Plate
                      </button>
                    )
                  }
                  {
                    (optionalFeatures?.imageInfoButton) && (
                      <button
                        type="button"
                        className="btn btn-outline-primary me-1 mb-1"
                        onClick={() => handleAddSection('imageInfos')}
                      >
                        Add ImageInfo
                      </button>
                    )
                  }
                  {
                    (optionalFeatures?.addLayROIButton) && (
                      <button
                        type="button"
                        className="btn btn-outline-primary me-1 mb-1"
                        onClick={() => handleAddSection('layerROIs')}
                      >
                        Add LayerROI
                      </button>
                    )
                  }
                  {
                    (optionalFeatures?.isBSSTrackerEnable) && (
                      <button
                        type="file"
                        accept=".json"
                        className="btn btn-outline-primary me-1 mb-1"
                        onClick={importBSSHandler}
                      >
                        Import BSS JSON
                      </button>
                    )
                  }
                </div>
                 <DynamicSnackbar
                  text={snackText}
                  severity={severity}
                />
                <div className="d-flex flex-wrap  justify-content-between">
                  <button type="reset" className="btn btn-outline-danger me-1 mb-1">
                    Reset
                  </button>
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-dark" className="btn me-1 mb-1" id="download-options">
                      Download
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item as="button" type="button" onClick={() => downloadAllMetadata(form)}>
                        All (.zip)
                      </Dropdown.Item>
                      <Dropdown.Item as="button" type="button" onClick={() => downloadExcelMetadata()}>
                        Excel format (.xlsx)
                      </Dropdown.Item>
                      <Dropdown.Item as="button" type="button" onClick={downloadJsonMetadata}>
                        Json format (.json)
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                  {/* <button
                    className="btn btn-outline-secondary mb-1 mx-2"
                    type="button"
                    onClick={onFormSave}
                  >
                    Save
                  </button> */}
                  <div className="mb-1 mx-2">
                    <EmailRecipientsPanel
                      form={form}
                      updateRecipients={addRecipientHandler}
                      defaultRecipients={form?.email ? [ form?.email ]: []}
                      groupId={groupId}
                      projectIds={[
                        ...(omeroObjectIds?.projectIDs || []),
                        form.omeroScreenOrProjectId,
                      ].filter(Boolean)}
                      submitReviewOpen={showSubmitEmailReview}
                      onConfirmSubmit={confirmEmailReview}
                      onCancelSubmit={() => setShowSubmitEmailReview(false)}
                      onSubmitReviewExited={submitAfterEmailReviewExit}
                    />
                  </div>
                  {/* <button
                    type="button"
                    className="btn btn-outline-primary mb-1 mx-2"
                    title="Send email notification on submission"
                    onClick={() => setShowRecipients(true)} // <-- open your dialog
                  >
                    <i className="bi bi-envelope"></i>
                  </button> */}
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
  );
};
