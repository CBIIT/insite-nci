import React from "react";
import ReadMeView from "./ReadMeView";
import {
  getTemplateHierarchy,
  useFacilityTemplate,
  useReadMeContent,
} from "../../service/Http";
import { CircularProgress } from "@mui/material";

const ReadMEController = ({
  imagingFacility
}) => {
  const facilityId = imagingFacility?.value;
  const dirName = imagingFacility?.dirName;

  const { template, loading: templateLoading } = useFacilityTemplate(facilityId, dirName);
  const { content, loading: contentLoading } = useReadMeContent(facilityId, dirName);
  
  const isLoading = templateLoading || contentLoading;

  if (isLoading) (
    <CircularProgress />
  )

  if (isLoading || !content || !template) return null;
  // const higherarchyLevel = getTemplateHierarchy(template);

  return (
    <ReadMeView
      content={content}
      template={template}
    />
  );
};

export default ReadMEController;
