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
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useInsight } from '@semoss/sdk-react';
import { Sidebar } from '../components/Sidebar';
import { PromptModal } from '../components/PromptModal';
import {PregeneratedContext } from '../components/PregeneratedContext';
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

const StyledContainer = styled(Stack)(() => ({
    height: '70vh',
    overflowY: 'scroll',
    display: 'flex',
    flexDirection: 'column',
    scrollbarWidth: 'none', // Hide the scrollbar for firefox
    '&::-webkit-scrollbar': {
        display: 'none', // Hide the scrollbar for WebKit browsers (Chrome, Safari, Edge, etc.)
    },
    '&-ms-overflow-style:': {
        display: 'none', // Hide the scrollbar for IE
    },
}));

const StyledTitle = styled('div')(({ theme }) => ({
    background: '#319fbe',
    padding: theme.spacing(2),
    borderTopLeftRadius: theme.spacing(2),
    borderTopRightRadius: theme.spacing(2),
    display: 'flex',
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
    background: 'white',
    marginRight: theme.spacing(2),
}));

const StyledAnswerAvatar = styled(Avatar)(({ theme }) => ({
    marginRight: theme.spacing(2),
}));

const StyledQuestionStack = styled(Stack)(({ theme }) => ({
    paddingLeft: theme.spacing(2),
    paddingBottom: theme.spacing(2),
}));

const StyledStack = styled(Stack)(({ theme }) => ({
    padding: theme.spacing(2),
}));

const StyledDescription = styled(Typography)(({ theme }) => ({
    padding: theme.spacing(3),
}));

const StyledName = styled(Typography)(({ theme }) => ({
    paddingTop: theme.spacing(1),
    paddingLeft: theme.spacing(1.4),
    fontWeight: 'bold',
}));

const StyledAdditonalInfo = styled(Typography)(({ theme }) => ({
    paddingLeft: theme.spacing(1.4),
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
    width: '100%',
    borderRadius: theme.spacing(2),
    marginBottom: theme.spacing(6),
}));

const StyledLayout = styled(Stack, {
    shouldForwardProp: (prop) => prop !== 'sideOpen',
})<{ sideOpen: boolean }>(({ theme, sideOpen }) => ({
    padding: `${theme.spacing(4)} ${sideOpen ? theme.spacing(4) : theme.spacing(6)} ${theme.spacing(4)} ${
        sideOpen ? '180px' : theme.spacing(6)
    }`,
    width: `${sideOpen ? '60vw' : '75vw'}`,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: '#ebf5f9',
}));

const StyledLeftPanel = styled(Paper)(({ theme }) => ({
    position: 'fixed',
    left: '0%',
    marginRight: 'auto',
    width: theme.spacing(6),
    height: '100%',
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
    paddingTop: theme.spacing(3),
}));

const StyledResponseDiv = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
}));

const StyledQuestionDiv = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection:'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing(2),
    textAlign: 'center',
    padding: theme.spacing(0.5),
    [theme.breakpoints.down('sm')]: {
        position: 'relative',
    },
}));

const StyledPromptContainer = styled('div')(({ theme }) => ({
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    paddingTop: theme.spacing(2),
    paddingLeft: theme.spacing(2),
    paddingBottom: theme.spacing(1),
}));

const StyledLabel = styled('div')(({ theme }) => ({
    ...theme.typography.body2,
    color: 'gray',
    display: 'flex',
    alignItems: 'center',
}));

const StyledPromptIconContainer = styled('div')(({ theme }) => ({
    color: theme.palette.text.disabled,
    width: theme.spacing(4),
}));

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
    LLM: string;
    vectorCatalogs: string;
}

interface Prompt {
    prompt_id: number, 
    prompt: string,
    context: string
}

