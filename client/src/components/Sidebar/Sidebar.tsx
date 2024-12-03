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
} from '@mui/material';
import { Model } from '@/pages/PolicyPage';
import { FileUploadOutlined } from '@mui/icons-material';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import ArrowBackIosNewOutlinedIcon from '@mui/icons-material/ArrowBackIosNewOutlined';
import Dropzone from 'react-dropzone';

interface GetInputPropsOptionsRef {
    ref?: React.RefObject<HTMLInputElement>;
}

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
    position: 'absolute',
    left: '0%',
    height: '100%',
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
    paddingTop: theme.spacing(5),
    paddingBottom: theme.spacing(5),
}));

const StyledLink = styled('button')(({ theme }) => ({
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
    setSideOpen,
    embeddingOptions,
    selectedEmbedder,
    setSelectedEmbedder,
}) => {
    const [fileError, setFileError] = useState<string | null>(null);

    const fileInput = useRef<HTMLInputElement>();

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

                <Typography> Select Embedder: </Typography>
                <StyledAutocomplete
                    options={embeddingOptions}
                    value={selectedEmbedder}
                    placeholder="Choose a Model"
                    getOptionLabel={(option: Model) =>
                        option.database_name || ''
                    }
                    onChange={(event, newModel) =>
                        setSelectedEmbedder(newModel)
                    }
                    renderInput={(params) => (
                        <TextField {...params} variant="outlined" />
                    )}
                />
            </StyledStack>

            <Typography>File Uploader:</Typography>
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
                            backgroundColor: '#ebf5f9',
                            color: 'black',
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
                                    <Typography variant="subtitle2">
                                        {
                                            <StyledLink>
                                                Click to Upload
                                            </StyledLink>
                                        }
                                        &nbsp;or drag and drop
                                        <Typography variant="subtitle2">
                                            Maximum File size 100MB.
                                        </Typography>
                                    </Typography>
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
        </StyledSidebar>
    );
};
