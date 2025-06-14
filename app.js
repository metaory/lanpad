import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { defaultKeymap } from '@codemirror/commands'
import { javascript } from '@codemirror/lang-javascript'
import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { yCollab } from 'y-codemirror.next'
import { StateEffect } from '@codemirror/state'

// Get room name from URL or generate one
const getRoomName = () => {
    const params = new URLSearchParams(window.location.search)
    return params.get('room') || crypto.randomUUID()
}

// Create Yjs document
const ydoc = new Y.Doc()
const roomName = getRoomName()

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

// Create Yjs text type
const ytext = ydoc.getText('codemirror')

// Create undo manager
const undoManager = new Y.UndoManager(ytext)

// Setup WebRTC provider
const webrtcProvider = new WebrtcProvider(roomName, ydoc, {
    signaling: [
        'ws://localhost:8787',  // Local development
        'wss://lanpad-hosted-signaling.metaory.workers.dev'  // Production
    ],
    filterBcConns: false
})

// Bind CodeMirror to Yjs
const extensions = [
    yCollab(ytext, webrtcProvider.awareness, { undoManager })
]

view.dispatch({
    effects: StateEffect.reconfigure.of(extensions)
})

// Update URL with room name
if (!window.location.search) {
    const newUrl = `${window.location.pathname}?room=${roomName}`
    window.history.replaceState({}, '', newUrl)
}

// Add room info to status
const statusEl = document.getElementById('status')
statusEl.innerHTML = `Room: ${roomName} | <span id="connection-status">Connecting...</span>`

// Handle connection status
webrtcProvider.on('connection-error', () => {
    document.getElementById('connection-status').textContent = 'Disconnected'
    document.getElementById('connection-status').style.color = '#e74c3c'
})

webrtcProvider.on('connection-ok', () => {
    document.getElementById('connection-status').textContent = 'Connected'
    document.getElementById('connection-status').style.color = '#2ecc71'
}) 