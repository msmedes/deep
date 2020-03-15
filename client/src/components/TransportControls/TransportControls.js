import React, { useContext } from 'react'
import { Play, Pause, SkipBack, SkipForward } from 'react-feather'

import TransportStyles from '../../styles/TransportStyles'
import TransportButton from '../../styles/TransportButton'


const TransportControls = ({ handleMoveToEnd, handlePlayPause, handleReturnToStart, isPlaying }) => {
  return (
    <TransportStyles>
      <TransportButton><span onClick={handleReturnToStart}><SkipBack strokeWidth="1.5px" color="hsl(218, 50%, 70%)" /></span></TransportButton>
      <TransportButton><span onClick={handlePlayPause}>{isPlaying ? <Pause color="hsl(355, 67%, 60%)" strokeWidth="1.5px" /> : <Play color="hsl(152, 54%, 59%)" strokeWidth="1.5px" />}</span></TransportButton>
      <TransportButton><span onClick={handleMoveToEnd}><SkipForward strokeWidth="1.5px" color="hsl(218, 50%, 70%)" /></span></TransportButton>
    </TransportStyles>
  )
}

export default TransportControls