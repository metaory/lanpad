import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { Awareness } from 'y-protocols/awareness'

export function createSync(roomName) {
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

    return {
        ydoc,
        awareness,
        ytext,
        provider
    }
} 