# VidFlow - AI Video Generation Platform

A futuristic, node-based AI content generation platform for creating videos, images, and text using cutting-edge AI models.

## Features

- **Node-Based Workflow Editor**: Drag and drop nodes to create complex AI generation pipelines
- **Video Generation**: Generate videos using Seedance 2.0 and Seedance Mini models
- **Image Generation**: Create images with Seedream-5.0-Lite and Image2 models
- **Text Generation**: AI-powered text generation
- **Visual Node Editor**: Connect nodes visually with an intuitive interface
- **Auto-Save**: Projects are automatically saved to local storage
- **Reference Assets**: Connect nodes to use generated content as reference material
- **Modal Editor**: Full-screen editing for video and image nodes
- **Futuristic UI**: Cyberpunk-themed dark mode interface with neon accents

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Python (server.py) - API proxy for CORS handling
- **Deployment**: Static site (Vercel-ready)

## Quick Start

### Local Development

1. Clone the repo:
   ```bash
   git clone https://github.com/YOUR_USERNAME/vidflow.git
   cd vidflow
   ```

2. Open `index.html` directly in a browser (for local testing)

3. For API proxy (optional, needed for AI generation):
   ```bash
   python server.py
   ```
   The proxy runs on http://localhost:8765

### Deploy to Vercel (Recommended)

1. Push this repo to GitHub
2. Visit [vercel.com](https://vercel.com) and sign in with GitHub
3. Click **Add New > Project**
4. Import your vidflow repository
5. Vercel will auto-detect the static site configuration
6. Click **Deploy**
7. Your site will be live at `your-project.vercel.app`

### Using the .env File

Create a `.env` file in the project root:
```env
# API Configuration (for local proxy)
API_KEY=your_api_key_here
```

## Project Structure

```
├── index.html          # Main application
├── privacy.html        # Privacy Policy page
├── terms.html          # Terms of Service page
├── vercel.json         # Vercel deployment config
├── server.py           # Python API proxy server
├── server.js           # Node.js alternative server
├── css/
│   └── style.css       # Cyberpunk dark theme
├── js/                 # JavaScript modules
├── assets/             # Static assets
└── package.json        # Node.js dependencies
```

## License

MIT License - feel free to use and modify for your own projects.
