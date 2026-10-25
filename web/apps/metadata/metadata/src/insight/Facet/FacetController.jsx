import React, { useEffect, useState } from 'react';
import { CircularProgress } from '@mui/material';
import FacetView from './FacetView';
import { safeClone } from '../../sections/utils2';
import useFacetData from './FacetStore';

const FacetController = ({
  facetItems,
}) => {
  const [state, action] = useFacetData();
  useEffect(() => {
    const updateFacetItem = safeClone(facetItems);
    const sections = Object.keys(updateFacetItem);
    sections.forEach((section) => {
      const items = updateFacetItem[section];
      const updateFacet = (items || []).map(item => ({
        ...item,
        isChecked: false,
      }));
      updateFacetItem[section] = updateFacet;
    });
    action.initializeFacetState(updateFacetItem);
  }, []);

  if (!state?.filter) {
    return (
      <CircularProgress />
    )
  }

  return (
    <>
      {
        Object.entries(state?.filter).map(([section, items]) => (
          <FacetView
            state={state}
            action={action}
            section={section}
            facetItems={items}
          />
        ))  
      }
    </>
  );
};

export default FacetController;
