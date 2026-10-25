import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';

export default ({
  children,
}) => {
  const theme = createTheme({
    components: {
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&.study': {
              backgroundColor: '#addde77d',
            },
            '&.biosample': {
              backgroundColor: '#4bb282',
            },
            '&.specimen': {
              backgroundColor: '#c8c5c5',
            },
            '&.multiwell': {
              backgroundColor: '#4685ebff',
            }
          }
        }
      },
      MuiDialog: {
        styleOverrides: {
          paperWidthXl: {
            '& img': {
              maxWidth: '700px',
            }
          },
        }
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  );
};
