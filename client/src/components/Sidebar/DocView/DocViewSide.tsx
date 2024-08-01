import {
    styled,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Modal,
    IconButton,
    Tooltip,
    Link,
} from '@mui/material';

import { DeletionModal } from '@/components/DeletionModal/DeletionModal'
import { useState } from 'react';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { LinkBottomBox } from '../Sidebar';

import { useNavigate } from 'react-router-dom';

const tooltipGuidance = `
This link will take you back to the
GenAI Document Box application.
Click here when done making changes to your document repositories.
`;

const StyledSectionTitle = styled(Typography)(({ theme }) => ({
    color: "#40007B", marginBottom: 0, alignSelf: 'center', textAlign: 'center',
}));

const StyledListText = styled(ListItemText)(() => ({
    paddingRight: '6px',
    '& > span': {
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
    }
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
    '&::-webkit-scrollbar': {
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

export const DocViewSide = ({ vectorOptions, actions, setError, setRefresh, setSelectedVectorDB, selectedVectorDB, setRefreshDB }) => {

    const [open, setOpen] = useState<boolean>(false);
    const [text, setText] = useState<string>(null);
    const [id, setId] = useState<string>(null);
    const navigate = useNavigate();

    let engine;
    const DelectVectorDB = async (id: string) => {

        try {
            let embedder = ''
            if (process.env.ENVIRONMENTFLAG === "Deloitte") {
                embedder = "e4449559-bcff-4941-ae72-0e3f18e06660"
            }
            else if (process.env.ENVIRONMENTFLAG === "NIH") {
                embedder = "6ce2e1ac-224c-47a3-a0f9-8ba147599b68"
            }
            const pixel = `DeleteEngine(engine=["${id}"]);`;
            const response = await actions.run(pixel);
            const { output, operationType } = response.pixelReturn[0];
            engine = output;
            if (operationType.indexOf('ERROR') > -1) {
                throw new Error(output as string);
            }
        } catch (e) {
            if (e.message) {
                setError(e.message);
            } else {
                console.log(e);
                setError(
                    'There was an error deleting your vector DB, please check pixel calls',
                );
            }
        }
        finally {
            setOpen(false);
        }
    }
    const Confirm = (text: string, id: string) => {
        setOpen(true);
        setText(text);
        setId(id);
    }

    return (
        <>
            <StyledSectionTitle variant="h5">
                Document Repositories
            </StyledSectionTitle>
            <StyledList dense={true}>
                {vectorOptions.map((item, index) =>
                    <StyledListItem key={index} className={selectedVectorDB.app_name === item.app_name ? 'selected' : undefined} secondaryAction={
                        <IconButton onClick={() => Confirm(`This action will permanently delete ${item.app_name} and all documents contained with this repository.`, item.app_name)}>
                            <svg viewBox="196.856 158.35 14 18" width="14" height="18" xmlns="http://www.w3.org/2000/svg">
                                <path d="M 197.856 174.35 C 197.856 175.45 198.756 176.35 199.856 176.35 L 207.856 176.35 C 208.956 176.35 209.856 175.45 209.856 174.35 L 209.856 162.35 L 197.856 162.35 L 197.856 174.35 Z M 210.856 159.35 L 207.356 159.35 L 206.356 158.35 L 201.356 158.35 L 200.356 159.35 L 196.856 159.35 L 196.856 161.35 L 210.856 161.35 L 210.856 159.35 Z" style={{ fill: '#40007B' }} transform="matrix(1, 0, 0, 1, 3.552713678800501e-15, 0)" />
                            </svg>
                        </IconButton>}>
                        <ListItemIcon>
                            <svg viewBox="293.887 172.527 16 20" width="16" height="20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M 295.887 172.527 C 294.787 172.527 293.897 173.427 293.897 174.527 L 293.887 190.527 C 293.887 191.627 294.777 192.527 295.877 192.527 L 307.887 192.527 C 308.987 192.527 309.887 191.627 309.887 190.527 L 309.887 178.527 L 303.887 172.527 L 295.887 172.527 Z M 302.887 179.527 L 302.887 174.027 L 308.387 179.527 L 302.887 179.527 Z" style={{ fill: '#40007B' }} transform="matrix(1, 0, 0, 1, 3.552713678800501e-15, 0)" />
                            </svg>
                        </ListItemIcon>
                        <StyledListText onClick={() => setSelectedVectorDB(item)}
                            primary={item.app_name}
                        />
                    </StyledListItem>)}
            </StyledList>
            <LinkBottomBox><Link color="#40007B" component='button' onClick={(e) => {
                e.preventDefault();
                navigate('/docbot/');
            }}>GenAI Document Bot</Link> <Tooltip title={tooltipGuidance}>
                <HelpOutlineIcon
                    color="primary"
                    sx={{ fontSize: 15, marginLeft: '5px' }}
                />
            </Tooltip></LinkBottomBox>

            <Modal open={open} onClose={() => setOpen(false)}>
                <DeletionModal
                    setOpen={setOpen}
                    middleText={text}
                    id={id}
                    action={DelectVectorDB}
                    setRefresh={setRefreshDB} />
            </Modal>
        </>
    );
}
