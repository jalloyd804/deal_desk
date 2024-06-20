import styled from "@mui/material/styles/styled";
import NIAID_ERROR from '../assets/img/transparent-warning-caution-triangle.png';

const StyledError = styled('div')(({ theme }) => ({
    paddingTop:'5%',
    maxWidth:'80%',
    margin:'auto',
    fontSize:'20px',
    color:'red'
}));

const StyledUL = styled('ul')(({ theme }) => ({
    margin:'0',
    padding:'0',
    listStylePosition:'inside',
    paddingTop:'2%',
}));

export const AIBotError = () => {
    
    return (
        <>
           <StyledError>
            <span>You do not have access to the NIAID GenAI Tools. Please reach out to <a href="mailto:genai-support@mail.nih.gov">genai-support@mail.nih.gov</a> to requestion access. ​
            When requesting access please provide:​</span>
                <StyledUL>
                    <li>Who at NIAID you support or work with​ </li>
                    <li>Justification on why you need access</li>
                </StyledUL>
            ​</StyledError>
            <div style={{textAlign:'center', paddingTop:'3%'}}>
            <img src={NIAID_ERROR}/>
            </div>
        </>
    );
};
