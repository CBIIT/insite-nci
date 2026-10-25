import React, { useState } from "react";
import {
  Accordion,
  AccordionSummary, 
  AccordionDetails, 
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const AccordionView = ({
  className,
  children,
  title,
}) => {

  const [expanded, setExpanded] = useState(true);

  function onToggle (){
    setExpanded(!expanded);
  };

  return (
    <>
      <Accordion expanded={expanded} onChange={onToggle}>
        <AccordionSummary
          sx={{ backgroundColor: 'info.main', color: '#fff' }}
          expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }} />}
        >
          <h2 className="h4 fw-semibold">{title}</h2>
        </AccordionSummary>
        <AccordionDetails>
          <div className="container">
            <div className="d-flex flex-wrap">
              {children}
            </div>
          </div>
        </AccordionDetails>
      </Accordion>
    </>
  );
};

export default AccordionView;
