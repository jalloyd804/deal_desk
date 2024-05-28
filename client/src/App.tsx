import { Env } from '@semoss/sdk';
import { InsightProvider } from '@semoss/sdk-react';

import { Router } from '@/pages';
import { Theme } from '@/components/common';

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
                <Router />
            </Theme>
        </InsightProvider>
    );
};
