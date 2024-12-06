import { Outlet } from 'react-router-dom';
import { Alert, Typography, styled } from '@mui/material';
import Logo from '@/assets/img/logo.svg';
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
    background: theme.palette.background.paper,
    top: '0px',
    left: '0px',
    right: '0px',
    height: '75px',
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    color: 'black',
}));

const StyledWrapper = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100vh', // Use viewport height
    width: '100%',
    overflow: 'hidden', // Ensure no overflow
    background: theme.palette.background.paper,
}));

const StyledMain = styled('div')(() => ({
    position: 'relative',
    flex: 1,
    overflow: 'auto',
}));

const StyledContent = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    // height: '100%',
    [theme.breakpoints.down('sm')]: {
        minHeight: 'auto',
    },
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

const StyledFooter = styled('div')(({ theme }) => ({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(1),
    padding: theme.spacing(1),
    height: '40px', // Fixed height for footer
    width: '100%',
    background: '#00314b',
    marginTop: '10px',
}));

const StyledFooterLogo = styled('a')(({ theme }) => ({
    display: 'inline-flex',
    textDecoration: 'none',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    color: theme.palette.background.paper,
    fontSize: theme.typography.caption.fontSize,
    overflow: 'hidden',
    '& > img': {
        height: theme.spacing(3),
    },
    ':visited': {
        color: 'inherit',
    },
}));

/**
 * Wrap the routes
 */
export const MainLayout = () => {
    return (
        <>
            <StyledWrapper>
                <StyledHeader>
                    <StyledHeaderLogo href="https://www.cancer.gov/">
                        <img src={Logo} alt="Logo" />
                    </StyledHeaderLogo>
                </StyledHeader>
                <StyledMain>
                    <StyledContent>
                        <Outlet />
                    </StyledContent>
                    <StyledFooter>
                        <StyledFooterLogo
                            title="CfG.AI"
                            href="https://deloitte.com"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Powered By
                            <img src={Logo_Powered} alt="Powered By Logo" />
                        </StyledFooterLogo>
                    </StyledFooter>
                </StyledMain>
            </StyledWrapper>
        </>
    );
};
