import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { defaultKeymap } from '@codemirror/commands'
import { javascript } from '@codemirror/lang-javascript'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { yCollab } from 'y-codemirror.next'
import { StateEffect } from '@codemirror/state'

// Create Yjs document
const ydoc = new Y.Doc()

// Create CodeMirror editor
const state = EditorState.create({
    doc: '',
    extensions: [
        keymap.of(defaultKeymap),
        javascript(),
        EditorView.theme({
            '&': { height: '100%' },
            '.cm-scroller': { overflow: 'auto' }
        })
    ]
})

const view = new EditorView({
    state,
    parent: document.getElementById('pad')
})

// Connect to WebSocket server
const provider = new WebsocketProvider(
    `ws://${window.location.hostname}:8080`,
    'livepad',
    ydoc
)

// Create Yjs text type
const ytext = ydoc.getText('codemirror')

// Create undo manager
const undoManager = new Y.UndoManager(ytext)

// Bind CodeMirror to Yjs
const extensions = [
    yCollab(ytext, provider.awareness, { undoManager })
]

view.dispatch({
    effects: StateEffect.reconfigure.of(extensions)
})

// Handle connection status
provider.on('status', ({ status }) => {
    const statusEl = document.getElementById('status')
    statusEl.textContent = status
    statusEl.style.color = status === 'connected' ? '#2ecc71' : '#e74c3c'
}) 