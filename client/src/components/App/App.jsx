import React, { useState, useEffect } from 'react';

import { Dashboard } from '@uppy/react'
import Uppy from '@uppy/core'
import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'
import xhr from '@uppy/xhr-upload'

import EditorWrapper from '../Editor/Editor';

import jsonToSlate from '../../utils/deserialize';
import { calcBufferTransport, createSourcesFromSchedules, generateTimeouts } from '../../utils/audioUtils'
import { fadeIn, fadeOut } from '../../utils/fadeCurves';


const initialState = {
  audioLoaded: false,
  audioContext: new (AudioContext || webkitAudioContext)(),
  transcript: {},
  audioData: null,
  isPlaying: false,
  buffers: [],
  timeOuts: [],
}


const App = () => {
  const player = document.getElementById("audioPlayer")
  const [state, setState] = useState(initialState)
  const [audioSchedule, setAudioSchedule] = useState([])
  const [seekTime, setSeekTime] = useState(0)

  useEffect(() => {
    if (player) {

      player.currentTime = seekTime
    }
  }, [seekTime])



  const handlePlayAudio = () => {
    // const timeOuts = generateTimeouts(audioSchedule, setSeekTime)
    const timeOuts = [];
    let lastEndTime = 0;
    for (const schedule of audioSchedule) {
      console.log('schedule', schedule)
      console.log('lastEndTime', lastEndTime)
      const setSeekTimeWrapper = () => { setSeekTime(schedule.startTime) }
      const timeout = setTimeout(setSeekTimeWrapper, lastEndTime * 1000)
      lastEndTime = schedule.endTime - schedule.startTime + lastEndTime
      timeOuts.push(timeout)
    }
    player.play()
    // const fadeInDuration = 0.1
    // const fadeOutDuration = 0.05
    // const currentTime = state.audioContext.currentTime
    // let bufferNodes = createSourcesFromSchedules(audioSchedule, state)
    // bufferNodes = calcBufferTransport(bufferNodes, currentTime)
    // console.log('bufferNodes', bufferNodes)
    // for (const node of bufferNodes) {
    //   const { startTime, offset, duration } = node.startParameters
    //   const gainStartOffset = startTime === 0 ? startTime : startTime + 0.4
    //   node.gainNode.gain.setValueCurveAtTime(fadeIn, gainStartOffset, fadeInDuration)
    //   node.gainNode.gain.setValueCurveAtTime(fadeOut, startTime + duration, fadeOutDuration)
    //   node.source.start(startTime, offset, duration + fadeOutDuration)

    // }
    setState({ ...state, isPlaying: true, timeOuts })
  }

  const stopAudio = () => {
    for (const timeout of state.timeOuts) {
      clearTimeout(timeout)
    }
    player.pause()
  }

  const uppy = Uppy({
    id: 'uppy1',
    // debug: true,
    autoProceed: true
  })
  uppy.use(xhr, {
    // endpoint: 'http://67.81.172.102:5000/upload',
    endpoint: 'http://localhost:5000/upload',
    method: 'post'
  })

  uppy.on('upload-success', (file, response) => {
    const deserialized = jsonToSlate(response)
    uppy.close()
    const url = URL.createObjectURL(file.data)
    setState({ ...state, audioLoaded: true, transcript: deserialized, audioData: file.data, audioSource: url })
  })

  return (
    <>
      <audio
        controls
        id="audioPlayer"
        autoPlay={false}>
        {state.audioSource && <source src={state.audioSource}>
        </source>}
      </audio>
      {!state.audioLoaded && <Dashboard uppy={uppy} {...{ inline: true, showProgressDetails: true, width: 300, height: 200 }} />}
      <button onClick={handlePlayAudio}>Play</button>
      {
        state.audioLoaded &&
        <EditorWrapper style={{ border: '1px', borderColor: 'grey' }} initialValue={state.transcript} setAudioSchedule={setAudioSchedule} />
      }
    </>
  )
}

export default App;
