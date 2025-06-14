export default {
    async fetch(request, env) {
        if (request.headers.get("Upgrade") !== "websocket") {
            return new Response("Expected websocket", { status: 400 })
        }

        const { 0: client, 1: server } = new WebSocketPair()
        const socket = server
        socket.accept()

        let roomName = null
        if (!env.rooms) env.rooms = new Map()
        const rooms = env.rooms

        socket.addEventListener("message", (event) => {
            const msg = JSON.parse(event.data)
            if (msg.type === "join") {
                roomName = msg.room
                if (!rooms.has(roomName)) rooms.set(roomName, new Set())
                rooms.get(roomName).add(socket)
            } else {
                // Broadcast to others
                const peers = rooms.get(roomName) || new Set()
                for (const peer of peers) {
                    if (peer !== socket) peer.send(event.data)
                }
            }
        })

        socket.addEventListener("close", () => {
            if (roomName) {
                const peers = rooms.get(roomName)
                peers?.delete(socket)
                if (peers?.size === 0) rooms.delete(roomName)
            }
        })

        return new Response(null, {
            status: 101,
            webSocket: client
        })
    }
} 