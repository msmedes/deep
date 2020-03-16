const validStartTime = (time) => {
  return time || time === 0
}

const generateAudioTransport = (text) => {
  const schedule = [];
  const { children } = text[0];
  let lastEndTime = 0
  let curr_obj = { startTime: null, endTime: null };
  for (let i = 0; i < children.length; i++) {
    const curr_span = children[i];
    if ((curr_span.removed && validStartTime(curr_obj.startTime) || (i === children.length - 1))) {
      schedule.push({ startTime: curr_obj.startTime, endTime: curr_span.startTime, lastEndTime })
      lastEndTime = curr_span.startTime
      curr_obj = { startTime: null }
    } else if (!curr_span.removed) {
      curr_obj.startTime = validStartTime(curr_obj.startTime) ? curr_obj.startTime : curr_span.startTime
    }
  }
  console.log(schedule)
  return schedule
}


export default generateAudioTransport;