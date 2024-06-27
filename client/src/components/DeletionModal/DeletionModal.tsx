import React, { useState } from "react";
import {
    styled,
    Box,
    Container,
    Avatar,
    CircularProgress,
    Typography,
    Button,
    IconButton,
    TextField,
    Autocomplete,
    hexToRgb
} from '@mui/material';


const StyledModal = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '600px',
    backgroundColor: theme.palette.background.paper,
    borderRadius: '30px',
    boxShadow: '24',
    p: '4',
    padding: theme.spacing(4),
}));

const SansTypography = styled(Typography)(({ theme }) => ({
    fontFamily: theme.typography.modal.fontFamily,
}));

const StyledTitle = styled(Typography)(({ theme }) => ({
    color: '#4F4F4F',
    fontSize: theme.typography.modal.fontSize,
    alignItems: 'center',
    marginBottom: theme.spacing(3),
    fontFamily: theme.typography.modal.fontFamily,
}));

const StyledButton = styled(Button)(({ theme }) => ({
    marginRight: theme.spacing(0.5),
}));

const StyledButtonGroup = styled('div')(() => ({
    display: 'flex',
    justifyContent: 'flex-end'
}));

const StyledButtonClose = styled(Button)(({ theme }) => ({
    backgroundColor:'inherit',
    color: hexToRgb('#00B050'),
    marginRight: theme.spacing(0.5),
}));


export const DeletionModal = ({ middleText, action, setOpen, id, setRefresh }) => {

    const [running, setRunning] = useState<boolean>(false);

    const BoldedText = ({ text, bolded }) => {
        const textArray = text.split(bolded);
        return (
            <span>
                {textArray.map((item, index) => (
                    <>
                        {item}
                        {index !== textArray.length - 1 && (
                            <b>{bolded}</b>
                        )}
                    </>
                ))}
            </span>
        );
    }

    const RunAction = async (action, id) => {
        setRunning(true);
        await action(id);
        setRefresh(true);
    }

    return (
        <StyledModal>
            <StyledTitle variant="h6">
                Are you sure?
            </StyledTitle>
            <SansTypography variant="body2">
                <StyledTitle variant="h6">
                    {BoldedText({ text: middleText, bolded: id })}
                </StyledTitle>
            </SansTypography>
            <StyledTitle variant="h6">
                This action is <b>NOT</b> reversible.
            </StyledTitle>
            <StyledButtonGroup>
                <StyledButtonClose
                    disabled={running}
                    onClick={() => setOpen(false)}
                >
                    {' '}
                    Close{' '}
                </StyledButtonClose>
                <StyledButton
                    disabled={running}
                    variant="contained"
                    color="error"
                    onClick={() => RunAction(action, id)}
                >
                    {' '}
                    Confirm{' '}
                </StyledButton>
            </StyledButtonGroup>
        </StyledModal>
    );
}