export const PolicyPage = () => {
    const { actions } = useInsight();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isAnswered, setIsAnswered] = useState(false);
    //From the LLM
    const [answer, setAnswer] = useState<Answer>(null);
    const [answerLog, setAnswerLog] = useState<Answer[]>([]);

    // Model Catalog and first model in dropdown
    const [modelOptions, setModelOptions] = useState([]);
    const [selectedModel, setSelectedModel] = useState<Model[]>([]);

    // Vector DB catalog and first vector DB in dropdown
    const [vectorOptions, setVectorOptions] = useState<Model[]>([]);
    const [selectedVectorDB, setSelectedVectorDB] = useState<Model[]>([]);

    const [prompt, setPrompt] = useState<string>(
        'Only return a helpful answer and nothing else.',
    );
    const [additionalContext, setAdditionalContext] = useState<string>('')
    const [showPrompts, setShowPrompts] = useState<boolean>(false);
    const [questionContext, setQuestionContext] = useState<string>(
    "Use the following pieces of information to answer the user's question. " + `${additionalContext} ` +
    "If you do not know the answer, just say that you don't know, don't try to make up an answer."
    );

    //Controlling the modal
    const [open, setOpen] = useState<boolean>(false);
    const [refresh, setRefresh] = useState<boolean>(false);

    //Controlling the Sidebar
    const [sideOpen, setSideOpen] = useState<boolean>(true);
    const { control, handleSubmit, setValue } = useForm({
        defaultValues: {
            QUESTION: '',
        },
    });

    const [limit, setLimit] = useState<number>(3);
    const [temperature, setTemperature] = useState<number>(0.1);

    // for our snackbar alert
    const [alertOpen, setAlertOpen] = useState<boolean>(false);

    //For the settings modal
    const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [context, setContext] = useState<'prompt' | 'refine' | 'download'>(null);

    // scrolling to the bottom of the container
    const div = useRef(null);

    const handleMenuClick = () => {
        setAnchorEl(event.target);
        setSettingsOpen(true);
    };

    const handlePromptChange = (prompt: Prompt) => {
        setValue("QUESTION", prompt.context)
        ask()
        setShowPrompts(false)
    }

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

        let finalContent = ``;

        let pixel = '';

        try {
            if (!data.QUESTION) {
                throw new Error('Question is required');
            }

            for (let i = 0; i < selectedVectorDB.length; i++) {
                const pixel = `
                VectorDatabaseQuery(engine="${selectedVectorDB[i].database_id}" , command="${data.QUESTION}", limit=${limit})
                `;

                const response = await actions.run<Record<string, any>[]>(
                    pixel,
                );

                const { output, operationType } = response.pixelReturn[0];

                if (operationType.indexOf('ERROR') > -1)
                    throw new Error(output.response);

                //Looping through Vector Database Query and forming a content string with name, page, and content
                for (let i = 0; i <= output.length - 1; i++) {
                    const content = output[i].content || output[i].Content;
                    finalContent += `\\n* `;
                    Object.keys(output[i]).map(
                        (source) =>
                            (finalContent += `${source}: ${output[i][source]},`),
                    );
                    finalContent += ` ${content}`;
                }
            }

            const contextDocs = `A context delimited by triple backticks is provided below. This context may contain plain text extracted from paragraphs or images. Tables extracted are represented as a 2D list in the following format - '[[Column Headers], [Comma-separated values in row 1], [Comma-separated values in row 2] ..... [Comma-separated values in row n]]'\\n \`\`\` ${finalContent} \`\`\`\\n ${questionContext}}`;
            for (let i=0; i< selectedModel.length; i++){
                    pixel = `
                LLM(engine="${
                    (selectedModel[i] as Model).database_id
                }" , command=["<encode>${prompt} Question: ${
                    data.QUESTION
                }. Context: ${contextDocs}</encode>"], paramValues=[{"temperature":${temperature}}])
                `;

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
                    conclusion: conclusion,
                    LLM: (selectedModel[i] as Model).database_name,
                    vectorCatalogs: JSON.stringify(
                        selectedVectorDB.map((vector) => vector.database_name),
                    ),
                });
            }
            

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
        setIsLoading(true);
        //Grabbing all the Models that are in CfGov
        let pixel = ` MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "text-generation" }] , engineTypes = [ 'MODEL' ] )`;

        actions.run(pixel).then((response) => {
            const { output, operationType } = response.pixelReturn[0];

            if (operationType.indexOf('ERROR') > -1) {
                throw new Error(output as string);
            }
            if (Array.isArray(output)) {
                setModelOptions(output);
                setSelectedModel([output[0]]);
            }
        });
        //Grabbing all the Vector Databases in CfG
        pixel = `MyEngines ( engineTypes=["VECTOR"]);`;

        actions.run(pixel).then((response) => {
            const { output, operationType } = response.pixelReturn[0];

            if (operationType.indexOf('ERROR') > -1) {
                throw new Error(output as string);
            }
            if (Array.isArray(output)) {
                setVectorOptions(output);
                setSelectedVectorDB([output[0]])
            }
        });

        setIsLoading(false);
    }, []);

    useEffect(() => {
        div.current?.scrollIntoView({ behavior: 'smooth' });
    }, [answerLog]);

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
        if (answer) {
            setAnswerLog([...answerLog, answer]);
        }
    }, [answer]);

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
                    vectorOptions={vectorOptions}
                    selectedVectorDB={selectedVectorDB}
                    setSelectedVectorDB={setSelectedVectorDB}
                    setSideOpen={setSideOpen}
                />
            ) : (
                <StyledLeftPanel>
                    <StyledIconButton onClick={() => setSideOpen(!sideOpen)}>
                        <ArrowForwardIosIcon />
                    </StyledIconButton>
                </StyledLeftPanel>
            )}
            <StyledContainer>
                <StyledPaper variant={'elevation'} elevation={2} square>
                    <StyledTitle>
                        <StyledAvatar>
                            <SmartToyOutlinedIcon
                                sx={{ color: 'rgba(0, 0, 0, 0.87)' }}
                            />
                        </StyledAvatar>
                        <div>
                            <Typography variant="h6">Demo Vector Engine 2 </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: 'rgba(0, 0, 0, 0.6)' }}
                            >
                                Policy Bot
                            </Typography>
                        </div>
                    </StyledTitle>
                    <StyledDescription variant="body1">
                        Assists users in answering complex policy, operational
                        procedure, and system questions. This engine takes data
                        such as policy manuals, system documents, process maps,
                        data from case databases as inputs, and uses LLM models
                        to provide answers.
                    </StyledDescription>

                    {/* <Accordion defaultExpanded>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography>
                                    Configure
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <StyledStack spacing={2}>
                                    <Typography> Select Model: </Typography>
                                    <Select
                                        fullWidth
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedModel(e.target.value)}
                                        value={selectedModel}
                                    >
                                        {modelOptions.map((option, i) => {
                                            return (
                                                <MenuItem value={option} key={i}>
                                                    {option.database_name}
                                                </MenuItem>
                                            );
                                        })}
                                    </Select>
                                    {/* <Typography> Select Knowledge Repository: </Typography>
                                    <Autocomplete
                                        options={vectorOptions}
                                        placeholder='Choose a Vector Catalog'
                                        getOptionLabel={(option) => option.database_name || ""}
                                        onChange={(event, newVectorDB) =>
                                            setSelectedVectorDB(newVectorDB)
                                        }
                                        renderInput={(params) => (
                                            <TextField {...params} variant="outlined" />
                                        )}
                                        multiple
                                    /> */}
                    {/* </StyledStack>
                            </AccordionDetails>
                        </Accordion> */}
                </StyledPaper>
                <Stack gap={1}>
                    {answerLog.map((answer) => (
                        <>
                            <StyledResponseDiv>
                                <StyledAnswerAvatar>
                                    <PersonIcon />
                                </StyledAnswerAvatar>
                                <StyledPaper elevation={2} square>
                                    <StyledName variant="h6">You</StyledName>
                                    <StyledQuestionStack>
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <div>
                                                <Typography variant={'body1'}>
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
                                            </IconButton>
                                        </div>
                                    </StyledQuestionStack>
                                </StyledPaper>
                            </StyledResponseDiv>
                            <StyledResponseDiv>
                                <StyledAvatar>
                                    <SmartToyOutlinedIcon
                                        sx={{
                                            color: 'rgba(0, 0, 0, 0.87)',
                                        }}
                                    />
                                </StyledAvatar>
                                <StyledPaper>
                                    <div>
                                        <StyledName variant="h6">
                                            Policy Extraction Response
                                        </StyledName>
                                        <StyledAdditonalInfo
                                            variant="body2"
                                            sx={{
                                                color: 'rgba(0, 0, 0, 0.6)',
                                            }}
                                        >
                                            {answer.LLM}
                                        </StyledAdditonalInfo>
                                        <StyledAdditonalInfo
                                            variant="body2"
                                            sx={{
                                                color: 'rgba(0, 0, 0, 0.6)',
                                            }}
                                        >
                                            {answer.vectorCatalogs}
                                        </StyledAdditonalInfo>
                                    </div>
                                    <StyledStack spacing={2}>
                                        <Box sx={{ mb: 2, overflow: 'auto' }}>
                                            {error && (
                                                <Alert color="error">
                                                    {error}
                                                </Alert>
                                            )}
                                            <Markdown>
                                                {answer.conclusion}
                                            </Markdown>
                                        </Box>
                                    </StyledStack>
                                </StyledPaper>
                            </StyledResponseDiv>
                        </>
                    ))}

                    {/* this is a dummy div so that you can scroll to it */}
                    <div ref={div} />
                    {showPrompts && <PregeneratedContext handlePromptChange={handlePromptChange}/>}
                </Stack>
            </StyledContainer>
            <StyledQuestionDiv>
            {
                selectedVectorDB.length > 0 && (
                    <StyledPromptContainer>
                        <StyledLabel>
                            {showPrompts ? 'Hide ' : 'Show '} Prompts:
                        </StyledLabel>
                        <StyledPromptIconContainer>
                            <ButtonGroup>
                                <IconButton
                                    size="small"
                                    color="inherit"
                                    onClick={()=> setShowPrompts(!showPrompts)}
                                >
                                    <MenuOpenOutlinedIcon
                                        color="inherit"
                                        fontSize="inherit"
                                    />
                                </IconButton>
                            </ButtonGroup>
                        </StyledPromptIconContainer>
                    </StyledPromptContainer>
                )
            }

                <Controller
                    name={'QUESTION'}
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => {
                        return (
                            <StyledPaper elevation={2} square>
                                <TextField
                                    autoComplete="off"
                                    placeholder={
                                        isAnswered
                                            ? 'Ask a new question'
                                            : 'Ask a question here'
                                    }
                                    variant="standard"
                                    fullWidth
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
                                                    onClick={handleMenuClick}
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
                        <MenuItem onClick={() => handleMenuClose('download')}>
                            <ListItemIcon>
                                <DownloadIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Download Answers</ListItemText>
                        </MenuItem>
                    )
                    }

                </Menu>
            </StyledQuestionDiv>
            {isLoading && <LinearProgress />}
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
        </StyledLayout>
    );
};
