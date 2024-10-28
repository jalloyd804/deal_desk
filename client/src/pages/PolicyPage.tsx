import { useEffect, useState } from 'react';
import {
    styled,
    Box,
    IconButton,
    Tabs,
    Tab,
    CircularProgress,
} from '@mui/material';
import { useInsight } from '@semoss/sdk-react';
import { Sidebar } from '../components/Sidebar';
import { useCookies } from 'react-cookie';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { DocBotPanel } from './DocBotPanel'
import { ChatHistoryPanel } from './ChatHistoryPanel'
import { AIBotError } from './Error'
import { Model } from '../interfaces/Model'
import { makeStyles } from '@material-ui/core/styles';
import { DisclaimerPage } from './Disclaimer'


const useStyles = makeStyles(theme => ({
    root: {
        '& [class*="MuiButtonBase-root MuiTab-root"]': {
            'max-width': "100%",
            'width': '50%',
            'border': 'solid',
            'border-color': 'lightgray',
            'border-radius': '5px 5px 0 0'
        },
        '& .MuiTabs-indicator': {
            'background-color': 'unset'
        },
        '& .Mui-selected ': {
            'border-color': '#40007B',
            'border-width': '2px',
            'color': '#40007B',
            'background-color': 'white'
        }
    }
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

const StyledLayout = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'row',
    height: '100%',
    overflow: 'hidden',
}));

const StyledButton = styled(IconButton)(() => ({
    position: 'fixed',
    left: '0%',
    marginRight: 'auto',
}));

const PoweredBy = styled('div')(() => ({
    color: '#4F4F4F',
    alignSelf: 'center',
    paddingBottom: '2rem',
}));

const StyledPolicy = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    overflow: 'auto'
}));

const welcomeText = `
The AI Document Repository Q&A is a chat interface between users and uploaded documents.
Upload policies, proposals, meeting minutes, operational procedures,
policy manuals as PDF’s, PowerPoints, or Word documents and ask questions.
To begin, select a document repository on the left or create a new one.
The Document Repository Q&A searches through the selected documents for content to answer questions.
It is best to spell out acronyms to improve the results.
If the user was to ask about large language models, it is recommended to format the
question as: What are large language models (LLMs)? 
`;

const disclaimer = ``;

const reminder = `
Note: Any document repositories not used after 120 days are automatically removed. 
`

export interface VectorContext {
    score: string;
    doc_index: string;
    tokens: string;
    content: string;
    url: string;
}
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

