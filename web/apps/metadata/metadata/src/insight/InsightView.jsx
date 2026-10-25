import React, { useEffect, useState } from "react";
import { CircularProgress } from "@mui/material";
import { useLocation } from "react-router-dom";
import FilterView from "./FilterView";
import { userVerify } from "../service/Http";

const InsightView = () => {
  // const location = useLocation();
  // const params = new URLSearchParams(location.search);
  const params = new URLSearchParams(window.location.search);
  const query = params.get("query");
  const [isLoggedIn, setLoggedIn] = useState(process.env.NODE_ENV === "development");

  // verify login
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      userVerify().then(res => {
        if (res) {
          setLoggedIn(true);
        } else {
          window.location.href = "/omero_plus/login/?url=%2Fmetadata%2Fportal"
        }
      })
    }
  }, []);

  if (!isLoggedIn) {
    return (
      <div className="bg-light py-5 h-100">
          <div className="container">
            <CircularProgress /> {' Searching...'}
          </div>
      </div>
    );
  }

  return (
    <>
      <FilterView query={query} />
    </>
  );
};

export default InsightView;
