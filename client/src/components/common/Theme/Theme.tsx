import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';

import { lightTheme } from '@/theme';

import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/inter/900.css';

export interface ThemeProps {
    /** children to be rendered */
    children?: React.ReactNode;
}

const theme = createTheme(lightTheme);

export const Theme = (props: ThemeProps) => {
    const { children } = props;

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
        </ThemeProvider>
    );
};