function BasicTabs({
    showContext,
    sideOpen,
    openBeta,
    setOpenBeta,
    genAnswerDisabled,
    setShowContext,
    temperature,
    setTabSelected,
    selectedVectorDB,
    setSelectedVectorDB,
    vectorOptions,
    allVectors,
    setRefresh,
    limit,
    open,
    setOpen,
    activeConversation,
    roomId,
    setIsLoading
}) {
    const [value, setValue] = useState(0);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabSelected(newValue);
        setValue(newValue);
    };
    const classes = useStyles();

    return (
        <>
        <Box sx={{ width: '100%', padding: '2%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', padding: 0 }}>
                <Tabs className={classes.root} value={value} onChange={handleChange} aria-label="basic tabs example">
                    <Tab label="Document Repository Q&A" {...a11yProps(0)} />
                    <Tab label="Document Repository Q&A History" {...a11yProps(1)} />
                </Tabs>
            </Box>
            <CustomTabPanel value={value} index={0}>
            <DocBotPanel    sideOpen={sideOpen}
                            welcomeText={welcomeText}
                            genAnswerDisabled={genAnswerDisabled}
                            showContext={showContext}
                            setShowContext={setShowContext}
                            selectedVectorDB={selectedVectorDB}
                            temperature = {temperature}
                            setSelectedVectorDB = {setSelectedVectorDB}
                            vectorOptions={allVectors}
                            setRefresh = {setRefresh}
                            limit = {limit}
                            open = {open}
                            setOpen ={setOpen}
                            roomId= {roomId}
                            setIsLoading = {setIsLoading}
                            disclaimer={disclaimer}
                            reminder={reminder}/>
            </CustomTabPanel>
            <CustomTabPanel value={value} index={1}>
                <ChatHistoryPanel 
                activeConversation={activeConversation}/>
            </CustomTabPanel>
        </Box>
    </>
    );
}
export const PolicyPage = () => {
    const { actions } = useInsight();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showContext, setShowContext] = useState(false);
    const [showDocManage, setShowDocManage] = useState(false);
    const [openBeta, setOpenBeta] = useState(true);
    const [tabSelected, setTabSelected] = useState(0);

    // Model Catalog and first model in dropdown
    const [modelOptions, setModelOptions] = useState([]);
    const [selectedModel, setSelectedModel] = useState<Model>({});

    // Vector DB catalog and first vector DB in dropdown
    const [vectorOptions, setVectorOptions] = useState([]);
    const [allVectors, setAllVectors] = useState([])
    const [selectedVectorDB, setSelectedVectorDB] = useState<Model>({});
    //Controlling the modal
    const [refresh, setRefresh] = useState<boolean>(false);

    //Controlling the Sidebar
    const [sideOpen, setSideOpen] = useState<boolean>(true);

    const [limit, setLimit] = useState<number>(5);
    const [temperature, setTemperature] = useState<number>(0.3);

    const [roomId, setRoomId] = useState(null);    const [cookies] = useCookies(['DOCBOT']);
    const [open, setOpen] = useState<boolean>(false);
    const [activeConversation, setActiveConversation] = useState(null);
    const [showDisclaimer] = useState(true);

    let model = ''
    if (process.env.ENVIRONMENTFLAG === "Deloitte") {
        model = "4801422a-5c62-421e-a00c-05c6a9e15de8"
    }
    else if (process.env.ENVIRONMENTFLAG === "NIH") {
        model = "f89f9eec-ba78-4059-9f01-28e52d819171"
    }
   
                        
    useEffect(() => {

        const openRoom = async () => {
            // wait for the pixel to run
            const { pixelReturn } = await actions.run<
                [
                    {
                        insightData: {
                            insightID: string;
                        };
                    },
                ]
            >(`OpenUserRoom();`);


            const { output: out } = pixelReturn[0];
            setRoomId(out.insightData.insightID);
        }

        openRoom();
    }, [])

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
                const mdl = output.find(m => m.app_id === model);
                if (mdl === undefined)
                    setError("You do not have access to the model");
                setSelectedModel(mdl);
            }
        });
        //Grabbing all the Vector Databases in CfG
        pixel = `MyEngines ( engineTypes=["VECTOR"], metaFilters = [ {"tag": ["Docbot_Repo", "Global_Repo"] } ] );`;

        actions.run(pixel).then((response) => {
            const { output, operationType } = response.pixelReturn[0];

            if (operationType.indexOf('ERROR') > -1) {
                throw new Error(output as string);
            }
            if (Array.isArray(output)) {
                runOutput(output);
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
                        setAllVectors(output)
                    }
                });


        setIsLoading(false);


    }, []);

    useEffect(() => {
        let pixel = `MyEngines ( engineTypes=["VECTOR"], metaFilters = [ {"tag": ["Docbot_Repo", "Global_Repo"] } ] );`;

        actions.run(pixel).then((response) => {
            const { output, operationType } = response.pixelReturn[0];
            if (operationType.indexOf('ERROR') > -1) {
                throw new Error(output as string);
            }
            if (Array.isArray(output)) {
                runOutput(output);
            }
        });

        pixel = `MyEngines ( engineTypes=["VECTOR"], permissionFilters=[1], metaFilters = [ {"tag": ["Docbot_Repo", "Global_Repo"] } ] );`;
        actions.run(pixel).then((response) => {
            const { output, operationType } = response.pixelReturn[0];
            if (operationType.indexOf('ERROR') > -1) {
                throw new Error(output as string);
            }
            if (Array.isArray(output)) {
                if (output.length > 0) {
                    setShowDocManage(true)
                }
            }
        });
    }, [refresh]);

    function genAnswerDisabled() {
        if (isLoading) return true;
        if (selectedVectorDB === null || selectedVectorDB === undefined) return true;
        if (Object.keys(selectedVectorDB).length === 0) return true;
    }
    function runOutput(output) {
        setVectorOptions(output);
        const currentUrl = new URL(window.location.href).searchParams;
        const pathSearch = output.filter(e => e["database_name"] === currentUrl.get("newDocRepo"));
        if (pathSearch.length !== 0) {
            setSelectedVectorDB(pathSearch[0]);
        } else {
            setSelectedVectorDB(output[0]);
        }
        setRefresh(false);
    }
    return (
        <>
        {isLoading && <LoadingOverlay><CircularProgress /></LoadingOverlay>}
        <StyledLayout id='styledlayout'>
            {error == 'You do not have access to the model' ? <AIBotError /> :
                <>
                    {sideOpen ? (
                        <Sidebar
                            vectorOptions={vectorOptions}
                            selectedVectorDB={selectedVectorDB}
                            setSelectedVectorDB={setSelectedVectorDB}
                            setSideOpen={setSideOpen}
                            setOpen={setOpen}
                            limit={limit}
                            setLimit={setLimit}
                            temperature={temperature}
                            setTemperature={setTemperature}
                            actions={actions}
                            setError={setError}
                            setRefresh={setRefresh}
                            setRefreshDB={null}
                            showDocManage={showDocManage}
                            view='main'
                            tabSelected={tabSelected}
                            setActiveConversation={setActiveConversation}
                            activeConversation={activeConversation}
                            roomId={roomId}
                            setRoomId={setRoomId}
                            showDisclaimer={!cookies.DOCBOT}
                            expiringDatabases={null}
                            isLoading={isLoading} />
                    ) : (
                        <StyledButton onClick={() => setSideOpen(!sideOpen)}>
                            <ArrowForwardIosIcon />
                        </StyledButton>
                    )}
                    {!cookies.DOCBOT ? <DisclaimerPage/> :
                    <StyledPolicy>
                        <BasicTabs
                            showContext={showContext}
                            sideOpen={sideOpen}
                            openBeta={openBeta}
                            setOpenBeta={setOpenBeta}
                            genAnswerDisabled={genAnswerDisabled}
                            setShowContext={setShowContext}
                            temperature={temperature}
                            setTabSelected={setTabSelected}
                            selectedVectorDB={selectedVectorDB}
                            setSelectedVectorDB={setSelectedVectorDB}
                            vectorOptions={vectorOptions}
                            allVectors={allVectors}
                            setRefresh={setRefresh}
                            limit={limit}
                            open={open}
                            setOpen={setOpen}
                            activeConversation={activeConversation}
                            roomId={roomId}
                            setIsLoading={setIsLoading}
                        />
                        {tabSelected !== 2 && <PoweredBy>Responses Generated by OpenAI’s GPT-4o</PoweredBy>}
                    </StyledPolicy>}
                </>
            }
        </StyledLayout>
        </>
    );
};
