import { Outlet, Navigate, useLocation } from 'react-router-dom';

import { useInsight } from '@semoss/sdk-react';

/**
 * Wrap the database routes and add additional funcitonality
 */
export const AuthenticatedLayout = () => {
    const { isAuthorized } = useInsight();

    // track the location
    const location = useLocation();

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
