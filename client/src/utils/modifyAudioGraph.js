// {
//   type: 'span',
//   text: token.word,
//   startTime: token.startTime,
//   dragged: false,
//   endTime: token.endTime,
//   removed: false,

// }

const modifyAudioGraph = (text) => {
  const schedule = [];
  const { children } = state[0];
  let curr_obj = { startTime: nil, endTime: nil };
  for (let i = 0; i < children.length; i++) {
    curr_span = children[i];
    if (curr_span.removed && curr_obj.startTime) {
      schedule.push({ startTime: curr_obj.startTime, endTime: curr_span.startTime })
      curr_obj = { startTime: nil }
    } else {
      curr_obj.startTime = curr_obj.startTime ? curr_obj.startTime : curr_span.startTime
    }
  }
}
// const modifyAudioGraph = (state) => {
//   let schedule = []
//   let children = state[0].children;
//   console.log('children', children)
//   let startTime = 0.0001;
//   let startSet = false;
//   let inRemoval = false;
//   for (let i = 0; i < children.length; i++) {
//     if (children[i].removed) {
//       if (startTime && !inRemoval) {
//         schedule.push({ startTime, endTime: children[i].startTime })
//       }
//       inRemoval = true
//     } else {
//       startTime = !startTime ? children[i].startTime : startTime;
//       if (inRemoval) {
//         startTime = children[i].startTime;
//       }
//       inRemoval = false;
//       console.log('starttime', startTime);
//     }
//   }
//   console.log('scheudle', schedule)
//   return schedule;
// }

export default modifyAudioGraph