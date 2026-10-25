import React, { useEffect, useState } from 'react';
import { Outlet, Link } from "react-router-dom";
import NavView from './sections/nav/NavView';
import { userVerify } from './service/Http';
import { CircularProgress } from '@mui/material';

const Layout = () => {
  const [isUploading, setUploading] = useState(false);
  const [isLoggedIn, setLoggedIn] = useState(process.env.NODE_ENV === "development");
  const [userInfo, setUserInfo] = useState({});

  // verify login
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      setUploading(true);
      userVerify().then(res => {
        if (res) {
          setLoggedIn(true);
          setUserInfo(res);
        } else {
          window.location.href = "/omero_plus/login/?url=%2Fmetadata%2F"
        }
      })
    }
    setUploading(false);
  }, []);

  if (!isLoggedIn || isUploading) {
    return (
      <div className="bg-light py-5 h-100">
          <div className="container">
            <CircularProgress /> {' Loading...'}
          </div>
      </div>
    );
  }

  return (
    <>
      {/* <NavView /> */}
      <Outlet context={{ userInfo, setUserInfo }} />
    </>
  );
}

export default Layout;
