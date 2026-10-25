import React from "react";
import { createRoot } from "react-dom/client";
import {
  HashRouter, Routes, Route
} from "react-router-dom";
import InsightView from "./insight/InsightView";
import HeaderView from "./insight/HeaderView";
import FooterView from "./insight/FooterView";

const root = createRoot(document.getElementById("portal-root"));

root.render (
  <HashRouter>
    <HeaderView />
    <Routes>
      <Route path="/" element={<InsightView />} />
    </Routes>
    <FooterView />
  </HashRouter>
)
