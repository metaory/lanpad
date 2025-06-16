# LanPad

Simple real-time collaborative text editor over local network

## Features

- Real-time collaboration over LAN
- No internet required
- No sign-up needed
- Works on any device
- Simple room-based sharing

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/metaory/lanpad.git
   cd lanpad
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit:
   ```
   http://localhost:4444
   ```

5. Share your local IP address with others on the same network:
   ```
   http://YOUR_LOCAL_IP:4444
   ```

## Use Cases

- 📝 Collaborative note-taking in meetings
- 👥 Team discussions in the office
- 🎓 Group study sessions
- 💡 Brainstorming sessions
- 📋 Shared task lists
- 📚 Code reviews
- ✍️ Collaborative writing

## Limitations

- Requires all users to be on the same local network
- No file upload/download
- No data persistence
- Anyone with the room name can join
- May not work across different network segments 

## License
[MIT](LICENSE)