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
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useForm, Controller } from 'react-hook-form';
import { useInsight } from '@semoss/sdk-react';
import { VectorModal } from '../components/VectorModal';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import Close from '@mui/icons-material/Close';
import { Markdown } from '@/components/common';
import { AIBotError } from './Error'
import { Model } from '../interfaces/Model'
import { Document } from '../interfaces/Document'
import Delete from '@mui/icons-material/Delete';
import { Sidebar } from '../components/Sidebar';

const StyledTitle = styled(Typography)(({ theme }) => ({
    
    color: theme.palette.modal.main,
}));

const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
    '& .MuiCheckbox-root.Mui-checked': {
    color: '#00B050',
  },
  }
));

const StyledContainer = styled('div')(({ theme }) => ({
    padding: `2rem 10rem 2rem calc(10rem + 280px)`,
    display: 'flex',
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    position: 'relative',
    width: '1300px',
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

const StyledLayout = styled('div')(() => ({
    display: 'flex',
    flexDirection:'column'
}));


const StyledButton = styled(IconButton)(() => ({
    position: 'fixed',
    left: '0%',
    marginRight: 'auto',
}));

const onDeleteClick = (e, row) => {
    console.log('deleting ')
    console.log(row)
}

export const DocumentManagement = () => {
    const { actions } = useInsight();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');


    // Vector DB catalog and first vector DB in dropdown
    const [vectorOptions, setVectorOptions] = useState([]);
    const [selectedVectorDB, setSelectedVectorDB] = useState<Model>({});
    const [documents, setDocuments] = useState([]);

    //Controlling the Sidebar
    const [sideOpen, setSideOpen] = useState<boolean>(true);

    useEffect(() => {
        setIsLoading(true);

        //Grabbing all the Vector Databases in CfG
        let pixel = `MyEngines ( engineTypes=["VECTOR"]);`;

        actions.run(pixel).then((response) => {
            const { output, operationType } = response.pixelReturn[0];

            if (operationType.indexOf('ERROR') > -1) {
                throw new Error(output as string);
            }
            if (Array.isArray(output)) {
                setVectorOptions(output);
                setSelectedVectorDB(output[0]);
            }

            setIsLoading(false);
        });
    }, []);

    useEffect(() => {
        setIsLoading(true);
        let pixel = `ListDocumentsInVectorDatabase(engine="${selectedVectorDB.database_id}")`;
        actions.run(pixel).then((response) => {
            const { output, operationType } = response.pixelReturn[0];

            if (operationType.indexOf('ERROR') > -1) {
                throw new Error(output as string);
            }
            if (Array.isArray(output)) {
                let id = 1
                console.log(output)
                output.forEach(item =>{
                    item.id = id
                    id++;
                })
                setDocuments(output)
                console.log(documents)
            }
            setIsLoading(false);
        });
    }, [selectedVectorDB]);


    const columns: GridColDef[] = [
        { field: 'fileName', headerName: 'Name', minWidth: 100, flex: 1},
        { field: 'lastModified', headerName: 'Date Modified', minWidth: 75, flex: .75},
        { field: 'fileSize', headerName: 'Size', minWidth: 50, flex: .5 },
        { field: 'actions', headerName: 'Actions', minWidth: 25, flex: .25, renderCell: (params) => {
            return (
              <IconButton
              aria-label="delete"
              color="inherit"
              size="small"
              onClick={(e) => onDeleteClick(e, params.row)}
              >
              <Delete fontSize="inherit" />
            </IconButton>
            );
          } }
      ];
      


    return(
        <StyledLayout id='styledlayout'>
                    {sideOpen ? (
                        <Sidebar
                            modelOptions={null}
                            selectedModel={null}
                            setSelectedModel={null}
                            vectorOptions={vectorOptions}
                            selectedVectorDB={selectedVectorDB}
                            setSelectedVectorDB={setSelectedVectorDB}
                            setSideOpen={setSideOpen}
                            setOpen={null}
                            limit={null}
                            setLimit={null}
                            temperature={null}
                            setTemperature={null}
                            isDoc={true}/>
                    ) : (
                        <StyledButton onClick={() => setSideOpen(!sideOpen)}>
                            <ArrowForwardIosIcon />
                        </StyledButton>
                    )}
            
                    <StyledContainer id='styledcontainer'>
                    <StyledPaper variant={'elevation'} elevation={2} square>
                            {isLoading && <LoadingOverlay><CircularProgress /></LoadingOverlay>}
                            <Stack spacing={2} color='#4F4F4F'>
                            <StyledDataGrid  
                            rows={documents}
                            columns={columns}
                            initialState={{
                                pagination: {
                                    paginationModel: { page: 0, pageSize: 5 },
                                },
                            }}
                            pageSizeOptions={[5]}
                            checkboxSelection/>
                            </Stack>
                        </StyledPaper>
                        {isLoading && <LinearProgress />}
                    </StyledContainer>
                
        </StyledLayout>
    )
};
