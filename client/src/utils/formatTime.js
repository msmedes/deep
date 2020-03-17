// Formats the timestamps for the seek bar

export default function (time) {
  const hours = ~~(time / 3600)
  const minutes = ~~(time / 60)
  const seconds = time - minutes * 60;

  return `${hours}:${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds.toFixed(0)}`
}