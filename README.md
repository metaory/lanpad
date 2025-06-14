# LanPad

A simple, real-time collaborative text editor that works right in your browser.

## Features

- Real-time collaboration
- No sign-up required
- Works on any device
- Dark mode by default
- Simple room-based sharing

## Quick Start

1. Visit [LanPad](https://metaory.github.io/lanpad/)
2. Create a new room or join an existing one
3. Share the room URL to collaborate

## Tips

- Use unique room names for private collaboration
- Room names are case-sensitive
- Changes sync automatically
- Works best on modern browsers

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Deployment

The project has two parts that need to be deployed:

1. **Frontend (GitHub Pages)**
   - Automatically deployed via GitHub Actions
   - No additional setup needed

2. **Signaling Server (Cloudflare Workers)**
   - Requires Cloudflare account and Wrangler CLI
   - Setup steps:
     ```bash
     # Install Wrangler
     npm install -g wrangler

     # Login to Cloudflare
     wrangler login

     # Deploy signaling server
     npm run deploy:cf
     ```

## License

MIT

## Use Cases

- 📝 Collaborative note-taking
- 👥 Team meetings and discussions
- 🎓 Group study sessions
- 💡 Brainstorming sessions
- 📋 Shared task lists
- 📚 Code reviews
- ✍️ Collaborative writing

## Limitations

- No file upload/download
- No data persistence
- Anyone with the room name can join
- May not work in all network conditions

## Contributing

Feel free to open issues or submit pull requests.




