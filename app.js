import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { defaultKeymap } from '@codemirror/commands'
import { javascript } from '@codemirror/lang-javascript'
import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { yCollab } from 'y-codemirror.next'
import { StateEffect } from '@codemirror/state'
import { Awareness } from 'y-protocols/awareness'

// Get room name from URL or generate one
const getRoomName = () => {
    const params = new URLSearchParams(window.location.search)
    return params.get('room') || crypto.randomUUID()
}

// Create Yjs document
const ydoc = new Y.Doc()
const roomName = getRoomName()

// Create awareness
const awareness = new Awareness(ydoc)

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
        maxConns: 20,
        resyncInterval: 30000, // Resync every 30 seconds instead of default
        peerOpts: {
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' },
                    { urls: 'stun:stun3.l.google.com:19302' },
                    { urls: 'stun:stun4.l.google.com:19302' }
                ],
                iceCandidatePoolSize: 10,
                iceTransportPolicy: 'all',
                bundlePolicy: 'max-bundle',
                rtcpMuxPolicy: 'require'
            }
        }
    })

    // Track active connections
    const activeConnections = new Set()

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
        activeConnections.add(peer)
        console.log('Active connections:', activeConnections.size)
    })

    webrtcProvider.on('peer-left', (peer) => {
        console.log('Peer left:', peer)
        activeConnections.delete(peer)
        console.log('Active connections:', activeConnections.size)
    })

    webrtcProvider.on('sync', (isSynced) => {
        console.log('Sync status:', isSynced)
    })

    webrtcProvider.on('status', (status) => {
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
    webrtcProvider.on('webrtc-connection', (conn) => {
        console.log('WebRTC connection state:', conn.connectionState)
        console.log('WebRTC ice connection state:', conn.iceConnectionState)
        console.log('WebRTC ice gathering state:', conn.iceGatheringState)
        console.log('WebRTC signaling state:', conn.signalingState)
    })

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        webrtcProvider.destroy()
    })

    // Force connection attempt only if not already connected
    setTimeout(() => {
        if (!webrtcProvider.connected) {
            console.log('Forcing connection attempt...')
            webrtcProvider.connect()
        }
    }, 1000)

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

// Add room info to status with initial connecting state
const statusEl = document.getElementById('status')
statusEl.innerHTML = `Room: ${roomName} | <span id="connection-status" style="color: #f39c12;">Connecting...</span>`

// Log initial connection attempt
console.log('Attempting to connect to room:', roomName) 