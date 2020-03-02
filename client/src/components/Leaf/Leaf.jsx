import React from 'react';
// import { Leaf } from 'slate';


const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.removed) {
    children = <span style="background:blue;color:white;" {...attributes}>{children}</span>
  }
  return <span {...attributes}>{children}</span>
};

export default Leaf;