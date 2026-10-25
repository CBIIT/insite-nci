import React, { useState, useEffect } from "react";
import { Snackbar } from "@mui/material";
import Alert from '@mui/material/Alert';

const DynamicSnackbar = ({
  text,
  severity,
}) => {
    const [open, setOpen] = useState(false);
    useEffect(() => {
        if (text) {
        setOpen(true);

        // auto close after 3 sec
        const timer = setTimeout(() => {
          setOpen(false);
        }, 3000);

        return () => clearTimeout(timer); // cleanup if text changes quickly
        }
    }, [text]);

    return (
      <>
        <Snackbar
          open={open}
          autoHideDuration={4000}
          message={text}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          slotProps={{
            content: {
              sx: {
                backgroundColor: '#009973',
                color: '#fff',
              },
            },
          }}
        >
          {/* <Alert
            severity={severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {text}
          </Alert> */}
        </Snackbar>
      </>
    );
};

export default DynamicSnackbar;
