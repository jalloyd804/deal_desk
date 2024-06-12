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

const StyledContainer = styled('div')(({ theme }) => ({
    padding: `${theme.spacing(4)} ${theme.spacing(0)} ${theme.spacing(
        4,
    )} 280px`,
    maxWidth: '1000px',
    display: 'flex',
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    width: '100%',
}));

const StyledLayout = styled(Stack)(() => ({
    display: 'flex',
    flexDirection: 'row',
}));

const StyledButton = styled(IconButton)(() => ({
    position: 'fixed',
    left: '0%',
    marginRight: 'auto',
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
            if (process.env.ENVIRONMENTFLAG === "Deloitte"){
                model = "4801422a-5c62-421e-a00c-05c6a9e15de8"
            }
            else if (process.env.ENVIRONMENTFLAG === "NIH"){
                model = "f89f9eec-ba78-4059-9f01-28e52d819171"
            }

            const response = await actions.run<Record<string, any>[]>(pixel);

            const { output, operationType } = response.pixelReturn[0];

            if (operationType.indexOf('ERROR') > -1)
                throw new Error(output.response);

            let context_docs = ``;
            const temp_urls = [];

            //Add three most similar policy docs to context to support policy bot.
            for (let i = 0; i <= output.length - 1; i++) {
                const content = output[i].content || output[i].Content;
                const source = output[i].source || output[i].Source + ", Page(s): " + output[i].Divider;
                context_docs += `{'role': 'system', 'content': '<encode>${content}</encode>'},`;
                temp_urls.push(source);
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

            LLM(engine="` + model + `", command=["<encode>${data.QUESTION}</encode>"], paramValues=[{"full_prompt":[{'role':'system', 'content':"<encode>You are an advanced AI designed to provide detailed and accurate analyses of various documents. Your goal is to answer questions based on the information contained within these documents, ensuring thoroughness, clarity, and relevance. If the answer cannot be found in the documents, inform the user explicitly. If the information is not present in the provided documents do not answer the question.\n\nGuidelines:\n1. Analyze Thoroughly: Carefully read and analyze the content of the documents provided.\n2. Provide Relevant Information: Ensure all answers are based solely on the information within the documents.\n3. Be Clear and Concise: Offer clear and concise responses, avoiding ambiguity and unnecessary details.\n4. Acknowledge Limitations: If the answer is not present in the documents, state that the information is not available.\n5. Maintain Integrity: Always provide truthful and accurate information.\n6. Answer Structure: Answers should be presented in a logical and organized manner, ensuring readability.\n\nQuestion:\n${data.QUESTION}</encode>"},` +
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
                setSelectedModel(output[0]);
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
            <Stack>
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
                        setTemperature={setTemperature}
                    />
                ) : (
                    <StyledButton onClick={() => setSideOpen(!sideOpen)}>
                        <ArrowForwardIosIcon />
                    </StyledButton>
                )}
                <StyledContainer>
                    <StyledPaper variant={'elevation'} elevation={2} square>
                        <Stack spacing={2}>
                            <Typography variant="h5">AskMe.AI</Typography>
                            <Typography variant="body1">
                                Assists users in answering complex policy,
                                operational procedure, and system questions.
                                This engine takes data such as policy manuals,
                                system documents, process maps, data from case
                                databases as inputs, and uses LLM models to
                                provide answers.
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
                                            value={
                                                field.value ? field.value : ''
                                            }
                                            onChange={(e) =>
                                                // set the value
                                                field.onChange(e.target.value)
                                            }
                                            multiline
                                            rows={4}
                                        />
                                    );
                                }}
                            />
                            <Stack
                                flexDirection={'row'}
                                alignItems={'center'}
                                justifyContent={'center'}
                                gap={1}
                            >
                                <Button
                                    variant="contained"
                                    disabled={isLoading}
                                    onClick={ask}
                                    sx={{ flex: 1, width: '85%' }}
                                >
                                    Generate Answer
                                </Button>
                            </Stack>
                            {isAnswered && (
                                <Stack>
                                    <Typography
                                        variant={'subtitle2'}
                                        sx={{ fontWeight: '600' }}
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
                                    >
                                        Policy Extraction Response:
                                    </Typography>
                                    <Typography
                                        variant={'subtitle2'}
                                        sx={{
                                            color: '#1260DD',
                                            fontWeight: '600',
                                        }}
                                    >
                                        Conclusion:
                                    </Typography>
                                    <Box sx={{ mb: 2, overflow: 'auto' }}>
                                        <Markdown>{answer.conclusion}</Markdown>
                                    </Box>
                                    {
                                        <>
                                            <Button
                                                onClick={() =>
                                                    setShowContext(!showContext)
                                                }
                                            >
                                                {!showContext && (
                                                    <p>Get Full Context</p>
                                                )}
                                                {showContext && (
                                                    <p>Hide Full Context</p>
                                                )}
                                            </Button>
                                            {showContext &&
                                                urls.map((url) => (
                                                    <div key={url.Page}>
                                                        Source:{' '}
                                                        <a href={url.link}>
                                                            {url.link}
                                                        </a>
                                                    </div>
                                                ))}
                                        </>
                                    }
                                </Stack>
                            )}
                        </Stack>
                    </StyledPaper>
                    {isLoading && <LinearProgress />}
                </StyledContainer>
            </Stack>
            <Modal open={open} onClose={() => setOpen(false)}>
                <VectorModal
                    setOpen={setOpen}
                    open={open}
                    vectorOptions={vectorOptions}
                    setRefresh={setRefresh}
                    setSelectedVectorDB={setSelectedVectorDB}
                    selectedVectorDB={selectedVectorDB}
                    setError={setError}
                />
            </Modal>
        </StyledLayout>
    );
};
