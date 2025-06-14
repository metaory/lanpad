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

// Create awareness
const awareness = new Y.Awareness(ydoc)

// Add error handlers for Yjs
ydoc.on('error', (error) => {
    console.error('Yjs document error:', error)
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

// Create Yjs text type
const ytext = ydoc.getText('codemirror')

// Create undo manager
const undoManager = new Y.UndoManager(ytext)

// Setup WebRTC provider with error handling
let webrtcProvider
try {
    webrtcProvider = new WebrtcProvider(roomName, ydoc, {
        signaling: [
            import.meta.env.DEV ? 'ws://localhost:8787' : 'wss://lanpad-hosted-signaling.metaory.workers.dev'
        ],
        filterBcConns: false,
        connect: true,
        awareness,
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' }
            ]
        }
    })

    // Enhanced connection status handling
    webrtcProvider.on('connection-error', (error) => {
        console.error('WebRTC connection error:', error)
        document.getElementById('connection-status').textContent = 'Disconnected'
        document.getElementById('connection-status').style.color = '#e74c3c'
    })

    webrtcProvider.on('connection-ok', () => {
        console.log('WebRTC connection established')
        document.getElementById('connection-status').textContent = 'Connected'
        document.getElementById('connection-status').style.color = '#2ecc71'
    })

    webrtcProvider.on('peer-joined', (peer) => {
        console.log('Peer joined:', peer)
    })

    webrtcProvider.on('peer-left', (peer) => {
        console.log('Peer left:', peer)
    })

    webrtcProvider.on('sync', (isSynced) => {
        console.log('Sync status:', isSynced)
    })

    webrtcProvider.on('status', (status) => {
        console.log('WebRTC status:', status)
    })

} catch (error) {
    console.error('Failed to initialize WebRTC provider:', error)
    document.getElementById('connection-status').textContent = 'Failed to initialize'
    document.getElementById('connection-status').style.color = '#e74c3c'
}

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

// Add room info to status
const statusEl = document.getElementById('status')
statusEl.innerHTML = `Room: ${roomName} | <span id="connection-status">Connecting...</span>`

// Log initial connection attempt
console.log('Attempting to connect to room:', roomName) 