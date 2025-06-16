import { WebSocketServer } from 'ws'

const createServer = () => new WebSocketServer({ port: 4444, host: '0.0.0.0' })
const wss = createServer()
const rooms = new Map()

// Pure logging functions
const logClient = (client) => `  - Client: ${client._socket.remoteAddress}`
const logRoom = (room, clients) => `Room ${room}: ${clients.size} clients`
const logMessage = (clientIp, msg) => `\nMessage from ${clientIp}: ${JSON.stringify(msg)}`
const logError = (clientIp, err) => `\nWebSocket error from ${clientIp}: ${err}`

// Room state management
const getOrCreateRoom = (roomName) => {
    if (!rooms.has(roomName)) {
        rooms.set(roomName, new Set())
    }
    return rooms.get(roomName)
}

const removeClientFromRoom = (ws, roomName) => {
    const peers = rooms.get(roomName)
    if (!peers) return false

    peers.delete(ws)
    console.log(`Room ${roomName} now has ${peers.size} clients`)
    
    if (peers.size === 0) {
        rooms.delete(roomName)
        console.log(`Room ${roomName} deleted (empty)`)
        return true
    }
    return false
}

// Message handlers
const handleSubscribe = (ws, clientIp, roomName) => {
    const room = getOrCreateRoom(roomName)
    room.add(ws)
    
    console.log(`Client ${clientIp} joined room: ${roomName}`)
    console.log(`Room ${roomName} now has ${room.size} clients`)
    console.log('Current clients in room:')
    for (const client of room) {
        console.log(logClient(client))
    }
    return roomName
}

const handlePublish = (ws, clientIp, roomName, msg) => {
    if (!roomName) return
    const peers = rooms.get(roomName)
    if (!peers) return

    let sentCount = 0
    for (const peer of peers) {
        if (peer !== ws && peer.readyState === WebSocket.OPEN) {
            peer.send(JSON.stringify(msg))
            sentCount++
        }
    }
    console.log(`Broadcasted message from ${clientIp} to ${sentCount} peers in room ${roomName}`)
}

const handleUnsubscribe = (ws, clientIp, roomName) => {
    if (!roomName) return
    console.log(`Client ${clientIp} unsubscribed from room ${roomName}`)
    removeClientFromRoom(ws, roomName)
}

// Connection handlers
const handleMessage = (ws, clientIp, data, currentRoomName) => {
    try {
        const msg = JSON.parse(data)
        console.log(logMessage(clientIp, msg))

        const messageHandlers = {
            subscribe: () => handleSubscribe(ws, clientIp, msg.topics[0]),
            publish: () => handlePublish(ws, clientIp, currentRoomName, msg),
            unsubscribe: () => handleUnsubscribe(ws, clientIp, currentRoomName)
        }

        return messageHandlers[msg.type]?.()
    } catch (err) {
        console.error(`Error processing message from ${clientIp}:`, err)
    }
}

const handleClose = (ws, clientIp, roomName) => {
    console.log(`\nConnection closed from ${clientIp}`)
    if (!roomName) return
    console.log(`Client ${clientIp} left room ${roomName}`)
    removeClientFromRoom(ws, roomName)
}

// Room state logging
const logRoomState = () => {
    console.log('\nCurrent Room State:')
    for (const [room, clients] of rooms.entries()) {
        console.log(logRoom(room, clients))
        for (const client of clients) {
            console.log(logClient(client))
        }
    }
    console.log('')
}

// Server setup
console.log('WebSocket server running on ws://0.0.0.0:4444')
setInterval(logRoomState, 5000)

// Connection handling
wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress
    console.log(`\nNew connection from ${clientIp}`)
    let roomName = null

    ws.on('message', (data) => {
        const newRoomName = handleMessage(ws, clientIp, data, roomName)
        if (newRoomName) roomName = newRoomName
    })

    ws.on('close', () => handleClose(ws, clientIp, roomName))
    ws.on('error', (err) => console.error(logError(clientIp, err)))
}) 