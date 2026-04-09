# PixelMotion AI

AI-powered pixel sprite motion sheet generator for Windows.

![PixelMotion AI](https://img.shields.io/badge/version-1.0.0-blue)
![Platform](https://img.shields.io/badge/platform-Windows-lightgrey)

## Features

- **Upload a single pixel character image** - Drag & drop PNG support
- **14 motion presets** - Idle, Run, Jump, Attack, Hit, Death, Dash, and more
- **Multiple AI providers**:
  - OpenAI (cloud)
  - ComfyUI (self-hosted)
  - Automatic1111 (self-hosted)
  - Local Diffusers (embedded Python)
- **Pixel-perfect output** - Nearest-neighbor scaling, no blur
- **Export PNG + JSON metadata** - Frame dimensions, layout, pivot info
- **History tracking** - Revisit and export past generations

## Screenshots

![Home Screen](docs/screenshots/home.png)
*Home screen with motion selection and image upload*

## Development (Replit)

```bash
# Install dependencies
npm install

# Run in dev mode
npm run dev
```

**Note for Replit:** Development works in Replit, but Windows .exe build requires a Windows machine.

## Building Windows .exe

1. Clone the repository to a Windows machine:
   ```bash
   git clone <repo-url>
   cd pixol
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the Windows installer:
   ```bash
   npm run dist:win
   ```

4. The installer will be created in the `release/` folder.

## Provider Configuration

### OpenAI (Cloud)

1. Get an API key from [platform.openai.com](https://platform.openai.com)
2. Open PixelMotion AI → Settings → OpenAI
3. Enter your API key
4. Set model name (default: `dall-e-3`)

**Cost:** Each generation uses API credits. Check OpenAI pricing.

### ComfyUI (Self-hosted)

1. Install ComfyUI from [github.com/comfyanonymous/ComfyUI](https://github.com/comfyanonymous/ComfyUI)
2. Start ComfyUI:
   ```bash
   python main.py --listen
   ```
3. In PixelMotion AI → Settings → ComfyUI:
   - Server URL: `http://127.0.0.1:8188` (default)
   - Enable "Use Built-in Workflow" for pixel art generation
   - Or paste your custom workflow JSON
4. Click "Ping Server" to verify connection

**Offline Mode:** When using ComfyUI, images never leave your machine.

### Automatic1111 (Stable Diffusion WebUI)

1. Install from [github.com/AUTOMATIC1111/stable-diffusion-webui](https://github.com/AUTOMATIC1111/stable-diffusion-webui)
2. Start with API enabled:
   ```bash
   python launch.py --api
   ```
3. In PixelMotion AI → Settings → A1111:
   - Base URL: `http://127.0.0.1:7860` (default)
   - Steps: 20-30 (higher = better quality, slower)
   - CFG Scale: 7 (recommended)
   - Denoise Strength: 0.75 (for img2img)
   - Sampler: `Euler a` or `DPM++ 2M Karras`
   - Checkpoint: Select your pixel art model
   - LoRA Names: Optional comma-separated list

**Recommended Models:** Any pixel art Stable Diffusion checkpoint.

### Local Diffusers (Embedded Python)

1. Install Python 3.10+:
   ```bash
   # Windows
   python --version
   ```

2. Install dependencies:
   ```bash
   pip install -r electron/python-service/requirements.txt
   ```

3. In PixelMotion AI → Settings → Local Diffusers:
   - Model Path: Full path to diffusers model folder
   - Device: CUDA (NVIDIA), DirectML (AMD), or CPU
   - LoRA Folder: Optional path to LoRA files

4. The Python service starts automatically when generating.

**Note:** First generation downloads the model (several GB).

## Output Folder

Default: `Documents/PixelMotion/output/`

To change:
1. Settings → Output
2. Click "Browse" and select a folder

## Pixel Enforcement Options

These settings ensure crisp pixel art output:

- **Nearest-Neighbor Scaling Only** - Prevents blur when resizing
- **Quantize Colors** - Reduces palette to 32-48 colors for authentic pixel art look
- **Palette Size** - Number of colors (default: 32)

## Troubleshooting

### Server Unreachable (ComfyUI/A1111)

1. Verify the server is running
2. Check the URL in Settings
3. Ensure no firewall is blocking the port
4. Try `http://127.0.0.1:PORT` instead of `localhost`

### OpenAI Quota Exceeded

- Check your API key has remaining credits
- Review usage at [platform.openai.com/usage](https://platform.openai.com/usage)

### Generation Timeout

- Reduce image dimensions (frame width/height)
- For ComfyUI/A1111: reduce steps
- For Local Diffusers: ensure GPU has enough VRAM

### VRAM Out of Memory (Local Diffusers)

- Use a smaller model
- Switch to CPU mode (slower but works)
- Close other GPU applications

### Images Not Pixel-Perfect

1. Enable "Nearest-Neighbor Scaling Only" in Settings
2. Enable "Quantize Colors"
3. Try a different AI provider

### History Thumbnails Not Loading

This is a known issue with local file paths in some environments. The full images are still saved correctly - use "Open Folder" to access them.

## Security

- **Local providers (ComfyUI, A1111, Local Diffusers)** never send images externally
- **OpenAI provider** uploads images to OpenAI's API (cloud processing)
- Settings are stored locally in electron-store
- No telemetry or analytics

## Project Structure

```
pixol/
├── electron/
│   ├── main.ts              # Electron main process
│   ├── preload.ts           # Secure IPC bridge
│   ├── settings.ts          # Settings persistence
│   ├── history.ts           # History storage
│   ├── postprocess.ts       # Sharp image processing
│   ├── providers/
│   │   ├── types.ts         # AIProvider interface
│   │   ├── factory.ts       # Provider factory
│   │   ├── openai.ts        # OpenAI implementation
│   │   ├── comfyui.ts       # ComfyUI implementation
│   │   ├── a1111.ts         # A1111 implementation
│   │   └── local-diffusers.ts
│   └── python-service/
│       ├── app.py           # FastAPI backend
│       └── requirements.txt
├── src/
│   ├── ui/
│   │   ├── App.tsx          # Main React app
│   │   ├── main.tsx         # Entry point
│   │   ├── index.css        # Styles
│   │   ├── components/      # UI components
│   │   └── hooks/           # React hooks
│   └── shared/
│       ├── types.ts         # TypeScript types
│       ├── motion-presets.ts
│       └── prompt-templates.ts
├── package.json
├── electron.vite.config.ts
├── electron-builder.config.js
└── README.md
```

## Scripts

```bash
npm run dev         # Run in development mode
npm run build       # Build for production
npm run preview     # Preview production build
npm run dist:win    # Build Windows installer
npm run typecheck   # Type check only
```

## License

MIT

## Contributing

Issues and PRs welcome!
