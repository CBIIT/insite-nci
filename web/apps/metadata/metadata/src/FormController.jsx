import React from 'react';
import {
  createHashRouter,
  RouterProvider,
  Route,
  Link,
  Outlet,
  useParams,
  useSearchParams,
} from "react-router-dom";

import SubmitMetadata from "./page";

const FormController = () => {

  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("Project");
  const datasetId = searchParams.get("Dataset");
  const screenId = searchParams.get("Screen");
  const plateId = searchParams.get("Plate");
  const imageId = searchParams.get("Image");
  const groupId = searchParams.get("Group");
  // console.log(imageId);
  // console.log(datasetId);
  const omeroObjectIds = {
    screenIDs: [],
    projectIDs: [],
    datasetIDs: [],
    plateIDs: [],
    imageIDs: [],
  }

  if (plateId) {
    omeroObjectIds.plateIDs.push(plateId);
  }

  if (projectId) {
    omeroObjectIds.projectIDs.push(projectId);
  }

  if (datasetId) {
    omeroObjectIds.datasetIDs.push(datasetId);
  }

  if (screenId) {
    omeroObjectIds.screenIDs.push(screenId);
  }

  if (imageId) {
    omeroObjectIds.imageIDs.push(imageId);
  }

  return (
    <SubmitMetadata
      projectId={projectId}
      datasetId={datasetId}
      screenId={screenId}
      plateId={plateId}
      imageId={imageId}
      groupId={groupId}
      omeroObjectIds={omeroObjectIds}
    />
  )
};

export default FormController;
