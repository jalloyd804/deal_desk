import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Document, Page } from 'react-pdf';
import { pdfjs } from 'react-pdf';
import { ownerDocument, styled } from '@mui/material';
import { useDebounce } from 'use-debounce';
import FileViewer from 'react-file-viewer';
import 'pdfjs-dist/build/pdf.worker.min.mjs';
import { PDFTextSearch } from '../components/services/PDFTextSearch';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
//import file from '../assets/img/climate.pdf'
import NewWindow from 'react-new-window';

const StyledPdfViewer = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
}));

const TopBar = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: '0 1rem',
    alignItems: 'center',
}));

const ZoomButtons = styled('div')(() => ({
    display: 'flex',
    gap: '.5rem',
    '& button': {
        appearance: 'none',
        margin: '0',
        padding: '0',
        background: 'transparent',
        border: 'none',
        '& > svg': {
            opacity: '.7',
            cursor: 'pointer',
            transition: '.2s ease opacity',
            '&:hover': {
                opacity: '1',
            }
        }
    },
}));

const StyledHeader = styled('h1')(() => ({
    fontSize: '20px',
    fontWeight: 'normal',
}));

const BottomBar = styled('div')(() => ({
    padding: '.5rem 1rem',
    backgroundColor: '#D9D9D9',
    borderRadius: '8px',
    margin: '.5rem',
    alignItems: 'center',
    '& form': {
        margin: '0',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
}));

const PagesBox = styled('div')(() => ({
    display: 'flex',
    '& input': {
        appearance: 'none',
        font: 'inherit',
        outline: 'none',
        backgroundColor: 'white',
        border: 'none',
        width: '3rem',
        padding: '0 .25rem',
        margin: '0 .5rem',
        borderRadius: '3px',
        textAlign: 'center',
    },
}));

const Pagination = styled('div')(() => ({
    display: 'flex',
    position: 'relative',
    '& button': {
        appearance: 'none',
        font: 'inherit',
        color: 'inherit',
        cursor: 'pointer',
        backgroundColor: 'transparent',
        border: 'none',
        padding: '2px 6px',
        opacity: '.7',
        transition: '.2s ease opacity',
        '&:hover': {
            opacity: '1',
        },
        '&[disabled]': {
            opacity: '.4',
            cursor: 'default'
        }
    }
}));

const PaginationSeparator = styled('div')(() => ({
    width: '1px',
    backgroundColor: 'black',
    margin: '0 .25rem',
}));

const StyledDocument = styled(Document)(() => ({
    flex: 1,
    alignSelf: 'center',
    maxWidth: '100%',
    overflow: 'auto',
}));

const StyledPage = styled(Page)(() => ({
    display: 'content',
    width: '680px',
}));

const ZoomIn = () => (
<svg width="23" height="24" viewBox="0 0 23 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="10" stroke="#414141" stroke-width="2"/>
    <line x1="18.4142" y1="19" x2="22" y2="22.5858" stroke="#414141" stroke-width="2" stroke-linecap="round"/>
    <line x1="11" y1="7" x2="11" y2="15" stroke="#414141" stroke-width="2" stroke-linecap="round"/>
    <line x1="15" y1="11" x2="7" y2="11" stroke="#414141" stroke-width="2" stroke-linecap="round"/>
</svg>
);

const ZoomOut = () => (
<svg width="23" height="24" viewBox="0 0 23 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="10" stroke="#414141" stroke-width="2"/>
    <line x1="18.4142" y1="19" x2="22" y2="22.5858" stroke="#414141" stroke-width="2" stroke-linecap="round"/>
    <line x1="15" y1="11" x2="7" y2="11" stroke="#414141" stroke-width="2" stroke-linecap="round"/>
</svg>
);

export const PDFViewer = ({ uri, isDocX, title }) => {
    const [numPages, setNumPages] = useState<number>(0);
    const [pdfURL, setPDFURL] = useState<string>('');
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [searchString, setSearchString] = useState("");
    const [error, setError] = useState("");
    const [inputNumber, setInputNumber] = useState('1');
    const [debouncedSearchString] = useDebounce(searchString, 250);
    const searchResults = PDFTextSearch(pdfURL, debouncedSearchString);
    const [searchResultsSelectedIndex, setSearchResultsSelectedIndex] = useState<number>(0);
    const [windowRef, setWindowRef] = useState(null);
    const [docUri, setDocUri] = useState('');
    const [scale, setScale] = useState(1);
    pdfjs.GlobalWorkerOptions.workerSrc = '..';
    
    useEffect(() => {
        if (!isDocX){
            setPDFURL(uri)
        }
        else{
            setDocUri(uri)
        }
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

    const memoRef = useMemo(()=>(
    {
        ownerDocument: windowRef ? windowRef.document : null
    }
    ),[windowRef])

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
    function openWindow(window)
    {
        setWindowRef(window);
    }

    function onError(e) {
        console.log(e);
      }

    if (!isDocX){
        return (
            <NewWindow onOpen={openWindow} features={{ width: 700, height: 1000, scrollbars: false }} title={''}>
            <StyledPdfViewer>
                <TopBar><ZoomButtons><button onClick={() => {
                    if (scale >= 10) return;
                    setScale(scale + 0.25);
                }}><ZoomIn /></button><button onClick={() => {
                    if (scale <= 1) return;
                    setScale(scale - 0.25);
                }}><ZoomOut /></button></ZoomButtons><StyledHeader>{title}</StyledHeader></TopBar>
                {memoRef ?
                <>
                <StyledDocument file={pdfURL} onLoadSuccess={onDocumentLoadSuccess} options={memoRef}>
                    <StyledPage pageNumber={pageNumber} width={680} scale={scale} />
                </StyledDocument>
                <BottomBar>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        if (Number(inputNumber) < 1 || Number(inputNumber) > numPages) return;
                        setPageNumber(Number(inputNumber));
                    }}>
                        <PagesBox>Page <input type='text' title='Page Number' onChange={(e) => setInputNumber(e.target.value)} pattern="^[0-9]+$" required={true} placeholder={`${pageNumber}`} /> of {numPages}</PagesBox>
                        <Pagination>
                            <button
                                type="reset"
                                disabled={pageNumber <= 1 || (debouncedSearchString.length > 0 && (searchResultsSelectedIndex == 0 || searchResults.length == 0))}
                                onClick={previousPage}
                            >
                                Previous
                            </button>
                            <PaginationSeparator />
                            <button
                                type="reset"
                                disabled={pageNumber >= numPages || (debouncedSearchString.length > 0 && (searchResultsSelectedIndex == searchResults.length - 1|| searchResults.length == 0))}
                                onClick={nextPage}
                            >
                                Next
                            </button>
                        </Pagination>
                    </form>
                </BottomBar></> : <div>'Loading'</div>}
            </StyledPdfViewer>
            </NewWindow>)
    }
    else{
        return (      
            <div>
        <FileViewer
            fileType={'docx'}
            filePath={uri}
            onError={onError}/>
            <p>
            {error}
            </p>
            </div>
        
        )

    }
    
};


function highlightPattern(text: string, pattern: string) {
    return text.replace(new RegExp(`${pattern}*`, "i"), (value) => `<mark>${value}</mark>`);
}
