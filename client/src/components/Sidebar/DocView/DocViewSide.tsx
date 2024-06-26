import {
    styled,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton,
    Tooltip,
    Link,
} from '@mui/material';

import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

import { LinkBottomBox } from '../Sidebar';

const tooltipGuidance = `
This link will take you back to the
GenAI Document Box application.
Click here when done making changes to your document repositories.
`;

const StyledSectionTitle = styled(Typography)(({ theme }) => ({
    marginBottom: theme.spacing(2),
    textAlign: 'center'
}));

const StyledList = styled(List)(() => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
}));

const StyledListText = styled(ListItemText)(() => ({
    paddingRight: '6px',
    '& > span': {
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
    }
}));

export const DocViewSide = ({ vectorOptions }) => {
    return (
        <>
            <StyledSectionTitle variant="h5" style={{ color: "#40007B", marginBottom: 0 }}>
                GenAI Resources
            </StyledSectionTitle>
            <StyledList dense={true}>
                {vectorOptions.map(item =>
                    <ListItem secondaryAction={
                        <IconButton>
                            <svg viewBox="196.856 158.35 14 18" width="14" height="18" xmlns="http://www.w3.org/2000/svg">
                                <path d="M 197.856 174.35 C 197.856 175.45 198.756 176.35 199.856 176.35 L 207.856 176.35 C 208.956 176.35 209.856 175.45 209.856 174.35 L 209.856 162.35 L 197.856 162.35 L 197.856 174.35 Z M 210.856 159.35 L 207.356 159.35 L 206.356 158.35 L 201.356 158.35 L 200.356 159.35 L 196.856 159.35 L 196.856 161.35 L 210.856 161.35 L 210.856 159.35 Z" style={{ fill: '#40007B' }} transform="matrix(1, 0, 0, 1, 3.552713678800501e-15, 0)" />
                            </svg>
                        </IconButton>}>
                        <ListItemIcon>
                            <svg viewBox="293.887 172.527 16 20" width="16" height="20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M 295.887 172.527 C 294.787 172.527 293.897 173.427 293.897 174.527 L 293.887 190.527 C 293.887 191.627 294.777 192.527 295.877 192.527 L 307.887 192.527 C 308.987 192.527 309.887 191.627 309.887 190.527 L 309.887 178.527 L 303.887 172.527 L 295.887 172.527 Z M 302.887 179.527 L 302.887 174.027 L 308.387 179.527 L 302.887 179.527 Z" style={{ fill: '#40007B' }} transform="matrix(1, 0, 0, 1, 3.552713678800501e-15, 0)" />
                            </svg>
                        </ListItemIcon>
                        <StyledListText
                            primary={item.app_name}
                        />
                    </ListItem>)}
            </StyledList>
            <LinkBottomBox><Link color="#40007B" href="/">GenAI Document Bot</Link> <Tooltip title={tooltipGuidance}>
                <HelpOutlineIcon
                    color="primary"
                    sx={{ fontSize: 15, marginLeft: '5px' }}
                />
            </Tooltip></LinkBottomBox>
        </>
    );
}
