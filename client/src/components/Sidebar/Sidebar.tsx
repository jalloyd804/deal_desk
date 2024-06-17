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
} from '@mui/material';
import { makeStyles } from "@material-ui/core/styles";
import { createFilterOptions } from '@mui/material/Autocomplete';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';


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

const StyledSidebar = styled(Paper)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    width: '280px',
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
    height: '100%',
    zIndex: 2,
}));

const StyledButton = styled(IconButton)(() => ({
    marginLeft: 'auto',
    maxHeight: '10%'
}));

const StyledDiv = styled('div')(() => ({
    display: 'flex',
}));

const DisplayButton = styled(Button)(() => ({
    backgroundImage: 'linear-gradient(90deg, #20558A 0%, #650A67 100%)',
    backgroundColor: '#20558A',
    fontSize: '16px',
    maxHeight: '60px',
    color: 'white',
    flex: '1',
    '&:hover': {
        backgroundImage: 'linear-gradient(90deg, #12005A 0%, #12005A 100%)',
        backgroundColor: '#12005A',
    },
    '&[disabled]': {
        color: 'rgba(255, 255, 255, .8)',
    },
}));

const filter = createFilterOptions();

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
            <Autocomplete
                disableClearable
                freeSolo
                options={vectorOptions}
                value={selectedVectorDB}
                filterOptions={(options, params) => {
                    const filtered = filter(options, params);
                    const { inputValue } = params;
                    // Suggest the creation of a new value
                    const isExisting = options.some(
                        (option) => inputValue === option.database_name,
                    );
                    if (inputValue !== '' && !isExisting) {
                        filtered.push({
                            inputValue,
                        });
                    }

                    return filtered;
                }}
                getOptionLabel={(option) => {
                    if (typeof option === 'string') {
                        return option;
                    }

                    if (option?.inputValue) {
                        return option.inputValue;
                    }

                    return option.database_name;
                }}
                onChange={(event, newVectorDB) =>
                    setSelectedVectorDB(newVectorDB)
                }
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Document Repository"
                        variant="standard"
                    />
                )}
            />
            <StyledDiv style={{ display: 'flex' }}>
                <Typography style={{ width: '100%', textAlign: 'center',fontWeight:'700', color:'#40007B' }}>Or</Typography>
            </StyledDiv>
            <DisplayButton variant="contained" onClick={() => setOpen(true)}>
                Create Document Repository
            </DisplayButton>
            <StyledDiv style={{ display: 'flex', marginTop: '10%', marginBottom: '1%' }}>
                <Typography style={{ width: '100%', textAlign: 'center',fontWeight:'700', color:'#40007B'  }}>Advanced Settings</Typography>
            </StyledDiv>
            <StyledDiv style={{ display: 'flex' }}>
                <Typography>Number of Results Queried</Typography>
                <Tooltip title={limitTooltipText}>
                    <HelpOutlineIcon
                        color="primary"
                        sx={{ fontSize: 15, marginLeft: '5px' }}
                    />
                </Tooltip>
            </StyledDiv>

            <Slider
                value={limit}
                step={1}
                min={1}
                max={10}
                marks
                valueLabelDisplay="auto"
                onChange={(event, newValue) => setLimit(newValue)}
                className={classes.root}
            />

            <StyledDiv>
                <Typography>Temperature</Typography>
                <Tooltip title={temperatureTooltipText}>
                    <HelpOutlineIcon
                        color="primary"
                        sx={{ fontSize: 15, marginLeft: '5px' }}
                    />
                </Tooltip>
            </StyledDiv>

            <Slider
                value={temperature}
                step={0.1}
                min={0}
                max={1}
                marks
                color='secondary'
                valueLabelDisplay="auto"
                onChange={(event, newValue) => setTemperature(newValue)}
                className={classes.root}
            />
        </StyledSidebar>
    );
};
