import React, {
  useEffect, useMemo, useState, useCallback, useContext
} from 'react';
import {
  createEditor, Transforms, Text, Editor, Range
} from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { withHistory } from 'slate-history';

import isHotkey from 'is-hotkey';

import generateAudioTransport from '../../utils/generateAudioTransport'
import { StateContext, DispatchContext } from '../../context/context'

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
  'ctrl+r': CustomEditor.toggleRemoved,
};


const EditorWrapper = ({ initialValue }) => {
  const [value, setValue] = useState(initialValue);
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const state = useContext(StateContext)
  const dispatch = useContext(DispatchContext)


  useEffect(() => {
    const schedule = generateAudioTransport(value)
    dispatch({ type: 'SET_AUDIO_SCHEDULE', audioSchedule: schedule })
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

  const handleTransportSelect = (e) => {
    console.log('e', e)
    console.log('editor selection', editor.selection)
    let selectedNode
    for (const [node] of Editor.nodes(editor, { at: editor.selection.focus })) {
      console.log('loop', node)
      if (node.type === 'span' && !node.isRemoved) {
        selectedNode = node
      }
    }
    if (selectedNode) {
      console.log('selectedNode', selectedNode)
      dispatch({ type: 'SET_SEEK_TIME', seekTime: selectedNode.startTime })
    }
  }

  const renderLeaf = useCallback(({ attributes, children, leaf }) => {
    if (leaf.removed) {
      return <span style={{ textDecorationLine: 'line-through', color: 'hsl(0, 80%, 63%)' }} {...attributes}>{children}</span>
    }
    if (leaf.startTime.toFixed(2) <= state.playerTime && leaf.endTime.toFixed(2) > state.playerTime) {
      return <span style={{ color: 'hsl(218, 100%, 52%)' }} {...attributes}>{children}</span>
    }
    return <span {...attributes}>{children}</span>
  })

  return (
    <Slate editor={editor} value={value} onChange={(value) => setValue(value)}>
      <Editable
        placeholder="Enter some text"
        autoFocus
        spellCheck
        onPointerDown={e => handleTransportSelect(e)}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        onKeyDown={event => {
          for (const hotkey in HOTKEYS) {
            if (isHotkey(hotkey, event)) {
              event.preventDefault();
              HOTKEYS[hotkey](editor)
            }
          }
        }}
      />
    </Slate>
  )
};


export default EditorWrapper;