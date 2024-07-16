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

const welcomeTextSum = `The AI Document Summarization is a tool the generates summaries of documents uploaded by users. Upload policies, proposals, meeting minutes, operational procedures, policy manuals as PDF’s to summarize. To begin, upload a document and click Generate Summary.​`

export const SummaryPanel = ({
    sideOpen,
    temperature
}) => {

    const [file, setFile] = useState<File[] | null>([]);
    const [totalSize, setTotalSize] = useState<number>(0);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { actions } = useInsight();
    const [isGenerated, setIsGenerated] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [instructions, setInstructions] = useState('');
    const [isTruncated, setIsTruncated] = useState(false);
    const [truncationKey, setTruncationKey] = useState('');

    const fileInput = useRef<HTMLInputElement>();
    interface GetInputPropsOptionsRef {
        ref?: React.RefObject<HTMLInputElement>;
    }
    const [fileError, setFileError] = useState<string | null>(null);

    //From the LLM
    const [summary, setSummary] = useState({
        summary: ''
    });

    let model = ''
    if (process.env.ENVIRONMENTFLAG === "Deloitte") {
        model = "4801422a-5c62-421e-a00c-05c6a9e15de8"
    }
    else if (process.env.ENVIRONMENTFLAG === "NIH") {
        model = "f89f9eec-ba78-4059-9f01-28e52d819171"
    }

    function escapeAndJoin(arr) {
        return arr.map(str => JSON.stringify(str)).join(',');
    }

    /**
    * Allow the user to ask a question
    */
    const generateSummary = async () => {
        try {
            console.log(instructions);
            // turn on loading
            setError('');
            setIsLoading(true);

            const fileUpload = await actions.upload(file, '');
            const fileLocation = escapeAndJoin(fileUpload.map(o => o.fileLocation));
            // Pixel call to generate a map from the .pdf file
            let pixel = `DocumentSummarization(filePath = [ ${fileLocation} ] )`;
            const documentmapReturn = await actions.run<Record<string, any>[]>(pixel);
            const { output: documentMap, operationType: documentMapType } = documentmapReturn.pixelReturn[0];
            if (documentMapType.indexOf('ERROR') > -1)
                throw new Error(documentMap.response);

            // define token limit for input text
            let tokenLimit = 5000;

            // populate map while checking for potential truncation
            let adjDocumentMap = {};
            let currentTokensCount = 0;

            for (let [index, key] of Object.keys(documentMap).entries()) {
                let newKey = `Page ${index + 1}`;
                let pageContent = `${documentMap[key]}`;
                let pageTokensCount = pageContent.length / 4; 
                
                if (currentTokensCount + pageTokensCount > tokenLimit) {
                    setIsTruncated(true);
                    setTruncationKey(newKey);
                    let remainingContentLength = (tokenLimit - currentTokensCount) * 4;
                    adjDocumentMap[newKey] = pageContent.substring(0, remainingContentLength);
                    break; // Stop processing further pages
                } else {
                    adjDocumentMap[newKey] = documentMap[key];
                    currentTokensCount += pageTokensCount;
                }
            }
            // Format map
            let formattedMap = Object.keys(adjDocumentMap).map(key => `
                ${key}
                ${adjDocumentMap[key].split('\n').join(' ')}
                `).join('\n');

            pixel =
                `
            LLM(engine="` + model + `", command=["<encode>Please read the following text, formatted as a map with page numbers followed by the corresponding text from each page, and provide a comprehensive summary. Your summary should:\n\n1. Capture Main Points and Key Arguments: Identify and summarize the central themes and key arguments presented in the text. In addition, cite the page number(s) to reference specific points or arguments.\n2. Highlight Important Details, Findings, and Conclusions: Summarize critical data, findings, and conclusions drawn in the text, citing the relevant page numbers to enhance traceability and verification.\n3. Preserve Original Tone, Context, and Intent: Maintain the original tone and context of the text, ensuring that the summary reflects the intended message without distortion.\n4. Clarity and Coherence: Ensure that the summary is clear, coherent, and easily understood, even by individuals who may not have access to the full original text.\n5. Exclude Extraneous Information: Focus strictly on the content provided, avoiding personal opinions, interpretations, or information not directly drawn from the text.\n6. Logical and Cohesive Organization: Organize the summary in a logical and cohesive manner, grouping related points and findings together, and using page citations to guide the reader through the text’s structure.\n\nHere is the text:\n\n${formattedMap}</encode>"], paramValues=[{"temperature":${temperature}}])
            `;

            const response = await actions.run<Record<string, any>[]>(pixel);
            const { output, operationType } = response.pixelReturn[0];
            if (operationType.indexOf('ERROR') > -1)
                throw new Error(output.response);
            let conclusion
            if (output.response) {
                conclusion = output.response
            }

            setTimeout(() => {
                setIsGenerated(true);
                setSummary({
                    summary: conclusion
                });
                setIsLoading(false);
            });
            return;

        } catch (e) {
            if (e) {
                setError(e);
            } else {
                setError('There is an error, please check pixel calls');
            }
        } finally {
            setIsLoading(false);
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
                    <Typography color='#40007B'>Step 1. Upload a .pdf document for summarization</Typography>
                    <Dropzone
                        accept={{ 'text/pdf': ['.pdf'] }}
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
                    <Typography color='#40007B'>Step 2 (Optional). Provide additional context on specific subjects from the document you wish the summary to highlight</Typography>
                    <TextField onChange={(e) => setInstructions(e.target.value)} minRows={5} multiline placeholder='Enter additional context'/>
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
                                    <Markdown>{summary.summary}</Markdown>
                                </Typography>
                                {isTruncated && <Typography
                                variant={'body1'}
                            sx={{ fontStyle: 'italic' }}
                        >
                            Note: The document text exceeded the model's maximum allowed size and was cut off at {truncationKey}.
                            </Typography>}
                            </>}
                    </Stack>
                </Stack>
            </StyledPaper>
        </StyledBox>
    )
}