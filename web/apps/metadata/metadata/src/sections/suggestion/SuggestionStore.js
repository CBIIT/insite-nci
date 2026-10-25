import { createHook, createStore } from 'react-sweet-state';

const actions = {
  setSuggestionList: (data) => ({
    setState,
    getState,
  }) => {
    const currState = getState();
    if (data) {
      setState({ suggestions: data });
    }
  },
  setImageList: (data) => ({
    setState,
    getState,
  }) => {
    const currState = getState();
    if (data) {
      setState({ imageList: data });
    }
  }
};

const SuggestionList = createStore({
  // Initial state
  initialState: {},
  // Actions to modify the state
  actions,
  // Optional, for debugging purposes
  name: 'SuggestionList',
});

const useSuggestionList = createHook(SuggestionList);

export default useSuggestionList;
