import React, { useEffect, useState } from "react";
// import styled from '@emotion/styled';
import { Button, TablePagination } from "@mui/material";
import { getMatchingObjects } from "../../Http";
import PaginationThemeProvider from "../../../sections/Table/PaginationTheme";
import PageActions from "../../../sections/Table/PageActions";
import useFacetData from "../../Facet/FacetStore";
import { countsForChart, getFilterData } from "../../Summary/Util";
import SummaryView from "../../Summary/SummaryView";
import * as muiStyled from './PlateStyled';

const PlateView = ({
  plateIds=[],
  results
}) => {
  if (!plateIds || plateIds.length === 0) {
    return <div>No matches found</div>;
  }

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(40);
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value));
  };

  const [state, action] = useFacetData();
  const filterData = getFilterData(results, state?.activeFacets);
  
  // sort images to display
  const startIndex = page * rowsPerPage;
  const endIndex = (page + 1) * rowsPerPage;
  const plates = results?.slice(startIndex, endIndex);

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
      imagingMethodCount={imagingMethodSummary.counts}
      imagingFacilityCount={imagingFacilitySummary.counts}
      biosampleTypeCount={biosampleTypeSummary.counts}
      organismCount={organismSummary.counts}
    />
      <div className="plate-icons">
        <muiStyled.OuterContrainer>
          <muiStyled.ResultsContainer className="row">
            {plates?.map((item, idx) => (
              <muiStyled.CardContrainer className="col-md-2">
                <div class="card-body">
                  <muiStyled.CardTitleOuter>
                    <muiStyled.CardTitle>Plate Id: {item?.id}</muiStyled.CardTitle>
                  </muiStyled.CardTitleOuter>
                  <ul>
                    <muiStyled.ListItem>
                      Plate Name : {item?.name}
                    </muiStyled.ListItem>
                  </ul>
                  <a 
                    class="dropdown-item" 
                    href={`/webclient/?show=plate-${item?.id}`} 
                    target="_blank"
                  >
                    <muiStyled.ViewButton>
                      View in OMERO
                    </muiStyled.ViewButton>
                  </a>
                </div>
              </muiStyled.CardContrainer>
            ))}
          </muiStyled.ResultsContainer>
          <div className="row">
            <PaginationThemeProvider>
              <TablePagination
                rowsPerPageOptions={[20, 40, 60, 80, 100, 200]}
                component="div"
                count={plateIds?.length || 0}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                ActionsComponent={PageActions}
              />
            </PaginationThemeProvider>
          </div>
        </muiStyled.OuterContrainer>
      </div>
    </>
  );
};

export default PlateView;
