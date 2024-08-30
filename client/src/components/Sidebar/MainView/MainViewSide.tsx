import { createFilterOptions } from '@mui/material/Autocomplete';
import { makeStyles } from "@material-ui/core/styles";
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

import {
    styled,
    Autocomplete,
    TextField,
    Button,
    Slider,
    Typography,
    Tooltip,
    Link,
    ListItem,
    List,
    ListItemButton,
    ListItemIcon,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { LinkBottomBox } from '../Sidebar';

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

let myurl = "";
if (process.env.DEVELOPMENTFLAG === "prod") {
    myurl = "https://genai.niaid.nih.gov/documentManagement/"
}
else if (process.env.DEVELOPMENTFLAG === "dev") {
    myurl = "https://genaidev.niaid.nih.gov/documentManagement/"
}

const filter = createFilterOptions();

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
const StyledSectionTitle = styled(Typography)(({ theme }) => ({
    //marginBottom: theme.spacing(2)
}));
const StyledDiv = styled('div')(() => ({
    display: 'flex',
}));
const StyledListItemIcon = styled(ListItemIcon)(() => ({
    //color: 'inherit',
    minWidth: 'auto',
    color: '#40007B'
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
const StyledListItemButton = styled(ListItemButton)(({ theme, selected }) => ({
    gap: theme.spacing(1.5),
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: 'transparent',
}));
const StyledList = styled(List)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    overflow: 'auto',
    flex: 1,
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
export const MainViewSide = ({ vectorOptions,
    selectedVectorDB, setSelectedVectorDB, limit, setLimit, temperature, setTemperature, setError, setOpen, showDocManage, tabSelected, showDisclaimer
}) => {
    const classes = useStyles();
    const navigate = useNavigate();
    return (
        <>
            <Autocomplete
                disableClearable
                freeSolo
                disabled={tabSelected===1 || showDisclaimer}
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
                onChange={(event, newVectorDB) => {
                    const currentUrl = new URL(window.location.href);
                    currentUrl.searchParams.set("newDocRepo", newVectorDB["database_name"]);
                    window.history.pushState({}, '', currentUrl);
                    setSelectedVectorDB(newVectorDB);
                }
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
                <Typography style={{ width: '100%', textAlign: 'center', fontWeight: '700', color: '#40007B' }}>Or</Typography>
            </StyledDiv>
            <DisplayButton disabled={tabSelected===1 || showDisclaimer} variant="contained" onClick={() => {
                setError('');
                setOpen(true);
            }}>
                Upload Document(s)
            </DisplayButton>
            <StyledDiv style={{ display: 'flex', marginTop: '10%', marginBottom: '1%' }}>
                <Typography style={{ width: '100%', textAlign: 'center', fontWeight: '700', color: '#40007B' }}>Advanced Settings</Typography>
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
                min={3}
                max={10}
                marks
                valueLabelDisplay="auto"
                onChange={(event, newValue) => setLimit(newValue)}
                className={classes.root}
                disabled={tabSelected===1 || showDisclaimer}
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
                step={null}
                min={0.0001}
                max={1}
                marks={[
                    { value: 0.0001 },
                    { value: 0.1 },
                    { value: 0.2 },
                    { value: 0.3 },
                    { value: 0.4 },
                    { value: 0.5 },
                    { value: 0.6 },
                    { value: 0.7 },
                    { value: 0.8 },
                    { value: 0.9 },
                    { value: 1 }
                ]}
                valueLabelDisplay="auto"
                onChange={(event, newValue) => setTemperature(newValue)}
                className={classes.root}
                disabled={tabSelected===1 || showDisclaimer}
            />
            {showDocManage && <LinkBottomBox><Link color="#40007B" component='button' onClick={(e) => {
                e.preventDefault();
                navigate('/documentManagement/');
            }}>Manage Document Repository</Link></LinkBottomBox>}
        </>
    );
}
