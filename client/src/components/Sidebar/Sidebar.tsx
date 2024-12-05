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
    Box,
    Button,
    CircularProgress
} from '@mui/material';
import { Model } from '@/pages/PolicyPage';
import { useInsight } from '@semoss/sdk-react';
import { FileUploadOutlined, Close } from '@mui/icons-material';
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
    marginTop: theme.spacing(4),
}));

const StyledButtonGroup = styled('div')(() => ({
    display: 'flex',
    justifyContent: 'flex-end',
}));

const StyledTitle = styled(Typography)(({ theme }) => ({
    alignItems: 'center',
    marginTop: theme.spacing(2),
}));


const StyledLink = styled('button')(({ theme }) => ({
    display: 'inline-block',
    color: theme.palette.primary.main,
    cursor: 'pointer',
    backgroundColor: theme.palette.background.paper,
    border: '0px',
}));

const StyledSidebar = styled(Paper)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    width: '360px',
    borderRadius: '0',
    padding: theme.spacing(2),
    background:
        'linear-gradient(0deg, rgba(49,159,190,1) 13%, rgba(42,114,165,1) 51%)',
    color: theme.palette.background.paper,
    [theme.breakpoints.down('md')]: {
        position: 'absolute',
        zIndex: open ? theme.zIndex.drawer + 2 : -1,
        width: '100%',
        maxWidth: '280px',
    },
    height: '100%',
    position: 'absolute',
    left: '0%',
    zIndex: 2,
    float: 'left',
}));

const StyledAutocomplete = styled(Autocomplete)(({ theme }) => ({
    background: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: '#ebf5f9',
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
    padding: '8px, 16px, 8px, 16px',
    borderRadius: theme.shape.borderRadius,
    display: 'flex',
    justifyContent: 'space-between',
}));

const StyledStack = styled(Stack)(({ theme }) => ({
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
    setRefresh
}) => {
    const [fileError, setFileError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [newVector, setNewVectorDB] = useState<string | null>(null);
    const { actions } = useInsight();


    const fileInput = useRef<HTMLInputElement>();

    const closingFunctions = () => {
        setLoading(false);
        setNewVectorDB(null);
        setRefresh(true)
        setFile(null);
    };

    const handleSubmit = async () => {
        setLoading(true);
        let engine;
        if (newVector) {
            try {
                const pixel = `CreateVectorDatabaseEngine ( database = [ "${newVector}" ] , conDetails = [ { "VECTOR_TYPE" : "FAISS" , "NAME" : "${newVector}","EMBEDDER_ENGINE_ID":"e4449559-bcff-4941-ae72-0e3f18e06660","INDEX_CLASSES":"default","CHUNKING_STRATEGY":"ALL","CONTENT_LENGTH":512,"CONTENT_OVERLAP":20,"DISTANCE_METHOD":"Squared Euclidean (L2) distance","RETAIN_EXTRACTED_TEXT":"false"} ] ) ;`;
                const response = await actions.run(pixel);
                const { output, operationType } = response.pixelReturn[0];
                console.log(output)
                engine = output;
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
                CreateEmbeddingsFromDocuments ( engine = "${
                    embedEngine.database_id
                }" , filePaths = ["${fileInfo.fileLocation}"] ) ;
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
                    Select or Create a Vector Repository
                </StyledTitle>
                <Typography variant="caption">
                    If creating a new repository, make sure to select Add *vector repository name*
                </Typography>
                <Typography> Select Vector Catalog: </Typography>

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

                <StyledTitle>
                    Embed any new documents
                </StyledTitle>
                <Typography variant="caption">
                    Drag and Drop .csv or .pdf files to embed your vector db
                </Typography>
                <Dropzone
                    accept={{ 'text/pdf': ['.pdf'], 'text/csv': ['.csv'] }}
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
                                marginTop: '16px',
                                marginBottom: '16px',
                            }}
                        >
                            <div
                                style={{
                                    paddingTop: '36px',
                                    paddingBottom: '36px',
                                }}
                                {...getRootProps({ className: 'dropzone' })}
                            >
                                <input
                                    accept=".pdf, .csv"
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
                                        <span>
                                            {
                                                <StyledLink>
                                                    Click to Upload
                                                </StyledLink>
                                            }
                                            &nbsp;or drag and drop
                                            <Typography variant="subtitle2">
                                                Maximum File size 100MB.
                                            </Typography>
                                        </span>
                                    </Typography>
                                </label>
                            </div>
                        </Container>
                    )}
                </Dropzone>
                <Typography variant="caption">
                    {file?.name}
                    {fileError}
                </Typography>
                {file && 
                <Button
                    variant="outlined"
                    disabled={!file?.name}
                    onClick={handleSubmit}
                >
                    {newVector ?
                        "Create and Embed"
                        :
                        "Embed Document"
                    }
                </Button>
                }
            </>
        );
    };
    return (
        <StyledSidebar>
            <StyledList>
                <StyledButton onClick={() => setSideOpen(false)}>
                    <ArrowBackIosNewOutlinedIcon />
                </StyledButton>
            </StyledList>

            <StyledStack spacing={2}>
                <Typography> Select Model: </Typography>
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
                    multiple
                />               
            {loading ? (
                <StyledLoadingDiv>
                    <CircularProgress />
                    <StyledTypography>
                        Embedding may take a while, thank you for your patience
                    </StyledTypography>
                </StyledLoadingDiv>
            ) : (
                firstStep()
            )}
            </StyledStack>
        </StyledSidebar>
    );
};
