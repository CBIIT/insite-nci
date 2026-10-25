import React, { useEffect, useState } from "react";
import { CircularProgress } from "@mui/material";
import { getMatchingObjects } from "../../Http";
import { countsForChart, getOmeroObjectCount } from "../../Summary/Util";
import FacetView from "../../Facet/FacetController";
import WellView from "./WellResult";

const WellResultController = ({
  wellIds = [],
}) => {
  if (wellIds.length === 0) {
    return <>No matches found</>;
  }

  const [results, setResults] = useState([]);
  useEffect(() => {
    if (wellIds) {
      getMatchingObjects('wells', wellIds)
        .then(res => {
          console.log(res);
          setResults(res);
      });
    }
  }, []);

  if (!results || results?.length === 0) {
    return (
        <CircularProgress />
    );
  }

  const data = results;
  
  if (!data || data.length === 0) {
    return (
      <CircularProgress />
    )
  }

  // Omero object type
  // 1. image -> dataset and project
  const datasets = getOmeroObjectCount(data, "Dataset");
  const projects = getOmeroObjectCount(data, "Project");
  // 2. image -> well, plate and screen
  // const wells = getOmeroObjectCount(data, "Well");
  const plates = getOmeroObjectCount(data, "Plate");
  const screens = getOmeroObjectCount(data, "Screen");
  
  const omeroObjectCount = [
    { name: "Dataset", value: datasets.length || 0},
    { name: "Project", value: projects.length || 0},
    { name: "Well", value: data.length || 0, },
    { name: "Plate", value: plates.length || 0, },
    { name: "Screen", value: screens.length || 0, }
  ];
  
  // imagin method
  const imgMethodKeys = { 
    imagingMethod: [
      "imagingMethod",
      "imaging method",
      "Imaging Method",
      "imaging_method"
    ]
  };
  const imagingMethodSummary = countsForChart(data, imgMethodKeys);
  
  // imagin facility
  const imgFacilityKeys = {
    imagingFacility: [
      "imagingFacility",
      "imaging facility",
      "Imaging Facility",
      "imaging_facility"
    ]
  };
  const imagingFacilitySummary = countsForChart(data, imgFacilityKeys);
  
  // imagin facility
  const biosampleType = {
    biosampleType: [
      "biosampleType",
      "biosample type",
      "Biosample Type",
      "biosample_type",
      "biosampletype",
      "sampleType", 
      "sample type", 
      "Sample Type", 
      "sample_type", 
      "sampletype"
    ]
  };
  const biosampleTypeSummary = countsForChart(data, biosampleType);
  
  // organism
  const organism = {
    organism: [
      "organism","Organism","organism.value",
      "specimens[0].organism","specimens[0].organism.value",
      "specimens[*].organism","specimens[*].organism.value"
    ]
  };
  const organismSummary = countsForChart(data, organism);
  
  return (
    <div class="row">
      <div class="col-md-2">
        <FacetView
          facetItems = {{
            omeroObjectCount,
            imagingMethodCount: imagingMethodSummary.counts,
            imagingFacilityCount: imagingFacilitySummary.counts,
            biosampleTypeCount: biosampleTypeSummary.counts,
            organismCount: organismSummary.counts
          }}
        />
      </div>
      <div class="col-md-10">
        <WellView
          wellIds={wellIds}
          results={results}
          data={data}
        />
      </div>
    </div>
  );
};

export default WellResultController;
