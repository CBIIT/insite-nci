import React, { useEffect, useState } from "react";
import SubmissionHistoryView from "./HistoryView";
import { getSubmissionHistory } from "../../service/Http";

const HistoryController = () => {
  const [submissions, setHistory] = useState([]);
  useEffect(() => {
    const fetchHistory = async () => {
      const res = await getSubmissionHistory();
      if (res) {
        setHistory(res);
      }
    }
    fetchHistory();         
  }, []);

  return (
    <SubmissionHistoryView
      submissions={submissions}
    />
  );
};

export default HistoryController;
