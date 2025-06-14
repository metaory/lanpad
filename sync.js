import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { Awareness } from 'y-protocols/awareness'

export function createSync(roomName) {
    // Create the shared document
    const ydoc = new Y.Doc()
    const awareness = new Awareness(ydoc)
    const ytext = ydoc.getText('codemirror')

    // Create WebRTC provider
    const provider = new WebrtcProvider(roomName, ydoc, {
        signaling: [
            import.meta.env.DEV ? 'ws://localhost:8787' : 'wss://lanpad-hosted-signaling.metaory.workers.dev'
        ],
        filterBcConns: false,
        connect: true,
        awareness,
        maxConns: 20,
        resyncInterval: 30000,
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

    // Track sync state
    const syncCallbacks = []
    let isSynced = false

    // Handle sync events
    provider.on('sync', (synced) => {
        isSynced = synced
        if (synced) {
            console.log('Document synced:', {
                content: ytext.toString(),
                length: ytext.length
            })
            // Notify all sync callbacks
            for (const cb of syncCallbacks) {
                cb(ytext.toString())
            }
        }
    })

    // Handle document updates
    ytext.observe(event => {
        if (isSynced) {
            console.log('Document updated:', {
                changes: event.changes,
                content: ytext.toString(),
                length: ytext.length
            })
        }
    })

    return {
        ydoc,
        awareness,
        ytext,
        provider,
        isSynced: () => isSynced,
        onSync: (callback) => {
            if (isSynced) {
                callback(ytext.toString())
            }
            syncCallbacks.push(callback)
        }
    }
} 