import React from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

const ProgressDialog = ({
  isOpen,
  message = "Appending metadata...",
}) => {
  return (
    <Dialog
      open={isOpen}
      maxWidth="sm"
    >
      <DialogContent>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            {message}
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default ProgressDialog;
