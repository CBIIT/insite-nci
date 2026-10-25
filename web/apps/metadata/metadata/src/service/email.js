import _ from "lodash";
import { generateExcelExport2 } from "../sections/excel/generate/GenerateExcel2";
import { generateJsonMetadata } from "../sections/Json/export/export";

/**
 * send email notification with attached documents
 * @param {*} form 
 * @param {*} displayFieldOptions 
 * @param {*} displayFormFields 
 * @returns success / failure
 */
export const sendEmailNotification = async (
    form,
    displayFieldOptions,
    displayFormFields,
) => {
    // send excel email
    const recipients = (form?.recipients || []).filter((r) => r.enabled).map((r) => r.email);
    if (recipients.length > 0) {
        const d = new Date();
        const timestamp = [
        d.getFullYear(),
        d.getMonth() + 1,
        d.getDate(),
        d.getHours(),
        d.getMinutes(),
        d.getSeconds(),
        ].join('');

        const filename =
            ["metadata", _.snakeCase(form.imagingFacilityName || ""), _.snakeCase(form.datasetId || ""), timestamp]
            .filter(Boolean)
            .join("_") + ".xlsx";
        const jsonFilename =
            ["metadata", _.snakeCase(form.imagingFacilityName || ""), _.snakeCase(form.datasetId || ""), timestamp]
            .filter(Boolean)

        const subject = form?.emailInfo?.subject || null;
        const content = form?.emailInfo?.content || null;

        const sendEmailUrl = `api/sendEmail`;
        const formData = new FormData();
        const buffer = await generateExcelExport2(form, 1, displayFieldOptions, displayFormFields);
        const blob = new Blob([new Uint8Array(buffer)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        
        // prepare json object
        const jsonObjects = await generateJsonMetadata(form, displayFormFields);
        const jsonBlob = new Blob([JSON.stringify(jsonObjects, null, 2)], {
            type: "application/json",
        });
        
        formData.append("file", blob, filename);
        formData.append("metadata", jsonBlob, jsonFilename);

        formData.append("emailSubject", subject);
        formData.append("emailContent", content);
        
        recipients.forEach(id => {
            formData.append("recipient", id);   
        })
        
        const response = await fetch(sendEmailUrl, {
            method: "POST",
            body: formData,
        });

        let responseBody = {};
        try {
            responseBody = await response.json();
        } catch {
            // Preserve the HTTP status when the server does not return JSON.
        }

        if (!response.ok) {
            throw new Error(responseBody.error || `Email request failed with status ${response.status}.`);
        }
        return true;
    }
    throw new Error("No enabled email recipients were provided.");
}