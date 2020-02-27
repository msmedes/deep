import time
import datetime
import json
import logging
import threading
import collections
import queue
import deepspeech
import numpy as np
import webrtcvad
from halo import Halo
from scipy import signal
from flask import Flask
from flask_socketio import SocketIO, emit
from typing import Callable, Dict, Union, Callable

logging.basicConfig(level=25)

Config = Dict[str, Union[str, int, float]]
app = Flask(__name__)
socket = SocketIO(app, async_mode="eventlet", cors_allowed_origins="*")

# socket_buffer = collections.deque()


@socket.on("connect", namespace="/transcribe")
def connect_handler():
    print("connected")
    socket.emit("hello", {"data": "hello"})


@socket.on("disconnect", namespace="/transcribe")
def disconnect_handler():
    print("disconnected")


@socket.on("stream-data", namespace="/transcribe")
def stream_reset_handler(stream):
    buffer, timestamp = stream['buffer'], stream['timestamp']
    # vad_audio.buffer_queue.put(buffer)
    process_audio(buffer)


@socket.on("stream-reset")
def stream_reset_handler():
    print('stream stopped')


def emit_results(text: str):
    print('emit results', text)
    socket.emit("recognize", {"text": text}, namespace='/transcribe')


class VADAudio:
    """Filter and segment audio with voice activitiy detection."""
    RATE_PROCESS = 16000
    BLOCKS_PER_SECOND = 50

    def __init__(self, aggressiveness=0, input_rate=RATE_PROCESS):
        self.vad = webrtcvad.Vad(aggressiveness)
        self.input_rate = input_rate
        self.sample_rate = 16000
        self.buffer_queue = queue.Queue()
        self.block_size = int(self.RATE_PROCESS /
                              float(self.BLOCKS_PER_SECOND))
        self.block_size_input = int(
            self.input_rate / float(self.BLOCKS_PER_SECOND))

    frame_duration_ms = property(
        lambda self: 1000 * self.block_size // self.sample_rate
    )

    def resample(self, data: str, input_rate: int) -> str:
        """
        Mic may not support our native processing sample rate, so
        resample from input_rate to RATE_PROCESS here for webrtcvad and
        deepspeech

        Args:
            data (binary): Input audio stream
            input_rate (int): Input audio rate to resample from
        """
        data16 = np.frombuffer(data, dtype=np.int16)
        resample_size = int(len(data16) / self.input_rate * self.RATE_PROCESS)
        resample = signal.resample(data16, resample_size)
        resample16 = np.array(resample, dtype=np.int16)
        return resample16.tostring()

    def read_resampled(self, frames) -> str:
        """Return a block of audio data resampled to 16k, blocking if necessary"""
        return self.resample(data=frames, input_rate=self.input_rate)

    def read(self):
        """Return a block of audio data, blocking if necessary"""
        return self.buffer_queue.get()

    def frame_generator(self, frames):
        """Generator that yields all audio frames from a microphone"""
        if self.input_rate == self.RATE_PROCESS:
            # while True:
            #     yield self.read()
            yield frames

        else:
            # while True:
            yield self.read_resampled(frames)

    def vad_collector(self, padding_ms=150, ratio=0.9, frames=None):
        """Generator that yields series of consecutive audio frames comprising each utterence, separated by yielding a single None.
           Determines voice activity by ratio of frames in padding_ms. Uses a buffer to include padding_ms prior to being triggered.
           Example: (frame, ..., frame, None, frame, ..., frame, None, ...)
                     |---utterence---|        |---utterence---|
       """        # if frames is None:
        #     frames = self.frame_generator()
        # else:

        frames = self.frame_generator(frames)
        num_padding_frames = padding_ms // self.frame_duration_ms
        ring_buffer = collections.deque(maxlen=num_padding_frames)
        triggered = False

        for frame in frames:
            if len(frame) < 640:
                return
            is_speech = self.vad.is_speech(frame, self.sample_rate)
            if not triggered:
                print('lol ikd')
                ring_buffer.append((frame, is_speech))
                num_voiced = len([f for f, speech in ring_buffer if speech])
                if num_voiced > ratio * ring_buffer.maxlen:
                    triggered = True
                    for f, _ in ring_buffer:
                        yield f
                    ring_buffer.clear()

            else:
                print('lets yield')
                yield frame
                ring_buffer.append((frame, is_speech))
                num_unvoiced = len(
                    [f for f, speech in ring_buffer if not speech])
                if num_unvoiced > ratio * ring_buffer.maxlen:
                    triggered = False
                    yield None
                    ring_buffer.clear()


def create_model_from_config(config: Config) -> deepspeech.Model:
    print("Initialize model...")
    model = deepspeech.Model(
        config['MODEL_PATH'], config['BEAM_WIDTH'])
    model.enableDecoderWithLM(
        config['LM_BINARY'], config['TRIE'], config['LM_ALPHA'], config['LM_BETA'])
    return model


def load_config() -> Config:
    with open('config.json') as json_file:
        return json.load(json_file)['config']


def process_audio(frames):
    # Start audio with VAD
    frames_collected = vad_audio.vad_collector(frames=frames)
    # Stream from microphone to DeepSpeech using VAD
    stream_context = model.createStream()
    for frame in frames_collected:
        if frame is not None:
            logging.debug("streaming frame")
            model.feedAudioContent(
                stream_context, np.frombuffer(frame, np.int16))
        else:
            logging.debug("end utterence")
            text = model.finishStreamWithMetadata(stream_context)
            # for item in text.items:
            #     print(item.character, item.start_time, item.timestep)
            text = "".join([item.character for item in text.items])
            # callback(text)
            print("text", text)
            stream_context = model.createStream()
    # print("this finished?")


config = load_config()
model = create_model_from_config(config)
vad_audio = VADAudio(config["VAD_AGGRESSIVENESS"])
# _ = socket.start_background_task(process_audio)


if __name__ == "__main__":
    socket.run(
        app, debug=True, use_reloader=True)
