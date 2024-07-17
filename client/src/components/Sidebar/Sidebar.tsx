import {
    styled,
    IconButton,
    Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { MainViewSide } from './MainView/MainViewSide';
import { DocViewSide } from './DocView/DocViewSide'

const StyledSidebar = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '0',
    gap: theme.spacing(2),
    width: '20%',
    backgroundImage: 'linear-gradient(to bottom, #e7ecf8, #f9effd)',
    padding: `${theme.spacing(2)} ${theme.spacing(1)}`,
    left: '0%',
    zIndex: 2,
    [theme.breakpoints.up('md')]: {
        width: '30%',
    },
    [theme.breakpoints.up('xl')]: {
        width: '20%',
    },
}));

const StyledButton = styled(IconButton)(() => ({
    marginLeft: 'auto',
    maxHeight: '10%'
}));

export const LinkBottomBox = styled(Box)(() => ({
    alignSelf: 'center',
    marginTop: 'auto',
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
    isDoc,
    showDocManage,
    summarySelected
}) => {

    return (
        <StyledSidebar>
            <StyledButton onClick={() => setSideOpen(false)}>
                <CloseIcon />
            </StyledButton>

            {!isDoc && <MainViewSide
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
                summarySelected={summarySelected}
            />}
            {isDoc && <DocViewSide
                vectorOptions={vectorOptions}
                selectedVectorDB={selectedVectorDB}
                setSelectedVectorDB={setSelectedVectorDB}
                actions={actions}
                setError={setError}
                setRefresh={setRefresh}
                setRefreshDB={setRefreshDB} />}

        </StyledSidebar>
    );
};
