import { actionTypes } from './Actions';

const reducer = (state, action) => {
  const { type, payload } = action;
  switch (type) {
    case actionTypes.ON_ROW_SELECT_RADIO:
      return {
        ...state,
        currAction: actionTypes.ON_ROW_SELECT_RADIO,
        selectedRows: payload,
      };
    case actionTypes.CLEAR_SLECTED_RADIO:
      return {
        ...state,
        currAction: actionTypes.CLEAR_SLECTED_RADIO,
        selectedRows: payload,
      };
    
    default:
      return state;
  }
};

export default reducer;
