const initialState = {
  audioLoaded: false,
  audioSchedule: [],
  fileDuration: 10.399524,
  isPlaying: false,
  playerTime: 0,
  seekTime: 0,
  timeOuts: [],
  transcript: {},
}

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_SEEK_TIME':
      return { ...state, seekTime: action.seekTime }
    case 'SET_AUDIO_SCHEDULE':
      return { ...state, audioSchedule: action.audioSchedule }
    case 'SET_PLAYER_TIME':
      return { ...state, playerTime: action.playerTime }
    case 'SET_TIMEOUTS':
      return { ...state, timeOuts: action.timeOuts }
    case "CLEAR_TIMEOUTS":
      return { ...state, timeOuts: [] }
    default:
      return state
  }
}

export { reducer, initialState }
