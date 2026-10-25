import React, { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Checkbox,
  Divider,
  List,
  ListItem,
  Typography
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckIcon from '@mui/icons-material/Check';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { safeClone } from '../../sections/utils2';
import useFacetData from './FacetStore';

const key2Name = {
  omeroObjectCount: "Object Type",
  imagingMethodCount: "Imaging Method",
  imagingFacilityCount: "Imaging Facility",
  biosampleTypeCount: "Sample Type",
  organismCount: "Organism",
}

const FacetView = ({
  section,
  facetItems,
}) => {

  const [state, action] = useFacetData();
  const [expand, setExpand] = useState(true);
  const onExpandSection = () => {
    setExpand(!expand);
  };

  const handleToggle = (item, index) => {
    const updateFacetItems = safeClone(state?.filter[section]);

    if (Array.isArray(facetItems)) {
      const toggleFacet = updateFacetItems[index];

      let currActiveFacets = safeClone(state.activeFacets);
      // if (!currActiveFacets[section]) {
      //   currActiveFacets[section] = []
      // }
      const list = Array.isArray(currActiveFacets[section]) ? [...currActiveFacets[section]] : [];
      if (!item?.isChecked) {
        // (currActiveFacets[section]).push(toggleFacet.name)
        if (!list.includes(toggleFacet.name)) list.push(toggleFacet.name);
      } else {
        // currActiveFacets = currActiveFacets.filter(item => item != toggleFacet.name);
        const i = list.indexOf(toggleFacet.name);
        if (i > -1) list.splice(i, 1);
      }
      console.log(list);
      updateFacetItems[index] = {
        ...toggleFacet,
        isChecked: !toggleFacet?.isChecked,
      };

      currActiveFacets[section] = list;
      action.toggleCheckBox({ [section]: updateFacetItems }, currActiveFacets);
    }
  };

  return (
    <>
      <Accordion
        expanded={expand}
        onChange={onExpandSection}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
        >
          <Typography>{key2Name[section]}</Typography>
        </AccordionSummary>
         <AccordionDetails>
          <List id="filter_Items">
            {facetItems?.map((item, index) => (
              <>
              <ListItem
              width={1}
              button
            >
              <Checkbox
                onClick={() => handleToggle(item, index)}
                checked={item?.isChecked}
              />
              <Box component="div">
                <Typography>{item.name}</Typography>
              </Box>
              <Typography>
                ({item.value})
              </Typography>
            </ListItem>
            <Divider
              style={{
                backgroundColor: '#b1b1b1',
                margin: '0px',
                height: '1px',
              }}
            />
              </>
            ))}
            
          </List>
        </AccordionDetails>
      </Accordion>
    </>
  );
};

export default FacetView;
