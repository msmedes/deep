import time
import datetime
import json
import logging
import threading
import collections
import queue
import os
import os.path
import deepspeech
import numpy as np
import pyaudio
import wave
import webrtcvad
from halo import Halo
from scipy import signal
logging.basicConfig(level=20)


class Audio:
    '''Streams raw audio from micropphone.  Data is received in a separate thread,
    and stored in a buffer, to be read from.'''

    FORMAT = pyaudio.paInt16
    # Network/VAD rate-space
    RATE_PROCESS = 16000
    CHANNELS = 1
    BLOCKS_PER_SECOND = 50

    def __init__(self, callback=None, device=None, input_rate=RATE_PROCESS, file=None):
        def proxy_callback(in_data, frame_count, time_info, status):
            if self.chunk is not None:
                in_data = self.wf.readframes(self.chunk)
            callback(in_data)
            return(None, pyaudio.paContinue)
        if callback is None:
            def callback(in_data): return self.buffer_queue.put(in_data)
        self.buffer_queue = queue.Queue()
        self.device = device
        self.input_rate = input_rate
        self.sample_rate = self.RATE_PROCESS
        self.block_size = int(self.RATE_PROCESS /
                              float(self.BLOCKS_PER_SECOND))
        self.block_size_input = int(
            self.input_rate / float(self.BLOCKS_PER_SECOND))
        self.pa = pyaudio.PyAudio()

        kwargs = {
            'format': self.FORMAT,
            'channels': self.CHANNELS,
            'rate': self.input_rate,
            'input': True,
            'frames_per_buffer': self.block_size_input,
            'stream_callback': proxy_callback
        }

        self.chunk = None
        if self.device:
            kwargs['input_device_index'] = self.device
        elif file is not None:
            print('file', file)
            self.chunk = 320
            self.wf = wave.open(file, 'rb')

        self.stream = self.pa.open(**kwargs)
        self.stream.start_stream()

    def resample(self, data: str, input_rate: int) -> str:
        '''
        Mic may not support our native processing sample rate, so
        resample from input_rate to RATE_PROCESS here for webrtcvad and
        deepspeech

        Args:
            data (binary): Input audio stream
            input_rate (int): Input audio rate to resample from
        '''
        data16 = np.fromstring(data, dtype=np.int16)
        resample_size = int(len(data16) / self.input_rate * self.RATE_PROCESS)
        resample = signal.resample(data16, resample_size)
        resample16 = np.array(resample, dtype=np.int16)
        return resample16.tostring()

    def read_resampled(self) -> str:
        '''Return a block of audio data resampled to 16k, blocking if necessary'''
        return self.resample(data=self.buffer_queue.get(), input_rate=self.input_rate)

    def read(self):
        '''Return a block of audio data, blocking if necessary'''
        return self.buffer_queue.get()

    def destroy(self):
        self.stream.stop_stream()
        self.stream.close()
        self.pa.terminate()

    frame_duration_ms = property(
        lambda self: 1000 * self.block_size // self.sample_rate)

    def write_wav(self, filename: str, data: str):
        logging.info("write wav %s", filename)
        wf = wave.open(filename, "wb")
        wf.setnchannels(self.CHANNELS)
        assert self.FORMAT == pyaudio.paInt16
        wf.setsampwidth(2)
        wf.setframerate(self.sample_rate)
        wf.writeframes(data)
        wf.close()


class VADAudio(Audio):
    """Filter and segment audio with voice activitiy detection."""

    def __init__(self, aggressiveness=0, device=None, input_rate=None, file=None):
        super().__init__(device=device, input_rate=input_rate, file=file)
        self.vad = webrtcvad.Vad(aggressiveness)

    def frame_generator(self):
        """Generator that yields all audio frames from a microphone"""
        if self.input_rate == self.RATE_PROCESS:
            while True:
                yield self.read()

        else:
            while True:
                yield self.read_resampled()

    def vad_collector(self, padding_ms=300, ratio=0.75, frames=None):
        """Generator that yields series of consecutive audio frames comprising each utterence, separated by yielding a single None.
           Determines voice activity by ratio of frames in padding_ms. Uses a buffer to include padding_ms prior to being triggered.
           Example: (frame, ..., frame, None, frame, ..., frame, None, ...)
                     |---utterence---|        |---utterence---|
       """
        if frames is None:
            frames = self.frame_generator()
        num_padding_frames = padding_ms // self.frame_duration_ms
        ring_buffer = collections.deque(maxlen=num_padding_frames)
        triggered = False

        for frame in frames:
            if len(frame) < 640:
                return

            is_speech = self.vad.is_speech(frame, self.sample_rate)

            if not triggered:
                ring_buffer.append((frame, is_speech))
                num_voiced = len([f for f, speech in ring_buffer if speech])
                if num_voiced > ratio * ring_buffer.maxlen:
                    triggered = True
                    for f, _ in ring_buffer:
                        yield f
                    ring_buffer.clear()

            else:
                yield frame
                ring_buffer.append((frame, is_speech))
                num_unvoiced = len(
                    [f for f, speech in ring_buffer if not speech])
                if num_unvoiced > ratio * ring_buffer.maxlen:
                    triggered = False
                    yield None
                    ring_buffer.clear()


def main(ARGS):
    # Load DeepSpeech model
    if os.path.isdir(ARGS.model):
        model_dir = ARGS.model
        ARGS.model = os.path.join(model_dir, 'output_graph.pb')
        ARGS.lm = os.path.join(model_dir, ARGS.lm)
        ARGS.trie = os.path.join(model_dir, ARGS.trie)

    print('Initializing model...')
    logging.info("ARGS.model: %s", ARGS.model)
    model = deepspeech.Model(ARGS.model, ARGS.beam_width)
    if ARGS.lm and ARGS.trie:
        logging.info("ARGS.lm: %s", ARGS.lm)
        logging.info("ARGS.trie: %s", ARGS.trie)
        model.enableDecoderWithLM(
            ARGS.lm, ARGS.trie, ARGS.lm_alpha, ARGS.lm_beta)

    # Start audio with VAD
    vad_audio = VADAudio(aggressiveness=ARGS.vad_aggressiveness,
                         device=ARGS.device,
                         input_rate=ARGS.rate,
                         file=ARGS.file)
    print("Listening (ctrl-C to exit)...")
    frames = vad_audio.vad_collector()

    # Stream from microphone to DeepSpeech using VAD
    spinner = None
    if not ARGS.nospinner:
        spinner = Halo(spinner='line')
    stream_context = model.createStream()
    wav_data = bytearray()
    for frame in frames:
        if frame is not None:
            if spinner:
                spinner.start()
            logging.debug("streaming frame")
            model.feedAudioContent(
                stream_context, np.frombuffer(frame, np.int16))
            if ARGS.savewav:
                wav_data.extend(frame)
        else:
            if spinner:
                spinner.stop()
            logging.debug("end utterence")
            if ARGS.savewav:
                vad_audio.write_wav(os.path.join(ARGS.savewav, datetime.now().strftime(
                    "savewav_%Y-%m-%d_%H-%M-%S_%f.wav")), wav_data)
                wav_data = bytearray()
            text = model.finishStreamWithMetadata(stream_context)
            # for item in text.items:
            #     print(item.character, item.start_time, item.timestep)
            print(''.join([item.character for item in text.items]))
            stream_context = model.createStream()


if __name__ == '__main__':
    # Beam width used in the CTC decoder when building candidate transcriptions
    BEAM_WIDTH = 500
    DEFAULT_SAMPLE_RATE = 16000

    # Alpha hyperparameter of the CTC decoder aka Language Model weight
    LM_ALPHA = 0.75

    # Valid word insertion weight. This is used to lessen the word insertion penalty
    # when the inserted word is part of the vocabulary
    LM_BETA = 1.85

    import argparse
    parser = argparse.ArgumentParser(
        description="Stream from microphone to DeepSpeech using VAD")

    parser.add_argument('-v', '--vad_aggressiveness', type=int, default=3,
                        help="Set aggressiveness of VAD: an integer between 0 and 3, 0 being the least aggressive about filtering out non-speech, 3 the most aggressive. Default: 3")
    parser.add_argument('--nospinner', action='store_true',
                        help="Disable spinner")
    parser.add_argument('-w', '--savewav',
                        help="Save .wav files of utterences to given directory")
    parser.add_argument('-f', '--file',
                        help="Read from .wav file instead of microphone")

    parser.add_argument('-m', '--model', required=True,
                        help="Path to the model (protocol buffer binary file, or entire directory containing all standard-named files for model)")
    parser.add_argument('-l', '--lm', default='lm.binary',
                        help="Path to the language model binary file. Default: lm.binary")
    parser.add_argument('-t', '--trie', default='trie',
                        help="Path to the language model trie file created with native_client/generate_trie. Default: trie")
    parser.add_argument('-d', '--device', type=int, default=None,
                        help="Device input index (Int) as listed by pyaudio.PyAudio.get_device_info_by_index(). If not provided, falls back to PyAudio.get_default_device().")
    parser.add_argument('-r', '--rate', type=int, default=DEFAULT_SAMPLE_RATE,
                        help=f"Input device sample rate. Default: {DEFAULT_SAMPLE_RATE}. Your device may require 44100.")
    parser.add_argument('-la', '--lm_alpha', type=float, default=LM_ALPHA,
                        help=f"The alpha hyperparameter of the CTC decoder. Language Model weight. Default: {LM_ALPHA}")
    parser.add_argument('-lb', '--lm_beta', type=float, default=LM_BETA,
                        help=f"The beta hyperparameter of the CTC decoder. Word insertion bonus. Default: {LM_BETA}")
    parser.add_argument('-bw', '--beam_width', type=int, default=BEAM_WIDTH,
                        help=f"Beam width used in the CTC decoder when building candidate transcriptions. Default: {BEAM_WIDTH}")

    ARGS = parser.parse_args()
    if ARGS.savewav:
        os.makedirs(ARGS.savewav, exist_ok=True)
    main(ARGS)

'''
['__class__', '__delattr__', '__dict__', '__dir__', '__doc__', '__eq__', '__format__', '__ge__', '__getattribute__', '__gt__', '__hash__', '__init__', '__init_subclass__', '__int__', '__le__', '__lt__', '__ne__',
    '__new__', '__reduce__', '__reduce_ex__', '__repr__', '__setattr__', '__sizeof__', '__str__', '__subclasshook__', 'acquire', 'append', 'confidence', 'disown', 'items', 'next', 'num_items', 'own', 'this', 'thisown']
'''
