import {
    styled,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemButton,
    CircularProgress,
    Stack,
    Link,
    Tooltip,
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

const StyledEllipses = styled(Typography)(({ theme }) => ({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
}));

const StyledListItemIcon = styled(ListItemIcon)(() => ({
    //color: 'inherit',
    minWidth: 'auto',
    color: '#40007B'
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

export const DocHistorySide = ({ setActiveConversation, activeConversation, roomId, setRoomId }) => {
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
            <Typography variant="h5" style={{ color: "#40007B", marginTop: '5%', textAlign: 'center' }}>
                Chat History
            </Typography>
            <Stack>
            <StyledList dense={true} className={classes.root}>
                {conversations.map((convo) => {
                    return (
                        <StyledListItemButton selected={convo.ROOM_ID === activeConversation} onClick={() => setActiveConversation(convo.ROOM_ID)}>
                            <StyledListItemIcon>
                                <ChatBubbleOutlineOutlined fontSize="inherit" />
                            </StyledListItemIcon>
                            <StyledEllipses style={{ fontSize: '16px' }}>{convo.ROOM_NAME ? convo.ROOM_NAME : convo.ROOM_ID}</StyledEllipses>
                            <StyledListItemIcon style={{ marginLeft: 'auto' }} onClick={() => removeConversation(convo.ROOM_ID)}>
                                <Close fontSize="inherit" />
                            </StyledListItemIcon>
                        </StyledListItemButton>
                    );
                })}
            </StyledList>
            <LinkBottomBox>{<Link color="#40007B" component='button' onClick={(e) => {
                e.preventDefault();
                navigate('/documentManagement/');
            }}>Manage Document Repository</Link>}</LinkBottomBox>

            </Stack>
        </>
    );
}
