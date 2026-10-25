import React, { useEffect, useState } from "react";
import { searchQuery, searchQueryAdvance } from "../Http";
import useSearchData from "../InsightStore";

const AdvanceFilter = ({pathQuery = ''}) => {
  const [query, setQuery] = useState(pathQuery);
  const [searchGroup, setGroup] = useState("");
  const [startDate, setStartDate] = useState("");   // keep as YYYY-MM-DD string
  const [endDate, setEndDate] = useState("");       // keep as YYYY-MM-DD string
  const [objectType, setObjectType] = useState("");
  const [field, setField] = useState("");
  const [useAcquisitionDate, setUseAcquisitionDate] = useState(false);
  const [state, action] = useSearchData();

  useEffect(() => {
    if (pathQuery) {
      action.setQuery(pathQuery);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (state?.currQuery && state?.currQuery?.length > 0) {
      action.startSearch(state?.currQuery);
      // Compose filters; adjust to your API signature
      // Build params from state
      const params = new URLSearchParams();

      // if (query) params.set("query", query);
      // if (searchGroup) params.set("searchGroup", searchGroup);
      // if (objectType) params.set("objectType", objectType);
      // if (field) params.set("field", field);
      // if (startDate) params.set("startDate", startDate);
      // if (endDate) params.set("endDate", endDate);
      // if (useAcquisitionDate) params.set("useAcquisitionDate", `${useAcquisitionDate}`);
      // Build full URL
      const url = params.toString();
      const additionalFilters = {};
      if (state?.currQuery) additionalFilters["query"] = state?.currQuery;
      if (searchGroup) additionalFilters["searchGroup"] = searchGroup;
      if (field) additionalFilters["field"] = field;
      if (startDate) additionalFilters["startDate"] = startDate;
      if (endDate) additionalFilters["endDate"] = endDate;
      if (useAcquisitionDate) additionalFilters["useAcquisitionDate"] = `${useAcquisitionDate}`;

      // If your searchQuery expects (query, filters), change this call accordingly.
      let objectTypes = ["images", "wells", "plates", "screens", "projects", "datasets"];
      if (objectType) {
        objectTypes = [objectType];
      }
      const results = {};
      for (const type of objectTypes) {
        try {
          const data = await searchQueryAdvance(state?.currQuery, type, additionalFilters); // <-- await here
          // choose the payload your UI expects
          const payload = data ?? [];
          results[type] = payload;
        } catch (err) {
          console.error(`search ${type} failed`, err);
          action.setSearchData(type, []); // keep shape consistent
        }
      }
      action.setResultSetIds(results);
    }
  };

  const onTextChange = (e) => {
    const val = e?.target?.value;
    action.setQuery(val);
    setQuery(val);
  };

  const handleObjectTypeChange = (e) => {
    setObjectType(e.target.value ?? "");
  };

  const handleFieldChange = (e) => {
    setField(e.target.value ?? "");
  };

  const handleGroupIdChange = (e) => {
    setGroup(e.target.value ?? "");
  };

  const handleUseAcquisitionDate = () => {
    setUseAcquisitionDate((v) => !v);
  };

  // ✅ Date handler: keeps range coherent
  const handleDateChange = (e) => {
    const { name, value } = e.target; // value is "YYYY-MM-DD" from <input type="date">

    if (name === "startdateinput") {
      setStartDate(value);
      // If endDate exists and is before new startDate, snap endDate forward
      if (endDate && value && endDate < value) {
        setEndDate(value);
      }
    }

    if (name === "enddateinput") {
      setEndDate(value);
      // If startDate exists and is after new endDate, snap startDate back
      if (startDate && value && startDate > value) {
        setStartDate(value);
      }
    }
  };

  return (
    <div id="advanced-search" role="tabpanel">
      <form id="advanced-search-form" onSubmit={handleSubmit}>
        <div className="row g-3">
          <div className="col-md-4">
            <label htmlFor="object-type" className="form-label">Object Type</label>
            <select
              className="form-select"
              id="object-type"
              name="datatype"
              onChange={handleObjectTypeChange}
              value={objectType}
            >
              <option value="">All Object Types</option>
              <option value="images">Images</option>
              <option value="datasets">Datasets</option>
              <option value="projects">Projects</option>
              <option value="screens">Screens</option>
              <option value="plates">Plates</option>
              <option value="wells">Wells</option>
            </select>
          </div>

          <div className="col-md-4">
            <label htmlFor="search-field" className="form-label">Search Field</label>
            <select
              className="form-select"
              id="search-field"
              name="field"
              onChange={handleFieldChange}
              value={field}
            >
              <option value="">All Fields</option>
              <option value="name">Name</option>
              <option value="description">Description</option>
              <option value="annotation">Annotation</option>
              <option value="tag">Tag</option>
            </select>
          </div>

          <div className="col-md-4">
            <label htmlFor="search-query" className="form-label">Search Query</label>
            <input
              type="text"
              className="form-control"
              id="search-query"
              name="query"
              placeholder="Enter search terms"
              onChange={onTextChange}
              value={state?.currQuery}
            />
          </div>

          <div className="col-md-4">
            <label htmlFor="group-id" className="form-label">Group ID</label>
            <input
              type="number"
              className="form-control"
              id="group-id"
              name="searchGroup"
              placeholder="Filter by group ID"
              value={searchGroup}
              onChange={handleGroupIdChange}
            />
          </div>

          <div className="col-md-4">
            <label className="form-label">Date Range</label>
            <div className="row g-2">
              <div className="col">
                <input
                  type="date"
                  className="form-control"
                  name="startdateinput"
                  placeholder="Start date"
                  onChange={handleDateChange}
                  value={startDate || ""}
                />
              </div>
              <div className="col">
                <input
                  type="date"
                  className="form-control"
                  name="enddateinput"
                  placeholder="End date"
                  onChange={handleDateChange}
                  value={endDate || ""}
                />
              </div>
            </div>
          </div>

          <div className="col-md-4 d-flex align-items-end">
            <button type="submit" className="btn btn-primary w-100">
              Advanced Search
            </button>
          </div>

          <div className="col-12">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="useAcquisitionDate"
                name="useAcquisitionDate"
                checked={useAcquisitionDate}
                onChange={handleUseAcquisitionDate}
              />
              <label className="form-check-label" htmlFor="useAcquisitionDate">
                Use acquisition date instead of import date
              </label>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdvanceFilter;
