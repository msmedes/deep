import React, { useRef, useState, useEffect, useContext } from 'react'
import { StateContext, DispatchContext } from '../../context/context'


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
    <div
      ref={myRef}
      onClick={handleSeek}
      style={{ width: "1000px", height: "20px", background: 'hsl(218, 50%, 80%)', marginTop: '.85rem', borderRadius: "1px" }}
    >
      <div style={{ background: 'hsl(218, 100%, 70%)', width: `${percentage}%`, height: "20px" }}></div>
    </div >
  )
}

export default SeekBar