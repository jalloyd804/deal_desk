import { useEffect, useRef, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom'
import { Document, Page } from 'react-pdf';
import { pdfjs } from 'react-pdf';

import { styled, Button } from '@mui/material';
import { useDebounce } from 'use-debounce';

import { PDFTextSearch } from '../components/services/PDFTextSearch';

import 'pdfjs-dist/build/pdf.worker.min.mjs';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

const FlexBox = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'row'
}));

const StyledInput = styled('input')(() => ({
    height: '25px',
    marginTop: '15px'
}));

const StyledPdfViewer = styled('div')(() => ({
    width: 'max-content'
}));

const StyledDocument = styled(Document)(() => ({
    minWidth: '673px',
    minHeight: '871px'
}));

const StyledPage = styled(Page)(() => ({
    display: 'content',
    width: 'max-content',
    minWidth: '673px',
    minHeight: '871px'
}));

export const PDFViewer = ({ insight, downloadkey }) => {
    const [numPages, setNumPages] = useState<number>(0);
    const [pdfURL, setPDFURL] = useState<string>('');
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [searchString, setSearchString] = useState("");
    const [debouncedSearchString] = useDebounce(searchString, 250);
    const searchResults = PDFTextSearch(pdfURL, debouncedSearchString);
    const [searchResultsSelectedIndex, setSearchResultsSelectedIndex] = useState<number>(0);
    pdfjs.GlobalWorkerOptions.workerSrc = '..'

    useEffect(() => {
        setPDFURL(`${process.env.ENDPOINT}${process.env.MODULE}/api/engine/downloadFile?insightId=${insight}&fileKey=${encodeURIComponent(downloadkey)}`,)
    }, []);

    useEffect(() => {
        if (debouncedSearchString.length > 0) {
            setPageNumber(searchResults[0])
            setSearchResultsSelectedIndex(0)
        }else
        {
            setPageNumber(1)
        }

    }, [searchResults])

    function onDocumentLoadSuccess({ numPages }) {
        const textLayers = document.querySelectorAll<HTMLElement>(".react-pdf__Page__textContent");
        textLayers.forEach(layer => {
            const style = layer.style;
            style.top = "0";
            style.left = "0";
            style.transform = "";
        });
        setNumPages(numPages);
    }

    function changePage(offset) {
        setPageNumber(prevPageNumber => prevPageNumber + offset);
    }

    function previousPage() {
        if (debouncedSearchString.length > 0) {
            setPageNumber(searchResults[searchResultsSelectedIndex - 1])
            setSearchResultsSelectedIndex(searchResultsSelectedIndex - 1)
        }
        else {
            changePage(-1);
        }
    }

    function nextPage() {
        if (debouncedSearchString.length > 0) {
            setPageNumber(searchResults[searchResultsSelectedIndex + 1])
            setSearchResultsSelectedIndex(searchResultsSelectedIndex + 1)
        }
        else {
            changePage(1);
        }
    }
    const textRenderer = useCallback(
        (textItem) => highlightPattern(textItem.str, debouncedSearchString),
        [debouncedSearchString]
    );

    let resultText =
        searchResults.length === 1
            ? "Results found on 1 page"
            : `Results found on ${searchResults.length} pages`;

    if (searchResults.length === 0) {
        resultText = "no results found";
    }
    return (
        <StyledPdfViewer>
            <StyledDocument file={pdfURL} onLoadSuccess={onDocumentLoadSuccess}>
                <StyledPage pageNumber={pageNumber} customTextRenderer={textRenderer} width={673} height={871}

                />
            </StyledDocument>
            <FlexBox>
                {debouncedSearchString.length == 0 && (<p style={{ float: 'left' }}>
                    Page {pageNumber} of {numPages}
                </p>)}
                {debouncedSearchString.length > 0 && (<p style={{ float: 'left' }}>
                    Page {searchResultsSelectedIndex + 1} of {searchResults.length}
                </p>)}
                <Button
                    type="button"
                    disabled={pageNumber <= 1 || (debouncedSearchString.length > 0 && (searchResultsSelectedIndex == 0 || searchResults.length == 0))}
                    onClick={previousPage}
                    style={{ float: 'left' }}
                >
                    Previous
                </Button>
                <Button
                    type="button"
                    disabled={pageNumber >= numPages || (debouncedSearchString.length > 0 && (searchResultsSelectedIndex == searchResults.length - 1|| searchResults.length == 0))}
                    onClick={nextPage}
                    style={{ float: 'left' }}
                >
                    Next
                </Button>
                <StyledInput
                    value={searchString}
                    onChange={(e) => setSearchString(e.target.value)}
                    type="text"
                />
            </FlexBox>
        </StyledPdfViewer>)
};

function highlightPattern(text: string, pattern: string) {
    return text.replace(new RegExp(`${pattern}*`, "i"), (value) => `<mark>${value}</mark>`);
}
