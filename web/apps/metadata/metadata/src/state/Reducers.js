import { defaultForm } from '../form';
import { actionTypes } from './Actions';

const reducer = (state, action) => {
  const { type, payload } = action;
  switch (type) {
    case actionTypes.RESET_FORM:
      return structuredClone(defaultForm);
    case actionTypes.UPDATE_SECTION:
      return {
        ...state,
        ...payload
      };
    case actionTypes.LOAD_FORM:
      return payload;
    case actionTypes.FILE_UPLOAD:
      return { ...state, ...payload};
    case actionTypes.UPDATE_SECTION:
      return {
        ...state,
        ...payload
      };
    case actionTypes.ADD_SAMPLE:
      return {
        ...state,
        ...payload
      };
    case actionTypes.UPDATE_MULTI_WELLPLATE:
      return {
        ...state,
        ...payload
      };
    case actionTypes.ADD_CHANNEL:
      return {
        ...state,
        ...payload
      };
    case actionTypes.ADD_SECTION:
      return {
        ...state,
        ...payload
      };
    case actionTypes.UPDATE_CHANNEL:
      return {
        ...state,
        ...payload
      };
    case actionTypes.HANDLE_STUDY_CHANGE:
      return {
        ...state,
        ...payload,
      }
    case actionTypes.ON_ADD_MULTIWELL:
      return {
        ...state,
      };
    case actionTypes.ADD_RECIPIENT:
      return {
        ...state,
        ...payload,
      }
    
    default:
      return state;
  }
};

export default reducer;