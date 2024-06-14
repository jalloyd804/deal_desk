import { Outlet } from 'react-router-dom';
import { styled } from '@mui/material';
import NIHLogo from '../assets/img/nihwhitelogo.svg';

const FOOTERLINKS = [ 
    {
        href: 'https://www.niaid.nih.gov/', 
        label: 'NIAID Public Website'
    },
    {
        href: 'https://www.nih.gov/',
        label: 'NIH Public Website'
    },
    {
        href: 'https://www.hhs.gov/',
        label: 'HHS Public Website'
    },
    {
        href: 'https://www.usa.gov/',
        label: 'USA.gov'
    }
]

const StyledWrapper = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    width: '100%',
    overflow: 'auto',
}));

const StyledHeader = styled('div')(() => ({
    display: 'flex',
    background: 'linear-gradient(90deg, rgba(32,85,138,1) 0%, rgba(32,85,138,1) 30%, rgba(101,10,103,1) 100%)',
    backgroundPosition: 'top left',
    padding: '0 2rem',
    position: 'relative',
    zIndex: '3',
    '& > img': {
        width: '4rem',
        height: 'auto'
    },
}));

const StyledH1 = styled('h1')(() => ({
    marginLeft: '1rem',
    color: 'white',
    fontWeight: 'normal',
}));

const StyledMain = styled('div')(() => ({
    position: 'relative',
    height: '100%',
    overflow: 'auto',
    flex: '1'
}));

const StyledContent = styled('div')(({ theme }) => ({
    position: 'relative',
}));

const StyledFooter = styled('footer')(({ theme }) => ({
    position: 'relative',
    zIndex: '4',
    color: '#4f4f4f',
    backgroundColor: '#FBFBFB',
    padding: '.5rem 2rem',
    fontSize: theme.typography.caption.fontSize,
    justifyContent: 'space-between',
    display: 'flex',
    '& a': {
        color: 'inherit'
    }
}));

const StyledFooterLeft = styled('div')(() => ({
}));

const StyledFooterRight = styled('div')(() => ({
    display: 'flex',
    gap: '1rem',
}));

/**
 * Wrap the routes
 */
export const MainLayout = () => {
    return (
        <StyledWrapper>
            <StyledHeader><img src={NIHLogo} /><StyledH1>NIAID | GenAI</StyledH1></StyledHeader>
            <StyledMain id="main">
                <StyledContent>
                    <Outlet />
                </StyledContent>
            </StyledMain>
            <StyledFooter><StyledFooterLeft><a href="mailto:NIAIDHelpdeskTeam@mail.nih.gov">Contact Us</a></StyledFooterLeft><StyledFooterRight>{FOOTERLINKS.map((link, index) => <a key={index} href={link.href}>{link.label}</a>)}</StyledFooterRight></StyledFooter>
        </StyledWrapper>
    );
};
