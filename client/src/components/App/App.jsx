import React, { useState } from 'react';
import { Dashboard } from '@uppy/react'
import Uppy from '@uppy/core'
import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'
import xhr from '@uppy/xhr-upload'

import EditorWrapper from '../Editor/Editor';

import jsonToSlate from '../../utils/deserialize';


const initialState = {
  audioLoaded: false,
  audioContext: new (window.AudioContext || window.webkitAudioContext)(),
  audioSchedule: [],
  audioBuffer: null,
  transcript: {}
}

const App = () => {
  const [state, setState] = useState(initialState)

  const playAudio = () => {
    console.log('play audio')
  }
  const uppy = Uppy({
    id: 'uppy1',
    debug: true,
    autoProceed: true
  })
  uppy.use(xhr, {
    endpoint: 'http://localhost:5000/upload'
  })

  uppy.on('file-added', (file) => {
    let buffer
    const url = URL.createObjectURL(file.data);
    console.log(file)
    const fileReader = new FileReader()
    fileReader.onloadend = function () {
      state.audioContext.decodeAudioData(fileReader.result).then(function (decodedData) {
        buffer = decodedData
      })
    }
    fileReader.readAsArrayBuffer(file.data)
    setState({ ...state, audioBuffer: buffer })
  })

  uppy.on('upload-success', (_, response) => {
    console.log(response)
    const deserialized = jsonToSlate(response)
    console.log(deserialized)
    setState({ audioLoaded: true, transcript: deserialized })
    uppy.close()
  })

  return (
    <>

      {!state.audioLoaded && <Dashboard uppy={uppy} {...{ inline: true, showProgressDetails: true, width: 300, height: 200 }} />}
      <button onClick={playAudio} disabled={!state.audioLoaded}>Play</button>
      {
        state.audioLoaded &&
        <EditorWrapper initialValue={state.transcript} />
      }
    </>
  )
};

export default App;
