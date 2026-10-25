import React from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  BrowserRouter,
  HashRouter, Routes, Route
} from "react-router-dom";
import { builder } from '@builder.io/react';
import SubmitMetadata from "./FormController";
import HistoryView from './sections/history/HistoryController';
import Layout from "./Layout";
import InsightView from "./insight/InsightView";
import BuilderPage from "./pages/BuilderSubmissionForm";

const root = createRoot(document.getElementById("root"));

root.render (
  <HashRouter>
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<SubmitMetadata />} />
        {/* <Route path="history" element={<HistoryView />} /> */}
        <Route path="test" element={<BuilderPage />} />
      </Route>
    </Routes>
  </HashRouter>
)
