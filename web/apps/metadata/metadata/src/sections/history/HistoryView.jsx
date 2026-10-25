import React from "react";
import TableView from './TableController';
import TableTheme from "./Theme";
import { Container } from "@mui/material";

const SubmissionHistoryView = ({
  submissions,
}) => {
  return (
    <div
      className="row" 
      style={{
        background: "#f8f9fa",
        minHeight: 800
      }}
    >
      <div class="col-md-8 offset-md-2">
        <TableTheme>
          <Container> 
            <TableView
              rows={submissions}
            />
          </Container>
        </TableTheme>
      </div>
    </div>
  );
};

export default  SubmissionHistoryView;
