const jsonToSlate = ({ body }) => {
  console.log(body);
  const spans = body.map((token) => (
    {
      type: 'span',
      text: token.word,
      startTime: token.startTime,
      dragged: false,
      endTime: token.endTime,
      removed: false,

    }
  ));
  return [{ type: 'paragraph', children: [...spans] }];
};

export default jsonToSlate;
