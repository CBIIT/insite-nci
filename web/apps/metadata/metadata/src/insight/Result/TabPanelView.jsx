import React, { useEffect, useState } from "react";
import clsx from "clsx";
import {
  CircularProgress,
  styled,
  Tab,
  Tabs
} from "@mui/material";
import ImageResultView from "./Image/ImageResultController";
import ScreenView from "./Screen/ScreenResultController";
import PlateView from "./Plate/PlateController";
import ProjectView from "./Project/ProjectResultController";
import DatasetView from "./Dataset/DatasetResultController";
import WellView from "./Well/WellResultController";
import useSearchData from "../InsightStore";

const NavContainer = styled('div')({
  display: 'flex',
  width: '100%',
  paddingLeft: '350px', // increased from 30px → 60px
  boxShadow: 'inset -1px -3px 0px -1px #c2bcc288',
});

const MuiTabView = styled(Tab)(({ theme, isActive }) => ({
  height: 50,
  padding: '6px 30px',
  overflow: 'hidden',
  position: 'relative',
  fontSize: 18,
  maxWidth: 264,
  minWidth: 130,
  color: '#5785a1',
  boxShadow: isActive ? '-1px -7px 10px 1px #c2bcc288' : '',
  background: isActive
    ? "#f8f9fa"
    : "#e7e5e5",
  borderTop: '0.9px solid #C4C4C4',
  borderLeft: '0.9px solid #C4C4C4',
  borderRight: '0.9px solid #C4C4C4',
  borderTopLeftRadius: 5,
  borderTopRightRadius: 5,
  marginTop: 20,
  marginLeft: 10,
  marginRight: 10,
  minHeight: 48,
  textAlign: 'center',
  flexShrink: 0,
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  fontWeight: 500,
  lineHeight: 1.75,
  letterSpacing: '0.02857em',
  textTransform: 'uppercase',
  textDecoration: 'none',
}));

const TabView = () => {
  const [tab, setTab] = useState(1);
  const [state, ] = useSearchData();
  
  // const [facetState,] = useFacetData();

  const objectTypes = [
    "images",
    "wells",
    "plates",
    "screens",
    "projects",
    "datasets"
  ];
  const tabItems = objectTypes
    .filter(item => state?.results?.[item]?.length > 0);

  // console.log(state);
  useEffect(() => {
    // console.log(state);
    const defaultTabIndex = objectTypes.indexOf(tabItems[0]) + 1 || 1;
    if(tabItems.length > 0) {
      setTab(defaultTabIndex);
    }
  }, [state?.currQuery, state?.isSearching]);

  if (state?.isSearching) {
    return (
      <div className="bg-light py-5 h-100">
          <div className="container">
            <CircularProgress /> {' Searching ...'}
          </div>
      </div>
    );
  }

  const handleChange = (event, newValue) => {
    event.preventDefault(); 
    setTab(newValue);
  }

  return (
    <>
      <>
        <div>
          <div class="d-flex justify-content-between align-items-center mb-3">
            <NavContainer>
              <Tabs
                onChange={handleChange}
                value={tab}
              >
                {tabItems.includes("images") && (
                  <MuiTabView
                    value="1"
                    label={`IMAGE (${state?.results?.images?.length || 0})`}
                    wrapped
                    isActive={tab === 1}
                  />
                )}
                {tabItems.includes("wells") && (
                  <MuiTabView
                    value="2"
                    label={`Well (${state?.results?.wells?.length || 0})`}
                    wrapped
                    isActive={tab === 2}
                  />
                )}
                {tabItems.includes("plates") && (
                  <MuiTabView
                    value="3"
                    label={`Plate (${state?.results?.plates?.length || 0})`}
                    wrapped
                    isActive={tab === 3}
                  />
                )}
                {tabItems.includes("screens") && (
                  <MuiTabView
                    value="4"
                    label={`Screen (${state?.results?.screens?.length || 0})`}
                    wrapped
                    isActive={tab === 4}
                  />
                )}
                {tabItems.includes("projects") && (
                  <MuiTabView
                    value="5"
                    label={`Project (${state?.results?.projects?.length || 0})`}
                    wrapped
                    isActive={tab === 5}
                  />
                )}
                {tabItems.includes("datasets") && (
                  <MuiTabView
                    value="6"
                    label={`Dataset (${state?.results?.datasets?.length || 0})`}
                    wrapped
                    isActive={tab === 6}
                  />
                )}
              </Tabs>
            </NavContainer>
          </div>
        </div>
        <div class="row">
          <div class="tab-content clearfix">
            {(tab == 1) && (
              <ImageResultView
                imageIds={state?.results?.images || []}
              />
            )}
            {(tab == 2) && (
              <WellView
                wellIds={state?.results?.wells || []}
              />
            )}
            {(tab == 3) && (
              <PlateView
                plateIds={state?.results?.plates || []}
              />
            )}
            {(tab == 4) && (
              <ScreenView
                screenIds={state?.results?.screens || []}
              />
            )}
            {(tab == 5) && (
              <ProjectView
                projectIds={state?.results?.projects}
              />
            )}
            {(tab == 6) && (
              <DatasetView
                datasetIds={state?.results?.datasets || []}
              />
            )}
          </div>
        </div>
      </>
    </>
  );
};

export default TabView;
