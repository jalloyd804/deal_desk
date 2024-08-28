import { Env } from '@semoss/sdk';
import { InsightProvider } from '@semoss/sdk-react';
import { router } from '@/pages/Router';
import { Theme } from '@/components/common';
import { RouterProvider } from 'react-router-dom';

if (process.env.NODE_ENV !== 'production') {
    Env.update({
        MODULE: process.env.MODULE || '',
        ACCESS_KEY: process.env.ACCESS_KEY || '',
        SECRET_KEY: process.env.SECRET_KEY || '',
        APP: process.env.APP || '',
    });
}

export const App = () => {
    return (
        <InsightProvider>
            <Theme>
                <RouterProvider router={router} />
            </Theme>
        </InsightProvider>
    );
};
