import React, { useRef, useState, useEffect, useContext } from 'react'
import { StateContext, DispatchContext } from '../../context/context'

import { SeekBarBackground, SeekBarProgress, SeekBarContainer, TimeDisplay } from '../../styles/SeekBar'

import formatTime from '../../utils/formatTime'

const SeekBar = () => {
  const myRef = useRef(null)
  const [percentage, setPercentage] = useState(0)
  const { playerTime, fileDuration, isPlaying, seekTime } = useContext(StateContext)
  const dispatch = useContext(DispatchContext)


  const calcPercentage = (time, duration) => {
    return (time / duration) * 100
  }

  const handleSeek = e => {
    const percent = (e.nativeEvent.offsetX / myRef.current.offsetWidth)
    dispatch({ type: 'SET_SEEK_TIME', seekTime: percent * fileDuration })
  }

  useEffect(() => {
    setPercentage(calcPercentage(playerTime, fileDuration))
  }, [playerTime])

  useEffect(() => {
    if (!isPlaying) {
      setPercentage(calcPercentage(seekTime, fileDuration))
    }
  }, [seekTime])

  return (
    <SeekBarContainer>
      <TimeDisplay>{formatTime(playerTime)}</TimeDisplay>
      <SeekBarBackground ref={myRef} onClick={handleSeek}>
        <SeekBarProgress percentage={percentage}></SeekBarProgress>
      </SeekBarBackground>
      <TimeDisplay>{formatTime(fileDuration - playerTime)}</TimeDisplay>
    </SeekBarContainer>
  )
}

export default SeekBar