import React from "react";
import SummaryView from "./SummaryView";
import { CircularProgress, styled } from "@mui/material";
import mockData from './filter.json';
import { getOmeroObjectCount, countsForChart } from "./Util";

const SummaryContrainer = styled('div')({
  padding: '15px',
  border: '1px solid #'
});

const SummaryController = ({
  results,
  summaryItems,
}) => {
  // const data = results || mockData.data;
  // // Omero object type
  // // 1. image -> dataset and project
  // const datasets = getOmeroObjectCount(data, "Dataset");
  // const projects = getOmeroObjectCount(data, "Project");
  // // 2. image -> well, plate and screen
  // const wells = getOmeroObjectCount(data, "Well");
  // const plates = getOmeroObjectCount(data, "Plate");
  // const screens = getOmeroObjectCount(data, "Screen");

  // const omeroObjectCount = [
  //   { name: "Dataset", value: datasets.length || 0},
  //   { name: "Project", value: projects.length || 0},
  //   { name: "Well", value: wells.length || 0, },
  //   { name: "Plate", value: plates.length || 0, },
  //   { name: "Screen", value: screens.length || 0, }
  // ];

  // // imagin method
  // const imgMethodKeys = { 
  //   imagingMethod: [
  //     "imagingMethod",
  //     "imaging method",
  //     "Imaging Method",
  //     "imaging_method"
  //   ]
  // };
  // const imagingMethodSummary = countsForChart(data, imgMethodKeys);

  // // imagin facility
  // const imgFacilityKeys = {
  //   imagingFacility: [
  //     "imagingFacility",
  //     "imaging facility",
  //     "Imaging Facility",
  //     "imaging_facility"
  //   ]
  // };
  // const imagingFacilitySummary = countsForChart(data, imgFacilityKeys);

  // // imagin facility
  // const biosampleType = {
  //   biosampleType: [
  //     "biosampleType",
  //     "biosample type",
  //     "Biosample Type",
  //     "biosample_type",
  //     "biosampletype",
  //     "sampleType", 
  //     "sample type", 
  //     "Sample Type", 
  //     "sample_type", 
  //     "sampletype"
  //   ]
  // };
  // const biosampleTypeSummary = countsForChart(data, biosampleType);
  // console.log(biosampleTypeSummary);

  // // organism
  // const organism = {
  //   organism: [
  //     "organism",
  //     "Organism"
  //   ]
  // };
  // const organismSummary = countsForChart(data, organism);
  if (!summaryItems) {
    return (
      <CircularProgress />
    )
  }

  return (
    <SummaryContrainer>
      <SummaryView
        omeroObjectCount={summaryItems?.omeroObjectCount}
        imagingMethodCount={summaryItems?.imagingMethodCount || []}
        imagingFacilityCount={summaryItems?.imagingFacilityCount || []}
        biosampleTypeCount={summaryItems?.biosampleTypeCount || []}
        organismCount={summaryItems?.organismCount || []}
      />
    </SummaryContrainer>
  )
};

export default SummaryController;

