import { Outlet, useLocation } from 'react-router-dom';

import { useInsight } from '@semoss/sdk-react';
import { useLayoutEffect, useState } from 'react';
import { createHashHistory } from 'history';
import { styled, CircularProgress } from '@mui/material';

/**
 * Wrap the database routes and add additional funcitonality
 */
export const history = createHashHistory();
const StyledContainer = styled('div')(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    inset: '0',
    height: '100%',
    width: '100%',
}));

export const AuthenticatedLayout = () => {

    const { isInitialized, isAuthorized, error } = useInsight();
    // track the location
    const location = useLocation();

    const [state, setState] = useState({
        action: history.action,
        location: history.location,
    });

    useLayoutEffect(() => history.listen(setState), [history]);

    // don't load anything if it is pending
    if (!isInitialized) {
        return (
            <StyledContainer>
                <CircularProgress />
            </StyledContainer>
        );
    }

    if (error) {
        return <>Error</>;
    }

    // disabling the login screen
    // if (!isAuthorized) {
    //     return <Navigate to="/login" state={{ from: location }} replace />;
    // }

    if (!isAuthorized) {
        window.location.href = "https://sts.nih.gov/auth/oauth/v2/authorize?client_id=3efd4207-9fd3-4eeb-984c-46289162e97e&response_type=code&redirect_uri=https%3A%2F%2Fgenai.niaid.nih.gov%2FMonolith%2Fapi%2Fauth%2Flogin%2Fgeneric&response_mode=query&scope=profile+email+openid+member";
        return null;
    }
    
    return <Outlet />;
};
