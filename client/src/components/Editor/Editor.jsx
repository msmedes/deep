import React, {
  useEffect, useMemo, useState, useCallback,
} from 'react';
import {
  createEditor, Transforms, Text, Editor
} from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { withHistory } from 'slate-history';

import isHotkey from 'is-hotkey';

import generateAudioTransport from '../../utils/generateAudioTransport'


const CustomEditor = {
  isTokenRemoved(editor) {
    const [match] = Editor.nodes(editor, {
      match: n => n.removed === true,
      universal: true
    })

    return !!match
  },

  toggleRemoved(editor) {
    const isRemoved = CustomEditor.isTokenRemoved(editor)
    Transforms.setNodes(
      editor,
      { removed: isRemoved ? false : true },
      { match: n => Text.isText(n) }
    )
  },
}

const HOTKEYS = {
  'mod+r': CustomEditor.toggleRemoved,
};

const EditorWrapper = ({ initialValue, setAudioSchedule }) => {
  const [value, setValue] = useState(initialValue);
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);

  useEffect(() => {
    const schedule = generateAudioTransport(value)
    setAudioSchedule(schedule)
  }, [value])

  const renderElement = useCallback(({ attributes, children, element }) => {
    switch (element.type) {
      case 'paragraph':
        return <p {...attributes}>{children}</p>
      case 'span':
        return (
          <span {...attributes}>
            {children}
          </span>
        )
      default:
        return <p {...attributes}>{children}</p>
    }
  }, [])

  const renderLeaf = useCallback(({ attributes, children, leaf }) => {
    if (leaf.removed) {
      return <span style={{ textDecorationLine: 'line-through', color: 'hsl(0, 100%, 75%)' }} {...attributes}>{children}</span>
    }
    return <span {...attributes}>{children}</span>
  })

  return (
    <Slate editor={editor} value={value} onChange={(value) => setValue(value)}>
      <Editable
        placeholder="Enter some text"
        autoFocus
        spellCheck
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        onKeyDown={event => {
          console.log(event)
          for (const hotkey in HOTKEYS) {
            if (isHotkey(hotkey, event)) {
              event.preventDefault();
              HOTKEYS[hotkey](editor)
            }
          }
        }}
      />
    </Slate>
  );
};


export default EditorWrapper;