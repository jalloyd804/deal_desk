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

export const StyledContainer = styled(Stack)(() => ({
  height: '80vh',
  overflowY: 'scroll',
  display: 'flex',
  flexDirection: 'column',
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
  '&-ms-overflow-style:': {
    display: 'none',
  },
}));

export const StyledTitle = styled('div')(({ theme }) => ({
  background: '#6254a3',
  color: theme.palette.background.paper,
  padding: theme.spacing(2),
  borderTopLeftRadius: theme.spacing(2),
  borderTopRightRadius: theme.spacing(2),
  display: 'flex',
}));

export const StyledAvatar = styled(Avatar)(({ theme }) => ({
  background: 'white',
  marginRight: theme.spacing(2),
}));

export const StyledAnswerAvatar = styled(Avatar)(({ theme }) => ({
  marginRight: theme.spacing(2),
}));

export const StyledQuestionStack = styled(Stack)(({ theme }) => ({
  paddingLeft: theme.spacing(2),
  paddingBottom: theme.spacing(2),
}));

export const StyledStack = styled(Stack)(({ theme }) => ({
  padding: theme.spacing(2),
}));

export const StyledDescription = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(1),
}));

export const StyledName = styled(Typography)(({ theme }) => ({
  paddingTop: theme.spacing(1),
  paddingLeft: theme.spacing(1.4),
  fontWeight: 'bold',
}));

export const StyledAdditonalInfo = styled(Typography)(({ theme }) => ({
  paddingLeft: theme.spacing(1.4),
}));

export const StyledPaper = styled(Paper)(({ theme }) => ({
  width: '100%',
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(6),
}));

export const StyledLayout = styled(Stack, {
  shouldForwardProp: (prop) => prop !== 'sideOpen',
})<{ sideOpen: boolean }>(({ theme, sideOpen }) => ({
  padding: `${theme.spacing(4)} ${sideOpen ? theme.spacing(4) : theme.spacing(6)} ${theme.spacing(4)} ${sideOpen ? '180px' : theme.spacing(6)}`,
  width: `${sideOpen ? '60vw' : '75vw'}`,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  background: '#ebf5f9',
}));

export const StyledLeftPanel = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  left: '0%',
  marginRight: 'auto',
  width: theme.spacing(6),
  height: '100%',
}));

export const StyledIconButton = styled(IconButton)(({ theme }) => ({
  paddingTop: theme.spacing(3),
}));

export const StyledResponseDiv = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'row',
  width: '100%',
}));

export const StyledQuestionDiv = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: theme.spacing(2),
  textAlign: 'center',
  padding: theme.spacing(0.5),
  [theme.breakpoints.down('sm')]: {
    position: 'relative',
  },
}));

export const StyledPromptContainer = styled('div')(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
  paddingTop: theme.spacing(2),
  paddingLeft: theme.spacing(2),
  paddingBottom: theme.spacing(1),
}));

export const StyledLabel = styled('div')(({ theme }) => ({
  ...theme.typography.body2,
  color: 'gray',
  display: 'flex',
  alignItems: 'center',
}));

export const StyledPromptIconContainer = styled('div')(({ theme }) => ({
  color: theme.palette.text.disabled,
  width: theme.spacing(4),
}));
