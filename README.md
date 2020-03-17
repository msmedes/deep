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
There will probably be more because I'm currently quarantined.  Some examples:
- Users (wow)
- Persistence to a db
- Uploading (this actually works but I removed it to tighten the dev cycle)
- Exporting an edited file.
- Idk crossfades?  This was actually already implemented but I couldn't extract any information about *where* in the audio file I was once the file started playing.  This is important for all the other features.  Not sure it's possible in the browser (though I have some ideas).
- Reshuffling text.  So the sentence `I have a cool puppy his name is Charles` could become `I have a Charles his name is cool puppy`.
- Punctuation and paragraphs in the transcription.

### Extremely future and not up to me:
- Multiple Speakers (wow)
