### Run the server
First, create a venv (I used virtualenv but it doesn't matter).  This was written in a 3.8.5 env.
Also make sure you have ffmpeg installed on your machine.  I used brew (`brew ffmpeg`)
```bash
cd server
pip install -r requirements.txt
```

Right now the config object assumes the deepspeech model files are in `server/deepspeech-0.8.2-models` so either create a file with that name or create your own.  Then, in that folder run 
```bash
curl -LO https://github.com/mozilla/DeepSpeech/releases/download/v0.8.2/deepspeech-0.8.2-models.pbmm
curl -LO https://github.com/mozilla/DeepSpeech/releases/download/v0.8.2/deepspeech-0.8.2-models.scorer
```
to download the model files.
Next start the server with
```bash
python main.py
```
and the server should spin up on `0.0.0.0:5000`.  Right now there is only one route defined, `/upload`, which takes a `wav` file from the client.  I think that functionality may be disabled client side right now but it's in there somewhere. 


### Run the client
```bash
cd client
npm install
npm run dev
```
Parcel (the bundler) should start a dev server on `localhost:1234`

### To use (because there are no instructions)

You can click in the timelime to move around.  You can double click a word to move the timeline to there (this is buggy because slatejs is being a butt about dispatching state reducer).  To "remove" some text, select the words you wish to banish and press `ctrl-r`.  Press play and viola, no more audio.  That's...about it.


### Upcoming features
There will probably be more because I'm currently quarantined. (UPDATE: lol I thought I was going to be able to get some work done in the epicenter of a global pandemic). 

Some examples:
- Users (wow)
- Persistence to a db
- Uploading (this actually works but I removed it to tighten the dev cycle)
- Exporting an edited file.
- Idk crossfades?  This was actually already implemented but I couldn't extract any information about *where* in the audio file I was once the file started playing.  This is important for all the other features.  Not sure it's possible in the browser (though I have some ideas).
- Reshuffling text.  So the sentence `I have a cool puppy his name is Charles` could become `I have a Charles his name is cool puppy`.
- Punctuation and paragraphs in the transcription.

### Extremely future and not up to me:
- Multiple Speakers (wow)
