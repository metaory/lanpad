import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { defaultKeymap } from '@codemirror/commands'
import { javascript } from '@codemirror/lang-javascript'
import * as Y from 'yjs'
import { yCollab } from 'y-codemirror.next'
import { createSync } from './sync.js'

// Set initial status
document.getElementById('status').textContent = 'Searching for peers on LAN...'

// Initialize sync
const sync = createSync()
const { ydoc, awareness, ytext, provider } = sync

// Create editor with Yjs integration
const state = EditorState.create({
    doc: ytext.toString(),
    extensions: [
        keymap.of(defaultKeymap),
        javascript(),
        EditorView.theme({
            '&': { height: '100%' },
            '.cm-scroller': { overflow: 'auto' }
        }),
        yCollab(ytext, awareness, { undoManager: new Y.UndoManager(ytext) })
    ]
})

const view = new EditorView({
    state,
    parent: document.getElementById('pad')
})

// Handle sync events
sync.onSync((content) => {
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

// Connection status handling
provider.on('status', (status) => {
    const statusEl = document.getElementById('status')
    statusEl.textContent = status.connected ? 'Connected to LAN' : 'Searching for peers on LAN...'
    statusEl.style.color = status.connected ? '#2ecc71' : '#f39c12'
})

// Cleanup on page unload
window.addEventListener('beforeunload', () => provider.destroy()) 