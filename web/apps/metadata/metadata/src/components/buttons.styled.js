import { IconButton } from "@mui/material";
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import styled from '@emotion/styled';

export const MuiIconBtn = styled(IconButton)({
    cursor: 'pointer',
    '&:hover': {
      cursor: 'pointer',
    }
});

export const CopyIcon = styled(ContentCopyIcon)({
    width: '25px',
    height: '25px',
    color: '#fff'
});

export const DeleteIcon = styled(DeleteForeverIcon)({
    width: '25px',
    height: '25px',
    color: '#fff'
});
