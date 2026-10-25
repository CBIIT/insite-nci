import { createHook, createStore } from 'react-sweet-state';

const actions = {
    toggleCheckBox: (updateFacetItems, activeFacets) =>
      ({ setState, getState }) => {
          const facetState = getState();
          setState(
            {
            filter: {
            ...facetState.filter,
            ...updateFacetItems,
            },
            activeFacets: activeFacets 
        })
      },
    initializeFacetState: (initData) => ({ setState }) => {
        setState({ filter: { ...initData }, activeFacets: {} });
    }  
};

const facetData = createStore({
  // Initial state
  initialState: undefined,
  // Actions to modify the state
  actions,
  // Optional, for debugging purposes
  name: 'facetData',
});

const useFacetData = createHook(facetData);

export default useFacetData;

