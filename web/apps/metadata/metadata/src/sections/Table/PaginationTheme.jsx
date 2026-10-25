import { createTheme, TablePagination, ThemeProvider } from '@mui/material';
import React from 'react';

const theme = {
  components: {
    MuiTablePagination: {
      styleOverrides: {
        root: {
          paddingRight: '50px',
          borderTop: '3px solid #42779a',
          '& p': {
            margin: 'auto',
          }
        },
      }
    },
    MuiTypography: {
      styleOverrides: {
        margin: 'auto',
        body2: {
          fontSize: '14px',
          textTransform: 'uppercase',
        },
        root: {
          fontSize: '14px',
        },
      }
    },
    MuiIconButton: {
      root: {
        padding: '2px',
      },
    },  
  },
  
};

const PaginationThemeProvider = ({
  children,
}) => (
  <ThemeProvider theme={createTheme(theme)}>
    {children}
  </ThemeProvider>
);


export default PaginationThemeProvider;
