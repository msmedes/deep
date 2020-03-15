import React, { useEffect, useRef, useReducer, useState } from 'react';
// import { Dashboard } from '@uppy/react'
// import Uppy from '@uppy/core'
// import '@uppy/core/dist/style.css'
// import '@uppy/dashboard/dist/style.css'
// import xhr from '@uppy/xhr-upload'
import { reducer, initialState } from '../../store/store'
import { StateContext, DispatchContext } from '../../context/context'

import EditorWrapper from '../EditorWrapper/EditorWrapper';
import SeekBar from '../SeekBar/SeekBar';
import TransportControls from '../TransportControls/TransportControls'

import jsonToSlate from '../../utils/deserialize';
import initialValue from '../../utils/initialValue'
import formatTime from '../../utils/formatTime'

import test10 from '../../test10.wav'


const newInitial = jsonToSlate(initialValue)

const App = () => {
  let player = useRef()
  const [initial, setInitialValue] = useState(newInitial)
  const [isPlaying, setIsPlaying] = useState(false)

  const [state, dispatch] = useReducer(reducer, initialState)
  const { seekTime, audioSchedule, playerTime, timeOuts, transcript, audioLoaded, fileDuration } = state

  const handleTimeUpdate = () => {
    dispatch({ type: 'SET_PLAYER_TIME', playerTime: player.currentTime })
  }

  useEffect(() => {
    console.log('you there')
    if (player) {
      player.currentTime = seekTime
      dispatch({ type: 'SET_PLAYER_TIME', playerTime: player.currentTime })
    }
    if (player && isPlaying) {
      console.log("hello?")
      stopAudio()
      handlePlayAudio()
    }
  }, [seekTime])

  const validStartTimeInterval = (schedule) => {
    return schedule.startTime < seekTime && seekTime < schedule.endTime
  }

  const generateTimeOuts = () => {
    const timeOuts = []
    let lastEndTime = 0;
    for (const schedule of audioSchedule) {
      console.log('schedule', schedule)
      console.log('play audio seek time', seekTime)
      if (schedule.startTime >= seekTime || schedule.startTime >= playerTime) {
        const setPlayerTimeWrapper = () => { dispatch({ type: 'SET_SEEK_TIME', seekTime: schedule.startTime }) }
        const timeout = setTimeout(setPlayerTimeWrapper, lastEndTime * 1000)
        lastEndTime = schedule.endTime - schedule.startTime + lastEndTime
        timeOuts.push(timeout)
      } else if (validStartTimeInterval(schedule)) {
        lastEndTime = schedule.endTime - seekTime
      }
    }
    return timeOuts
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      stopAudio()
    } else {
      handlePlayAudio()
    }
  }
  const handlePlayAudio = () => {
    console.log('audioSchedule', audioSchedule)
    const timeouts = generateTimeOuts()
    console.log('timeouts', timeouts)
    console.log('seektime', seekTime)
    player.play(seekTime)
    setIsPlaying(true)
    dispatch({ type: 'SET_TIMEOUTS', timeOuts: timeouts })
  }

  const clearTimeouts = () => {
    if (timeOuts) {
      for (const timeout of timeOuts) {
        clearTimeout(timeout)
      }
      dispatch({ type: "CLEAR_TIMEOUTS" })
    }
  }

  const stopAudio = () => {
    if (isPlaying) {
      clearTimeouts()
      player.pause()
      setIsPlaying(false)
    }
  }

  const handleOnEnded = () => {
    stopAudio()
    // setIsEnded(true)
  }

  const handleReturnToStart = () => {
    // this isn't working, idk why.  useEffect doesn't seem to be firing?
    console.log("ugess not")
    // clearTimeouts()
    dispatch({
      type: 'SET_SEEK_TIME', seekTime: 0
    })
  }

  const handleMoveToEnd = () => {
    stopAudio()
    dispatch({
      type: 'SET_SEEK_TIME', seekTime: fileDuration
    })
  }

  // const uppy = Uppy({
  //   id: 'uppy1',
  //   // debug: true,
  //   autoProceed: true
  // })
  // uppy.use(xhr, {
  //   // endpoint: 'http://67.81.172.102:5000/upload',
  //   endpoint: 'http://localhost:5000/upload',
  //   method: 'post'
  // })

  // uppy.on('upload-success', (file, response) => {
  //   const deserialized = jsonToSlate(response)
  //   uppy.close()
  //   const url = URL.createObjectURL(file.data)
  //   set{ ... audioLoaded: true, transcript: deserialized, audioData: file.data, audioSource: url })
  // })

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        <audio
          ref={ref => (player = ref)}
          id="audioPlayer"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleOnEnded}
          autoPlay={false}
          src={test10}
          type="audio/wav">
          {/*audioSource && <source src='../../test10.wav'>
    </source>*/}
        </audio>
        {/*!audioLoaded && <Dashboard uppy={uppy} {...{ inline: true, showProgressDetails: true, width: 300, height: 200 }} />*/}
        <TransportControls handleReturnToStart={handleReturnToStart} handlePlayPause={handlePlayPause} handleMoveToEnd={handleMoveToEnd} isPlaying={isPlaying} />
        <div style={{ display: 'flex' }}>
          <p style={{ fontSize: '.75rem', margin: '1rem' }}>{formatTime(playerTime)}</p>
          {<SeekBar player={player} />}
          <p style={{ fontSize: '.75rem', margin: '1rem' }}>-{formatTime(fileDuration - playerTime)}</p>
        </div>

        {/*<p>player: {player.currentTime}</p>*/}
        {
          audioLoaded &&
          <EditorWrapper initialValue={transcript} />
        }
        <EditorWrapper initialValue={initial} />
      </DispatchContext.Provider>
    </StateContext.Provider >
  )
}

export default App;
