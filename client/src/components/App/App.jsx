import React, { useEffect, useRef, useReducer, useState } from 'react';

// import { Dashboard } from '@uppy/react'
// import Uppy from '@uppy/core'
// import '@uppy/core/dist/style.css'
// import '@uppy/dashboard/dist/style.css'
// import xhr from '@uppy/xhr-upload'
import { reducer, initialState } from '../../store'
import { StateContext, DispatchContext } from '../../context'
import EditorWrapper from '../EditorWrapper/EditorWrapper';
import SeekBar from '../SeekBar/SeekBar';

import jsonToSlate from '../../utils/deserialize';
import initialValue from '../../utils/initialValue'
import { calcBufferTransport, createSourcesFromSchedules, generateTimeouts } from '../../utils/audioUtils'
import { fadeIn, fadeOut } from '../../utils/fadeCurves';

import test10 from '../../test10.wav'
import test240 from '../../test240.wav'


const newInitial = jsonToSlate(initialValue)

const App = () => {
  let player = useRef()
  const [initial, setInitialValue] = useState(newInitial)

  const [state, dispatch] = useReducer(reducer, initialState)

  const handleTimeUpdate = () => {
    dispatch({ type: 'SET_PLAYER_TIME', playerTime: player.currentTime })
  }

  useEffect(() => {
    if (player) {
      player.currentTime = state.seekTime
    }
    dispatch({ type: 'SET_PLAYER_TIME', playerTime: player.currentTime })
  }, [state.seekTime])


  const handlePlayAudio = () => {
    // const timeOuts = generateTimeouts(audioSchedule, setSeekTime)
    console.log('audioSchedule', state.audioSchedule)
    const timeOuts = [];
    let lastEndTime = 0;
    for (const schedule of state.audioSchedule) {
      console.log('schedule', schedule)
      console.log('play audio seek time', state.seekTime)
      if (schedule.startTime >= state.seekTime || schedule.startTime >= state.playerTime) {
        const setPlayerTimeWrapper = () => { dispatch({ type: 'SET_SEEK_TIME', seekTime: schedule.startTime }) }
        const timeout = setTimeout(setPlayerTimeWrapper, lastEndTime * 1000)
        lastEndTime = schedule.endTime - schedule.startTime + lastEndTime
        timeOuts.push(timeout)
      }
    }
    console.log('timeouts', timeOuts)
    console.log('seektime', state.seekTime)
    player.play(state.seekTime)
    dispatch({ type: 'SET_PLAYING', timeOuts: timeOuts })
  }

  const stopAudio = () => {
    for (const timeout of state.timeOuts) {
      clearTimeout(timeout)
    }
    player.pause()
    if (state.seekTime === player.duration) {
      dispatch({
        type: 'SET_SEEK_TIME', seekTime: 0
      })
    }
    dispatch({ TYPE: "CLEAR_TIMEOUTS" })
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
  //   setState({ ...state, audioLoaded: true, transcript: deserialized, audioData: file.data, audioSource: url })
  // })

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {<SeekBar player={player} />}
        <audio
          ref={ref => (player = ref)}
          id="audioPlayer"
          onTimeUpdate={handleTimeUpdate}
          autoPlay={false}
          src={test10}
          type="audio/wav">
          {/*state.audioSource && <source src='../../test10.wav'>
  </source>*/}
        </audio>
        {/*!state.audioLoaded && <Dashboard uppy={uppy} {...{ inline: true, showProgressDetails: true, width: 300, height: 200 }} />*/}
        <button onClick={handlePlayAudio}>Play</button>
        <button onClick={stopAudio}>Stop</button>
        <p>seekTime: {state.seekTime}</p>
        <p>playerTime: {state.playerTime}</p>
        {/*<p>player: {player.currentTime}</p>*/}
        {
          state.audioLoaded &&
          <EditorWrapper initialValue={state.transcript} />
        }
        <EditorWrapper initialValue={initial} />
      </DispatchContext.Provider>
    </StateContext.Provider>
  )
}

export default App;
