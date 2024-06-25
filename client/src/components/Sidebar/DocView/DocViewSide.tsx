import {
    styled,
    Typography,
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    ListItemIcon,
} from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

const StyledSectionTitle = styled(Typography)(({ theme }) => ({
    marginBottom: theme.spacing(2),
    textAlign: 'center'
}));

export const DocViewSide = ({ vectorOptions, selectedVectorDB, setSelectedVectorDB }) => {
    return (
        <>
            <StyledSectionTitle variant="h5" style={{ color: "#40007B", marginBottom: 0 }}>
                GenAI Resources
            </StyledSectionTitle>
            <List dense={true} style={{maxHeight: '100%', overflow: 'auto'}}>
                {vectorOptions.map(item =>
                    <ListItem>
                        <ListItemIcon>
                            <svg viewBox="293.887 172.527 16 20" width="16" height="20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M 295.887 172.527 C 294.787 172.527 293.897 173.427 293.897 174.527 L 293.887 190.527 C 293.887 191.627 294.777 192.527 295.877 192.527 L 307.887 192.527 C 308.987 192.527 309.887 191.627 309.887 190.527 L 309.887 178.527 L 303.887 172.527 L 295.887 172.527 Z M 302.887 179.527 L 302.887 174.027 L 308.387 179.527 L 302.887 179.527 Z" style={{fill:'#40007B'}} transform="matrix(1, 0, 0, 1, 3.552713678800501e-15, 0)"/>
                            </svg>
                        </ListItemIcon>
                        <ListItemText onClick={() => setSelectedVectorDB(item)}
                            primary={item.app_name}
                        />
                        <ListItemIcon>
                            <svg viewBox="196.856 158.35 14 18" width="14" height="18" xmlns="http://www.w3.org/2000/svg">
                                <path d="M 197.856 174.35 C 197.856 175.45 198.756 176.35 199.856 176.35 L 207.856 176.35 C 208.956 176.35 209.856 175.45 209.856 174.35 L 209.856 162.35 L 197.856 162.35 L 197.856 174.35 Z M 210.856 159.35 L 207.356 159.35 L 206.356 158.35 L 201.356 158.35 L 200.356 159.35 L 196.856 159.35 L 196.856 161.35 L 210.856 161.35 L 210.856 159.35 Z" style={{fill:'#40007B'}} transform="matrix(1, 0, 0, 1, 3.552713678800501e-15, 0)"/>
                            </svg>
                        </ListItemIcon>
                    </ListItem>)}
            </List>
            <div>
                GenAI Document Bot
            </div>
        </>
    );
}
