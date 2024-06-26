import {
    styled,
    IconButton,
    Box
} from '@mui/material';
import { makeStyles } from "@material-ui/core/styles";
import CloseIcon from '@mui/icons-material/Close';
import { MainViewSide } from './MainView/MainViewSide';
import { DocViewSide } from './DocView/DocViewSide'



const useStyles = makeStyles(theme => ({
    root: {
        '& .MuiSlider-thumb': {
            color: "#40007B"
        },
        '& .MuiSlider-track': {
            color: "#CF9BFF"
        },
        '& .MuiSlider-rail': {
            color: "#CF9BFF"
        },
        '& .MuiSlider-mark': {
            color: '#40007B',
        },
    }
}));

const StyledSidebar = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '0',
    padding: `5rem ${theme.spacing(2)} ${theme.spacing(2)} ${theme.spacing(2)}`,
    gap: theme.spacing(2),
    width: '300px',
    backgroundImage: 'linear-gradient(to bottom, #e7ecf8, #f9effd)',
    position: 'fixed',
    left: '0%',
    top: '0',
    height: '98vh',
    zIndex: 2,

}));

const StyledButton = styled(IconButton)(() => ({
    marginLeft: 'auto',
    maxHeight: '10%'
}));

export const LinkBottomBox = styled(Box)(() => ({
    position: 'absolute',
    bottom: '4rem',
    width: 'calc(100% - 32px)',
    textAlign: 'center',
    left: '50%',
    transform: 'translatex(-50%)',
}));

export const Sidebar = ({
    modelOptions,
    selectedModel,
    setSelectedModel,
    vectorOptions,
    selectedVectorDB,
    setSelectedVectorDB,
    setSideOpen,
    setOpen,
    limit,
    setLimit,
    temperature,
    setTemperature,
}) => {


    const classes = useStyles();

    const limitTooltipText = `
    This will change the amount of documents pulled from 
    a vector database. Pulling too many documents can potentially cause your engines
    token limit to be exceeded!
    `;

    const temperatureTooltipText = `
    This changes the randomness of the LLM's output. 
    The higher the temperature the more creative and imaginative your
    answer will be.
    `;
    return (
        <StyledSidebar>
            <StyledButton onClick={() => setSideOpen(false)}>
                <CloseIcon />
            </StyledButton>
            <MainViewSide 
                vectorOptions={vectorOptions} 
                selectedVectorDB={selectedVectorDB}
                setSelectedVectorDB = {setSelectedVectorDB}
                limit={limit}
                temperature={temperature}
                setTemperature={setTemperature}
                setLimit={setLimit}
                setOpen={setOpen}
            />
            {/* <DocViewSide vectorOptions={vectorOptions} /> */}
            
        </StyledSidebar>
    );
};
