import React, { useRef, useState } from 'react';
import {
    styled,
    Paper,
    IconButton,
    Autocomplete,
    TextField,
    Typography,
    Container,
    Stack,
    List,
    Avatar,
    Tooltip,
    Box,
    Button,
    CircularProgress,
} from '@mui/material';
import { Model } from '@/pages/PolicyPage';
import { useInsight } from '@semoss/sdk-react';
import { FileUploadOutlined, Close, QuestionMark } from '@mui/icons-material';
import { createFilterOptions } from '@mui/material/Autocomplete';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import ArrowBackIosNewOutlinedIcon from '@mui/icons-material/ArrowBackIosNewOutlined';
import Dropzone from 'react-dropzone';

interface GetInputPropsOptionsRef {
    ref?: React.RefObject<HTMLInputElement>;
}

interface GetInputPropsOptionsRef {
    ref?: React.RefObject<HTMLInputElement>;
}

const filter = createFilterOptions();

const StyledLoadingDiv = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    justifyItems: 'center',
    alignItems: 'center',
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
    marginTop: 0,
}));

const StyledTitle = styled(Typography)(({ theme }) => ({
    alignItems: 'center',
    marginTop: '0',
}));

const StyledLink = styled('button')(({ theme }) => ({
    display: 'inline-block',
    color: theme.palette.background.paper,
    cursor: 'pointer',
    backgroundColor: 'transparent',
    fontSize: '1rem',
    border: '0px',
}));

const StyledSidebar = styled(Paper)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'flex-start',
    boxSizing: 'border-box',
    flexDirection: 'column',
    borderRadius: '.5rem',
    width: '350px',
    // height: 'auto',
    padding: theme.spacing(2),
    background:
        'linear-gradient(0deg, rgba(49,159,190,1) 13%, rgba(42,114,165,1) 51%)',
    color: theme.palette.background.paper,
    overflowY: 'scroll', // Enable vertical scrolling
    // Hide scroll bar for Webkit browsers (Chrome, Safari)
    '::-webkit-scrollbar': {
        display: 'none',
    },
    // Hide scroll bar for other browsers
    msOverflowStyle: 'none', // IE and Edge
    scrollbarWidth: 'none', // Firefox
    [theme.breakpoints.down('md')]: {
        zIndex: open ? theme.zIndex.drawer + 2 : -1,
        flexDirection: 'flex-start',
        height: 'auto',
    },
    zIndex: 2,
}));

const StyledAutocomplete = styled(Autocomplete)(({ theme }) => ({
    background: theme.palette.background.paper,
    borderRadius: '.5rem',
    backgroundColor: '#ebf5f9',
    marginTop: '0',
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
    background: 'white',
    marginRight: theme.spacing(0.5),
}));

const StyledButton = styled(IconButton)(() => ({
    marginLeft: 'auto',
}));

const StyledDiv = styled('div')(() => ({
    display: 'flex',
}));

const StyledList = styled(List)(({ theme }) => ({
    width: '100%',
    padding: '8px',
    borderRadius: '.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
}));

const StyledEmbedList = styled(List)(({ theme }) => ({
    width: '100%',
    padding: '8px',
    borderRadius: '.5rem',
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
}));

const StyledStack = styled(Stack)(({ theme }) => ({
    display: 'inline-flex',
    overflow: 'hidden',
}));

const StyledButtonLink = styled('button')(({ theme }) => ({
    display: 'inline-block',
    color: theme.palette.primary.main,
    cursor: 'pointer',
    border: '0px',
    backgroundColor: '#ebf5f9',
}));

