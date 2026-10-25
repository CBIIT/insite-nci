import React, { useEffect, useState } from "react";
import { CircularProgress } from "@mui/material";
import { getMatchingObjects } from "../../Http";
import { countsForChart } from "../../Summary/Util";
import FacetView from "../../Facet/FacetController";
import ProjectView from "./ProjectResult";

const DatasetResultController = ({
  projectIds = [],
}) => {
  if (projectIds.length === 0) {
    return <>No matches found</>;
  }

  const [results, setResults] = useState([]);
  useEffect(() => {
    if (projectIds) {
      getMatchingObjects('projects', projectIds)
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
            imagingMethodCount: imagingMethodSummary.counts,
            imagingFacilityCount: imagingFacilitySummary.counts,
            biosampleTypeCount: biosampleTypeSummary.counts,
            organismCount: organismSummary.counts
          }}
        />
      </div>
      <div class="col-md-10">
        <ProjectView
          projectIds={projectIds}
          results={results}
          data={data}
        />
      </div>
    </div>
  );
};

export default DatasetResultController;
