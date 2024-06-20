import { useEffect, useState } from 'react';
import {
    styled,
    Alert,
    Box,
    Button,
    Stack,
    LinearProgress,
    TextField,
    Typography,
    Paper,
    Modal,
    IconButton,
    CircularProgress,
    Collapse,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useInsight } from '@semoss/sdk-react';
import { Sidebar } from '../components/Sidebar';
import { VectorModal } from '../components/VectorModal';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import Close from '@mui/icons-material/Close';
import { Markdown } from '@/components/common';
import { AIBotError } from './Error'

const StyledContainer = styled('div')(({ theme }) => ({
    padding: `2rem 10rem 2rem calc(10rem + 280px)`,
    display: 'flex',
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    position: 'relative',
    width: '100%',
    borderRadius: '6px',
    overflow: 'hidden',
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

const StyledLayout = styled(Stack)(() => ({
    display: 'flex',
}));

const StyledButton = styled(IconButton)(() => ({
    position: 'fixed',
    left: '0%',
    marginRight: 'auto',
}));

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

const PoweredBy = styled('div')(() => ({
    color: '#4F4F4F',
    alignSelf: 'center',
    padding: '0  0 2rem 280px',
}));

const SourceBox = styled('div')(() => ({
    marginTop: '1rem',
    '& > a': {
        color: '#4f4f4f',
    }
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

export const PolicyPage = () => {
    const { actions } = useInsight();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isAnswered, setIsAnswered] = useState(false);
    const [showContext, setShowContext] = useState(false);
    const [openBeta, setOpenBeta] = useState(true);
    //From the LLM
    const [answer, setAnswer] = useState({
        question: '',
        conclusion: '',
        partial_docs_note: ''
    });
    // Model Catalog and first model in dropdown
    const [modelOptions, setModelOptions] = useState([]);
    const [selectedModel, setSelectedModel] = useState<Model>({});

    // Vector DB catalog and first vector DB in dropdown
    const [vectorOptions, setVectorOptions] = useState([]);
    const [selectedVectorDB, setSelectedVectorDB] = useState<Model>({});
    //Controlling the modal
    const [open, setOpen] = useState<boolean>(false);
    const [refresh, setRefresh] = useState<boolean>(false);

    //Controlling the Sidebar
    const [sideOpen, setSideOpen] = useState<boolean>(true);
    const [urls, setUrls] = useState([]);
    const { control, handleSubmit } = useForm({
        defaultValues: {
            QUESTION: '',
        },
    });

    const [limit, setLimit] = useState<number>(5);
    const [temperature, setTemperature] = useState<number>(0.3);
    /**
     * Allow the user to ask a question
     */
    const ask = handleSubmit(async (data: { QUESTION: string }) => {
        try {
            // turn on loading
            setError('');
            setIsLoading(true);
            setIsAnswered(false);

            if (!data.QUESTION) {
                throw new Error('Question is required');
            }
            let pixel = `
            VectorDatabaseQuery(engine="${selectedVectorDB.database_id}" , command="<encode>${data.QUESTION}</encode>", limit=${limit})
            `;

            let model = ''
            if (process.env.ENVIRONMENTFLAG === "Deloitte") {
                model = "4801422a-5c62-421e-a00c-05c6a9e15de8"
            }
            else if (process.env.ENVIRONMENTFLAG === "NIH") {
                model = "f89f9eec-ba78-4059-9f01-28e52d819171"
            }

            const response = await actions.run<Record<string, any>[]>(pixel);

            const { output, operationType } = response.pixelReturn[0];

            if (operationType.indexOf('ERROR') > -1)
                throw new Error(output.response);

            let context_docs = ``;
            const temp_urls = [];

            let docs_used = 0
            for (let i = 0; i <= output.length - 1; i++) {
                if (output[i].score || output[i].Score < 0.8) {
                    docs_used += 1
                    const content = output[i].content || output[i].Content;
                    const source = output[i].source || output[i].Source + ", Page(s): " + output[i].Divider;
                    context_docs += `{'role': 'system', 'content': '<encode>${content}</encode>'},`;
                    temp_urls.push(source);
                }
            }

            let partial_docs_note = ''
            if (docs_used == 1 && docs_used < output.length) {
                partial_docs_note = `Note: Only ${docs_used} source was used to answer this question.`
            } else if (docs_used > 1 && docs_used < output.length) {
                partial_docs_note = `Note: Only ${docs_used} sources were used to answer this question.`
            };

            if (context_docs.length > 0)
                context_docs = context_docs.substring(
                    0,
                    context_docs.length - 1,
                );

            setUrls(
                temp_urls.map((url, i) => ({
                    ID: i,
                    link: url,
                })),
            );

            pixel =
                `
            LLM(engine="` + model + `", command=["<encode>${data.QUESTION}</encode>"], paramValues=[{"full_prompt":[{'role':'system', 'content':"<encode>You are an advanced AI designed to provide detailed and accurate analyses of various documents. Your goal is to answer questions based on the information contained within these documents, ensuring thoroughness, clarity, and relevance. If the answer cannot be found in the documents, inform the user explicitly. If the information is not present in the provided documents do not answer the question.\n\nGuidelines:\n1. Analyze Thoroughly: Carefully read and analyze the content of the documents provided.\n2. Provide Relevant Information: Ensure all answers are based solely on the information within the documents.\n3. Be Clear and Concise: Offer clear and concise responses, avoiding ambiguity and unnecessary details.\n4. Acknowledge Limitations: If the answer is not present in the documents, state that the information is not available.\n5. Maintain Integrity: Always provide truthful and accurate information.\n6. Answer Structure: Answers should be presented in a logical and organized manner, ensuring readability.\n\nQuestion:\n${data.QUESTION}</encode>"},` +
                context_docs +
                `]}, temperature=${temperature}])
            `;

            // only need to call LLM if documents that meet the threshold were found
            let conclusion = ''
            if (docs_used > 0) {
                const LLMresponse = await actions.run<[{ response: string }]>(
                    pixel,
                );

                const { output: LLMOutput, operationType: LLMOperationType } =
                    LLMresponse.pixelReturn[0];

                if (LLMOperationType.indexOf('ERROR') > -1) {
                    throw new Error(LLMOutput.response);
                }

                if (LLMOutput.response) {
                    conclusion = LLMOutput.response
                }
            } else {
                conclusion = 'The required information is not available in the provided documents. Please attempt a different question or upload other documents.'
            }

            // set answer based on data
            setAnswer({
                question: data.QUESTION,
                conclusion: conclusion,
                partial_docs_note: partial_docs_note
            });

            setIsAnswered(true);
        } catch (e) {
            if (e) {
                setError(e);
            } else {
                setError('There is an error, please check pixel calls');
            }
        } finally {
            setIsLoading(false);
        }
    });

    useEffect(() => {
        setIsLoading(true);
        //Grabbing all the Models that are in CfG
        let pixel = `MyEngines ( engineTypes=["MODEL"]);`;

        actions.run(pixel).then((response) => {
            const { output, operationType } = response.pixelReturn[0];

            if (operationType.indexOf('ERROR') > -1) {
                throw new Error(output as string);
            }
            if (Array.isArray(output)) {
                setModelOptions(output);
                const model = output.find(m => m.app_id === model);
                if (model === undefined)
                    setError("You do not have access to the model");
                setSelectedModel(model);
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
                setSelectedVectorDB(output[0]);
            }
        });

        setIsLoading(false);
    }, []);

    useEffect(() => {
        const pixel = `MyEngines ( engineTypes=["VECTOR"]);`;

        actions.run(pixel).then((response) => {
            const { output, operationType } = response.pixelReturn[0];
            if (operationType.indexOf('ERROR') > -1) {
                throw new Error(output as string);
            }
            if (Array.isArray(output)) {
                setVectorOptions(output);
                setSelectedVectorDB(output[0]);
                setRefresh(false);
            }
        });
    }, [refresh]);

    function genAnswerDisabled() {
        if (isLoading) return true;
        if (selectedVectorDB === null) return true;
        if (Object.keys(selectedVectorDB).length === 0) return true;
    }

    return (
        <StyledLayout justifyContent={'center'}>
            {error == 'You do not have access to the model' ? <AIBotError /> :
                <><Stack>
                    {sideOpen ? (
                        <Sidebar
                            modelOptions={modelOptions}
                            selectedModel={selectedModel}
                            setSelectedModel={setSelectedModel}
                            vectorOptions={vectorOptions}
                            selectedVectorDB={selectedVectorDB}
                            setSelectedVectorDB={setSelectedVectorDB}
                            setSideOpen={setSideOpen}
                            setOpen={setOpen}
                            limit={limit}
                            setLimit={setLimit}
                            temperature={temperature}
                            setTemperature={setTemperature} />
                    ) : (
                        <StyledButton onClick={() => setSideOpen(!sideOpen)}>
                            <ArrowForwardIosIcon />
                        </StyledButton>
                    )}
                    <StyledContainer>
                        <StyledPaper variant={'elevation'} elevation={2} square>
                            {isLoading && <LoadingOverlay><CircularProgress /></LoadingOverlay>}
                            <Stack spacing={2} color='#4F4F4F'>
                                <Typography variant="h5" color='#40007B'><strong>Hello!</strong> Welcome to NIAID’s AI Document Bot</Typography>
                                <Typography variant="body1">
                                    The AI Document Bot is a chat interface between users and uploaded documents. Upload policies, proposals, meeting minutes, operational procedures, policy manuals as PDF’s or Word documents and ask questions. To begin, select a document repository on the right or create a new one.
                                </Typography>
                                {error && <Alert color="error">{error.toString()}</Alert>}
                                <Collapse in={openBeta}>
                                    <Alert severity={'info'}
                                        action={
                                            <IconButton
                                                aria-label="close"
                                                color="inherit"
                                                size="small"
                                                onClick={() => {
                                                    setOpenBeta(false);
                                                }}
                                            >
                                                <Close fontSize="inherit" />
                                            </IconButton>
                                        }
                                        sx={{ mb: 2 }}
                                    >
                                        <Typography
                                            variant={'caption'}
                                        >
                                            You are ultimately responsible for ensuring the accuracy, completeness, and relevance of any output generated by this tool and how the generated output is used. Please note, that responses from this tool may be inaccurate (hallucinations), outdated, incomplete, or not aligned to your specific needs. You should always independently understand and verify that the content generated is accurate in your specific context and suitable for your use. Where possible review other sources of information to verify accuracy of the generated content. Please make any necessary edits before sharing the output from this tool.
                                        </Typography>

                                    </Alert>
                                </Collapse>
                                <Controller
                                    name={'QUESTION'}
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field }) => {
                                        return (
                                            <TextField
                                                label="Enter Question:"
                                                variant="outlined"
                                                fullWidth
                                                value={field.value ? field.value : ''}
                                                onChange={(e) =>
                                                    // set the value
                                                    field.onChange(e.target.value)}
                                                multiline
                                                rows={4} />
                                        );
                                    }} />
                                <Stack
                                    flexDirection={'row'}
                                    alignItems={'center'}
                                    justifyContent={'center'}
                                    gap={1}
                                >
                                    <DisplayButton
                                        variant="contained"
                                        disabled={genAnswerDisabled()}
                                        onClick={ask}
                                        sx={{ flex: 1, width: '85%' }}
                                    >
                                        Generate Answer
                                    </DisplayButton>
                                </Stack>
                                {isAnswered && (
                                    <Stack>
                                        <Typography
                                            variant={'subtitle1'}
                                            sx={{ fontWeight: '600' }}
                                            color='#40007B'
                                        >
                                            Question:
                                        </Typography>
                                        <Typography
                                            variant={'body1'}
                                            sx={{ mb: 2 }}
                                        >
                                            {answer.question}
                                        </Typography>
                                        <Typography
                                            variant={'subtitle1'}
                                            sx={{ fontWeight: '600', mb: 0.5 }}
                                            color='#40007B'
                                        >
                                            Document Bot Response:
                                        </Typography>
                                        <Box sx={{ mb: 2, overflow: 'auto' }}>
                                            <Markdown>{answer.conclusion}</Markdown>
                                            {answer.partial_docs_note && (
                                                <Typography component="p" style={{ fontStyle: 'italic', marginTop: '16px' }}>
                                                    {answer.partial_docs_note}
                                                </Typography>
                                            )}
                                        </Box>
                                        {<>
                                            <Stack flexDirection={'row'} gap={'1rem'} marginBottom={'2rem'}>
                                                <DisplayButton variant="contained" onClick={() => setShowContext(!showContext)}>{showContext ? 'Hide Full Context' : 'Get Full Context'}</DisplayButton><DisplayButton variant="contained" onClick={() => {
                                                    navigator.clipboard.writeText(answer.conclusion);
                                                }}>Copy Results</DisplayButton>
                                            </Stack>
                                            {showContext &&
                                                urls.map((url) => (
                                                    <SourceBox key={url.Page}>
                                                        <Typography color='#40007B' display={'inline'}>Source:</Typography>{' '}
                                                        <a href={url.link}>
                                                            {url.link}
                                                        </a>
                                                    </SourceBox>
                                                ))}
                                        </>}
                                    </Stack>
                                )}
                            </Stack>
                        </StyledPaper>
                        {isLoading && <LinearProgress />}
                    </StyledContainer>
                </Stack><Modal open={open} onClose={() => setOpen(false)}>
                        <VectorModal
                            setOpen={setOpen}
                            open={open}
                            vectorOptions={vectorOptions}
                            setRefresh={setRefresh}
                            setSelectedVectorDB={setSelectedVectorDB}
                            selectedVectorDB={selectedVectorDB}
                            setError={setError} />
                    </Modal><PoweredBy>Responses Generated by OpenAI’s GPT-4o</PoweredBy></>
            }
        </StyledLayout>
    );
};
