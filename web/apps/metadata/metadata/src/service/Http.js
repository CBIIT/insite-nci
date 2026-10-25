import { snakeCase } from "lodash";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { getTimestamp } from "../utils";

/**
* redirect users to login page
* @returns
*/
export const userVerify = async () => {
  const verifyEndpoint = `api/verify`;
  const response = await fetch(verifyEndpoint, {
    method: "POST",
  });

  if (!response.ok) {
    let resData = await response.json();
    window.location.href = "/omero_plus/login/?url=%2Fmetadata%2F"
    // throw new Error(`Server error: ${response.status}`);
  }

  try {
    // Code that might throw an error
    const data = await response.json();
    console.log("Suggestions retrieved:", data);
    return data;
  } catch (error) {
    console.log("Please logged in");
    return null;
  }
};

export const getSuggestionsByObjectType = async (objectType, query) => {
  const endpoint = 'api/suggestionsByUser';
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        objectType,
        query
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    if (data) { 
      return data;
    }
    return data;

  } catch (error) {
    console.error("Failed to fetch suggestions:", error);
    return null;
  }
}


/**
* redirect users to login page
* @returns
*/
export const getSuggestions = async (objectTypes) => {
  const verifyEndpoint = `api/suggestions`;

  try {
    const response = await fetch(verifyEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        objectTypes: objectTypes
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    if (data?.matches) { 
      return data?.matches;
    }
    return data;

  } catch (error) {
    console.error("Failed to fetch suggestions:", error);
    return null;
  }
};

export const getImageIds = async (reqBody) => {
  const verifyEndpoint = `api/suggestions`;

  try {
    const response = await fetch(verifyEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...reqBody,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    if (data?.matches) { 
      return data?.matches;
    }
    return data;

  } catch (error) {
    console.error("Failed to fetch suggestions:", error);
    return null;
  }
};

/**
* get template by id
* @param {*} facilityId 
* @param {*} dirName 
* @returns 
*/
export function useFacilityTemplate(facilityId, dirName) {
  const [template, setTemplate] = useState(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!facilityId) return;

    const loadData = async () => {
      try {
        let fileName = `Facility_ID_${facilityId}`;
        if (dirName) fileName = `${fileName}_${dirName}`;
        const baseUrl = `/static/metadata/template/${fileName}.xlsx`;

        const response = await fetch(baseUrl);
        if (!response.ok) {
          setTemplate(null);
          setLoading(false);
          return;
        }

        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        let sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        sheetData = sheetData.map((row, index) => {
          const indexes = []
          row.forEach((item, itemIndex) => {
            indexes.push(itemIndex);
          })
          const rowItems = [];
          for (let i = 0; i < row.length; i++) {
            let value = 'N/A';
            if (indexes.includes(i)) {
              value = row[i]
            }
            rowItems.push(value);
          }
          return rowItems;
        }).filter((row, index) => (index > 0 && row.length > 5 && row[1] !== "N/A"));

        setTemplate(sheetData);
      } catch (err) {
        console.error("Error reading Excel file:", err);
        setTemplate(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [facilityId, dirName]);

  return { template, loading };
};

/**
 * get hierarchy mapping
 * @param {*} hierarchyItems 
 * @returns 
 */
export const getTemplateHierarchy = (hierarchyItems) => {
  const appendTags = {};
  const formFieldIndex = 1;
  const hierarchyMapModuleIndex = 6;
  const levelIndex = 7;
  const appendTagIndex = 8;
  const namespaceIndex = 9;
  // append tags
  hierarchyItems.forEach((row, index) => {
    // check to add tag
    if (('Yes' === row[appendTagIndex])) {
      if (!appendTags[row[levelIndex]]) {
        appendTags[row[levelIndex]] = [];
      }
      appendTags[row[levelIndex]].push(row[formFieldIndex]);
    }
  });

  const hierarchyMapping = hierarchyItems.reduce(
    (acc, row) => {
      const key = `${row[hierarchyMapModuleIndex]}`;
      //.replace(/\W/g, '');
      const namespace = `${row[levelIndex]}`;
      if (namespace.includes('N/A') || namespace.includes('n/a')) {
        return acc;
      }
      //.replace(/\W/g, '');
      if (!acc[namespace]) {
        acc[namespace] = {};
      }
      let targetItem = acc[namespace][key];
      if (!targetItem) {
        targetItem = {
          namespace: row[namespaceIndex],
          attributes: []
        };
      }
      targetItem.attributes.push(row[formFieldIndex]);
      acc[namespace][key] = targetItem;
    return acc;
  }, {});
  return { hierarchyMapping, appendTags };
};

/**
* get read me content
*/
export const getReadMeContent = async (facilityId, dirName) => {
  let fileName = `Facility_ID_${facilityId}`;
  if (dirName) {
    fileName = `Facility_ID_${facilityId}_${dirName}`;
  }
  const baseUrl = `/static/metadata/template/${fileName}.md`;
  const response = await fetch(baseUrl);
  if (!response.ok) {
    return false;
  }
  const data = await response.text();
  if (data) {
    return data;
  }
  return null;
}

export function useReadMeContent(facilityId, dirName) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!facilityId || !dirName) {
      setContent(null);
      setLoading(false);
      return;
    }

    const fetchContent = async () => {
      try {
        const readMe = await getReadMeContent(facilityId, dirName);
        setContent(readMe || null);
      } catch (error) {
        console.error("Failed to load ReadMe content:", error);
        setContent(null);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [facilityId, dirName]);

  return { content, loading };
}

/**
 * readme content
 * @param {*} facilityId 
 * @param {*} dirName 
 * @returns 
 */
export async function getReadMecontent(facilityId, dirName = undefined) {
  if (!facilityId) {
    log.error("{getReadMecontent} missing facility id");
  }
  const [content, setContent] = useState(null);
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const data = await getReadMeContent(facilityId, dirName);
        if (data) {
          setContent(data);
        }
      } catch (error) {
        console.error("Failed to fetch ReadMe:", error);
        setContent(null);
      }
    }
    fetchContent();
  }, [facilityId]);
  return content;
};

export async function appendFileMetadata (formData) {
  try {
    const endpoint = `api/upload-file`;
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });
    if (response.ok) {
      return true;
    }
  } catch (error) {
    return false;
  } 
};

export async function getImageInfo (imageId) {
  try {
    const endpoint = "api/imageInfo";
    const response = await fetch(endpoint, {
      method: "POST",
      body: JSON.stringify({"imageId" : imageId}),
    });
    if (response.ok) {
      const data = response.json()
      return data;
    }
  } catch (error) {
    return false;
  } 
};

export async function getSubmissionHistory() {
  try {
    const endpoint = "api/history";
    const response = await fetch(endpoint, {
      method: "POST",
      body: JSON.stringify({}),
    });
    if (response.ok) {
      const data = await response.json()
      return data?.response;
    }
  } catch (error) {
    return false;
  } 
};


export async function postSubmissionHistory(
  form,
  feedback
) {
  try {
    const facilityId = form?.imagingFacility?.value;
    const endpoint = "api/saveHistory";
    const timeAndDate = new Date().toLocaleString();
    console.log(timeAndDate);
    const filename =
    ["metadata", snakeCase(form?.imagingFacility?.label || ""), timeAndDate]
      .filter(Boolean)
      .join(" ");
    const body = {
      facilityId,
      form,
      filename,
      group: 'group',
      feedback,
      timeAndDate
    };
    const response = await fetch(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (response.ok) {
      const data = await response.json()
      return data;
    }
  } catch (error) {
    return false;
  } 
}
