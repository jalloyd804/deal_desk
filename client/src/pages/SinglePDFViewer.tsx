import { styled } from '@mui/material';
import { useState, useEffect } from 'react';
// Div that will be tied to the iframe.
const StyledPdfViewer = styled('div')(({ theme }) => ({
    height: '500px',
    width: '100%',
}));
export const SinglePdfViewer = ({ pdfUrl, pageNumber }) => {
    const [iframeKey, setIframeKey] = useState<number>(1);
    // Use this to use iframe, this allows it to change
    useEffect(() => {
        const iframe = document.getElementById(
            'pdf-viewer-iframe',
        ) as HTMLIFrameElement;
        if (iframe) {
            // Shows pdf with the iframe toolbar.
            // If you want to show the pdf without the tool bar, set it to 0.
            const src = `${pdfUrl}#page=${pageNumber}&toolbar=1`;
            iframe.src = src;
        }
    }, [pageNumber, iframeKey]);
    return (
        <StyledPdfViewer id={'pdf-view'}>
            <iframe
                id="pdf-view-iframe"
                key={iframeKey}
                title="PDF Viewer"
                width="100%"
                height="100%"
            ></iframe>
        </StyledPdfViewer>
    );
};