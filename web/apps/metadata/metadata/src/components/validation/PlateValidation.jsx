import * as React from 'react';
import Alert from '@mui/material/Alert';
import CloseIcon from '@mui/icons-material/Close';
import styled from '@emotion/styled';
/**
 * valide the sections form
 */
const warningTextColor = '#1D2D7F';

const FieldValue = styled('span')({
    fontSize: '16px',
    fontWeight: '900'
});

const AlertText = styled('span')({
  fontSize: '16px',
  fontWeight: '900',
  color: warningTextColor
});

export default function PlateValidation({
  plate ={}
}) {
  const { id: plateID = '' } = plate;
  const isPlateIDEmpty = `${plateID}`.trim() === "";
  const isPlateIDNumeric = /^-?\d+(\.\d+)?$/.test(plateID);
  return (
    <>
      {
        (!isPlateIDEmpty && !isPlateIDNumeric) && (
          <Alert
            icon={<CloseIcon fontSize="inherit" />}
            severity="warning"
          >
            <FieldValue>Plate ID </FieldValue> value is <FieldValue>{plateID}</FieldValue>.
            <AlertText> Provide Numeric value. </AlertText>
          </Alert>
        )
      }
    </>
  );
};
