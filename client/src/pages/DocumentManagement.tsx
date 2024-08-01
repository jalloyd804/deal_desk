import { useEffect, useState } from 'react';
import {
    styled,
    Alert,
    Button,
    Stack,
    LinearProgress,
    Typography,
    Paper,
    IconButton,
    CircularProgress,
    OutlinedInput,
    InputAdornment,
    Collapse,
    Modal
} from '@mui/material';
import { DataGrid, GridColDef, useGridApiRef, GridRowSelectionModel } from '@mui/x-data-grid';
import { VectorModal } from '../components/VectorModal';
import { useInsight } from '@semoss/sdk-react';
import { Model } from '../interfaces/Model'
import { Sidebar } from '../components/Sidebar';
import { DeletionModal } from '@/components/DeletionModal/DeletionModal';
import { useNavigate } from "react-router-dom";
import SearchIcon from '@mui/icons-material/Search';
import Delete from '@mui/icons-material/Delete';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import Close from '@mui/icons-material/Close';

const StyledTitle = styled(Typography)(({ theme }) => ({
    color: theme.palette.modal.main,
}));

const StyledRedTitle = styled(Typography)(({ theme }) => ({
    color: '#C00000',
}));

const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
    '& .MuiCheckbox-root.Mui-checked': {
        color: '#00B050',
        display: 'grid'
    },
}
));

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    overflow: 'hidden',
    flex: 1
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
    overflow: 'auto',
}));


const StyledButton = styled(IconButton)(() => ({
    position: 'fixed',
    left: '0%',
    marginRight: 'auto',
}));

const EmbedButton = styled(Button)(() => ({
    backgroundImage: 'linear-gradient(90deg, #20558A 0%, #650A67 100%)',
    backgroundColor: '#20558A',
    fontSize: '14px',
    whiteSpace: 'nowrap',
    maxHeight: '30px',
    color: 'white',
    '&:hover': {
        backgroundImage: 'linear-gradient(90deg, #12005A 0%, #12005A 100%)',
        backgroundColor: '#12005A',
    },
    '&[disabled]': {
        color: 'rgba(255, 255, 255, .8)',
    },
}));

const DeleteButton = styled(Button)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    fontSize: '14px',
    marginRight: '2%',
    whiteSpace: 'nowrap',
    float: 'right',
    maxHeight: '30px',
    borderColor: '#C00000',
    color: '#C00000',
    '&:hover': {
        backgroundColor: 'rgba(192, 0, 0, .5)',
    },
    '&[disabled]': {
        color: 'rgba(255, 255, 255, .8)',
    },
}));

const Search = styled('div')(({ theme }) => ({
    borderColor: '#4F4F4F',
    color: '#4F4F4F',
    maxHeight: '30px',
    borderRadius: theme.shape.borderRadius,
    '&:hover': {
    },
    marginLeft: 0,
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}));

const StyledInputBase = styled(OutlinedInput)(({ theme }) => ({
    color: 'inherit',
    maxHeight: '30px',
    '& .MuiInputBase-input': {
        padding: theme.spacing(1, 1, 1, 0),
        paddingLeft: '15px'
    },
}));

const StyledAlert = styled(Alert)(() => ({
    marginTop: '1rem',
    '& span.extend': {
        color: 'rgb(64, 0, 123)',
        borderBottom: '1px solid transparent',
        cursor: 'pointer',
        transition: '.2s ease border',
        '&:hover': {
            borderColor: 'rgb(64, 0, 123)',
        }
    }
}));

