export const actionTypes = {
  ON_ROW_SELECT_RADIO: 'ON_ROW_SELECT_RADIO',
  CLEAR_SLECTED_RADIO: 'CLEAR_SLECTED_RADIO'
};

export const onRadioSeclect = (rows) => ({
  type: actionTypes.ON_ROW_SELECT_RADIO,
  payload: rows,
});

export const onClearRadioSeclect = () => ({
  type: actionTypes.CLEAR_SLECTED_RADIO,
  payload: [],
});

// other action types