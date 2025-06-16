import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { Awareness } from 'y-protocols/awareness'

export function createSync() {
    const ydoc = new Y.Doc()
    const awareness = new Awareness(ydoc)
    const ytext = ydoc.getText('codemirror')
    const roomName = 'lanpad'
    const wsUrl = `ws://${window.location.hostname}:4444`
    const syncCallbacks = []
    let isSynced = false

    // Create WebRTC provider
    const provider = new WebrtcProvider(roomName, ydoc, {
        signaling: [wsUrl],
        filterBcConns: false,
        connect: true,
        awareness,
        maxConns: 20,
        resyncInterval: 30000,
        peerOpts: {
            config: {
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
                iceCandidatePoolSize: 10,
                iceTransportPolicy: 'all',
                bundlePolicy: 'max-bundle',
                rtcpMuxPolicy: 'require'
            }
        }
    })

    // Update UI with peer count
    function updatePeerCount(count) {
        const statusEl = document.getElementById('status')
        if (statusEl) {
            const baseText = statusEl.textContent.split(' - ')[0]
            statusEl.textContent = `${baseText} - ${count} peer${count !== 1 ? 's' : ''} connected`
        }
    }

    // Track awareness changes
    awareness.on('change', (changes) => {
        const states = Array.from(awareness.getStates().entries())
        updatePeerCount(states.length)
    })

    // Handle sync events
    provider.on('sync', (synced) => {
        isSynced = synced
        if (synced) {
            const content = ytext.toString()
            for (const cb of syncCallbacks) {
                cb(content)
            }
        }
    })

    // Handle peer events
    provider.on('peer-joined', () => {
        const states = Array.from(awareness.getStates().entries())
        updatePeerCount(states.length)
        isSynced = true
        const content = ytext.toString()
        for (const cb of syncCallbacks) {
            cb(content)
        }
    })

    provider.on('peer-left', () => {
        const states = Array.from(awareness.getStates().entries())
        updatePeerCount(states.length)
    })

    // Handle status changes
    provider.on('status', (status) => {
        if (status.connected) {
            isSynced = true
            const content = ytext.toString()
            for (const cb of syncCallbacks) {
                cb(content)
            }
        }
    })

    return {
        ydoc,
        awareness,
        ytext,
        provider,
        isSynced: () => isSynced,
        onSync: (callback) => {
            if (isSynced) callback(ytext.toString())
            syncCallbacks.push(callback)
        }
    }
}