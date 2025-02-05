import { Outlet } from 'react-router-dom';
import { Alert, Typography, styled } from '@mui/material';
import Logo from '@/assets/img/nih_logo.svg';
import Logo_Powered from '@/assets/img/logo_powered.svg';
import { relative } from 'path';

const StyledHeaderLogo = styled('a')(({ theme }) => ({
    display: 'inline-flex',
    textDecoration: 'none',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    color: 'white',
    fontSize: theme.typography.h5.fontSize,
    overflow: 'hidden',
    paddingLeft: '10px',
    '& > img': {
        height: theme.spacing(7),
    },
    ':visited': {
        color: 'inherit',
    },
}));

const StyledHeader = styled('div')(({ theme }) => ({
    boxSizing: 'border-box',
    background: theme.palette.background.paper,
    top: '0px',
    left: '0px',
    right: '0px',
    height: '10%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    color: 'black',
    width: '100%',
}));

const StyledWrapper = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    // background:
    //     'linear-gradient(0deg, rgba(98,84,163,1) 13%, rgba(130,54,140,1) 51%)',
    backgroundColor: '#fff',
    padding: '0.15rem 0.5rem 0.5rem 0.5rem',
    height: '100vh !important', // Ensure the wrapper takes the full viewport height
    overflow: 'visible', // Prevent the wrapper from scrolling
    overflowY: 'scroll', // Enable vertical scrolling
    // Hide scroll bar for Webkit browsers (Chrome, Safari)
    '::-webkit-scrollbar': {
        display: 'none',
    },
    // Hide scroll bar for other browsers
    msOverflowStyle: 'none', // IE and Edge
    scrollbarWidth: 'none', // Firefox
    position: 'relative',
    boxSizing: 'border-box',
    '@media (min-width: 800px)': {
        height: 'auto',
    },
}));

const StyledMain = styled('div')(({ theme }) => ({
    posiiton: 'relative',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    boxSizing: 'border-box',
    overflow: 'visible', // Allow the main content to scroll if it overflows
    scrollbarWidth: 'none',
}));

const StyledContent = styled('div')(({ theme }) => ({
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    paddingTop: '.5rem',
    background: theme.palette.background.paper,
    flex: 1, // Ensure the content takes the remaining space
    [theme.breakpoints.down('sm')]: {
        minHeight: 'auto',
    },
    // borderBottomLeftRadius: '12px',
    // borderBottomRightRadius: '12px',
}));

const StyledDisclaimer = styled('div')(({ theme }) => ({
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 0,
    width: '100%',
    textAlign: 'center',
    padding: theme.spacing(0.5),
    [theme.breakpoints.down('sm')]: {
        position: 'relative',
    },
}));

/**
 * Wrap the routes
 */
export const MainLayout = () => {
    return (
        <>
            <StyledWrapper>
                <StyledMain>
                    <StyledContent>
                        <Outlet />
                    </StyledContent>
                </StyledMain>
            </StyledWrapper>
        </>
    );
};
