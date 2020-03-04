import { fadeIn, fadeOut } from './fadeCurves';

const createSourcesFromSchedules = (schedules, state) => {
  const sources = []
  for (const schedule of schedules) {
    const [source, gainNode] = createSource(state)
    sources.push({ schedule, source, gainNode })
  }
  return sources
}


const createSource = ({ audioData, audioContext }) => {
  const source = audioContext.createBufferSource();
  const gainNode = audioContext.createGain();
  source.connect(gainNode);
  gainNode.connect(audioContext.destination);
  const fileReader = new FileReader()
  fileReader.onloadend = function () {
    audioContext.decodeAudioData(fileReader.result).then(function (decodedData) {
      source.buffer = decodedData
      // console.log('index', index, 'schedule', schedule)
      // // offset should actually be calculated by duration since endtime doens't seem reliable
      // console.log(schedule.lastEndTime + currentTime, schedule.startTime, schedule.endTime - schedule.startTime)
      // source.start(schedule.lastEndTime + currentTime, schedule.startTime, !last && schedule.endTime - schedule.startTime)
    })
  }
  fileReader.readAsArrayBuffer(audioData)
  return [source, gainNode]
}

const calcBufferTransport = (schedules, currentTime) => {
  let startParameters
  let endTime = 0
  for (const schedule of schedules) {
    [startParameters, endTime] = calcStartParameters(schedule, currentTime, endTime)
    // const gainParameters = calcGainParameters(schedule.gainNode, startParameters, currentTime)
    schedule.startParameters = startParameters
    // schedule.gainParameters = gainParameters
  }
  return schedules
}

const calcStartParameters = (schedule, currentTime, endTime) => {
  const { schedule: currSchedule } = schedule
  const cutPadding = currSchedule.startTime === 0 ? 0 : 0.4
  const startTime = currentTime + cutPadding + endTime
  const offset = currSchedule.startTime
  const duration = currSchedule.endTime - currSchedule.startTime
  return [{ startTime, offset, duration }, startTime - currentTime + duration]
}

const calcGainParameters = (gainNode, startParameters, currentTime) => {

}

const calcCurves = () => {
  const fadeIn = new Float32Array(100)
  const fadeOut = new Float32Array(100)
  for (let i = 0.01; i <= 1; i += 0.01) {
    fadeOut[i] = (Math.cos(i * 0.5 * Math.PI));
    fadeIn[i](Math.cos((1.0 - i) * 0.5 * Math.PI));
  }
  // console.log(fadeIn)
  // // console.log(fadeOut)
}


export { calcBufferTransport, createSourcesFromSchedules }