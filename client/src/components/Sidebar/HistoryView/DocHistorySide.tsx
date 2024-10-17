import {
    styled,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    IconButton,
    ListItemButton,
    CircularProgress,
    Stack,
    Link,
    Tooltip,
    Button,
} from '@mui/material';
import { makeStyles } from "@material-ui/core/styles";
import { useEffect, useState } from 'react';
import { ChatBubbleOutlineOutlined, Close } from '@mui/icons-material';
import { useInsight } from '@semoss/sdk-react';
import { Room } from '@/interfaces/Room';
import { LinkBottomBox } from '../Sidebar';
import { useNavigate } from 'react-router-dom';

const tooltipGuidance = `
This link will take you back to the
GenAI Document Box application.
Click here when done making changes to your document repositories.
`;

const useStyles = makeStyles(theme => ({
    root: {
        '& .Mui-selected': {
            'background-color': '#3333a329'
        }
    }
}));

const StyledSectionTitle = styled(Typography)(() => ({
    color: "#40007B",
    marginBottom: 0,
    alignSelf: 'center',
    textAlign: 'center',
}));

const StyledEllipses = styled(Typography)(({ theme }) => ({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
}));

const StyledListItemIcon = styled(ListItemIcon)(() => ({
    '& svg': {
        fill: '#40007B',
    }
}));

const StyledListItemButton = styled(ListItemButton)(({ theme, selected }) => ({
    gap: theme.spacing(1.5),
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: 'transparent',
    maxHeight: '35px',
    '&:hover': {
        backgroundColor: 'rgb(51, 51, 163, 0.16)'
    }
}));

const LoadingOverlay = styled('div')(() => ({
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, .5)',
    top: '0',
    left: '0',
    zIndex: '2',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
}));

const StyledList = styled(List)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    overflow: 'auto',
    height: '100%',
    scrollbarWidth: 'auto',
    scrollbarColor: '#40007B transparent',
    scrollBehavior: 'smooth',
    '::-webkit-scrollbar': {
        width: '8px',
    },
    '&::-webkit-scrollbar-thumb': {
        background: '#40007B',
        borderRadius: '8px',
    },
    '&::-webkit-scrollbar-track': {
        background: 'none',
    }
}));

const StyledListItem = styled(ListItem)(() => ({
    cursor: 'pointer',
    borderRadius: '5px',
    '&.selected': {
        backgroundColor: '#CCCEEB',
        cursor: 'default',
    }
}));

const StyledListText = styled(ListItemText)(() => ({
    paddingRight: '6px',
    '& > span': {
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
    }
}));
const DisplayButton = styled(Button)(() => ({
    backgroundImage: 'linear-gradient(90deg, #20558A 0%, #650A67 100%)',
    backgroundColor: '#20558A',
    fontSize: '16px',
    color: 'white',
    '&:hover': {
        backgroundImage: 'linear-gradient(90deg, #12005A 0%, #12005A 100%)',
        backgroundColor: '#12005A',
    },
    '&[disabled]': {
        color: 'rgba(255, 255, 255, .8)',
        backgroundImage: 'none',

    },
}));
export const DocHistorySide = ({ setActiveConversation, activeConversation, roomId, setRoomId, showDocManage }) => {
    const [conversations, setConversations] = useState([])
    const [isLoading, setIsLoading] = useState(false);
    const { actions } = useInsight();
    const classes = useStyles();
    const navigate = useNavigate();

    useEffect(() => {
        getRooms();
    }, []);

    const removeConversation = async (id: string) => {
        await actions.run(`RemoveUserRoom(roomId=["${id}"])`).then((response) => {
            const { output, operationType } = response.pixelReturn[0];
        }).finally
        {
            if (id === roomId) {
                const { pixelReturn } = await actions.run<
                    [
                        {
                            insightData: {
                                insightID: string;
                            };
                        },
                    ]
                >(`OpenUserRoom();`);
                
                const { output: out } = pixelReturn[0];
                setRoomId(out.insightData.insightID);
            }
            const newConvos = conversations.filter(conv=>conv.ROOM_ID !== id);
            if( newConvos.length && activeConversation !== newConvos[0].ROOM_ID)
                setActiveConversation(newConvos.length > 0 ? newConvos[0].ROOM_ID : null);
            else if( !newConvos.length)
                setActiveConversation(null);

            setConversations(newConvos);
            console.log(`Room removed : ${id}`)
        }
    };

    const getRooms = async () => {
        console.log(`Getting rooms`)
        setIsLoading(true);
        await actions.run<
            [
                Room[],
            ]
        >(`GetUserConversationRooms();`).then((response) => {
            const { output, operationType } = response.pixelReturn[0];

            if (operationType.indexOf('ERROR') > -1) {
                setIsLoading(false);
                throw new Error('error loading rooms');
            }
            if (Array.isArray(output)) {
                if (output.length && !activeConversation)
                    setActiveConversation(output[0].ROOM_ID)
                setConversations(output);
                setIsLoading(false);
            }
        })
    }
    return (
        <>
            {isLoading && <LoadingOverlay><CircularProgress /></LoadingOverlay>}
            <StyledSectionTitle variant="h5">
                Chat History
            </StyledSectionTitle>
            <StyledList dense={true}>
                {conversations.map((convo, index) =>
                    <StyledListItem onClick={() => setActiveConversation(convo.ROOM_ID)} key={index} className={convo.ROOM_ID === activeConversation ? 'selected' : undefined} secondaryAction={
                        <IconButton onClick={() => removeConversation(convo.ROOM_ID)}>
                            <svg viewBox="196.856 158.35 14 18" width="14" height="18" xmlns="http://www.w3.org/2000/svg">
                                <path d="M 197.856 174.35 C 197.856 175.45 198.756 176.35 199.856 176.35 L 207.856 176.35 C 208.956 176.35 209.856 175.45 209.856 174.35 L 209.856 162.35 L 197.856 162.35 L 197.856 174.35 Z M 210.856 159.35 L 207.356 159.35 L 206.356 158.35 L 201.356 158.35 L 200.356 159.35 L 196.856 159.35 L 196.856 161.35 L 210.856 161.35 L 210.856 159.35 Z" style={{ fill: '#40007B' }} transform="matrix(1, 0, 0, 1, 3.552713678800501e-15, 0)" />
                            </svg>
                        </IconButton>}>
                        <StyledListItemIcon><ChatBubbleOutlineOutlined /></StyledListItemIcon>
                        <StyledListText primary={convo.ROOM_NAME ? convo.ROOM_NAME : convo.ROOM_ID} />
                    </StyledListItem>)}
            </StyledList>
            {showDocManage && <DisplayButton variant="contained" onClick={(e) => {
                e.preventDefault();
                navigate('/documentManagement/');
            }}>
                Document Repository Management
            </DisplayButton>}
        </>
    );
}
