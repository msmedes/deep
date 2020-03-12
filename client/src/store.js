const initialState = {
  audioLoaded: false,
  audioContext: new (AudioContext || webkitAudioContext)(),
  transcript: {},
  audioData: null,
  isPlaying: false,
  buffers: [],
  timeOuts: [],
  seekTime: 0,
  playerTime: 0,
  audioSchedule: [],
  fileDuration: 10.399524,
}

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_SEEK_TIME':
      return { ...state, seekTime: action.seekTime }
    case 'SET_PLAYING':
      return { ...state, isPLaying: true, timeOuts: action.timeOuts }
    case 'SET_AUDIO_SCHEDULE':
      return { ...state, audioSchedule: action.audioSchedule }
    case 'SET_PLAYER_TIME':
      return { ...state, playerTime: action.playerTime }
    case "CLEAR_TIMEOUTS":
      return { ...state, timeOuts: [] }
    default:
      return state
  }
}

export { reducer, initialState }
