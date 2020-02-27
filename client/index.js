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
  visualize(stream);

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
    if (e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  mediaRecorder.onstop = (e) => {
    console.log('data available after MediaRecorder.stop() called.');

    const audio = document.createElement('audio');
    audio.controls = true;
    const blob = new Blob(recordedChunks, { type: 'audio/ogg; codecs=opus' });
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


function visualize(stream) {
  if (!audioCtx) {
    audioCtx = new AudioContext({ sampleRate: 48000 });
  }

  const source = audioCtx.createMediaStreamSource(stream);

  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);
  // analyser.connect(audioCtx.destination);

  const draw = () => {
    WIDTH = canvas.width;
    HEIGHT = canvas.height;

    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    canvasCtx.beginPath();

    const sliceWidth = WIDTH * 1.0 / bufferLength;
    let x = 0;


    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = v * HEIGHT / 2;

      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    draw();

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
  };
}
