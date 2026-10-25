import React, { useEffect, useState } from "react";
import SuggestionView from "./SuggestionView";
import useSuggestionList from "./SuggestionStore";
// import { getSuggestions } from "../../http/service";
// import { getSuggestions } from "../../http/service";

const SuggestionController = (props) => {
    const {
      objectTypes,
      children,
      title,
      searchQuery,
      value,
      handleChange,
      suggestionListItems
    } = props;
    // http for omero object -> store to redux
    const [state, action] = useSuggestionList();

    // const filterByObjectTypes = (state?.suggestions || []).filter((item) => objectTypes.includes(item?.object_type));
    let items = [];
    if (objectTypes.includes("Image")) {
      items = (state?.imageList || []).filter((item) => searchQuery && `${item.object_id}`.includes(searchQuery));
    } else {
      const filterByObjectTypes = (state?.suggestions || []).filter((item) => objectTypes.includes(item?.object_type));
      if (searchQuery && `${searchQuery}`.length > 0) {
        items = filterByObjectTypes.filter((item) => `${item.object_id}`.includes(searchQuery));
      }
    }
    return (
      <SuggestionView
        {...props}
        title={title}
        items={suggestionListItems || items}
        searchQuery={searchQuery}
        value={value}
        handleChange={handleChange}
      >
        {children}
      </SuggestionView>
    );
};

export default SuggestionController;
