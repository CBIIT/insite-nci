import React,  { useEffect, useState }  from "react";
import TabView from "./TabPanelView";
import useSearchData from "../InsightStore";
import { searchQuery } from "../Http";
import { CircularProgress } from "@mui/material";

const ResultsView = ({
  query
}) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [, action] = useSearchData();

  useEffect(() => {
    const ac = new AbortController(); // cancel on unmount
    const run = async () => {
      try {
        setLoading(true); 
        setError(null);

        action.startSearch(query);
        // const results = getQuerySearchResults(query);
        const types = ["images", "wells", "plates", "screens", "projects", "datasets"];
        const results = {};
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
        action.setResultSetIds(results);

      } catch (e) {
        if (e.name !== "AbortError") setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => ac.abort();
  }, [query]);

  if (loading) {
    return (
      <CircularProgress />
    )
  }

  return (
    <>
      <main class="flex-grow-1">
        <TabView />
      </main>
    </>
  )
}

export default ResultsView;
