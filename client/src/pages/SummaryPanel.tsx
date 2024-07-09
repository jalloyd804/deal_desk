import {
    styled,
    Box,
    Stack,
    TextField,
    Typography,
    IconButton,
    CircularProgress,
    Paper,
    Alert,
    Button,
    Avatar
} from '@mui/material';
import React, { useRef, useState } from 'react';
import { Markdown } from '@/components/common';
import Dropzone from 'react-dropzone';
import { FileUploadOutlined } from '@mui/icons-material';
import { useInsight } from '@semoss/sdk-react';

const DisplayButton = styled(Button)(() => ({
    backgroundImage: 'linear-gradient(90deg, #20558A 0%, #650A67 100%)',
    backgroundColor: '#20558A',
    fontSize: '16px',
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

const StyledBox = styled(Box)(({ theme }) => ({
    display: "flex",
}));

const StyledLink = styled('span')(({ theme }) => ({
    color: theme.palette.primary.main,
    cursor: 'pointer',
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    position: 'relative',
    width: '100%',
    borderRadius: '6px',
    overflow: 'hidden'
}));

const SansTypography = styled(Typography)(({ theme }) => ({
    fontFamily: theme.typography.modal.fontFamily,
}));

const IndentedListItem = styled('li')(() => ({
    paddingLeft: '20px',
}));

const LoadingOverlay = styled('div')(() => ({
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, .5)',
    top: '0',
    left: '0',
    zIndex: '2',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
}));

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

const welcomeTextSum = `The AI Document Summarization is a tool the generates summaries of documents uploaded by users. Upload policies, proposals, meeting minutes, operational procedures, policy manuals as PDF’s or Word documents to summarize. To begin, upload a document and click Generate Summary.​`

export const SummaryPanel = ({
    sideOpen
}) => {

    const [file, setFile] = useState<File[] | null>([]);
    const [totalSize, setTotalSize] = useState<number>(0);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { actions } = useInsight();
    const [isGenerated, setIsGenerated] = useState(false);
    const [documents, setDocuments] = useState([]);

    const fileInput = useRef<HTMLInputElement>();
    interface GetInputPropsOptionsRef {
        ref?: React.RefObject<HTMLInputElement>;
    }
    const [fileError, setFileError] = useState<string | null>(null);

    //From the LLM
    const [summary, setSummary] = useState({
        summary: ''
    });

    /**
    * Allow the user to ask a question
    */
    const generateSummary = async () => {
        try {

            // turn on loading
            setError('');
            setIsLoading(true);
            setTimeout(() => {
                setIsGenerated(true);
                setSummary({
                    summary: `Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been 
the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of 
type and scrambled it to make a type specimen book. It has survived not only five centuries, but also 
the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 
1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with 
desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.`});
setIsLoading(false);
            }, 5000);
            return;
            let pixel = `
            VectorDatabaseQuery(engine="$" , command="<encode>$</encode>", limit=$)
            `;

            const response = await actions.run<Record<string, any>[]>(pixel);

            const { output, operationType } = response.pixelReturn[0];

            if (operationType.indexOf('ERROR') > -1)
                throw new Error(output.response);

        } catch (e) {
            if (e) {
                setError(e);
            } else {
                setError('There is an error, please check pixel calls');
            }
        } finally {
            //setIsLoading(false);
        }
    };

    return (
        <StyledBox width={sideOpen ? '100%' : '100%'} id='styledcontainer'>
            <StyledPaper variant={'elevation'} elevation={2} square>
                {isLoading && <LoadingOverlay><CircularProgress /></LoadingOverlay>}
                <Stack spacing={2} color='#4F4F4F'>
                    <Stack spacing={2} style={{ fontSize: '12px' }}>
                        <Typography variant="h5" color='#40007B'><strong>Hello!</strong> Welcome to NIAID’s AI Document Summarization ​</Typography>
                        <Typography variant="body1">{welcomeTextSum}</Typography>
                        {error && <Alert color="error">{error.toString()}</Alert>}
                    </Stack>
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
                                        if (acceptedFile.name === document.fileName) {
                                            if (!duplicateFound) {
                                                errorMessage += 'The following document(s) already exist in this repository: '
                                            }
                                            errorMessage += '\n' + acceptedFile.name + ''
                                            duplicateFound = true
                                        }
                                    })
                                });
                                if (!duplicateFound) {
                                    setFile(acceptedFiles);
                                    setFileError(null);
                                }
                                else {
                                    setFile([]);
                                    setFileError(errorMessage);
                                }


                            }
                            setTotalSize(tempMaxTotal);
                        }} multiple={true} maxFiles={1} maxSize={10000000}
                    >
                        {({ getRootProps, getInputProps }) => (
                            <div
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='16' ry='16' stroke='%23333' stroke-width='1' stroke-dasharray='6%2c 14' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e")`,
                                    borderRadius: '16px',
                                    borderColor: 'rgba(0,0,0,0.23)',
                                    marginTop: '16px',
                                    marginBottom: '16px',
                                    fontFamily: 'Public Sans',
                                    maxWidth: '100%'
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
                            </div>
                        )}
                    </Dropzone>
                    <Stack
                        flexDirection={'row'}
                        alignItems={'center'}
                        justifyContent={'center'}
                        gap={1}
                    >
                        <DisplayButton
                            variant="contained"
                            disabled={isLoading || !file.length}
                            onClick={generateSummary}
                            sx={{ flex: 1, width: '85%' }}
                        >
                            Generate Summary
                        </DisplayButton>
                    </Stack>
                    <Stack>
                        <Typography
                            variant={'subtitle1'}
                            sx={{ fontWeight: '400' }}
                            color='#40007B'
                            marginTop='2%'
                        >
                            {(file.length > 0 && totalSize <= 40000000) && <span>Document: <span style={{ color: '#4f4f4f' }}>{file[0].name}</span></span>}
                            {fileError !== null && <FormatError text={fileError.replace("10000000 bytes", "10MB")}></FormatError>}
                            {totalSize > 40000000 && <Typography color="red" fontSize="inherit">Error: Maximum set of documents size cannot exceeded 40MB.</Typography>}
                        </Typography>
                        {isGenerated &&
                            <>
                                <Typography
                                    variant={'subtitle1'}
                                    sx={{ fontWeight: '400' }}
                                    color='#40007B'
                                    marginTop='2%'
                                >
                                    Summary:
                                </Typography>
                                <Typography
                                    variant={'body1'}
                                    sx={{ mb: 2 }}
                                >
                                    {summary.summary}
                                </Typography>
                            </>}
                    </Stack>
                </Stack>
            </StyledPaper>
        </StyledBox>
    )
}