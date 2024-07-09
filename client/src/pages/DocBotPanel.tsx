import {
    styled,
    Box,
    Stack,
    TextField,
    Typography,
    IconButton,
    CircularProgress,
    Collapse,
    Paper,
    Alert,
    Button
} from '@mui/material';
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Markdown } from '@/components/common';
import Close from '@mui/icons-material/Close';

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

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    position: 'relative',
    width: '100%',
    borderRadius: '6px',
    overflow: 'hidden'
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

const SourceBox = styled('div')(() => ({
    marginTop: '1rem',
    '& > a': {
        color: '#4f4f4f',
    }
}));

export const DocBotPanel = ({
    isLoading,
    sideOpen,
    error,
    welcomeText,
    openBeta,
    setOpenBeta,
    warningText,
    control, 
    genAnswerDisabled,
    isAnswered,
    ask,
    answer,
    showContext,
    setShowContext,
    documents
    }) => {

    return (
    <StyledBox width={sideOpen ? '100%' : '100%'} id='styledcontainer'>
        <StyledPaper variant={'elevation'} elevation={2} square>
            {isLoading && <LoadingOverlay><CircularProgress /></LoadingOverlay>}
            <Stack spacing={2} color='#4F4F4F'>
                <Stack spacing={2} style={{ fontSize: '12px' }}>
                    <Typography variant="h5" color='#40007B'><strong>Hello!</strong> Welcome to NIAID’s AI Document Bot</Typography>
                    <Typography variant="body1">{welcomeText}</Typography>
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
                        ><Typography variant={'caption'}>{warningText}</Typography></Alert>
                    </Collapse>
                </Stack>
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
                            <Stack flexDirection={'row'} gap={'1rem'}>
                                <DisplayButton variant="contained" onClick={() => setShowContext(!showContext)}>{showContext ? 'Hide Full Context' : 'Get Full Context'}</DisplayButton><DisplayButton variant="contained" onClick={() => {
                                    navigator.clipboard.writeText(answer.conclusion);
                                }}>Copy Results</DisplayButton>
                            </Stack>
                            {showContext &&
                                documents.map((document, index) => (
                                    <SourceBox key={index}>
                                        <Typography color='#40007B' display={'inline'}>Source:</Typography>{' '}
                                        <a href={document.url} target="_blank">
                                            {document.documentName}
                                        </a>
                                    </SourceBox>
                                ))}
                        </>}
                    </Stack>
                )}
            </Stack>
        </StyledPaper>
    </StyledBox>
    )
}