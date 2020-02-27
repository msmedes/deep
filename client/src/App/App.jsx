import React, { useState, useEffect } from 'react';

const DS_WORKER = './downsampling_worker.js';

const App = ({ socket }) => {
  const [connected, setConnected] = useState(false);
  const [recording, setRecording] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingStart, setRecordingStart] = useState(0);
  const [recognitionOutput, setRecognitionOutput] = useState([]);
  let recordingInterval;
  let audioContext; let mediaStream; let mediaStreamSource; let processor;

  useEffect(() => {
    if (!recording) {
      stopMicrophone();
    } else {
      startMicrophone();
    }
  }, [recording]);

  socket.on('connect', () => {
    console.log('socket connected');
    setConnected(true);
  });

  socket.on('disconnect', () => {
    console.log('socket disconnected');
    setConnected(false);
    stopRecording();
  });

  socket.on('recognize', (results) => {
    console.log('recognized: ', results);
    setRecognitionOutput([...recognitionOutput, ...results]);
  });
  const handleStartRecording = () => {
    console.log('handleStart Recording');
    if (!recording) {
      recordingInterval = setInterval(() => {
        setRecordingTime(new Date().getTime() - recordingStart);
      }, 100);

      setRecording(true);
      setRecordingStart(new Date().getTime());
      setRecordingTime(0);
    }
  };

  const startMicrophone = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();

    const success = (stream) => {
      console.log('recording started');
      mediaStream = stream;
      mediaStreamSource = audioContext.createMediaStreamSource(stream);
      processor = createAudioProcessor(audioContext, mediaStreamSource);
      mediaStreamSource.connect(processor);
    };

    const fail = (e) => {
      console.error('recording failure', e);
    };

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      })
        .then(success)
        .catch(fail);
    } else {
      navigator.getUserMedia({
        video: false,
        audio: true,
      }, success, fail);
    }
  };

  const stopRecording = () => {
    console.log('stop recording');
    if (recording) {
      if (socket.connected) {
        socket.emit('stream-reset');
      }
      clearInterval(recordingInterval);
      setRecording(false);
    }
  };

  const stopMicrophone = () => {
    if (mediaStream) {
      mediaStream.getTracks()[0].stop();
    }
    if (mediaStreamSource) {
      mediaStreamSource.disconnect();
    }
    if (processor) {
      processor.shutdown();
    }
    if (audioContext) {
      audioContext.close();
    }
  };

  const createAudioProcessor = (audioContext, audioSource) => {
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    const { sampleRate } = audioSource.context;

    const downsampler = new Worker(DS_WORKER);
    downsampler.postMessage({ command: 'init', inputSampleRate: sampleRate });
    downsampler.onmessage = (e) => {
      if (socket.connected) {
        console.log(e.data.buffer);
        socket.emit('stream-data', e.data.buffer);
      }
    };

    processor.onaudioprocess = (event) => {
      const data = event.inputBuffer.getChannelData(0);
      // console.log(data)
      downsampler.postMessage({ command: 'process', inputFrame: data });
    };

    processor.shutdown = () => {
      processor.disconnect();
      processor.onaudioprocess = null;
    };

    processor.connect(audioContext.destination);

    return processor;
  };

  return (
    <div>
      <button disable={!connected || recording} onClick={handleStartRecording}>Start Recording</button>
      <button onClick={stopRecording}>Stop Recording</button>
    </div>
  );
};

export default App;
