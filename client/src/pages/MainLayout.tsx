import { Outlet } from 'react-router-dom';
import { Alert, Typography, styled } from '@mui/material';
import Logo from '@/assets/img/logo.svg';
import Logo_Powered from '@/assets/img/logo_powered.svg';

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
    borderTopLeftRadius: '12px',
    borderTopRightRadius: '12px',
}));

const StyledWrapper = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    overflow: 'visible',
    background:
        'linear-gradient(0deg, rgba(98,84,163,1) 13%, rgba(130,54,140,1) 51%)',
    padding: '1rem',
    width: '100vw !important',
    height: '100vh !important',  
    '@media (min-width: 800px)': {
        height: 'auto',
    },
}));

const StyledMain = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    flex: 1,
    overflow: 'visible', 
    scrollbarWidth: 'none',
}));

const StyledContent = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    overflow: 'visible',
    background: theme.palette.background.paper,
    [theme.breakpoints.down('sm')]: {
        minHeight: 'auto',
    },
    borderBottomLeftRadius: '12px',
    borderBottomRightRadius: '12px',
    padding: '10px',
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
                    <StyledHeader>
                        <StyledHeaderLogo href="https://www.cancer.gov/">
                            <img src={Logo} alt="Logo" />
                        </StyledHeaderLogo>
                    </StyledHeader>
                    <StyledContent>
                        <Outlet />
                    </StyledContent>
                </StyledMain>
            </StyledWrapper>
        </>
    );
};
