import React, { useState } from 'react';

import { Dashboard } from '@uppy/react'
import Uppy from '@uppy/core'
import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'
import xhr from '@uppy/xhr-upload'

import EditorWrapper from '../Editor/Editor';

import jsonToSlate from '../../utils/deserialize';
import { calcBufferTransport, createSourcesFromSchedules } from '../../utils/audioUtils'
import { fadeIn, fadeOut } from '../../utils/fadeCurves';


const initialState = {
  audioLoaded: false,
  audioContext: new (AudioContext || webkitAudioContext)(),
  transcript: {},
  audioData: null,
  isPlaying: false,
  buffers: []
}


const App = () => {
  const [state, setState] = useState(initialState)
  const [audioSchedule, setAudioSchedule] = useState([])

  const handlePlayAudio = () => {
    const fadeDuration = 0.1
    const currentTime = state.audioContext.currentTime
    console.log(currentTime)
    let bufferNodes = createSourcesFromSchedules(audioSchedule, state)
    bufferNodes = calcBufferTransport(bufferNodes, currentTime)
    console.log('bufferNodes', bufferNodes)
    for (const node of bufferNodes) {
      const { startTime, offset, duration } = node.startParameters
      node.gainNode.gain.setValueCurveAtTime(fadeIn, startTime + 0.25, fadeDuration)
      node.gainNode.gain.setValueCurveAtTime(fadeOut, startTime + duration + 0.25, fadeDuration)
      node.source.start(startTime, offset, duration + fadeDuration)

    }
    setState({ ...state, isPlaying: true, buffers: bufferNodes })
  }

  // const stopAudio = () => {
  //   for (const buffer of state.buffers) {
  //     buffer.stop(0)
  //   }
  // }

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
    setState({ ...state, audioLoaded: true, transcript: deserialized, audioData: file.data })
    uppy.close()
  })

  return (
    <>
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
