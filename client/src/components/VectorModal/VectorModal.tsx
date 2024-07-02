import React, { useState, useEffect, useRef } from 'react';
import {
    styled,
    Box,
    Container,
    Avatar,
    CircularProgress,
    Typography,
    Button,
    IconButton,
    TextField,
    Autocomplete
} from '@mui/material';
import { FileUploadOutlined } from '@mui/icons-material';
import { createFilterOptions } from '@mui/material/Autocomplete';
import Dropzone from 'react-dropzone';
import { useInsight } from '@semoss/sdk-react';
import { makeStyles } from "@material-ui/core/styles";

import CloseIcon from '@mui/icons-material/Close';

const useStyles = makeStyles(theme => ({
    root: {
        "& .MuiFormLabel-root": {
            'font-family': "Public Sans"
        },
        "& .MuiInputBase-input": {
            'font-family': "Public Sans"
        },
        "& .MuiFilledInput-root": {
            'background-color': "white"
        },
    }
}));

interface GetInputPropsOptionsRef {
    ref?: React.RefObject<HTMLInputElement>;
}

const filter = createFilterOptions();

const StyledModal = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '600px',
    backgroundColor: theme.palette.background.paper,
    borderRadius: '30px',
    boxShadow: '24',
    p: '4',
    padding: theme.spacing(4),
}));

const StyledLoadingDiv = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    justifyItems: 'center',
    alignItems: 'center',
}));

const IndentedListItem = styled('li')(() => ({
    paddingLeft: '20px',
}));


const StyledTypography = styled(Typography)(({ theme }) => ({
    marginTop: theme.spacing(4),
}));

const SansTypography = styled(Typography)(({ theme }) => ({
    fontFamily: theme.typography.modal.fontFamily,
}));
const StyledTextField = styled(TextField)(({ theme }) => ({
    fontFamily: theme.typography.modal.fontFamily,
    backgroundColor: 'white'
}));

const StyledButtonGroup = styled('div')(() => ({
    display: 'flex',
    justifyContent: 'flex-end'
}));

const StyledTitle = styled(Typography)(({ theme }) => ({
    color: theme.palette.modal.main,
    fontSize: theme.typography.modal.fontSize,
    alignItems: 'center',
    marginTop: theme.spacing(3),
    fontFamily: theme.typography.modal.fontFamily,
}));

const StyledButtonOpen = styled(Button)(({ theme }) => ({
    marginRight: theme.spacing(0.5),
}));

const StyledButton = styled(Button)(({ theme }) => ({
    marginRight: theme.spacing(0.5),
}));

const StyledAutocomplete = styled(Autocomplete)(({ theme }) => ({
    margin: theme.spacing(3),
}));

const StyledLink = styled('span')(({ theme }) => ({
    color: theme.palette.primary.main,
    cursor: 'pointer',
}));

