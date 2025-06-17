import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import { defaultKeymap } from '@codemirror/commands'
import { javascript } from '@codemirror/lang-javascript'
import * as Y from 'yjs'
import { yCollab } from 'y-codemirror.next'
import { createSync } from './sync.js'
import { oneDark } from '@codemirror/theme-one-dark'
import '@fontsource/nabla'
import '@fontsource/bungee'

// Central state
const state = new Proxy(
  {
    connected: false,
    peers: 0,
  },
  {
    set(target, prop, value) {
      target[prop] = value
      renderStatus()
      return true
    },
  },
)

const PeerCount = ({ count }) => `
    <span>${count}</span>
`

const Status = ({ connected, peers }) => `
    ${PeerCount({ count: peers })}
`

// Render function
const renderStatus = () => {
  const statusEl = document.getElementById('status')
  if (!statusEl) return
  statusEl.innerHTML = Status(state)
}

// Initialize sync
const sync = createSync()
const { ydoc, awareness, ytext, provider } = sync

// Create editor with Yjs integration
const editorState = EditorState.create({
  doc: ytext.toString(),
  extensions: [
    keymap.of(defaultKeymap),
    javascript(),
    oneDark,
    lineNumbers(),
    EditorView.theme({
      '&': {
        height: '100%',
        backgroundColor: '#220033',
      },
      '.cm-scroller': {
        overflow: 'auto',
      },
      '.cm-content': {
        padding: '1em 0',
      },
      '.cm-gutter': {
        padding: '0 6px 0 0',
      },
      '.cm-line': {
        padding: '0 8px',
      },
    }),
    yCollab(ytext, awareness, { undoManager: new Y.UndoManager(ytext) }),
  ],
})

const view = new EditorView({
  state: editorState,
  parent: document.getElementById('pad'),
})

// Handle sync events
sync.onSync((content) => {
  if (content !== view.state.doc.toString()) {
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: content,
      },
    })
  }
})

// Connection status handling
provider.on('status', ({ connected }) => {
  state.connected = connected
})

// Update peer count
awareness.on('change', () => {
  state.peers = Array.from(awareness.getStates().entries()).length
})

// Cleanup on page unload
window.addEventListener('beforeunload', () => provider.destroy())
