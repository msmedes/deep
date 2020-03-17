// More deprecated bullsh

const loadAudio = (audioContext) => {

  let buffer;
  // const request = new XMLHttpRequest();

  // request.open('GET', '../test10.wav', true);
  // request.responseType = 'arraybuffer';

  // request.onload = function () {
  //   context.decodeAudioData(request.response, function (buffer) {
  //     audioBuffer = buffer
  //   })
  // }
  // request.send()

  // const url = URL.createObjectURL('../test10.wav')
  const fileReader = new FileReader();
  fileReader.onloadend = function () {
    audioContext.decodeAudioData(fileReader.result).then(decodedData => {
      buffer = decodedData
    })
  }

  fileReader.readAsArrayBuffer('../test10.wav')

  return audioBuffer
}

export default loadAudio