import React, { useEffect, useState, useRef } from 'react';
import {
    styled,
    Alert,
    Box,
    ButtonGroup,
    Stack,
    LinearProgress,
    ListItemIcon,
    ListItemText,
    TextField,
    Typography,
    Paper,
    IconButton,
    Avatar,
    Modal,
    Snackbar,
    Menu,
    MenuItem,
    AccordionSummary,
    Accordion,
    AccordionDetails,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import Button from '@mui/material/Button';
import { useInsight } from '@semoss/sdk-react';
import { Sidebar } from '../components/Sidebar';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import MenuOpenOutlinedIcon from '@mui/icons-material/MenuOpenOutlined';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import { Markdown } from '@/components/common';
import { PromptModal } from '../components/PromptModal';
import {
    StyledContainer,
    StyledStack,
    StyledDescription,
    StyledName,
    StyledAdditonalInfo,
    StyledAccordion,
    StyledLayout,
    StyledResponseDiv,
    StyledLeftPanel,
    StyledIconButton,
    StyledQuestionDiv,
    StyledPromptContainer,
    StyledLabel,
    StyledPromptIconContainer,
    StyledPaper,
    StyledTitle,
    StyledQuestionStack,
    StyledAvatar,
    StyledAnswerAvatar,
    StyledButton,
} from '../components/StyledComponents/StyledComponents';

export interface Model {
    database_name?: string;
    database_id?: string;
}

export interface VectorContext {
    score: string;
    doc_index: string;
    tokens: string;
    content: string;
    url: string;
}

interface Answer {
    question: string;
    conclusion: string;
    file: string[];
}

interface Prompt {
    prompt_id: number;
    prompt: string;
    context: string;
}

export const PolicyPage = () => {
    const { actions, system } = useInsight();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isAnswered, setIsAnswered] = useState(false);

    const [refresh, setRefresh] = useState<boolean>(false);

    //From the LLM
    const [answer, setAnswer] = useState<Answer>(null);
    const [answerLog, setAnswerLog] = useState<Answer[]>([]);

    // Model Catalog and first model in dropdown
    const [modelOptions, setModelOptions] = useState([]);
    const [selectedModel, setSelectedModel] = useState<Model | null>(null);

    // Model Catalog and first model in dropdown
    const [vectorOptions, setVectorOptions] = useState([]);
    const [selectedVector, setSelectedVector] = useState<Model | null>(null);

    //the file of the temporal vectorDB
    const [file, setFile] = useState<File | null>(null);
    const [fileInfo, setFileInfo] = useState<Record<string, string>>({});

    const [prompt, setPrompt] = useState<string>(
    `You are an advanced AI designed to provide detailed and accurate analyses of various documents. Your goal is to answer questions based on the information contained within these documents, ensuring thoroughness, clarity, and relevance. If the answer cannot be found in the documents, inform the user explicitly. Under no circumstances should you create information not explicitly stated in the documents. Limit inferences to those supported by and related to the provided data.

    Guidelines:
    1. Analyze Thoroughly: Carefully read and analyze the content of the documents provided.
    2. Provide Relevant Information: Ensure all answers are based solely on the information within the documents.
    3. Be Clear and Concise: Offer clear and concise responses, avoiding ambiguity and unnecessary details.
    4. Acknowledge Limitations: If the answer is not present in the documents, state that the information is not available.
    5. Maintain Integrity: Always provide truthful and accurate information.
    6. Structured Response: Answers should be presented in a logical and organized manner, ensuring readability.
    
    Additional Protocol for Scope and Information Integrity:
    - Strict Adherence to Scope: You must not extrapolate or infer information beyond what is explicitly stated in the documents. Avoid making up information or hypothesizing when the text is not sufficient to address the query.
    - Explicit Disclosure: If the information needed to answer a query is not contained within the documents, clearly state that the answer is beyond the scope of the provided materials and cannot be addressed.`
    );
    const [showPrompts, setShowPrompts] = useState<boolean>(false);
    const [questionContext, setQuestionContext] = useState<string>(
        "Use only the  pieces of information from above to answer the user's question. If you do not know the answer, just say that you do not know, do not try to make up an answer.",
    );

    //Controlling the modal
    const [open, setOpen] = useState<boolean>(false);

    //Controlling the Sidebar
    const [sideOpen, setSideOpen] = useState<boolean>(true);
    const { control, handleSubmit, setValue } = useForm({
        defaultValues: {
            QUESTION: '',
        },
    });

    //Question list from the python
    const [questionList, setQuestionList] = useState<Record<string, any>>({});
    const [responseQuestions, setResponseQuestions] = useState<string[]>([]);

    const [limit, setLimit] = useState<number>(3);
    const [temperature, setTemperature] = useState<number>(0.1);

    // for our snackbar alert
    const [alertOpen, setAlertOpen] = useState<boolean>(false);

    //For the settings modal
    const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [context, setContext] = useState<'prompt' | 'refine' | 'download'>(
        null,
    );

    const loginProviders = Object.keys(system.config.logins);
    const user = system.config.logins[loginProviders[0]];

    // scrolling to the bottom of the container
    const div = useRef(null);

    const handleMenuClick = () => {
        setAnchorEl(event.target);
        setSettingsOpen(true);
    };

    const handleMenuClose = (context: 'prompt' | 'refine' | 'download') => {
        setContext(context);
        setSettingsOpen(false);
        setOpen(true);
    };

    /**
     * Allow the user to ask a question
     */
    const ask = handleSubmit(async (data: { QUESTION: string }) => {
        // turn on loading
        setError('');
        setIsLoading(true);
        setIsAnswered(false);

        try {
            if (!data.QUESTION) {
                throw new Error('Question is required');
            }

            // await actions.run(
            //     `CreateEmbeddingsFromDocuments(engine="617d2b2f-77d2-4ace-a2b5-9366a1fead51", filePaths="${fileInfo.fileLocation}") `,
            // );
            let pixel = `
            VectorDatabaseQuery(engine="${selectedVector.database_id}" , command="${data.QUESTION}", limit=${limit})
            `;

            const response = await actions.run<Record<string, any>[]>(pixel);

            const { output, operationType } = response.pixelReturn[0];

            if (operationType.indexOf('ERROR') > -1)
                throw new Error(output.response);
            let finalContent = '';
            const fileSources = [];
            //Looping through Vector Database Query and forming a content string with name, page, and content
            // for (let i = 0; i <= output.length - 1; i++) {
            //     const content = output[i].content || output[i].Content;
            //     const sourcePage = `${output[i].Source},  Page(s): ${output[i].Divider}`;
            //     output[i].Source &&
            //         !fileSources.includes(sourcePage) &&
            //         fileSources.push(sourcePage);
            //     finalContent += `\\n* `;
            //     Object.keys(output[i]).map(
            //         (source) =>
            //             (finalContent += `${source}: ${output[i][source]},`),
            //     );
            //     finalContent += ` ${content}`;
            // }

            // Looping through Vector Database Query and forming a content string with name, page, and content
            for (let i = 0; i < output.length; i++) {
                const content = output[i].content || output[i].Content;
                const sourcePage = `${output[i].Source}, Page(s): ${output[i].Divider}`;

                if (output[i].Source && !fileSources.includes(sourcePage)) {
                    fileSources.push(sourcePage);
                }

                // Start a new line for each source
                finalContent += `\n* `;

                // Add each key-value pair from the current output item
                Object.keys(output[i]).forEach((key) => {
                    finalContent += `${key}: ${output[i][key]}, `;
                });

                // Add the content and ensure a newline at the end
                finalContent += `Content: ${content}\n`;
            }

            const contextDocs = `A context delimited by triple backticks is provided below. This context may contain plain text extracted from paragraphs or images. Tables extracted are represented as a 2D list in the following format - '[[Column Headers], [Comma-separated values in row 1], [Comma-separated values in row 2] ..... [Comma-separated values in row n]]'\\n
            
            \`\`\` ${finalContent} \`\`\`\\n
            
            ${questionContext}}`;

            pixel = `LLM(engine="${selectedModel.database_id}" , command=["<encode>${prompt} 
            
            User Question: ${data.QUESTION}
            
            Context: ${contextDocs}</encode>"], paramValues=[{"temperature":${temperature}}])`;

            const LLMresponse = await actions.run<[{ response: string }]>(
                pixel,
            );

            const { output: LLMOutput, operationType: LLMOperationType } =
                LLMresponse.pixelReturn[0];

            if (LLMOperationType.indexOf('ERROR') > -1) {
                throw new Error(LLMOutput.response);
            }

            let conclusion = '';
            if (LLMOutput.response) {
                conclusion = LLMOutput.response;
            }
            // set answer based on data
            setAnswer({
                question: data.QUESTION,
                file: [...fileSources],
                conclusion: conclusion,
            });
            setIsAnswered(true);
        } catch (e) {
            if (e) {
                setError(e);
                setAlertOpen(true);
            } else {
                setError('There is an error, please check pixel calls');
                setAlertOpen(true);
            }
        } finally {
            setIsLoading(false);
            setValue('QUESTION', '');
        }
    });

    useEffect(() => {
        const pixel = `MyEngines ( engineTypes=["VECTOR"]);`;

        actions.run(pixel).then((response) => {
            const { output, operationType } = response.pixelReturn[0];
            if (operationType.indexOf('ERROR') > -1) {
                throw new Error(output as string);
            }
            if (Array.isArray(output)) {
                setVectorOptions(output);
                setRefresh(false);
            }
        });
    }, [refresh]);

    useEffect(() => {
        setIsLoading(true);
        
        const fetchAction = async () => {
            //Grabbing all the Models that are in CfGov

            let pixel = ` MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "text-generation" }] , engineTypes = [ 'MODEL' ] )`;

            await actions.run(pixel).then((response) => {
                const { output, operationType } = response.pixelReturn[0];

                if (operationType.indexOf('ERROR') > -1) {
                    throw new Error(output as string);
                }
                if (Array.isArray(output)) {
                    setModelOptions(output);
                    setSelectedModel(output[0]);
                }
            });

            pixel = ` MyEngines ( metaKeys = [], engineTypes = [ 'VECTOR' ] )`;

            await actions.run(pixel).then((response) => {
                const { output, operationType } = response.pixelReturn[0];

                if (operationType.indexOf('ERROR') > -1) {
                    throw new Error(output as string);
                }
                if (Array.isArray(output)) {
                    setVectorOptions(output);
                    setSelectedVector(output[0]);
                }
            });
        };

        fetchAction();
        setIsLoading(false);
    }, []);

    useEffect(() => {
        const uploadFile = async () => {
            const fileUpload = await actions.upload(file, '');
            const { fileLocation, fileName } = fileUpload[0];
            setFileInfo({ fileLocation: fileLocation, fileName: fileName });
        };

        if (file) {
            uploadFile();
        }
    }, [file]);

    useEffect(() => {
        div.current?.scrollIntoView({ behavior: 'smooth' });
    }, [answerLog]);

    useEffect(() => {
        if (answer) {
            setAnswerLog([...answerLog, answer]);
        }
    }, [answer]);

    useEffect(() => {
        setAnswerLog([])
    }, [selectedVector])

    const handleAlertClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setAlertOpen(false);
    };

    return (
        <StyledLayout justifyContent={'center'} sideOpen={sideOpen}>
            <Snackbar
                open={alertOpen}
                autoHideDuration={6000}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                onClose={handleAlertClose}
            >
                <Alert
                    severity="error"
                    onClose={(e) => handleAlertClose(e, 'none')}
                >
                    Pixel Call Error
                </Alert>
            </Snackbar>
            {sideOpen ? (
                <Sidebar
                    modelOptions={modelOptions}
                    selectedModel={selectedModel}
                    setSelectedModel={setSelectedModel}
                    setSideOpen={setSideOpen}
                    file={file}
                    setFile={setFile}
                    fileInfo={fileInfo}
                    vectorOptions={vectorOptions}
                    setSelectedVector={setSelectedVector}
                    selectedVector={selectedVector}
                    setRefresh={setRefresh}
                    setIsLoading={setIsLoading}
                />
            ) : (
                <StyledLeftPanel>
                    <StyledIconButton onClick={() => setSideOpen(!sideOpen)}>
                        <ArrowForwardIosIcon />
                    </StyledIconButton>
                </StyledLeftPanel>
            )}
            <div style={{ width: '100%' }}>
                <StyledContainer>
                    {answerLog.length === 0 && (
                        <StyledTitle>
                            <Typography variant="h4" fontWeight={700}>
                                Hello {user}!
                            </Typography>
                            <Typography variant="h5" sx={{ color: '#606060' }}>
                                I'm here to assist you in answering any complex
                                policy, operational procedure, or system
                                questions.
                            </Typography>
                        </StyledTitle>
                    )}

                    {answerLog.length > 0 && (
                        <Stack
                            gap={1}
                            sx={{ paddingLeft: '1rem', paddingTop: '.25rem' }}
                        >
                            {answerLog.map((answer) => (
                                <>
                                    <StyledResponseDiv>
                                        <StyledAnswerAvatar
                                            sx={{
                                                border: '2px solid rgba(42,114,165,1)',
                                                backgroundColor: 'white',
                                            }}
                                        >
                                            <PersonIcon
                                                sx={{
                                                    backgroundColor: 'white',
                                                    color: 'rgba(42,114,165,1)',
                                                }}
                                            />
                                        </StyledAnswerAvatar>
                                        <StyledPaper
                                            sx={{
                                                background: '#ebf5f9',
                                                borderRadius: '.75rem',
                                                boxShadow: 'none',
                                                padding: '1rem',
                                                fontSize: '1rem',
                                            }}
                                            square
                                        >
                                            <StyledQuestionStack>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        justifyContent:
                                                            'space-between',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <div>
                                                        <Typography
                                                            variant={'body1'}
                                                        >
                                                            {answer.question}
                                                        </Typography>
                                                    </div>
                                                    <IconButton
                                                        onClick={() =>
                                                            navigator.clipboard.writeText(
                                                                answer.question,
                                                            )
                                                        }
                                                    >
                                                        <ContentCopyIcon />
                                                    </IconButton>{' '}
                                                </div>
                                            </StyledQuestionStack>
                                        </StyledPaper>
                                    </StyledResponseDiv>
                                    <StyledResponseDiv>
                                        <StyledAvatar
                                            sx={{
                                                border: '2px solid rgba(42,114,165,1)',
                                            }}
                                        >
                                            <SmartToyOutlinedIcon
                                                sx={{
                                                    color: 'rgba(42,114,165,1)',
                                                }}
                                            />
                                        </StyledAvatar>
                                        <StyledPaper
                                            sx={{
                                                background: '#FFF3E0',
                                                borderRadius: '.75rem',
                                                boxShadow: 'none',
                                                padding: '1rem',
                                                fontSize: '1rem',
                                            }}
                                        >
                                            <div></div>
                                            <StyledQuestionStack spacing={2}>
                                                <Box
                                                    sx={{
                                                        mb: 2,
                                                        overflow: 'auto',
                                                    }}
                                                >
                                                    {error && (
                                                        <Alert color="error">
                                                            {error}
                                                        </Alert>
                                                    )}
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            flexDirection:
                                                                'row',
                                                            justifyContent:
                                                                'space-between',
                                                        }}
                                                        key={Math.random()}
                                                    >
                                                        <Markdown>
                                                            {answer.conclusion}
                                                        </Markdown>
                                                    </div>
                                                    <StyledAccordion>
                                                        <AccordionSummary
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems:
                                                                    'flex-end',
                                                                justifyContent:
                                                                    'space-between',
                                                                padding: '0',
                                                                textAlign:
                                                                    'center',
                                                            }}
                                                        >
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    flexGrow: 1,
                                                                    textAlign:
                                                                        'right',
                                                                    alignSelf:
                                                                        'center',
                                                                    paddingRight:
                                                                        '.5rem',
                                                                    justifyContent:
                                                                        'flex-end',
                                                                    alignItems:
                                                                        'flex-end',
                                                                }}
                                                            >
                                                                Show Sources
                                                            </Typography>
                                                            <IconButton
                                                                sx={{
                                                                    padding:
                                                                        '4px',
                                                                    alignItems:
                                                                        'center',
                                                                }}
                                                                onClick={() =>
                                                                    navigator.clipboard.writeText(
                                                                        answer.conclusion,
                                                                    )
                                                                }
                                                            >
                                                                <ContentCopyIcon />
                                                            </IconButton>
                                                        </AccordionSummary>
                                                        <AccordionDetails>
                                                            <div>
                                                                {answer.file.map(
                                                                    (
                                                                        file: string,
                                                                    ) => (
                                                                        <Typography fontStyle="italic">
                                                                            {
                                                                                file
                                                                            }
                                                                        </Typography>
                                                                    ),
                                                                )}
                                                            </div>
                                                        </AccordionDetails>
                                                    </StyledAccordion>
                                                </Box>
                                            </StyledQuestionStack>
                                        </StyledPaper>
                                    </StyledResponseDiv>
                                </>
                            ))}

                            {/* this is a dummy div so that you can scroll to it */}
                            <div ref={div} />
                        </Stack>
                    )}
                </StyledContainer>
                <StyledQuestionDiv>
                    <Controller
                        name={'QUESTION'}
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => {
                            return (
                                <StyledPaper
                                    elevation={2}
                                    square
                                    sx={{
                                        width: '70%',
                                        paddingBottom: '0px',
                                        marginBottom: '1rem',
                                        borderRadius: '.5rem',
                                    }}
                                >
                                    <TextField
                                        autoComplete="off"
                                        placeholder={'Enter your question here'}
                                        variant="standard"
                                        fullWidth
                                        disabled={isLoading}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                ask();
                                            }
                                        }}
                                        value={field.value ? field.value : ''}
                                        onChange={(e) =>
                                            // set the value
                                            field.onChange(e.target.value)
                                        }
                                        InputProps={{
                                            disableUnderline: true,
                                            endAdornment: (
                                                <>
                                                    <IconButton
                                                        disabled={isLoading}
                                                        onClick={ask}
                                                    >
                                                        <SendIcon
                                                            sx={{
                                                                color: 'rgba(0, 0, 0, 0.54)',
                                                            }}
                                                        />
                                                    </IconButton>
                                                    <IconButton
                                                        disabled={isLoading}
                                                        onClick={
                                                            handleMenuClick
                                                        }
                                                    >
                                                        <MoreVertRoundedIcon
                                                            sx={{
                                                                color: 'rgba(0, 0, 0, 0.54)',
                                                            }}
                                                        />
                                                    </IconButton>
                                                </>
                                            ),
                                        }}
                                        sx={{ padding: '10px 10px' }}
                                    />
                                </StyledPaper>
                            );
                        }}
                    />
                    <Menu
                        open={settingsOpen}
                        anchorEl={anchorEl}
                        onClose={() => setSettingsOpen(false)}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                        }}
                    >
                        <MenuItem onClick={() => handleMenuClose('refine')}>
                            <ListItemIcon>
                                <TuneRoundedIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Refine Results</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={() => handleMenuClose('prompt')}>
                            <ListItemIcon>
                                <EditIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Edit Prompt</ListItemText>
                        </MenuItem>
                        {answerLog.length > 0 && (
                            <MenuItem
                                onClick={() => handleMenuClose('download')}
                            >
                                <ListItemIcon>
                                    <DownloadIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>Download Answers</ListItemText>
                            </MenuItem>
                        )}
                    </Menu>
                </StyledQuestionDiv>
                <Box sx={{ padding: '0 2rem' }}>
                    {isLoading && <LinearProgress />}
                    {open && (
                        <Modal open={open} onClose={() => setOpen(false)}>
                            <PromptModal
                                prompt={prompt}
                                setOpen={setOpen}
                                setPrompt={setPrompt}
                                questionContext={questionContext}
                                setQuestionContext={setQuestionContext}
                                context={context}
                                limit={limit}
                                setLimit={setLimit}
                                temperature={temperature}
                                setTemperature={setTemperature}
                                answerLog={answerLog}
                            />
                        </Modal>
                    )}
                </Box>
            </div>
        </StyledLayout>
    );
};
