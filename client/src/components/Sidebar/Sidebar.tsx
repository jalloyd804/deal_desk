import {
    styled,
    IconButton,
    Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { MainViewSide } from './MainView/MainViewSide';
import { DocViewSide } from './DocView/DocViewSide'
import { DocHistorySide } from './HistoryView/DocHistorySide';

const StyledSidebar = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '0',
    gap: theme.spacing(2),
    width: '15%',
    minWidth: '15%',
    backgroundImage: 'linear-gradient(to bottom, #e7ecf8, #f9effd)',
    padding: `${theme.spacing(2)} ${theme.spacing(1)}`,
    left: '0%',
    overflow:'auto'
}));

const StyledButton = styled(IconButton)(() => ({
    marginLeft: 'auto',
    maxHeight: '10%'
}));

export const LinkBottomBox = styled(Box)(() => ({
    alignSelf: 'center',
}));

export const Sidebar = ({
    vectorOptions,
    selectedVectorDB,
    setSelectedVectorDB,
    setSideOpen,
    setOpen,
    limit,
    setLimit,
    temperature,
    setTemperature,
    actions,
    setError,
    setRefresh,
    setRefreshDB,
    view,
    showDocManage,
    tabSelected,
    setActiveConversation,
    activeConversation,
    roomId,
    setRoomId,
    showDisclaimer
}) => {

    return (
        <StyledSidebar>
            <StyledButton onClick={() => setSideOpen(false)}>
                <CloseIcon />
            </StyledButton>

            {((tabSelected===0 || tabSelected ===1) && view==='main') && <MainViewSide
                vectorOptions={vectorOptions}
                selectedVectorDB={selectedVectorDB}
                setSelectedVectorDB={setSelectedVectorDB}
                limit={limit}
                temperature={temperature}
                setTemperature={setTemperature}
                setLimit={setLimit}
                setError={setError}
                setOpen={setOpen}
                showDocManage={showDocManage}
                tabSelected={tabSelected}
                showDisclaimer={showDisclaimer}

            />}
            {(view === 'doc') && <DocViewSide
                vectorOptions={vectorOptions}
                selectedVectorDB={selectedVectorDB}
                setSelectedVectorDB={setSelectedVectorDB}
                actions={actions}
                setError={setError}
                setRefresh={setRefresh}
                setRefreshDB={setRefreshDB} />}
            {(tabSelected===2 && view==='main') && <DocHistorySide
                setActiveConversation={setActiveConversation}
                activeConversation={activeConversation}
                roomId={roomId}
                setRoomId={setRoomId} />}


        </StyledSidebar>
    );
};
