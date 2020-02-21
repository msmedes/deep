import React from 'react'


const App = () => {

  const handleStartRecording = () => {
    console.log('handleStart Recording')
  };

  const handleStopRecording = () => {
    console.log('handleStop Recording')
  };


  return (
    <div>
      <button onClick={handleStartRecording}>Start Recording</button>
      <button onClick={handleStopRecording}>Stop Recording</button>
    </div>
  )
}

export default App