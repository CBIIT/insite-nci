import React, { useEffect, useState } from "react";
import styled from '@emotion/styled';
import { Button, TablePagination } from "@mui/material";
import { getMatchingObjects } from "../../Http";
import PaginationThemeProvider from "../../../sections/Table/PaginationTheme";
import PageActions from "../../../sections/Table/PageActions";
import SummaryView from "../../Summary/SummaryView";
import { countsForChart, getFilterData } from "../../Summary/Util";
import useFacetData from "../../Facet/FacetStore";
import * as muiStyled from './WellStyled';

const WellView = ({ 
  wellIds = [],
  results
 }) => {
  if (!wellIds || wellIds.length === 0) {
    return <div>No matches found</div>;
  }

  // const [results, setResults] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(40);
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value));
  };

  // sort images to display
  const [state, action] = useFacetData();
  const filterData = getFilterData(results, state?.activeFacets);
  const startIndex = page * rowsPerPage;
  const endIndex = (page + 1) * rowsPerPage;
  const wells = results?.slice(startIndex, endIndex);

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
    <div className="well-icons">
      <muiStyled.OuterContrainer>
        <muiStyled.ResultsContainer className="row">
          {wells?.map((item, idx) => (
            <muiStyled.CardContrainer className="col-md-2">
              <div class="card-body">
                <muiStyled.CardTitleOuter>
                  <muiStyled.CardTitle>
                    Well id: {item?.id}
                  </muiStyled.CardTitle>
                </muiStyled.CardTitleOuter>
                <ul>
                  <muiStyled.ListItem>
                    Plate id : {item?.[`Plate_${item.parent_plate_id}`]?.id || ''}
                  </muiStyled.ListItem>
                  <muiStyled.ListItem>
                    Plate name : {item?.[`Plate_${item.parent_plate_id}`]?.name || ''}
                  </muiStyled.ListItem>
                </ul>
                <a 
                  class="dropdown-item" 
                  href={`/webclient/?show=well-${item?.id}`} 
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
              count={wellIds?.length || 0}
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

export default WellView;
