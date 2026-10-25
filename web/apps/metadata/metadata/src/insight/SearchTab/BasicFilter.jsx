import React, { useEffect, useState } from "react";
import styled from '@emotion/styled'
import { searchQuery } from "../Http";
import useSearchData from "../InsightStore";

const InputSerachBox = styled.input`
  padding: .5rem 3rem;
  display: block;
  width: 100%;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
  color: var(--bs-body-color);
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-color: var(--bs-body-bg);
  background-clip: padding-box;
  border: var(--bs-border-width) solid var(--bs-border-color);
`;

/**
 * @param {*} queryVariables
 * @param {*} table (table state)
 * @param {*} tab (tab)
 * @returns table data
 */
const getQuerySearchResults = (query) => {
  const [data, setSearchData] = useState(undefined);
  
  async function getData() {
    const results = {};
    const types = ["images", "wells", "plates", "screens", "projects", "datasets"];
    for (const type of types) {
      try {
        const data = await searchQuery(query, type); // <-- await here
        // choose the payload your UI expects
        const payload = data ?? [];
        results[type] = payload;
      } catch (err) {
        console.error(`search ${type} failed`, err);
        action.setSearchData(type, []); // keep shape consistent
      }
    }
    return results;
  }

  useEffect(() => {
    const controller = new AbortController();
    getData().then(res => {
      if (res) {
        setSearchData(res);
      }
    });
    
    return () => {
      // cancel the request before component unmounts
      controller.abort();
    };
  }, []);
  
  return data;
};

const BasicFilter = ({
  pathQuery = ''
}) => {
  const [query, setQuery] = useState(pathQuery);
  const [state, action] = useSearchData();

  useEffect(() => {
    // const results = getQuerySearchResults(query);
    // if(results) {
    //   action.setResultSetIds(results);
    // }
    if (pathQuery) {
        action.setQuery(pathQuery);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (state?.currQuery && state?.currQuery?.length > 0) {
      // const queryUrl = `query=${encodeURIComponent(query)}`;
      // const queryUrl = query;
      action.startSearch(state?.currQuery);
      // const results = getQuerySearchResults(query);
      const types = ["images", "wells", "plates", "screens", "projects", "datasets"];
      const results = {};
      for (const type of types) {
        try {
          const data = await searchQuery(state?.currQuery, type); // <-- await here
          // choose the payload your UI expects
          const payload = data ?? [];
          results[type] = payload;
        } catch (err) {
          console.error(`search ${type} failed`, err);
          action.setSearchData(type, []); // keep shape consistent
        }
      }
      action.setResultSetIds(results)
    }
  };

  const onTextChange = (e) => {
    const val = e?.target?.value;
    action.setQuery(val);
    setQuery(val);
  }

  return (
    <div class="tab-pane fade show active" id="simple-search" role="tabpanel" aria-labelledby="simple-search-tab">
      <form id="simple-search-form" onSubmit={handleSubmit}>
        <div class="search-container">
          <i class="bi bi-search search-icon"></i>
          <InputSerachBox 
            type="text" 
            class="form-control form-control-lg search-input" 
            id="simple-query" 
            name="query"
            placeholder="Search by slide ID, tissue type, diagnosis, or any metadata..."
            value={state?.currQuery}
            onChange={onTextChange}
          />
          <button
            type="submit"
            class="btn btn-primary position-absolute end-0 top-0 bottom-0 px-4 rounded-end"
          >
            Search
          </button>
        </div>
      </form>
    </div>
  );
};

export default BasicFilter;