export const VectorModal = ({
    setOpen,
    open,
    vectorOptions,
    setRefresh,
    setSelectedVectorDB,
    selectedVectorDB,
    setError,
    existingVectorDB,
    documents
}) => {
    const [newVector, setNewVectorDB] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [file, setFile] = useState<File[] | null>([]);
    const { actions } = useInsight();

    const [fileError, setFileError] = useState<string | null>(null);
    const [vectorNameError, setVectorNameError] = useState<string | null>("Name not selected");

    const [totalSize, setTotalSize] = useState<number>(0);

    const classes = useStyles();

    const fileInput = useRef<HTMLInputElement>();

    useEffect(() => {
        setNewVectorDB(null);
    }, [open]);

    const closingFunctions = () => {
        setLoading(false);
        setRefresh(true);
        setOpen(false);
        setNewVectorDB(null);
        setFile(null);
    };
    function escapeAndJoin(arr) {
        return arr.map(str => JSON.stringify(str)).join(',');
    }
    
    function disabled()
    {
        if( existingVectorDB !== null)
             return file.length === 0;
        else
            return (!file.length || fileError !== null || vectorNameError !== null)
    }

    function addUrlParam(e) {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set("newDocRepo", e);
        window.history.pushState({}, '', currentUrl);
    }

    const handleSubmit = async () => {
        setLoading(true);
        let engine;
        if (newVector) {
            try {
                let embedder = ''
                if (process.env.ENVIRONMENTFLAG === "Deloitte") {
                    embedder = "e4449559-bcff-4941-ae72-0e3f18e06660"
                }
                else if (process.env.ENVIRONMENTFLAG === "NIH") {
                    embedder = "6ce2e1ac-224c-47a3-a0f9-8ba147599b68"
                }
                const pixel = `CreateVectorDatabaseEngine ( database = [ "${newVector}" ] , conDetails = [ { "CONNECTION_URL" : "@BaseFolder@/vector/@ENGINE@/", "VECTOR_TYPE" : "FAISS" , "NAME" : "${newVector}" , "EMBEDDER_ENGINE_ID":"` + embedder + `","CONTENT_LENGTH":"512","CONTENT_OVERLAP":"0","DISTANCE_METHOD":"Squared Euclidean (L2) distance" } ] ) ;`;
                const response = await actions.run(pixel);
                const { output, operationType } = response.pixelReturn[0];
                engine = output;
                if (operationType.indexOf('ERROR') > -1) {
                    throw new Error(output as string);
                }
                addUrlParam(newVector);
            } catch (e) {
                if (e.message) {
                    setError(e.message);
                } else {
                    console.log(e);
                    setError(
                        'There was an error creating your vector DB, please check pixel calls',
                    );
                }
                closingFunctions();
                return;
            }
        }

        if (file.length) {
            try {
                const fileUpload = await actions.upload(file, '');
                const fileLocation = escapeAndJoin(fileUpload.map(o => o.fileLocation));
                const embedEngine = existingVectorDB || engine?.database_id;
                const pixel = `
                CreateEmbeddingsFromDocuments ( engine = "${embedEngine}" , filePaths = [ ${fileLocation} ] ) ;`;
                await actions.run(pixel).then((response) => {
                    const { output, operationType } = response.pixelReturn[0];
                    if (operationType.indexOf('ERROR') > -1) {
                        throw new Error(output as string);
                    }
                });
            } catch (e) {
                if (e.message) {
                    setError(e.message);
                } else {
                    setError(
                        'There was an error embedding your document, please check pixel calls',
                    );
                }
            } finally {
                closingFunctions();
                return;
            }
        }
    };

    function FormatError(props) {
        const textWithBreaks = props.text.split('\n').map((text, index) => {
          if (index === 0)
            return <React.Fragment key={index}>
                {text}
            </React.Fragment>
          else
            return <React.Fragment key={index}>
            <IndentedListItem>{text}</IndentedListItem>
            
        </React.Fragment>
        });
      
        return <Typography color="red" fontSize="inherit">Error: {textWithBreaks}</Typography>;
      }

    const firstStep = () => {
        return (
            <>
                {selectedVectorDB &&
                    <>
                        <StyledButtonGroup>
                            <IconButton onClick={() => setOpen(false)}>
                                {' '}
                                <CloseIcon />
                            </IconButton>
                        </StyledButtonGroup>
                        <StyledTitle variant="h6">
                            Step 1: Create a Document Repository
                        </StyledTitle>
                        <SansTypography variant="body2">
                            Type the name of the document repository.
                        </SansTypography>
                        <SansTypography>
                            <StyledTextField
                                autoComplete='off'
                                className={classes.root}
                                required
                                id="filled-required"
                                label="Document Repository​"
                                defaultValue=""
                                helperText={vectorNameError}
                                variant="filled"
                                value={newVector}
                                style={{ minWidth: '100%' }}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                    setNewVectorDB(event.target.value);
                                    if (vectorOptions.find(op => op?.app_name.toUpperCase() === event.target.value?.toUpperCase()))
                                        setVectorNameError("Vector database name is not available")
                                    else
                                        setVectorNameError(null);
                                }}
                                error={vectorOptions.find(op => op?.app_name.toUpperCase() === newVector?.toUpperCase())}
                            />
                        </SansTypography>
                        <StyledTitle variant="h6">
                            Step 2: Document(s) to embed
                        </StyledTitle>
                        <SansTypography variant="body2" >
                            Drag and drop .pdf or .docx files to your document repository. Please rename any files containing special characters before uploading.
                        </SansTypography>
                    </>
                }
                {!selectedVectorDB && <StyledTitle variant="h6">
                    Upload Files
                </StyledTitle>}
                <Dropzone
                    accept={{ 'text/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }}
                    onDrop={(acceptedFiles, fileRejections) => {
                        let tempMaxTotal = 0;
                        if (fileRejections.length > 0) {
                            setFileError(fileRejections[0].errors[0].message);
                            setFile([]);
                        } else {
                            acceptedFiles.map(file => tempMaxTotal += file.size);
                            let duplicateFound = false;
                            let errorMessage = '';
                            documents.forEach(document => {
                                acceptedFiles.forEach(acceptedFile => {
                                    if (acceptedFile.name === document.fileName){
                                        if (!duplicateFound){
                                            errorMessage += 'The following document(s) already exist in this repository: '
                                        }
                                        errorMessage += '\n' + acceptedFile.name + ''
                                        duplicateFound = true
                                    }
                                })
                            });
                            if (!duplicateFound){
                                setFile(acceptedFiles);
                                setFileError(null);
                            }
                            else{
                                setFile([]);
                                setFileError(errorMessage);
                            }
                            
                            
                        }
                        setTotalSize(tempMaxTotal);
                    }} multiple={true} maxFiles={7} maxSize={10000000}
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
                                fontFamily: 'Public Sans'
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
                                    accept=".pdf, .docx"
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
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Avatar
                                            sx={{
                                                bgcolor: '#ebd6ff',
                                                marginRight: '16px'
                                            }}
                                        >
                                            <FileUploadOutlined
                                                sx={{ color: '#40a0ff' }}
                                            />
                                        </Avatar>
                                        <div><StyledLink>Click to upload</StyledLink> or drag and drop.<br />Maximum individual file size: 10MB.<br />Maximum set of documents size: 40MB.</div>
                                    </Typography>
                                </label>
                            </div>
                        </Container>
                    )}
                </Dropzone>
                <SansTypography variant="caption">
                    {(file.length > 0 && totalSize <= 40000000) && <ul>{file.map((file, index) => <li key={index}>{file.name}</li>)}</ul>}
                    {fileError !== null && <FormatError text = {fileError.replace("10000000 bytes", "10MB")}></FormatError>}
                    {totalSize > 40000000 && <Typography color="red" fontSize="inherit">Error: Maximum set of documents size cannot exceeded 40MB.</Typography>}
                </SansTypography>
                <StyledButtonGroup>
                    <StyledButtonOpen
                        variant="contained"
                        color="error"
                        onClick={() => setOpen(false)}
                    >
                        {' '}
                        Cancel{' '}
                    </StyledButtonOpen>
                    <StyledButton
                        variant="contained"
                        color="success"
                        disabled={disabled()}
                        onClick={handleSubmit}
                    >
                        {' '}
                        Upload{' '}
                    </StyledButton>
                </StyledButtonGroup>
            </>
        );
    };

    return (
        <StyledModal>
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
        </StyledModal>
    );
};
