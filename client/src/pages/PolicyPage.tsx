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
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useInsight } from '@semoss/sdk-react';
import { Sidebar } from '../components/Sidebar';
import { VectorModal } from '../components/VectorModal';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Markdown } from '@/components/common';
import { AIBotError } from './Error'

const StyledContainer = styled('div')(({ theme }) => ({
    padding: `2rem 10rem 2rem calc(10rem + 280px)`,
    display: 'flex',
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    width: '100%',
    borderRadius: '6px',
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
    //From the LLM
    const [answer, setAnswer] = useState({
        question: '',
        conclusion: '',
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

    const [limit, setLimit] = useState<number>(3);
    const [temperature, setTemperature] = useState<number>(0);
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
            VectorDatabaseQuery(engine="${selectedVectorDB.database_id}" , command="${data.QUESTION}", limit=${limit})
            `;

            const response = await actions.run<Record<string, any>[]>(pixel);

            const { output, operationType } = response.pixelReturn[0];

            if (operationType.indexOf('ERROR') > -1)
                throw new Error(output.response);

            let context_docs = ``;
            const temp_urls = [];

            //Add three most similar policy docs to context to support policy bot.
            for (let i = 0; i <= output.length - 1; i++) {
                const content = output[i].content || output[i].Content;
                context_docs += `{'role': 'system', 'content': '${content}'},`;
                temp_urls.push(output[i].url);
            }

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
            LLM(engine="${selectedModel.database_id}" , command=["${data.QUESTION}"], paramValues=[{"full_prompt":[{'role':'system', 'content':"You are an intelligent AI designed to answer queries based on provided policy documents. If an answer cannot be determined based on the provided policy documents, inform the user. Answer as truthfully as possible at all times and tell the user if you do not know the answer. Please be concise and get to the point. ${data.QUESTION}"},` +
                context_docs +
                `]}, temperature=${temperature}])
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
                const model = output.find(m=>m.app_id === "4acbe913-df40-4ac0-b28a-daa5ad91b172");
                if(model === undefined) 
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

    return (
        <StyledLayout justifyContent={'center'}>
            { error == 'You do not have access to the model' ? <AIBotError/> : 
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
                            <Stack spacing={2} color='#4F4F4F'>
                                <Typography variant="h5" color='#40007B'><strong>Hello!</strong> Welcome to NIAID’s AI Document Bot</Typography>
                                <Typography variant="body1">
                                    The AI Document Bot is a chat interface between users and uploaded documents. Upload policies, proposals, meeting minutes, operational procedures, policy manuals as PDF’s or Word documents and ask questions. To begin, select a document repository on the right or create a new one.
                                </Typography>
                                {error && <Alert color="error">{error}</Alert>}
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
                                    } } />
                                <Stack
                                    flexDirection={'row'}
                                    alignItems={'center'}
                                    justifyContent={'center'}
                                    gap={1}
                                >
                                    <DisplayButton
                                        variant="contained"
                                        disabled={isLoading || (Object.keys(selectedVectorDB).length === 0)}
                                        onClick={ask}
                                        sx={{ flex: 1, width: '85%' }}
                                    >
                                        Generate Answer
                                    </DisplayButton>
                                </Stack>
                                {isAnswered && (
                                    <Stack>
                                        <Typography
                                            variant={'subtitle2'}
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
                                        <Typography
                                            variant={'subtitle2'}
                                            color='#40007B'
                                            sx={{
                                                fontWeight: '600',
                                            }}
                                        >
                                            Conclusion:
                                        </Typography>
                                        <Box sx={{ mb: 2, overflow: 'auto' }}>
                                            <Markdown>{answer.conclusion}</Markdown>
                                        </Box>
                                        {<>
                                            <Stack flexDirection={'row'} gap={'1rem'}>
                                                <DisplayButton variant="contained" onClick={() => setShowContext(!showContext)}>{showContext ? 'Hide Full Context' : 'Get Full Context'}</DisplayButton><DisplayButton variant="contained" onClick={() => {
                                                    navigator.clipboard.writeText(answer.conclusion);
                                                } }>Copy Results</DisplayButton>
                                            </Stack>
                                            {showContext &&
                                                urls.map((url) => (
                                                    <div key={url.ID}>
                                                        Source:{' '}
                                                        <a href={url.link}>
                                                            {url.link}
                                                        </a>
                                                    </div>
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
                    </Modal><PoweredBy>Responses Generated by OpenAI’s GPT-4 Turbo</PoweredBy></>
                        }
        </StyledLayout>
    );
};
