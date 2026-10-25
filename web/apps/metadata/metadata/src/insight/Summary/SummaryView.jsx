import React from "react";
import ChartView from "./BarChart";
import { styled } from "@mui/material";

const OuterContainer = styled('div')({
  background: "#e1e0e3",
});
const ChartContriner = styled('div')({
  display: "grid",
  gap: 16,
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" 
});

const SummaryView = ({
  omeroObjectCount,
  imagingMethodCount,
  imagingFacilityCount,
  biosampleTypeCount,
  organismCount,
}) => {

    return (
      <OuterContainer>
        <ChartContriner>
          {omeroObjectCount && (
            <ChartView
              title="Parent Object Type"
              data={omeroObjectCount}
            />
          )}
          {imagingMethodCount && (
          <ChartView
            title="Imaging Method"
            data={imagingMethodCount}
          />
          )}
          {
            imagingFacilityCount && (
              <ChartView
                title="Imaging Facility"
                data={imagingFacilityCount}
              />
            )
          }
          {
            biosampleTypeCount && (
              <ChartView
                title="Biosample Type"
                data={biosampleTypeCount}
              />
            )
          }
          {
            organismCount && (
              <ChartView
                title="Organism"
                data={organismCount}
              />
            )
          }
        </ChartContriner>
      </OuterContainer>
    );
};

export default SummaryView;
