import React, { useEffect, useState } from "react";
import { styled, TablePagination } from "@mui/material";
import PaginationThemeProvider from "../../../sections/Table/PaginationTheme";
import { getMatchingObjects } from "../../Http";
import PageActions from "../../../sections/Table/PageActions";
import SummaryView from "../../Summary/SummaryController";
import FacetView from "../../Facet/FacetController";
import { countsForChart, getFilterData, getOmeroObjectCount } from "../../Summary/Util";
import useFacetData from "../../Facet/FacetStore";

const CardView = ({
  result, 
}) => {
  const name = result?.name || 'Unnamed';
  const description = result?.description || 'No description';
  const id = result?.id;

  return (
    <>
    <div class="col-md-2">
      <div class="result-card-image d-flex justify-content-center align-items-center">
        <img 
          src={`/webgateway/render_thumbnail/${id}`}
          alt={name}
          loading="lazy"
          onerror="this.onerror=null; this.style.display='none'; this.parentNode.innerHTML += '<i class=\'bi bi-image\' style=\'font-size: 3rem; opacity: 0.6;\'></i>';"
        />
      </div>
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h5 class="card-title mb-0 text-truncate">{name}</h5>
          </div>
          <div class="small mb-3 d-flex gap-2 align-items-center">
            <span class="badge bg-secondary">Image</span>
            <span class="text-muted">ID: {id}</span>
          </div>
          <p class="card-text small text-truncate">${description}</p>
          {(result?.owner) && (
            <div class="small text-muted mb-2">
              <i class="bi bi-person" /> {result?.owner?.name || 'Unknown'}
            </div>
          )}
          {result?.acquisition_date && (
            <div class="small text-muted">
              <i class="bi bi-calendar" /> 
              {new Date(result?.acquisition_date).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const ResultsView = styled('div')({
  marginTop: '25px',
});

const ImageResultsView = ({
  results,
  data
  // omeroObjectCount,
  // imagingMethodCount,
  // imagingFacilityCount,
  // biosampleTypeCount,
  // organismCount,
}) => {
  // if (imageIds.length === 0) {
  //   return <>No matches found</>;
  // }

  // const [results, setResults] = useState([]);
  const [page, setPage] = useState(0);

  const [rowsPerPage, setRowsPerPage] = useState(40);
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value));
  };

  // useEffect(() => {
  //   if (imageIds) {
  //     getMatchingObjects('images', imageIds)
  //       .then(res => {
  //         console.log(res);
  //         setResults(res);
  //     });
  //   }
  // }, []);

  // sort images to display
  const [state, action] = useFacetData();
  const filterData = getFilterData(data, state?.activeFacets);
  const startIndex = page * rowsPerPage;
  const endIndex = (page + 1) * rowsPerPage;
  const images = filterData?.slice(startIndex, endIndex);

  // Omero object type
  // 1. image -> dataset and project
  const datasets = getOmeroObjectCount(filterData, "Dataset");
  const projects = getOmeroObjectCount(filterData, "Project");
  // 2. image -> well, plate and screen
  const wells = getOmeroObjectCount(filterData, "Well");
  const plates = getOmeroObjectCount(filterData, "Plate");
  const screens = getOmeroObjectCount(filterData, "Screen");
  
  const omeroObjectCount = [
    { name: "Dataset", value: datasets.length || 0},
    { name: "Project", value: projects.length || 0},
    { name: "Well", value: wells.length || 0, },
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
  const imagingMethodSummary = countsForChart(filterData, imgMethodKeys);

  // imagin facility
  const imgFacilityKeys = {
    imagingFacility: [
      "imagingFacility",
      "imaging facility",
      "Imaging Facility",
      "imaging_facility"
    ]
  };
  const imagingFacilitySummary = countsForChart(filterData, imgFacilityKeys);

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
  const biosampleTypeSummary = countsForChart(filterData, biosampleType);

  // organism
  const organism = {
    organism: [
      "organism",           // e.g., { Organism: "Mouse" }
      "Organism",
      "organism.value",     // e.g., { "organism.value": "Mouse" }  <-- your first 6
      // common dotted/array paths you might see
      "specimens[0].organism",
      "specimens[0].organism.value",
      "specimens[*].organism",
      "specimens[*].organism.value",
    ]
  };
  const organismSummary = countsForChart(filterData, organism);

  return (
    <>
      <SummaryView
        results={results}
        summaryItems = {{
          omeroObjectCount,
          imagingMethodCount: imagingMethodSummary.counts,
          imagingFacilityCount: imagingFacilitySummary.counts,
          biosampleTypeCount: biosampleTypeSummary.counts,
          organismCount: organismSummary.counts,
        }}
      />
      <ResultsView>
        <hr />
        <div class="row">
        {
          (images) && (images).map(image => (
            <CardView result={image} />
          ))
        }
        </div>
        <div className="row">
          <PaginationThemeProvider>
            <TablePagination
              rowsPerPageOptions={[20, 40, 60, 80, 100, 200]}
              component="div"
              count={filterData?.length || 0}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              ActionsComponent={PageActions}
            />
          </PaginationThemeProvider>
        </div>
      </ResultsView>
    </>
  );
};

export default ImageResultsView;
