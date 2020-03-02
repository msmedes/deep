import React from 'react';

const Element = ({ attributes, children, element }) => {
  switch (element.type) {
    case 'paragraph':
      return <p {...attributes}>{children}</p>;
    case 'span':
      return <span {...attributes}>{children}</span>;
    default:
      return <p {...attributes}>{children}</p>;
  }
};

export default Element;
