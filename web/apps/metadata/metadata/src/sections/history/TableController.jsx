import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import _ from "lodash";
import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import Table from "../Table/Table";
import { tblConfig } from "./tableConfig";
import useFormData from "./HistoryStore";
import { getFormTemplate, getTimestamp , downloadExcel} from "../../utils";

function isJsonString(str) {
  try {
    const parsed = JSON.parse(str);
    // Optional: only return true if it’s an object or array
    return parsed;
  } catch (e) {
    return false;
  }
}

const TableController = ({
  rows,
}) => {

  const [state, action] = useFormData();
  const navigate = useNavigate();

  const downloadExcelFile = (data) => {
    console.log(data);
    const form = isJsonString(data);
    if (form) {
      const imageFacilityId = form?.imagingFacility?.value || -1;
      const dirName = form?.imagingFacility?.dirName || undefined;
      getFormTemplate(imageFacilityId, dirName)
        .then((response) => {
          const { displayFormFields, formFieldOptions } = response;
          const timestamp = getTimestamp();
          const imagingFacilityName = form?.imagingFacility?.label;
          const filename = ["metadata", _.snakeCase(imagingFacilityName|| ""), _.snakeCase(form.datasetId || ""), timestamp]
              .filter(Boolean)
              .join("_") + ".xlsx";
          downloadExcel(form, filename, 1, formFieldOptions, displayFormFields);
      });
    }
  };

  const uploadForm = (data) => {
    const form = isJsonString(data);
    if (form) {
      action.setFormData(form);
      navigate("/");
    }
   };

  const getFormatedData = (timestamp) => {
    const date = new Date(timestamp.replace(" ", "T")); // replace space with 'T' for ISO format

    // Format as "Month day, year, hh:mm AM/PM"
    const options = { 
      year: "numeric", 
      month: "long", 
      day: "numeric", 
      hour: "2-digit", 
      minute: "2-digit", 
      hour12: true 
    };

    const formatted = date.toLocaleString("en-US", options);
    console.log(formatted);
    return formatted;
  }

  const CustomView = (label, row, field) => {
    switch(label) {
        case 'Download':
          return (
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => downloadExcelFile(row[field])}
            >
              Download
            </Button>
          )
        case 'Load':
          return (
            <Button
              variant="outlined"
              startIcon={<UploadFileIcon />}
              onClick={() => uploadForm(row[field])}
            >
              Load Form
            </Button>
            );
        // case 'Date':
        //   return (
        //     <>
        //       {getFormatedData(row[field])}
        //     </>
        //   )
        default:
          return <p>View</p>
    }
  };

  const cols = tblConfig.map((col) => ({
    ...col,
    CustomElem: (row) => CustomView(col.label, {...row}, col.field)
  }));

  return (
    <Table
      columns={cols}
      rows={rows}
      noRecordsMsg="No Matching Records Found"
    />
  );
}

export default TableController;
