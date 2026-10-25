
export async function searchQuery (
  query,
  objectType,
) {
  try {
    // const endpoint = `api/search?${queryUrl}`;
    const endpoint = `api/search-omero-object`;
    // fetch(endpoint).then(res => console.log(res));

    const response = await fetch(endpoint, {
      method: "POST",
      body: JSON.stringify({
        query,
        objectType,
      }),
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });
    if (response.ok) {
      const data = await response.json();
      return data.matchingIds;
    }
  } catch (error) {
    return false;
  } 
};


export async function searchQueryAdvance (
  query,
  objectType,
  additionalFilter = {},
) {
  try {
    // const endpoint = `api/search?${queryUrl}`;
    const endpoint = `api/search-omero-object-advance`;
    // fetch(endpoint).then(res => console.log(res));

    const response = await fetch(endpoint, {
      method: "POST",
      body: JSON.stringify({
        query,
        objectType,
        ...additionalFilter
      }),
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });
    if (response.ok) {
      const data = await response.json();
      return data.matchingIds;
    }
  } catch (error) {
    return false;
  } 
};

export async function getMatchingObjects(objectType, ids) {
  try {
    const endpoint = "api/object-details";
    const response = await fetch(endpoint, {
      method: "POST",
      body: JSON.stringify({
        ids,
        objectType
      }),
    });
     if (response.ok) {
      const res = await response.json();
      return res.data;
    }
  } catch (error) {
    return false;
  } 
};

