// Serializer for converting the JSON response from the transcription service
// to a format slate can use.

const jsonToSlate = ({ body }) => {
  console.log(body);
  const spans = body.map((token, index) => (
    {
      type: 'span',
      text: token.word,
      startTime: token.startTime,
      dragged: false,
      endTime: token.endTime,
      removed: false,
      index
    }
  ));
  return [{ type: 'paragraph', children: [...spans] }];

};

export default jsonToSlate;
