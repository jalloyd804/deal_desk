import {
    styled,
    Typography,
    CircularProgress,
    Box,
    Paper
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useInsight } from '@semoss/sdk-react';
import { RoomDetail } from '../interfaces/RoomDetail'
import 'pdfjs-dist/build/pdf.worker.min.mjs';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import Markdown from 'markdown-to-jsx';

const LoadingOverlay = styled('div')(() => ({
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, .5)',
    top: '0',
    left: '0',
    zIndex: '2',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
}));

const StyledBox = styled(Box)(({ theme }) => ({
    display: "flex",
    background:"#F2F2F2",
}));

const ConversationTitle = styled(Typography)(({ theme }) => ({
    color:"rgb(64, 0, 123)",
    fontWeight:'600',
    fontSize:'18px'
}));

const MarkDownPlus = styled(Markdown)(({ theme }) => ({
    '& > p:first-of-type': {
        margin: '0',
    }
}));
const StyledPaper = styled(Paper)(({ theme }) => ({
    //padding: theme.spacing(4),
    boxShadow:'none',
    position: 'relative',
    width: '100%',
    borderRadius: '6px',
    overflow: 'hidden',
    backgroundColor:'#f2f2f2'
}));

export const ChatHistoryPanel = ({
    activeConversation
}) => {

    const [isLoading, setIsLoading] = useState(false);
    const [pairedDetails, setPairedDetails] = useState([]);
    const { actions } = useInsight();
    const [lastLoaded, setLastLoaded] = useState(false)
    const notLastRef = useRef<HTMLDivElement>(null);
    const lastRef = useRef<HTMLDivElement>(null);

    const renderResponse = (roomDetails:RoomDetail[], last:boolean) => {
        if (last){
            //setLastLoaded(true)
            return (
                <div ref={lastRef} style={{borderRadius:'10px',boxShadow:'-1px 7px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12)'}}>
                    {roomDetails.map((room,index) =>{
                        switch (room.MESSAGE_TYPE) {
                            case "INPUT":
                                return (
                                    <div style={{padding:'2% 2% 0 2%', backgroundColor:'white', borderRadius:'10px 10px 0 0 '}}>
                                        <ConversationTitle>User Input:</ConversationTitle>
                                        <div>{room.MESSAGE_DATA}</div>
                                    </div>
                                )
                            case "RESPONSE":
                                return (
                                    <div style={{padding:'1% 2%', backgroundColor:'white', marginBottom:'2%', borderRadius:'0 0 10px 10px'}}>
                                        <ConversationTitle>Document Search Response:</ConversationTitle>
                                        <Typography style={{overflowWrap:"anywhere"}}><Markdown>{room.MESSAGE_DATA}</Markdown></Typography>
                                    </div>
                                )
                        }
                    })}
                </div>
            )
        } else
        return (
            <div style={{borderRadius:'10px',boxShadow:'-1px 7px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12)'}}>
                {roomDetails.map((room,index) =>{
                    switch (room.MESSAGE_TYPE) {
                        case "INPUT":
                            return (
                                <div style={{padding:'2% 2% 0 2%', backgroundColor:'white', borderRadius:'10px 10px 0 0 '}}>
                                    <ConversationTitle>User Input:</ConversationTitle>
                                    <div>{room.MESSAGE_DATA}</div>
                                </div>
                            )
                        case "RESPONSE":
                            return (
                                <div style={{padding:'1% 2%', backgroundColor:'white', marginBottom:'2%', borderRadius:'0 0 10px 10px'}}>
                                    <ConversationTitle>Document Search Response:</ConversationTitle>
                                    <Typography style={{overflowWrap:"anywhere"}}><Markdown>{room.MESSAGE_DATA}</Markdown></Typography>
                                </div>
                            )
                    }
                })}
            </div>
        )
    }
    useEffect(() => {
        if( activeConversation === null )
        {
            setPairedDetails([]);
            return;
        }
        setIsLoading(true);
        actions.run<
            [
                RoomDetail[],
            ]
        >(`GetRoomMessages(roomId="${activeConversation}");`).then((response) => {
            const { output, operationType } = response.pixelReturn[0];
   
            if (operationType.indexOf('ERROR') > -1) {
                setIsLoading(false);
                throw new Error('error loading rooms');
            }
            if (Array.isArray(output)) {
                let pairs = [];
                let prev:RoomDetail;
                output.forEach( (curr, index)=>{
                    if( index % 2)
                    {
                        pairs = pairs.concat([[prev,curr]]);
                    }
                    prev=curr;
                });
                setPairedDetails(pairs);
                setIsLoading(false);
            }
        })
    }, [activeConversation])

    return (
        <>
            {isLoading && <LoadingOverlay><CircularProgress /></LoadingOverlay>}
            <StyledBox width='100%' id='styledcontainer'>
            <StyledPaper variant={'elevation'} elevation={2} square>
            {pairedDetails.map((room: RoomDetail[], index) => 
                    renderResponse(room, index + 1 === pairedDetails.length)
            )}
            </StyledPaper>
            </StyledBox>
        </>
    )
}
