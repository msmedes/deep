const handleSuccess = (stream) => {
  const context = new AudioContext();
  const source = context.createMediaStreamSource(stream);
  const processor = context.createScriptProcessor(1024, 1, 1);

  source.connect(processor);
  processor.connect(context.destination);

  processor.onaudioprocess = (e) => {
    console.log(e.inputBuffer);
  };
};

navigator.mediaDevices.getUserMedia({ audio: true, video: false })
  .then(handleSuccess);
