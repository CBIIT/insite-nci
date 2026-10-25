import styled from '@emotion/styled';
import { Button } from '@mui/material';

export const CardContrainer = styled('div')({
  border: '3px solid #4668f0ff',
  borderRadius: '5px',
  margin: '10px',
  padding: '10px',
});

export const ViewButton = styled(Button)({
  color: "#ffffff",
  width: "100%",
  border: "1px solid #14212b",
  cursor: "pointer",
  height: "30px",
  fontsize: "16px",
  marginTop: "15px",
  textAlign: "center",
  fontFamily: "Lato",
  lineHeight: "13px",
  backgroundColor: "#4668f0ff",
  borderbottomLeftRadius: "5px",
  borderBottomRightRadius: "5px",
});

export const CardTitle = styled('span')({
  backgroundColor: "#4668f0ff",
  fontSize: "13px",
  borderRadius: "10px",
  color: "#fff",
  padding: "10px",
});

export const CardTitleOuter = styled('div')({
  textAlign: 'center',
  marginBottom: '10px',
});

export const OuterContrainer = styled('div')({
  marginTop: '50px',
  padding: '5px 20px',
});

export const ResultsContainer = styled('div')({
  marginBottom: '50px',
});

export const ListItem = styled('li')({
  wordBreak: 'break-all',
});
