import {
    styled,
    Paper,
    IconButton,
    Autocomplete,
    TextField,
    Button,
    Slider,
    Typography,
    Tooltip,
    Link,
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
    [theme.breakpoints.down('md')]: {
        position: 'absolute',
        zIndex: open ? theme.zIndex.drawer + 2 : -1,
        width: '100%',
        maxWidth: '280px',
    },
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
    isDoc
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
            
            { !isDoc && <MainViewSide 
                vectorOptions={vectorOptions} 
                selectedVectorDB={selectedVectorDB}
                setSelectedVectorDB = {setSelectedVectorDB}
                limit={limit}
                temperature = {temperature}
                setTemperature = {setTemperature}
                setLimit = {setLimit}
                setOpen = {setOpen}
            />}
            {isDoc && <DocViewSide 
            vectorOptions={vectorOptions}
            selectedVectorDB={selectedVectorDB}
            setSelectedVectorDB = {setSelectedVectorDB} /> }
            
        </StyledSidebar>
    );
};
