import { createHook, createStore } from 'react-sweet-state';

const actions = {
  startSearch:
  (query) =>
    ({ setState }) => {
      setState({ isSearching: true, error: null, currQuery: query ?? null });
  },
  setSearchData: (type, data) => ({
    setState,
    getState,
  }) => {
    const currState = getState();
    if (data) {
      const prev = getState()?.results || {};
      console.log(prev);
      setState({
        results: { ...prev, [type]: data }, 
        isSearching: false,
        error: null,
      });
    }
  },
  setQuery: (query) => ({
    getState,
    setState
  }) => {
    const prevState = getState();
    setState({
      ...prevState,
      currQuery: query,
    })
  },
  setResultSetIds: (data) => ({
    setState,
    getState,
  }) => {
    setState({
      results: data,
      isSearching: false,
      error: null,
    })
  },
  setSearchError:
    (error) =>
    ({ setState }) => {
      setState({ isSearching: false, error });
    },
  // toggleCheckBox: (updateFacetItems, activeFacets) =>
  //     ({ setState, getState }) => {
  //         const facetState = getState();
  //         setState(
  //           {
  //           filter: {
  //           ...facetState.filter,
  //           ...updateFacetItems,
  //           },
  //           activeFacets: activeFacets 
  //       })
  //     },
  //   initializeFacetState: (initData) => ({ setState }) => {
  //       setState({ filter: { ...initData }, activeFacets: [] });
  //   }  
};

const searchData = createStore({
  // Initial state
  initialState: undefined,
  // Actions to modify the state
  actions,
  // Optional, for debugging purposes
  name: 'searchData',
  activeTab: 'basic',
  query: ''
});

const useSearchData = createHook(searchData);

export default useSearchData;
