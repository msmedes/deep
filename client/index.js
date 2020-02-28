const record = document.querySelector('.record');
const stop = document.querySelector('.stop');
const canvas = document.querySelector('.visualizer');

stop.disabled = true;

let audioCtx;
const canvasCtx = canvas.getContext('2d');

const handleSuccess = function (stream) {
  const options = { mimeType: 'audio/webm' };
  let recordedChunks = [];
  const mediaRecorder = new MediaRecorder(stream, options);
  console.log(mediaRecorder);

  record.onclick = () => {
    mediaRecorder.start();
    console.log('mediaRecorder.state', mediaRecorder.state);
    console.log('recorder started');
    stop.disabled = false;
    record.disabled = true;
  };

  stop.onclick = () => {
    mediaRecorder.stop();
    console.log('mediaRecorder.state', mediaRecorder.state);
    stop.disabled = true;
    record.disabled = false;
  };

  mediaRecorder.ondataavailable = (e) => {
    console.log('e.data.size', e.data);
    recordedChunks.push(e.data);
  };

  mediaRecorder.onstop = (e) => {
    console.log('stream', stream.getTracks()[0].getSettings());
    console.log('recordedChunks', recordedChunks);
    console.log('data available after MediaRecorder.stop() called.');

    const audio = document.createElement('audio');
    audio.controls = true;
    const blob = new Blob(recordedChunks, { type: 'audio/wav' });
    handleAudioUpload(blob);
    recordedChunks = [];
    const audioURL = window.URL.createObjectURL(blob);
    audio.src = audioURL;
    console.log('recorder stopped');
    document.querySelector('body').appendChild(audio);
  };
};

const onError = function (err) {
  console.log(`The following error occured: ${err}`);
};

navigator.mediaDevices.getUserMedia({ audio: true, video: false })
  .then(handleSuccess, onError);


const handleAudioUpload = (audio) => {
  // const formData = new FormData();
  // formData.append('file', audio, audio.name);
  // console.log('formData', formData.getAll('file'));

  fetch('http://127.0.0.1:5000/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/audio' },
    body: audio,
  })
    .then((response) => response.json())
    .then((data) => { console.log(data); })
    .catch((error) => {
      console.error(error);
    });
};