export const Sidebar = ({
    modelOptions,
    selectedModel,
    setSelectedModel,
    file,
    setFile,
    fileInfo,
    setSideOpen,
    vectorOptions,
    setSelectedVector,
    selectedVector,
    setRefresh,
}) => {
    const [fileError, setFileError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [newVector, setNewVectorDB] = useState<string | null>(null);
    const { actions } = useInsight();

    const fileInput = useRef<HTMLInputElement>();

    const closingFunctions = () => {
        setLoading(false);
        setNewVectorDB(null);
        setRefresh(true);
        setFile(null);
    };

    const handleSubmit = async () => {
        setLoading(true);
        let engine;
        if (newVector) {
            try {
                const pixel = `CreateVectorDatabaseEngine ( database = [ "${newVector}" ] , conDetails = [ { "VECTOR_TYPE" : "FAISS" , "NAME" : "${newVector}","EMBEDDER_ENGINE_ID":"${process.env.EMBEDDER}","INDEX_CLASSES":"default","CHUNKING_STRATEGY":"ALL","CONTENT_LENGTH":512,"CONTENT_OVERLAP":20,"DISTANCE_METHOD":"Squared Euclidean (L2) distance","RETAIN_EXTRACTED_TEXT":"false"} ] ) ;`;
                const response = await actions.run(pixel);
                const { output, operationType } = response.pixelReturn[0];
                engine = output;
                setSelectedVector(engine);
                if (operationType.indexOf('ERROR') > -1) {
                    throw new Error(output as string);
                }
            } catch (e) {
                if (e.message) {
                    setFileError(e.message);
                } else {
                    console.log(e);
                    setFileError(
                        'There was an error creating your vector DB, please check pixel calls',
                    );
                }
            } finally {
                closingFunctions();
            }
        }

        if (file) {
            try {
                const embedEngine = engine || selectedVector;
                const pixel = `
                CreateEmbeddingsFromDocuments ( engine = "${embedEngine.database_id}" , filePaths = ["${fileInfo.fileLocation}"] ) ;
                `;
                await actions.run(pixel).then((response) => {
                    const { output, operationType } = response.pixelReturn[0];
                    console.log(operationType.indexOf('ERROR'));
                    if (operationType.indexOf('ERROR') > -1) {
                        throw new Error(output as string);
                    }
                });
            } catch (e) {
                if (e.message) {
                    setFileError(e.message);
                } else {
                    setFileError(
                        'There was an error embedding your document, please check pixel calls',
                    );
                }
            } finally {
                closingFunctions();
            }
        }
    };

    const firstStep = () => {
        return (
            <>
                <StyledTitle>
                    Select or Create a Document Repository
                </StyledTitle>
                <Typography variant="caption">
                    Make sure to select Add *name* when creating a new repo.
                </Typography>
                <StyledAutocomplete
                    freeSolo
                    selectOnFocus
                    clearOnBlur
                    handleHomeEndKeys
                    options={vectorOptions}
                    value={selectedVector}
                    filterOptions={(options, params) => {
                        const filtered = filter(options, params);

                        if (params.inputValue !== '') {
                            filtered.push({
                                inputValue: params.inputValue,
                                database_name: `Add "${params.inputValue}"`,
                            });
                        }
                        return filtered;
                    }}
                    getOptionLabel={(option: any) => {
                        if (typeof option === 'string') {
                            return option;
                        }

                        if (option?.inputValue) {
                            return option.inputValue;
                        }

                        return option.database_name;
                    }}
                    renderOption={(props, option: any) => (
                        <li {...props}>{option.database_name}</li>
                    )}
                    onChange={(event, newVectorDB: any) => {
                        if (newVectorDB.inputValue) {
                            setNewVectorDB(newVectorDB.inputValue);
                        }
                        setSelectedVector(newVectorDB);
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            variant="outlined"
                            value={selectedVector}
                        />
                    )}
                />
                <StyledTitle>Embed a document</StyledTitle>
                <Typography variant="caption">
                    Drag and Drop .pdf, .doc, .docx or .txt files
                </Typography>
                <Dropzone
                    accept={{
                        'text/pdf': ['.pdf'],
                        'text/doc': ['.doc', '.docx'],
                        'text/txt': ['.txt'],
                    }}
                    onDrop={(acceptedFiles, fileRejections) => {
                        if (fileRejections.length > 0) {
                            setFileError(fileRejections[0].errors[0].message);
                        } else {
                            setFile(acceptedFiles[0]);
                            setFileError(null);
                        }
                    }}
                >
                    {({ getRootProps, getInputProps }) => (
                        <Container
                            maxWidth="lg"
                            sx={{
                                backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='16' ry='16' stroke='%23333' stroke-width='1' stroke-dasharray='6%2c 14' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e")`,
                                borderRadius: '16px',
                                borderColor: 'rgba(0,0,0,0.23)',
                                // marginBottom: '16px',
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <div
                                style={{
                                    paddingTop: '.75rem',
                                    paddingBottom: '.75rem',
                                }}
                                {...getRootProps({ className: 'dropzone' })}
                            >
                                <input
                                    accept=".pdf, .txt, .doc, .docx"
                                    {...(getInputProps() as GetInputPropsOptionsRef)}
                                    onClick={(e) => e.stopPropagation()}
                                />

                                <label>
                                    <TextField
                                        variant="outlined"
                                        type="text"
                                        sx={{ display: 'none' }}
                                        InputProps={{
                                            endAdornment: (
                                                <IconButton>
                                                    <FileUploadOutlined />
                                                    <input
                                                        ref={fileInput}
                                                        style={{
                                                            display: 'none',
                                                        }}
                                                        type="file"
                                                        hidden
                                                        name="[licenseFile]"
                                                    />
                                                </IconButton>
                                            ),
                                        }}
                                    />
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Avatar
                                            sx={{
                                                bgcolor: '#E1F5FE',
                                                marginRight: '16px',
                                            }}
                                        >
                                            <FileUploadOutlined
                                                sx={{ color: '#40a0ff' }}
                                            />
                                        </Avatar>
                                        <span style={{ fontSize: '1rem' }}>
                                            {
                                                <StyledLink>
                                                    Click to Upload
                                                </StyledLink>
                                            }
                                            &nbsp;
                                        </span>
                                    </Typography>
                                    <Typography
                                        sx={{
                                            display: 'flex',
                                            fontSize: '13px',
                                            paddingTop: '10px',
                                        }}
                                        variant="caption"
                                    >
                                        Maximum File size 100MB.
                                    </Typography>
                                </label>
                            </div>
                        </Container>
                    )}
                </Dropzone>
                <Box
                    sx={{
                        display: 'flex',
                        marginTop: '0',
                        overflow: 'hidden',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            flex: '1 1 auto',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            marginRight: '8px',
                        }}
                    >
                        {file?.name}
                        {fileError}
                    </Typography>
                    {file && (
                        <Button
                            variant="outlined"
                            disabled={!file?.name}
                            onClick={handleSubmit}
                            sx={{ flex: '0 0 auto' }}
                        >
                            Upload
                        </Button>
                    )}
                </Box>{' '}
            </>
        );
    };
    return (
        <StyledSidebar>
            <StyledStack spacing={{ xs: 1, sm: 1, md: 1, l: 3, xl: 3 }}>
                <StyledList>
                    <Typography> Select Model: </Typography>
                    <StyledButton onClick={() => setSideOpen(false)}>
                        <ArrowBackIosNewOutlinedIcon />
                    </StyledButton>
                </StyledList>

                <StyledAutocomplete
                    options={modelOptions}
                    value={selectedModel}
                    placeholder="Choose a Model"
                    getOptionLabel={(option: Model) =>
                        option.database_name || ''
                    }
                    onChange={(event, newModel) => setSelectedModel(newModel)}
                    renderInput={(params) => (
                        <TextField {...params} variant="outlined" />
                    )}
                />
                {loading ? (
                    <StyledLoadingDiv>
                        <CircularProgress />
                        <StyledTypography>
                            Embedding may take a while, thank you for your
                            patience
                        </StyledTypography>
                    </StyledLoadingDiv>
                ) : (
                    firstStep()
                )}
            </StyledStack>
        </StyledSidebar>
    );
};
