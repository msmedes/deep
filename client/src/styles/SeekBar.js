import styled from 'styled-components'

const SeekBarProgress = styled.div`
background: hsl(218, 100%, 70%);
width: ${props => props.percentage}%;
height: 20px;
`

const SeekBarBackground = styled.div`
width: 1000px; 
height: 20px; 
background: hsl(218, 50%, 80%); 
marginTop: .85rem, 
borderRadius: 1px;
`

const SeekBarContainer = styled.div`
display: flex;
justify-content: center
`

const TimeDisplay = styled.p`
margin: 0;
font-size: .75rem;
padding-left: .5rem;
padding-right: .5rem;
padding-top: .1rem;
`

export { SeekBarBackground, SeekBarProgress, SeekBarContainer, TimeDisplay }