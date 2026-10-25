import React from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  components: {
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#e3e7e9ff',
          borderBottom: `3px solid #004c73`,
          borderTop: `3px solid #004c73`,
          '&.MuiTableCell-root': {
            backgroundColor: 'inherit',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          textAlign: "center",
          fontWeight: 600,
          maxWidth: '350px',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': 3,
          overflow: 'hidden',
        }
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingTop: 40,
        },
      },
    },
  },
});

const TableTheme = ({
  children,
}) => (
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
);

export default TableTheme;
