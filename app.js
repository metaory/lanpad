import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { defaultKeymap } from '@codemirror/commands'
import { javascript } from '@codemirror/lang-javascript'
import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { yCollab } from 'y-codemirror.next'
import { StateEffect } from '@codemirror/state'
import { Awareness } from 'y-protocols/awareness'
import { createSync } from './sync.js'

// Get room name from URL or generate one
const getRoomName = () => {
    const params = new URLSearchParams(window.location.search)
    return params.get('room') || crypto.randomUUID()
}

// Initialize sync
const roomName = getRoomName()
const { ydoc, awareness, ytext, provider, onSync } = createSync(roomName)

// Create undo manager
const undoManager = new Y.UndoManager(ytext)

// Track document changes
ytext.observe(event => {
    console.log('Document changed:', {
        changes: event.changes,
        currentContent: ytext.toString(),
        docLength: ytext.length
    })
})

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

// Handle sync events
onSync((content) => {
    console.log('Syncing content:', content)
    if (content !== view.state.doc.toString()) {
        view.dispatch({
            changes: {
                from: 0,
                to: view.state.doc.length,
                insert: content
            }
        })
    }
})

// Enhanced connection status handling
provider.on('connection-error', (error) => {
    console.error('WebRTC connection error:', error)
    document.getElementById('connection-status').textContent = 'Disconnected'
    document.getElementById('connection-status').style.color = '#e74c3c'
})

provider.on('connection-ok', () => {
    console.log('WebRTC connection established')
    document.getElementById('connection-status').textContent = 'Connected'
    document.getElementById('connection-status').style.color = '#2ecc71'
})

provider.on('peer-joined', (peer) => {
    console.log('Peer joined:', peer)
})

provider.on('peer-left', (peer) => {
    console.log('Peer left:', peer)
})

provider.on('status', (status) => {
    console.log('WebRTC status:', status)
    if (status.connected) {
        document.getElementById('connection-status').textContent = 'Connected'
        document.getElementById('connection-status').style.color = '#2ecc71'
    } else {
        document.getElementById('connection-status').textContent = 'Connecting...'
        document.getElementById('connection-status').style.color = '#f39c12'
    }
})

// Add more detailed connection logging
provider.on('webrtc-connection', (conn) => {
    console.log('WebRTC connection state:', conn.connectionState)
    console.log('WebRTC ice connection state:', conn.iceConnectionState)
    console.log('WebRTC ice gathering state:', conn.iceGatheringState)
    console.log('WebRTC signaling state:', conn.signalingState)
})

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    provider.destroy()
})

// Bind CodeMirror to Yjs with error handling
try {
    const extensions = [
        yCollab(ytext, awareness, { undoManager })
    ]

    view.dispatch({
        effects: StateEffect.reconfigure.of(extensions)
    })
} catch (error) {
    console.error('Failed to initialize CodeMirror collaboration:', error)
}

// Update URL with room name
if (!window.location.search) {
    const newUrl = `${window.location.pathname}?room=${roomName}`
    window.history.replaceState({}, '', newUrl)
}

// Add room info to status with initial connecting state
const statusEl = document.getElementById('status')
statusEl.innerHTML = `Room: ${roomName} | <span id="connection-status" style="color: #f39c12;">Connecting...</span>`

// Log initial connection attempt
console.log('Attempting to connect to room:', roomName) 