import { createHook, createStore } from 'react-sweet-state';

const actions = {
  setFormData: (data) => ({
    setState,
    getState,
  }) => {
    const currState = getState();
    if (data) {
      setState({ formData: data });
    }
  },
};

const FormData = createStore({
  // Initial state
  initialState: undefined,
  // Actions to modify the state
  actions,
  // Optional, for debugging purposes
  name: 'FormData',
});

const useFormData = createHook(FormData);

export default useFormData;
