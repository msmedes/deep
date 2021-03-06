from config import Config

import os
import logging
import deepspeech
import ffmpeg

# import numpy as np
import scipy.io.wavfile as wav
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

logging.basicConfig(level=25)


UPLOAD_FOLDER = "./uploads"
ALLOWED_EXTENSIONS = {"wav", "mp3", "flac", "ogg"}


app = Flask(__name__)
app.config["CORS_HEADERS"] = "Content-Type"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["CONVERTED"] = os.path.join(app.config["UPLOAD_FOLDER"], "converted")
app.config["RAW"] = os.path.join(app.config["UPLOAD_FOLDER"], "raw")
CORS(app)


def create_model_from_config(config: Config) -> deepspeech.Model:
    print("Initialize model...")
    model = deepspeech.Model(config.model_path)
    model.setBeamWidth(config.beam_width)
    model.enableExternalScorer(config.scorer)
    model.setScorerAlphaBeta(config.scorer_alpha, config.scorer_beta)
    return model


def load_config() -> Config:
    return Config()


def normalize_file(file_name: str) -> str:
    print("here we go")
    full_path = os.path.join(app.config["RAW"], file_name)
    destination = os.path.join(app.config["CONVERTED"], file_name)
    (
        ffmpeg.input(full_path)
        .output(destination, acodec="pcm_s16le", ac=1, ar="16k")
        .overwrite_output()
        .run()
    )

    return destination


def process_transcript(transcript):
    items = transcript.items  # character, start_time, timestep
    result = []
    word_start = 0
    for i, item in enumerate(items):
        if item.character == " ":
            start_time = items[word_start].start_time
            end_time = item.start_time
            token = "".join([curr.character for curr in items[word_start:i]])
            result.append({"word": token, "startTime": start_time, "endTime": end_time})
            if i < len(items) - 1:
                result.append(
                    {
                        "word": " ",
                        "startTime": end_time,
                        "endTime": items[i + 1].start_time,
                    }
                )
            word_start = i + 1
    return result


def transcribe(file_name: str):
    fs, audio = wav.read(file_name)
    print("Loaded file")
    print("Starting transcription...")
    processed_data = model.sttWithMetadata(audio)
    os.remove(file_name)
    return processed_data


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/upload", methods=["POST"])
# @cross_origin
def upload_file():
    if len(request.files) == 0:
        return jsonify(error="No file in request"), 400
    for fi in request.files:
        file = request.files[fi]
        if file and allowed_file(file.filename):
            file_name = secure_filename(file.filename)
            raw_file = os.path.join(app.config["RAW"], file_name)
            file.save(raw_file)
            file_name = normalize_file(file_name)
            transcript = transcribe(file_name)
            transcript = process_transcript(transcript)
            os.remove(raw_file)
            return jsonify(transcript), 201
    return jsonify(message="no file"), 400


config = load_config()
model = create_model_from_config(config)

if __name__ == "__main__":
    app.run("0.0.0.0", 5000, debug=True, use_reloader=True)