export const DocumentManagement = () => {
    const { actions } = useInsight();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showDelete, setShowDelete] = useState(false);
    const [open, setOpen] = useState<boolean>(false);
    const [openDelete, setOpenDelete] = useState<boolean>(false);
    const [openEmbed, setOpenEmbed] = useState<boolean>(false);
    const [text, setText] = useState<string>(null);
    const [id, setId] = useState<string>(null);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [refreshDB, setRefreshDB] = useState<boolean>(false);
    const [noDoc, setNoDoc] = useState<boolean>(false);
    // Vector DB catalog and first vector DB in dropdown
    const [vectorOptions, setVectorOptions] = useState([]);
    const [selectedVectorDB, setSelectedVectorDB] = useState<Model>({});
    const [documents, setDocuments] = useState([]);
    const [expirationInfo, setExpirationInfo] = useState(false);
    const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>([]);
    //Controlling the Sidebar
    const [sideOpen, setSideOpen] = useState<boolean>(true);
    const [alertOpen, setAlertOpen] = useState<boolean>(true);
    const dataGridApi = useGridApiRef();
    const navigate = useNavigate();
    const EXPIRATION_DAYS = 40;


    function escapeAndJoin(arr) {
        return arr.map(str => JSON.stringify(str)).join(',');
    }
    const DeleteDocs = async (fileDelete: string[]) => {
        setError('');
        const fileLocation = escapeAndJoin(fileDelete);
        try {
            let embedder = ''
            if (process.env.ENVIRONMENTFLAG === "Deloitte") {
                embedder = "e4449559-bcff-4941-ae72-0e3f18e06660"
            }
            else if (process.env.ENVIRONMENTFLAG === "NIH") {
                embedder = "6ce2e1ac-224c-47a3-a0f9-8ba147599b68"
            }

            const pixel = `RemoveDocumentFromVectorDatabase(engine = "${selectedVectorDB.database_id}", fileNames = [ ${fileLocation} ]);`;

            //const pixel = `DeleteEngine(engine=["${id}"]);`;
            const response = await actions.run(pixel);
            const { output, operationType } = response.pixelReturn[0];
            const engine = output;
            if (operationType.indexOf('ERROR') > -1) {
                throw new Error(output as string);
            }
        } catch (e) {
            if (e.message) {
                setError(e.message);
            } else {
                setError(
                    'There was an error deleting your vector DB, please check pixel calls',
                );
            }
        }
        finally {
            setOpen(false);
            setOpenDelete(false);
        }
    }
    useEffect(() => {
        try {
            //setError('');
            setIsLoading(true);

            //Grabbing all the Vector Databases in CfG
            let pixel = `MyEngines ( engineTypes=["VECTOR"], permissionFilters=[1]);`;

            actions.run(pixel).then((response) => {
                const { output, operationType } = response.pixelReturn[0];

                if (operationType.indexOf('ERROR') > -1) {
                    throw new Error(output as string);
                }

                if (Array.isArray(output)) {
                    if (output.length > 0) {
                        setVectorOptions(output);
                        setSelectedVectorDB(output[0]);
                    }
                    else {
                        navigate("/");
                    }
                    setIsLoading(false);
                }
            })
        }
        catch (e) {
            setIsLoading(false);
            if (e) {
                setError(e);
            } else {
                setError('There is an error, please check pixel calls');
            }
        }
        finally {
            setRefreshDB(false);
        }
    }, [refreshDB]);

    const handleSearch = (event) => {
        let searchFilter = event.target.value
        dataGridApi.current.setFilterModel({
            items: [
                {
                    id: 1,
                    field: 'fileName',
                    operator: 'contains',
                    value: searchFilter
                }
            ]
        })
        dataGridApi.current.setRowSelectionModel([])
    }

    const formatFileSize = (fileSize) => {
        if (fileSize < 1000) {
            return Math.round(fileSize) + 'KB'
        }
        else {
            return Math.round(fileSize / 1000) + "MB"
        }
    }
    useEffect(() => {
        try {
            //setError('');
            setIsLoading(true);
            let pixel = `ListDocumentsInVectorDatabase(engine="${selectedVectorDB.database_id}")`;
            let pixel2 = `GetExpiredVectorDatabases(${EXPIRATION_DAYS})`;
            actions.run(pixel2).then((response) => {
                const { output, operationType } = response.pixelReturn[0];
                if (operationType.indexOf('ERROR') > -1) {
                    throw new Error(output as string);
                }
                if (Object.hasOwn(output[selectedVectorDB.database_id], 'Days Since Last Update')) {
                    if (output[selectedVectorDB.database_id]['Days Since Last Update'] > EXPIRATION_DAYS) {
                        setExpirationInfo(true);
                    } else {
                        setExpirationInfo(false);
                    }
                }
            });
            actions.run(pixel).then((response) => {
                const { output, operationType } = response.pixelReturn[0];
                if (operationType.indexOf('ERROR') > -1) {
                    throw new Error(output as string);
                }
                if (Array.isArray(output)) {
                    let id = 1
                    output.forEach(item => {
                        item.id = id
                        item.fileSize = formatFileSize(item.fileSize)
                        id++;
                    })
                    setDocuments(output.filter(a => a.fileName.substring(a.fileName.length - 3) !== 'csv'))
                    setIsLoading(false);
                    setRefresh(false);

                }
            });
        }
        catch (e) {
            setIsLoading(false);
            if (e) {
                setError(e);
            } else {
                setError('There is an error, please check pixel calls');
            }
        }
    }, [selectedVectorDB, refresh]);


    useEffect(() => {
        if (rowSelectionModel.length > 0) {
            setShowDelete(true)
        }
        else {
            setShowDelete(false)
        }
    }, [rowSelectionModel]);

    const deleteSingle = (fileName) => {
        DeleteDocs([fileName]);
    }

    const deleteSelected = () => {
        let selectedRows = dataGridApi.current.getSelectedRows();
        const array: string[] = Array.from(selectedRows, ([fileName, value]) => ({ fileName, value })).map(item => item.value.fileName);
        DeleteDocs(array);
    }

    const Confirm = (text: string, id: string) => {
        setOpen(true);
        setText(text);
        setId(id);
    }

    const ConfirmSingle = (text: string, id: string) => {
        setOpenDelete(true);
        setText(text);
        setId(id);
    }

    const columns: GridColDef[] = [
        { field: 'fileName', headerName: 'Name', minWidth: 100, flex: 1 },
        { field: 'lastModified', headerName: 'Date Modified', minWidth: 75, flex: .75 },
        { field: 'fileSize', headerName: 'Size', minWidth: 50, flex: .5 },
        {
            field: 'actions', headerName: 'Actions', minWidth: 25, flex: .25, renderCell: (params) => {
                return (
                    <IconButton
                        aria-label="delete"
                        color="inherit"
                        size="small"
                        onClick={(e) => ConfirmSingle(`This will remove ${params.row.fileName} from your document repository.`, params.row.fileName)}
                    >
                        <Delete fontSize="inherit" />
                    </IconButton>
                );
            }
        }
    ];

    return (
        <>
            <StyledLayout id='styledlayout'>
                {sideOpen ? (
                    <Sidebar
                        vectorOptions={vectorOptions}
                        selectedVectorDB={selectedVectorDB}
                        setSelectedVectorDB={setSelectedVectorDB}
                        setSideOpen={setSideOpen}
                        setOpen={null}
                        limit={null}
                        setLimit={null}
                        temperature={null}
                        setTemperature={null}
                        actions={actions}
                        setError={setError}
                        setRefresh={setRefresh}
                        setRefreshDB={setRefreshDB}
                        isDoc={true}
                        showDocManage={false}
                        summarySelected={false}
                        conversations={null} />
                ) : (
                    <StyledButton onClick={() => setSideOpen(!sideOpen)}>
                        <ArrowForwardIosIcon />
                    </StyledButton>
                )}

                <StyledPaper variant={'elevation'} elevation={2} square>
                    <StyledTitle variant="h5">
                        {selectedVectorDB.database_name}
                    </StyledTitle>
                    {expirationInfo && (<Collapse in={alertOpen}>
                        <StyledAlert severity={'warning'}
                            action={
                                <IconButton
                                    aria-label="close"
                                    color="inherit"
                                    size="small"
                                    onClick={() => {
                                        setAlertOpen(false);
                                    }}
                                >
                                    <Close fontSize="inherit" />
                                </IconButton>
                            }
                            sx={{ mb: 2 }}
                        ><Typography variant={'caption'}><strong>This repository will be deleted since the last document was modified over {EXPIRATION_DAYS} days ago.</strong><br/>Would you like to extend the life of the repository? <span className='extend'>Yes.</span> <span className='extend'>No.</span></Typography></StyledAlert>
                    </Collapse>)}
                    {noDoc && <StyledRedTitle variant="h6">
                        It appears you don't have any Document Repositories to manage. To get started, click "Upload Documents(s)".
                    </StyledRedTitle>}
                    {isLoading && <LoadingOverlay><CircularProgress /></LoadingOverlay>}
                    <Stack spacing={2} color='#4F4F4F'>
                        <div style={{ display: 'flex' }}>
                            <Search style={{ marginLeft: 'auto', paddingRight: '2%' }}>
                                {documents.length > 0 && <StyledInputBase
                                    onChange={(event) => handleSearch(event)}
                                    placeholder="Search files"
                                    endAdornment={
                                        <InputAdornment disableTypography position='end' children={(
                                            <SearchIcon />
                                        )} />}
                                    inputProps={{
                                        'aria-label': 'search',


                                    }
                                    }

                                />}
                            </Search>
                            {showDelete && (<DeleteButton variant="contained" onClick={() => { Confirm(`This will remove ALL selected files from the document repository.​`, 'ALL') }}>
                                Delete Selected
                            </DeleteButton>)}
                            <EmbedButton variant="contained" onClick={() => { setOpenEmbed(true) }}>
                                Embed New Document
                            </EmbedButton>
                        </div>
                        {error && <Alert color="error">{error.toString()}</Alert>}
                        {documents.length > 0 && <StyledDataGrid
                            apiRef={dataGridApi}
                            rows={documents}
                            columns={columns}
                            style={{ display: 'grid' }}
                            onRowSelectionModelChange={(newRowSelectionModel) => {
                                setRowSelectionModel(newRowSelectionModel);
                            }}
                            rowSelectionModel={rowSelectionModel}
                            initialState={{
                                pagination: {
                                    paginationModel: { page: 0, pageSize: 5 },
                                },
                            }}
                            pageSizeOptions={[5, 10]}
                            checkboxSelection
                            disableRowSelectionOnClick />}
                    </Stack>
                </StyledPaper>
                {isLoading && <LinearProgress />}
            </StyledLayout>
            <Modal open={open} onClose={() => setOpen(false)}>
                <DeletionModal
                    setOpen={setOpen}
                    middleText={text}
                    id={id}
                    action={deleteSelected}
                    setRefresh={setRefresh}
                />
            </Modal>
            <Modal open={openDelete} onClose={() => setOpenDelete(false)}>
                <DeletionModal
                    setOpen={setOpenDelete}
                    middleText={text}
                    id={id}
                    action={deleteSingle}
                    setRefresh={setRefresh}
                />
            </Modal>
            <Modal open={openEmbed} onClose={() => setOpenEmbed(false)}>
                <VectorModal
                    setOpen={setOpenEmbed}
                    open={openEmbed}
                    vectorOptions={vectorOptions}
                    setRefresh={setRefresh}
                    setSelectedVectorDB={setSelectedVectorDB}
                    selectedVectorDB={null}
                    existingVectorDB={selectedVectorDB.database_id}
                    setError={setError}
                    documents={documents} />
            </Modal>
        </>
    )
};
