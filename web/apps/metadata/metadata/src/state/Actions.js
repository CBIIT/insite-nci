import { defaultForm, defaultMultiwellPlate, defaultSample } from "../form";

export const actionTypes = {
  RESET_FORM: 'RESET_FORM',
  UPDATE_SECTION: 'UPDATE_SECTION',
  ADD_MULTI_WELLPLATE: 'ADD_MULTI_WELLPLATE',
  ADD_SAMPLE: 'ADD_SAMPLE',
  FILE_UPLOAD: 'FILE_UPLOAD',
  ADD_SECTION: 'ADD_SECTION',
  UPDATE_MULTI_WELLPLATE: 'UPDATE_MULTI_WELLPLATE',
  ADD_CHANNEL: 'ADD_CHANNEL',
  UPDATE_CHANNEL: 'UPDATE_CHANNEL',
  SET_FIELDS_AND_INPUTS: 'SET_FIELDS_AND_INPUTS',
  HANDLE_STUDY_CHANGE: 'HANDLE_STUDY_CHANGE',
  ON_ADD_BIOSAMPLE: 'ON_ADD_BIOSAMPLE',
  ON_ADD_MULTIWELL: 'ON_ADD_MULTIWELL',
  LOAD_FORM: 'LOAD_FORM',
  ADD_RECIPIENT: 'ADD_RECIPIENT',
};

export const resetForm = () => ({
  type: actionTypes.RESET_FORM,
});

export const addMultiWellPlate = (form) => {
  const updateForm = { ...form };
  if (!updateForm?.multiwellPlates) {
    updateForm.multiwellPlates = [];
  }
  updateForm.multiwellPlates.push(defaultMultiwellPlate);
  return {
    type: actionTypes.ADD_MULTI_WELLPLATE,
    payload: updateForm,
  };
}

export const addSample = (form) => {
  const updateForm = { ...form };
  if (!updateForm?.samples) {
    updateForm.samples = [];
  }
  updateForm.samples.push(defaultSample);
  return {
    type: actionTypes.ADD_SAMPLE,
    payload: updateForm,
  };
}

export const addSection = (form, section) => {
  const updateForm = { ...form };
  if (!updateForm[section]) {
    updateForm[section] = [];
  }
  updateForm[section].push({});
  return {
    type: actionTypes.ADD_SECTION,
    payload: updateForm,
  };
}

export const updateFormChange = (form) => {
  return {
    type: actionTypes.UPDATE_SECTION,
    payload: form,
  };
}

export const updateSampleChange = (index, fieldName, value) => {
  
}

export const addChannel = (updateForm) => {
  return {
    type: actionTypes.ADD_CHANNEL,
    payload: updateForm,
  }
}

export const updateChannel = (updateForm) => {
  return {
    type: actionTypes.UPDATE_CHANNEL,
    payload: updateForm,
  }
}

export const onInputValueChange = (value) => ({
  type: actionTypes.HANDLE_STUDY_CHANGE,
  payload: value,
});

export const setFormFieldsAndInputs = (value) => ({
  type: actionTypes.SET_FIELDS_AND_INPUTS,
  payload: value,
});

export const uploadFile = (value) => ({
  type: actionTypes.FILE_UPLOAD,
  payload: value
});

export const onUploadForm = (form) => ({
  type: actionTypes.LOAD_FORM,
  payload: form
});

export const addRecipient = (recipients) => {
  return {
    type: actionTypes.ADD_RECIPIENT,
    payload: recipients,
  };
}
