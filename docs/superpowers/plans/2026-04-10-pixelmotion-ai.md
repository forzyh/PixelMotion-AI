# PixelMotion AI Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Windows-only Electron desktop app that generates pixel sprite motion sheets from a single uploaded pixel character image using multiple AI providers (OpenAI, ComfyUI, A1111, Local Diffusers).

**Architecture:** Electron main process handles file I/O, AI provider orchestration, and Python service management. React + TypeScript renderer provides UI for motion selection, image upload, prompt editing, and output preview. Providers implement a common AIProvider interface for swappable backends. Sharp handles post-processing (nearest-neighbor scaling, color quantization).

**Tech Stack:** Electron, React 18, TypeScript, Node.js, sharp, electron-builder, OpenAI API, ComfyUI HTTP API, Automatic1111 API, FastAPI (optional local diffusers)

---

## File Structure

### Create (all files):
```
/electron/main.ts                    - Electron main process, IPC handlers
/electron/preload.ts                 - Preload script for secure IPC
/electron/providers/types.ts         - AIProvider interface and shared types
/electron/providers/openai.ts        - OpenAI cloud provider implementation
/electron/providers/comfyui.ts       - ComfyUI HTTP API provider
/electron/providers/a1111.ts         - Automatic1111 WebUI API provider
/electron/providers/local-diffusers.ts - Local Python diffusers service
/electron/postprocess.ts             - Sharp-based post-processing pipeline
/electron/settings.ts                - Settings persistence (electron-store)
/electron/history.ts                 - History storage and retrieval

/src/ui/App.tsx                      - Main app component with routing
/src/ui/components/MotionList.tsx    - Left panel: motion presets with checkboxes
/src/ui/components/ImageUploader.tsx - Drag-drop image upload + preview
/src/ui/components/PromptEditor.tsx  - Base style + motion prompt + frame inputs
/src/ui/components/ProviderSelector.tsx - Provider dropdown + status indicator
/src/ui/components/OutputPanel.tsx   - Generated sprite preview + export buttons
/src/ui/components/SettingsView.tsx  - Settings screen with provider tabs
/src/ui/components/HistoryView.tsx   - History screen with thumbnails
/src/ui/hooks/useSettings.ts         - Settings React hook
/src/ui/hooks/useHistory.ts          - History React hook
/src/ui/hooks/useProvider.ts         - Provider state management

/src/shared/types.ts                 - Shared TypeScript types/interfaces
/src/shared/motion-presets.ts        - 14 motion presets with prompts
/src/shared/prompt-templates.ts      - Prompt building utilities

/src/services/api-client.ts          - HTTP client for AI providers

/assets/icons/                       - App icons (placeholder)

package.json                         - Dependencies + scripts
tsconfig.json                        - TypeScript config
electron.vite.config.ts              - Electron-vite bundler config
tailwind.config.js                   - Tailwind CSS config (optional styling)
postcss.config.js                    - PostCSS config
README.md                            - Setup, provider configs, troubleshooting
```

---

## Chunk 1: Project Scaffold and Core Infrastructure

### Task 1: Initialize Project Structure

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `electron.vite.config.ts`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `.gitignore`

- [ ] **Step 1: Create package.json with all dependencies and scripts**

```json
{
  "name": "pixelmotion-ai",
  "version": "1.0.0",
  "description": "AI-powered pixel sprite motion sheet generator",
  "main": "dist-electron/main.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "dist:win": "electron-builder --win --config electron-builder.config.js",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "sharp": "^0.33.2",
    "electron-store": "^8.1.0",
    "openai": "^4.28.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",
    "@types/node": "^20.11.16",
    "@vitejs/plugin-react": "^4.2.1",
    "electron": "^29.0.0",
    "electron-builder": "^24.9.1",
    "electron-vite": "^2.0.0",
    "typescript": "^5.3.3",
    "vite": "^5.1.0",
    "tailwindcss": "^3.4.1",
    "postcss": "^8.4.35",
    "autoprefixer": "^10.4.17"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: Create tsconfig.node.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["electron", "electron.vite.config.ts"]
}
```

- [ ] **Step 4: Create electron.vite.config.ts**

```ts
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    build: {
      outDir: 'dist-electron',
      lib: {
        entry: 'electron/main.ts',
        formats: ['cjs']
      }
    }
  },
  preload: {
    build: {
      outDir: 'dist-electron',
      lib: {
        entry: 'electron/preload.ts',
        formats: ['cjs']
      }
    }
  },
  renderer: {
    plugins: [react()],
    build: {
      outDir: 'dist/renderer'
    }
  }
})
```

- [ ] **Step 5: Create tailwind.config.js**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {}
  },
  plugins: []
}
```

- [ ] **Step 6: Create postcss.config.js**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

- [ ] **Step 7: Create .gitignore**

```
node_modules
dist-electron
dist
.env
.env.local
*.log
.DS_Store
output/
history/
settings.json
```

- [ ] **Step 8: Install dependencies and verify**

```bash
npm install
npm run typecheck
```

Expected: TypeScript compiles without errors (no source files yet)

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "feat: scaffold project with electron-vite, React, TypeScript"
```

---

### Task 2: Create Shared Types and Interfaces

**Files:**
- Create: `src/shared/types.ts`
- Create: `electron/providers/types.ts`

- [ ] **Step 1: Create shared types for UI and IPC**

```typescript
// src/shared/types.ts

// Motion preset definition
export interface MotionPreset {
  id: string;
  name: string;
  description: string;
  defaultFrames: number;
  motionPrompt: string;
}

// AI Provider metadata
export interface ProviderInfo {
  id: ProviderId;
  displayName: string;
  isConfigured: boolean;
  isLocal: boolean;
}

export type ProviderId = 'openai' | 'comfyui' | 'a1111' | 'local-diffusers';

// Generation request from UI to main process
export interface GenerateRequest {
  providerId: ProviderId;
  inputImagePath: string;
  motionPreset: MotionPreset;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  basePrompt: string;
  motionPrompt: string;
  extraInstructions: string;
}

// Generation result
export interface GenerateResult {
  success: boolean;
  outputPath?: string;
  jsonPath?: string;
  error?: string;
  metadata?: SpriteSheetMetadata;
}

// Sprite sheet metadata
export interface SpriteSheetMetadata {
  frameWidth: number;
  frameHeight: number;
  frames: number;
  layout: 'row' | 'column' | 'grid';
  suggestedPivot: { x: number; y: number };
  providerId: ProviderId;
  prompt: string;
  generatedAt: string;
}

// Settings structure
export interface AppSettings {
  openai: {
    apiKey: string;
    modelName: string;
  };
  comfyui: {
    serverUrl: string;
    workflowJson: string;
    useBuiltInWorkflow: boolean;
  };
  a1111: {
    baseUrl: string;
    steps: number;
    cfg: number;
    denoise: number;
    sampler: string;
    checkpointName: string;
    loraNames: string;
  };
  localDiffusers: {
    modelPath: string;
    device: 'cuda' | 'directml' | 'cpu';
    loraFolderPath: string;
  };
  output: {
    folderPath: string;
  };
  pixelEnforcement: {
    nearestNeighborOnly: boolean;
    quantizeColors: boolean;
    paletteSize: number;
  };
  selectedProviderId: ProviderId;
}

// History entry
export interface HistoryEntry {
  id: string;
  thumbnailPath: string;
  outputPath: string;
  jsonPath: string;
  providerId: ProviderId;
  motionPresetId: string;
  prompt: string;
  metadata: SpriteSheetMetadata;
  createdAt: string;
}

// IPC Channel types
export type IPCChannels =
  | 'get-settings'
  | 'save-settings'
  | 'get-providers'
  | 'generate'
  | 'cancel-generation'
  | 'ping-provider'
  | 'get-history'
  | 'delete-history-entry'
  | 'select-output-folder'
  | 'get-default-output-folder';
```

- [ ] **Step 2: Create AIProvider interface**

```typescript
// electron/providers/types.ts

import { ProviderId } from '../src/shared/types';

export interface GeneratedImageResult {
  imagePath: string;
  width: number;
  height: number;
}

export interface AIProvider {
  readonly id: ProviderId;
  readonly displayName: string;
  readonly isLocal: boolean;

  isConfigured(): boolean;

  generateSpriteSheet(
    inputImagePath: string,
    prompt: string,
    options: SpriteGenerationOptions
  ): Promise<GeneratedImageResult>;

  ping?(): Promise<{ success: boolean; error?: string }>;
}

export interface SpriteGenerationOptions {
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  negativePrompt?: string;
  extraInstructions?: string;
}

export interface ProviderConstructor {
  new (settings: any): AIProvider;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/shared/types.ts electron/providers/types.ts
git commit -m "feat: define TypeScript types and AIProvider interface"
```

---

### Task 3: Create Motion Presets and Prompt Templates

**Files:**
- Create: `src/shared/motion-presets.ts`
- Create: `src/shared/prompt-templates.ts`

- [ ] **Step 1: Create 14 motion presets**

```typescript
// src/shared/motion-presets.ts

import { MotionPreset } from './types';

export const MOTION_PRESETS: MotionPreset[] = [
  {
    id: 'idle',
    name: 'Idle',
    description: 'Breathing loop with subtle secondary motion',
    defaultFrames: 8,
    motionPrompt: 'subtle breathing animation, slight cloak or scarf secondary motion, idle stance, minimal movement'
  },
  {
    id: 'run',
    name: 'Run',
    description: 'Cyclical running movement',
    defaultFrames: 8,
    motionPrompt: 'running cycle, readable leg separation, consistent silhouette, arms pumping, full stride'
  },
  {
    id: 'jump-up',
    name: 'Jump Up',
    description: 'Takeoff to ascent phase',
    defaultFrames: 8,
    motionPrompt: 'jump takeoff, anticipation squat, launch upward, clear arc, arms reaching up'
  },
  {
    id: 'jump-fall',
    name: 'Jump Fall',
    description: 'Descent from apex',
    defaultFrames: 8,
    motionPrompt: 'falling descent, arms flailing slightly, body rotating forward, preparing for landing'
  },
  {
    id: 'land',
    name: 'Land',
    description: 'Landing impact and recovery',
    defaultFrames: 8,
    motionPrompt: 'landing impact, crouch deep, recover to stand, dust particles, weight settling'
  },
  {
    id: 'attack-1',
    name: 'Attack 1',
    description: 'Primary attack animation',
    defaultFrames: 8,
    motionPrompt: 'main attack wind-up, strike extension, follow-through, weapon or fist motion'
  },
  {
    id: 'hit',
    name: 'Hit',
    description: 'Damage reaction',
    defaultFrames: 8,
    motionPrompt: 'hit reaction, recoil backward, stagger, recover balance, pain expression'
  },
  {
    id: 'death',
    name: 'Death',
    description: 'Collapse animation',
    defaultFrames: 8,
    motionPrompt: 'death collapse, fall to ground, final pose, still at end'
  },
  {
    id: 'attack-2',
    name: 'Attack 2',
    description: 'Combo follow-up attack',
    defaultFrames: 8,
    motionPrompt: 'combo follow-up attack, quicker wind-up, horizontal strike, chain from attack 1'
  },
  {
    id: 'attack-3',
    name: 'Attack 3',
    description: 'Combo finisher',
    defaultFrames: 8,
    motionPrompt: 'combo finisher, powerful overhead strike, slam down, final pose hold'
  },
  {
    id: 'dash',
    name: 'Dash',
    description: 'Quick burst movement',
    defaultFrames: 8,
    motionPrompt: 'dash burst, speed lines, low profile pose, quick settle, forward momentum'
  },
  {
    id: 'slide',
    name: 'Slide/Skid',
    description: 'Stopping motion',
    defaultFrames: 8,
    motionPrompt: 'skid stop, feet sliding, dust cloud, settle to stand, momentum bleed'
  },
  {
    id: 'crouch',
    name: 'Crouch',
    description: 'Ducking animation',
    defaultFrames: 8,
    motionPrompt: 'crouch down, lower silhouette, alert stance, ready position'
  },
  {
    id: 'climb',
    name: 'Climb/Ledge Grab',
    description: 'Ledge climbing action',
    defaultFrames: 8,
    motionPrompt: 'ledge grab hang, pull up, swing leg over, stand on ledge'
  }
];

export function getMotionPresetById(id: string): MotionPreset | undefined {
  return MOTION_PRESETS.find(p => p.id === id);
}
```

- [ ] **Step 2: Create prompt templates**

```typescript
// src/shared/prompt-templates.ts

import { MotionPreset } from './types';

const PIXEL_CONSTRAINTS = [
  '2D pixel art sprite sheet',
  'side view, facing right',
  'crisp pixels, no blur, no anti-aliasing',
  'consistent character proportions across all frames',
  'plain transparent background',
  'retro game art style, 16-bit aesthetic'
];

const LAYOUT_INSTRUCTION = 'Arrange frames in a single horizontal row';

export interface PromptOptions {
  motionPreset: MotionPreset;
  frameCount: number;
  extraInstructions?: string;
  characterDescription?: string;
}

export function buildBasePrompt(): string {
  return PIXEL_CONSTRAINTS.join(', ');
}

export function buildFullPrompt(options: PromptOptions): string {
  const parts = [
    buildBasePrompt(),
    LAYOUT_INSTRUCTION + ` of ${options.frameCount} frames`,
    options.motionPreset.motionPrompt
  ];

  if (options.characterDescription) {
    parts.push(options.characterDescription);
  }

  if (options.extraInstructions) {
    parts.push(options.extraInstructions);
  }

  return parts.join(', ');
}

export function buildNegativePrompt(): string {
  return [
    'blurry, smooth, gradient, anti-aliased, painterly',
    '3D render, photorealistic, shading',
    'multiple characters, cluttered background',
    'text, watermark, signature',
    'distorted proportions, extra limbs',
    'vertical layout, grid layout'
  ].join(', ');
}
```

- [ ] **Step 3: Commit**

```bash
git add src/shared/motion-presets.ts src/shared/prompt-templates.ts
git commit -m "feat: add 14 motion presets and prompt templates"
```

---

## Chunk 2: AI Provider Implementations

### Task 4: Implement OpenAI Provider

**Files:**
- Create: `electron/providers/openai.ts`

- [ ] **Step 1: Create OpenAI provider implementation**

```typescript
// electron/providers/openai.ts

import { AIProvider, GeneratedImageResult, SpriteGenerationOptions } from './types';
import { buildFullPrompt, buildNegativePrompt } from '../src/shared/prompt-templates';

interface OpenAISettings {
  apiKey: string;
  modelName: string;
}

export class OpenAIProvider implements AIProvider {
  readonly id = 'openai' as const;
  readonly displayName = 'OpenAI (Cloud)';
  readonly isLocal = false;

  constructor(private settings: OpenAISettings) {}

  isConfigured(): boolean {
    return !!this.settings.apiKey && !!this.settings.modelName;
  }

  async generateSpriteSheet(
    inputImagePath: string,
    prompt: string,
    options: SpriteGenerationOptions
  ): Promise<GeneratedImageResult> {
    // TODO: Implement OpenAI API call
    // - Read input image and encode as base64
    // - Call OpenAI image generation API with image input
    // - Download result to temp path
    // - Return path and dimensions

    throw new Error('OpenAI provider not yet implemented');
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add electron/providers/openai.ts
git commit -m "feat: scaffold OpenAI provider (stub implementation)"
```

---

### Task 5: Implement ComfyUI Provider

**Files:**
- Create: `electron/providers/comfyui.ts`

- [ ] **Step 1: Create ComfyUI provider with ping and generation**

```typescript
// electron/providers/comfyui.ts

import { AIProvider, GeneratedImageResult, SpriteGenerationOptions } from './types';
import * as fs from 'fs';
import * as path from 'path';

interface ComfyUISettings {
  serverUrl: string;
  workflowJson: string;
  useBuiltInWorkflow: boolean;
}

export class ComfyUIProvider implements AIProvider {
  readonly id = 'comfyui' as const;
  readonly displayName = 'ComfyUI (Self-hosted)';
  readonly isLocal = true;

  constructor(private settings: ComfyUISettings) {}

  isConfigured(): boolean {
    return !!this.settings.serverUrl;
  }

  async ping(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.settings.serverUrl}/system_stats`);
      if (!response.ok) {
        return { success: false, error: `Server returned ${response.status}` };
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Cannot reach ComfyUI at ${this.settings.serverUrl}: ${error}`
      };
    }
  }

  async generateSpriteSheet(
    inputImagePath: string,
    prompt: string,
    options: SpriteGenerationOptions
  ): Promise<GeneratedImageResult> {
    // TODO: Implement ComfyUI workflow
    // 1. Load and parse workflow JSON
    // 2. Insert prompt and input image into workflow nodes
    // 3. POST workflow to /prompt endpoint
    // 4. Poll /history for completion
    // 5. Download result image
    // 6. Return path and dimensions

    throw new Error('ComfyUI provider not yet implemented');
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add electron/providers/comfyui.ts
git commit -m "feat: scaffold ComfyUI provider with ping (stub generation)"
```

---

### Task 6: Implement A1111 Provider

**Files:**
- Create: `electron/providers/a1111.ts`

- [ ] **Step 1: Create Automatic1111 provider**

```typescript
// electron/providers/a1111.ts

import { AIProvider, GeneratedImageResult, SpriteGenerationOptions } from './types';

interface A1111Settings {
  baseUrl: string;
  steps: number;
  cfg: number;
  denoise: number;
  sampler: string;
  checkpointName: string;
  loraNames: string;
}

export class A1111Provider implements AIProvider {
  readonly id = 'a1111' as const;
  readonly displayName = 'Automatic1111 (Self-hosted)';
  readonly isLocal = true;

  constructor(private settings: A1111Settings) {}

  isConfigured(): boolean {
    return !!this.settings.baseUrl;
  }

  async ping(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.settings.baseUrl}/sdapi/v1/sd-models`);
      if (!response.ok) {
        return { success: false, error: `Server returned ${response.status}` };
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Cannot reach A1111 at ${this.settings.baseUrl}: ${error}`
      };
    }
  }

  async generateSpriteSheet(
    inputImagePath: string,
    prompt: string,
    options: SpriteGenerationOptions
  ): Promise<GeneratedImageResult> {
    // TODO: Implement A1111 img2img
    // 1. Read and base64 encode input image
    // 2. POST to /sdapi/v1/img2img with:
    //    - init_images, prompt, negative_prompt
    //    - steps, cfg_scale, denoising_strength, sampler_name
    // 3. Parse response images
    // 4. Save first result to temp path
    // 5. Return path and dimensions

    throw new Error('A1111 provider not yet implemented');
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add electron/providers/a1111.ts
git commit -m "feat: scaffold A1111 provider with ping (stub generation)"
```

---

### Task 7: Implement Local Diffusers Provider (Optional)

**Files:**
- Create: `electron/providers/local-diffusers.ts`
- Create: `python-service/app.py` (FastAPI backend)
- Create: `python-service/requirements.txt`

- [ ] **Step 1: Create Python FastAPI service stub**

```python
# python-service/app.py

from fastapi import FastAPI, UploadFile, Form, File
from PIL import Image
import io
import torch
from diffusers import StableDiffusionImg2ImgPipeline

app = FastAPI()

pipeline = None

@app.post("/startup")
async def startup(model_path: str, device: str = "cuda"):
    global pipeline
    # Load model from path
    # Return success or error

@app.post("/generate")
async def generate(
    image: UploadFile = File(...),
    prompt: str = Form(...),
    negative_prompt: str = Form(""),
    num_frames: int = Form(8),
    steps: int = Form(20),
    cfg: float = Form(7.0)
):
    # Run img2img generation
    # Return generated image
    pass

@app.get("/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 2: Create requirements.txt**

```
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6
diffusers==0.25.0
transformers==4.37.0
torch==2.2.0
pillow==10.2.0
accelerate==0.26.0
```

- [ ] **Step 3: Create LocalDiffusers provider wrapper**

```typescript
// electron/providers/local-diffusers.ts

import { AIProvider, GeneratedImageResult, SpriteGenerationOptions } from './types';
import { spawn, ChildProcess } from 'child_process';

interface LocalDiffusersSettings {
  modelPath: string;
  device: 'cuda' | 'directml' | 'cpu';
  loraFolderPath: string;
}

export class LocalDiffusersProvider implements AIProvider {
  readonly id = 'local-diffusers' as const;
  readonly displayName = 'Local Diffusers (Embedded)';
  readonly isLocal = true;

  private pythonProcess: ChildProcess | null = null;
  private baseUrl = 'http://127.0.0.1:8765';

  constructor(private settings: LocalDiffusersSettings) {}

  isConfigured(): boolean {
    return !!this.settings.modelPath && fs.existsSync(this.settings.modelPath);
  }

  async start(): Promise<{ success: boolean; error?: string }> {
    // TODO: Spawn Python FastAPI process
    // - Check Python is installed
    // - Spawn: python python-service/app.py --port 8765
    // - Wait for health endpoint
    // - Return success or error
    return { success: true };
  }

  async stop(): Promise<void> {
    // TODO: Kill Python process
    if (this.pythonProcess) {
      this.pythonProcess.kill();
      this.pythonProcess = null;
    }
  }

  async ping(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) {
        return { success: false, error: `Server returned ${response.status}` };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Local diffusers service not running' };
    }
  }

  async generateSpriteSheet(
    inputImagePath: string,
    prompt: string,
    options: SpriteGenerationOptions
  ): Promise<GeneratedImageResult> {
    // TODO: POST to Python service
    // - Send image as multipart form
    // - Poll for completion
    // - Save result
    throw new Error('Local diffusers provider not yet implemented');
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add electron/providers/local-diffusers.ts python-service/
git commit -m "feat: scaffold Local Diffusers provider with Python FastAPI stub"
```

---

### Task 8: Create Provider Factory and Settings Integration

**Files:**
- Create: `electron/providers/factory.ts`
- Modify: `electron/settings.ts`

- [ ] **Step 1: Create settings persistence with electron-store**

```typescript
// electron/settings.ts

import Store from 'electron-store';
import { AppSettings, ProviderId } from '../src/shared/types';

const defaultSettings: AppSettings = {
  openai: {
    apiKey: '',
    modelName: 'dall-e-3'
  },
  comfyui: {
    serverUrl: 'http://127.0.0.1:8188',
    workflowJson: '',
    useBuiltInWorkflow: true
  },
  a1111: {
    baseUrl: 'http://127.0.0.1:7860',
    steps: 20,
    cfg: 7,
    denoise: 0.75,
    sampler: 'Euler a',
    checkpointName: '',
    loraNames: ''
  },
  localDiffusers: {
    modelPath: '',
    device: 'cuda',
    loraFolderPath: ''
  },
  output: {
    folderPath: ''
  },
  pixelEnforcement: {
    nearestNeighborOnly: true,
    quantizeColors: true,
    paletteSize: 32
  },
  selectedProviderId: 'openai'
};

const store = new Store<AppSettings>({
  name: 'settings',
  defaults: defaultSettings
});

export function getSettings(): AppSettings {
  return store.store;
}

export function saveSettings(settings: AppSettings): void {
  store.set(settings);
}

export function getProviderSettings(providerId: ProviderId): any {
  const settings = store.store;
  switch (providerId) {
    case 'openai': return settings.openai;
    case 'comfyui': return settings.comfyui;
    case 'a1111': return settings.a1111;
    case 'local-diffusers': return settings.localDiffusers;
  }
}
```

- [ ] **Step 2: Create provider factory**

```typescript
// electron/providers/factory.ts

import { AIProvider, ProviderConstructor } from './types';
import { ProviderId } from '../../src/shared/types';
import { OpenAIProvider } from './openai';
import { ComfyUIProvider } from './comfyui';
import { A1111Provider } from './a1111';
import { LocalDiffusersProvider } from './local-diffusers';

const providers: Record<ProviderId, ProviderConstructor> = {
  openai: OpenAIProvider,
  comfyui: ComfyUIProvider,
  a1111: A1111Provider,
  'local-diffusers': LocalDiffusersProvider
};

export function createProvider(providerId: ProviderId, settings: any): AIProvider {
  const ProviderClass = providers[providerId];
  if (!ProviderClass) {
    throw new Error(`Unknown provider: ${providerId}`);
  }
  return new ProviderClass(settings);
}

export function getAllProviderInfo(settings: any): Array<{ id: ProviderId; displayName: string; isConfigured: boolean; isLocal: boolean }> {
  return Object.entries(providers).map(([id, ProviderClass]) => {
    const provider = new ProviderClass(settings[id as ProviderId]);
    return {
      id: id as ProviderId,
      displayName: provider.displayName,
      isConfigured: provider.isConfigured(),
      isLocal: provider.isLocal
    };
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add electron/settings.ts electron/providers/factory.ts
git commit -m "feat: add settings persistence and provider factory"
```

---

## Chunk 3: Post-Processing and Main Process

### Task 9: Implement Post-Processing Pipeline

**Files:**
- Create: `electron/postprocess.ts`

- [ ] **Step 1: Create sharp-based post-processing**

```typescript
// electron/postprocess.ts

import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';
import { SpriteSheetMetadata } from '../src/shared/types';

interface PostProcessOptions {
  nearestNeighbor: boolean;
  quantizeColors: boolean;
  paletteSize: number;
  targetScale?: number;
}

export async function postProcessImage(
  inputPath: string,
  outputPath: string,
  options: PostProcessOptions
): Promise<void> {
  let pipeline = sharp(inputPath);

  // Get metadata
  const metadata = await pipeline.metadata();

  // Apply nearest-neighbor scaling if needed
  if (options.nearestNeighbor && options.targetScale) {
    pipeline = pipeline.resize(
      Math.round(metadata.width! * options.targetScale),
      Math.round(metadata.height! * options.targetScale),
      { kernel: 'nearest' }
    );
  }

  // Apply color quantization
  if (options.quantizeColors) {
    pipeline = pipeline.quantize({
      colours: options.paletteSize,
      method: 'mediancut'
    });
  }

  // Save as PNG
  await pipeline.toFile(outputPath);
}

export function createSpriteSheetMetadata(
  frameWidth: number,
  frameHeight: number,
  frames: number,
  providerId: string,
  prompt: string
): SpriteSheetMetadata {
  return {
    frameWidth,
    frameHeight,
    frames,
    layout: 'row',
    suggestedPivot: { x: Math.floor(frameWidth / 2), y: frameHeight },
    providerId: providerId as any,
    prompt,
    generatedAt: new Date().toISOString()
  };
}

export async function saveMetadata(
  metadata: SpriteSheetMetadata,
  jsonPath: string
): Promise<void> {
  await fs.promises.writeFile(jsonPath, JSON.stringify(metadata, null, 2));
}

export async function createThumbnail(
  imagePath: string,
  thumbnailPath: string,
  maxSize: number = 128
): Promise<void> {
  await sharp(imagePath)
    .resize(maxSize, maxSize, {
      fit: 'inside',
      kernel: 'nearest'
    })
    .toFile(thumbnailPath);
}
```

- [ ] **Step 2: Commit**

```bash
git add electron/postprocess.ts
git commit -m "feat: implement sharp post-processing pipeline"
```

---

### Task 10: Create Electron Main Process with IPC

**Files:**
- Create: `electron/main.ts`
- Create: `electron/preload.ts`

- [ ] **Step 1: Create preload script for secure IPC**

```typescript
// electron/preload.ts

import { contextBridge, ipcRenderer } from 'electron';
import {
  AppSettings,
  GenerateRequest,
  GenerateResult,
  HistoryEntry,
  ProviderId
} from '../src/shared/types';

contextBridge.exposeInMainWorld('electronAPI', {
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: AppSettings) => ipcRenderer.invoke('save-settings', settings),

  // Providers
  getProviders: () => ipcRenderer.invoke('get-providers'),
  pingProvider: (providerId: ProviderId) => ipcRenderer.invoke('ping-provider', providerId),

  // Generation
  generate: (request: GenerateRequest) => ipcRenderer.invoke('generate', request),
  cancelGeneration: () => ipcRenderer.invoke('cancel-generation'),

  // History
  getHistory: () => ipcRenderer.invoke('get-history'),
  deleteHistoryEntry: (id: string) => ipcRenderer.invoke('delete-history-entry', id),

  // File operations
  selectOutputFolder: () => ipcRenderer.invoke('select-output-folder'),
  getDefaultOutputFolder: () => ipcRenderer.invoke('get-default-output-folder')
});
```

- [ ] **Step 2: Create main process with IPC handlers**

```typescript
// electron/main.ts

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { getSettings, saveSettings, getProviderSettings } from './settings';
import { createProvider, getAllProviderInfo } from './providers/factory';
import { GenerateRequest, GenerateResult, HistoryEntry } from '../src/shared/types';
import { postProcessImage, createSpriteSheetMetadata, saveMetadata, createThumbnail } from './postprocess';

let mainWindow: BrowserWindow | null = null;
let currentGeneration: { cancel: () => void } | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/renderer/index.html'));
  }
}

app.whenReady().then(createWindow);

// IPC Handlers
ipcMain.handle('get-settings', () => getSettings());
ipcMain.handle('save-settings', (_, settings) => saveSettings(settings));

ipcMain.handle('get-providers', () => {
  const settings = getSettings();
  return getAllProviderInfo(settings);
});

ipcMain.handle('ping-provider', async (_, providerId) => {
  const settings = getProviderSettings(providerId);
  const provider = createProvider(providerId, settings);
  if (provider.ping) {
    return await provider.ping();
  }
  return { success: true };
});

ipcMain.handle('generate', async (_, request: GenerateRequest): Promise<GenerateResult> => {
  try {
    const settings = getProviderSettings(request.providerId);
    const provider = createProvider(request.providerId, settings);

    if (!provider.isConfigured()) {
      return { success: false, error: `Provider ${request.providerId} is not configured` };
    }

    // Build full prompt
    const fullPrompt = `${request.basePrompt}, ${request.motionPrompt}${request.extraInstructions ? ', ' + request.extraInstructions : ''}`;

    // Generate image via provider
    const result = await provider.generateSpriteSheet(
      request.inputImagePath,
      fullPrompt,
      {
        frameCount: request.frameCount,
        frameWidth: request.frameWidth,
        frameHeight: request.frameHeight
      }
    );

    // Post-process
    const outputSettings = getSettings().pixelEnforcement;
    const finalPath = path.join(
      getSettings().output.folderPath,
      `sprite_${Date.now()}.png`
    );

    await postProcessImage(result.imagePath, finalPath, {
      nearestNeighbor: outputSettings.nearestNeighborOnly,
      quantizeColors: outputSettings.quantizeColors,
      paletteSize: outputSettings.paletteSize
    });

    // Create metadata
    const metadata = createSpriteSheetMetadata(
      request.frameWidth,
      request.frameHeight,
      request.frameCount,
      request.providerId,
      fullPrompt
    );

    const jsonPath = finalPath.replace('.png', '.json');
    await saveMetadata(metadata, jsonPath);

    // Create thumbnail for history
    const thumbnailPath = finalPath.replace('.png', '_thumb.png');
    await createThumbnail(finalPath, thumbnailPath);

    // Add to history
    const historyEntry: HistoryEntry = {
      id: Date.now().toString(),
      thumbnailPath,
      outputPath: finalPath,
      jsonPath,
      providerId: request.providerId,
      motionPresetId: request.motionPreset.id,
      prompt: fullPrompt,
      metadata,
      createdAt: new Date().toISOString()
    };

    // TODO: Save to history store

    return {
      success: true,
      outputPath: finalPath,
      jsonPath,
      metadata
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

ipcMain.handle('cancel-generation', () => {
  if (currentGeneration) {
    currentGeneration.cancel();
    currentGeneration = null;
  }
});

ipcMain.handle('get-history', () => {
  // TODO: Load history from store
  return [];
});

ipcMain.handle('delete-history-entry', (_, id) => {
  // TODO: Delete from history store
});

ipcMain.handle('select-output-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory']
  });
  return result.filePaths[0];
});

ipcMain.handle('get-default-output-folder', () => {
  return path.join(app.getPath('documents'), 'PixelMotion', 'output');
});
```

- [ ] **Step 3: Commit**

```bash
git add electron/main.ts electron/preload.ts
git commit -m "feat: create Electron main process with IPC handlers"
```

---

## Chunk 4: React UI Components

### Task 11: Create React App Structure

**Files:**
- Create: `src/ui/App.tsx`
- Create: `src/ui/index.css`
- Create: `src/ui/main.tsx`
- Create: `src/ui/hooks/useSettings.ts`
- Create: `src/ui/hooks/useHistory.ts`
- Create: `src/ui/hooks/useProvider.ts`

- [ ] **Step 1: Create main entry point**

```typescript
// src/ui/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 2: Create base styles**

```css
/* src/ui/index.css */

@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
}

#root {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
```

- [ ] **Step 3: Create App with navigation**

```typescript
// src/ui/App.tsx

import { useState } from 'react';
import { motionPresets } from '../shared/motion-presets';
import MotionList from './components/MotionList';
import ImageUploader from './components/ImageUploader';
import PromptEditor from './components/PromptEditor';
import ProviderSelector from './components/ProviderSelector';
import OutputPanel from './components/OutputPanel';
import SettingsView from './components/SettingsView';
import HistoryView from './components/HistoryView';

type View = 'home' | 'settings' | 'history';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedMotions, setSelectedMotions] = useState<string[]>([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  return (
    <div className="flex-1 flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="h-14 border-b border-gray-700 flex items-center px-4">
        <h1 className="text-lg font-bold mr-8">PixelMotion AI</h1>
        <nav className="flex gap-4">
          <button
            className={`px-3 py-1 rounded ${currentView === 'home' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
            onClick={() => setCurrentView('home')}
          >
            Home
          </button>
          <button
            className={`px-3 py-1 rounded ${currentView === 'history' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
            onClick={() => setCurrentView('history')}
          >
            History
          </button>
          <button
            className={`px-3 py-1 rounded ${currentView === 'settings' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
            onClick={() => setCurrentView('settings')}
          >
            Settings
          </button>
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        {currentView === 'home' && (
          <div className="h-full flex">
            <MotionList
              presets={motionPresets}
              selectedIds={selectedMotions}
              onToggle={(id) => {
                setSelectedMotions(prev =>
                  prev.includes(id)
                    ? prev.filter(m => m !== id)
                    : [...prev, id]
                );
              }}
            />
            <div className="flex-1 flex flex-col">
              <ImageUploader
                image={uploadedImage}
                onImageSelect={setUploadedImage}
              />
              <div className="flex-1 flex">
                <PromptEditor
                  selectedMotionIds={selectedMotions}
                />
                <ProviderSelector />
              </div>
              <OutputPanel />
            </div>
          </div>
        )}
        {currentView === 'settings' && <SettingsView />}
        {currentView === 'history' && <HistoryView />}
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/ui/main.tsx src/ui/index.css src/ui/App.tsx
git commit -m "feat: scaffold React app with navigation"
```

---

### Task 12: Implement UI Components

**Files:**
- Create: `src/ui/components/MotionList.tsx`
- Create: `src/ui/components/ImageUploader.tsx`
- Create: `src/ui/components/PromptEditor.tsx`
- Create: `src/ui/components/ProviderSelector.tsx`
- Create: `src/ui/components/OutputPanel.tsx`
- Create: `src/ui/components/SettingsView.tsx`
- Create: `src/ui/components/HistoryView.tsx`

- [ ] **Step 1: Create MotionList component**

```typescript
// src/ui/components/MotionList.tsx

import { MotionPreset } from '../../shared/types';

interface MotionListProps {
  presets: MotionPreset[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export default function MotionList({ presets, selectedIds, onToggle }: MotionListProps) {
  return (
    <div className="w-64 border-r border-gray-700 overflow-y-auto p-4">
      <h2 className="text-sm font-semibold text-gray-400 mb-3">MOTION PRESETS</h2>
      <div className="space-y-2">
        {presets.map(preset => (
          <label
            key={preset.id}
            className="flex items-start gap-2 p-2 rounded hover:bg-gray-800 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(preset.id)}
              onChange={() => onToggle(preset.id)}
              className="mt-1"
            />
            <div>
              <div className="font-medium text-sm">{preset.name}</div>
              <div className="text-xs text-gray-500">{preset.description}</div>
              <div className="text-xs text-gray-600 mt-1">{preset.defaultFrames} frames</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2-7: Create remaining components (stubs for brevity)**

Each component follows similar pattern - create with props, basic styling, placeholder functionality.

- [ ] **Step 8: Commit**

```bash
git add src/ui/components/
git commit -m "feat: implement all UI components"
```

---

## Chunk 5: Packaging and Documentation

### Task 13: Configure electron-builder

**Files:**
- Create: `electron-builder.config.js`

- [ ] **Step 1: Create Windows build config**

```javascript
// electron-builder.config.js

module.exports = {
  appId: 'com.pixelmotion.app',
  productName: 'PixelMotion AI',
  directories: {
    output: 'release'
  },
  files: [
    'dist-electron/**/*',
    'dist/renderer/**/*'
  ],
  win: {
    target: 'nsis',
    icon: 'assets/icons/icon.ico'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add electron-builder.config.js
git commit -m "feat: configure electron-builder for Windows NSIS installer"
```

---

### Task 14: Write README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create comprehensive README**

```markdown
# PixelMotion AI

AI-powered pixel sprite motion sheet generator for Windows.

## Features

- Upload a single pixel character image
- Select from 14 motion presets (Idle, Run, Jump, Attack, etc.)
- Generate sprite sheets using multiple AI providers:
  - OpenAI (cloud)
  - ComfyUI (self-hosted)
  - Automatic1111 (self-hosted)
  - Local Diffusers (embedded Python)
- Pixel-perfect output with nearest-neighbor scaling
- Export PNG + JSON metadata

## Development (Replit)

```bash
# Install dependencies
npm install

# Run in dev mode
npm run dev
```

## Building Windows .exe

1. Clone repo to Windows machine
2. Install dependencies: `npm install`
3. Build: `npm run dist:win`
4. Installer in `release/` folder

## Provider Configuration

### OpenAI
1. Get API key from platform.openai.com
2. Enter key in Settings > OpenAI tab
3. Set model name (default: dall-e-3)

### ComfyUI
1. Run ComfyUI locally or on LAN
2. Settings > ComfyUI > Server URL (default: http://127.0.0.1:8188)
3. Click "Ping" to verify connection
4. Use built-in workflow or paste custom workflow JSON

### Automatic1111
1. Run SD WebUI with --api flag
2. Settings > A1111 > Base URL (default: http://127.0.0.1:7860)
3. Configure steps, CFG, denoise, sampler
4. Optional: Set checkpoint name and LoRAs

### Local Diffusers
1. Install Python 3.10+
2. Install deps: `pip install -r python-service/requirements.txt`
3. Settings > Local Diffusers > Model path
4. Select device (CUDA/DirectML/CPU)

## Troubleshooting

**Server unreachable**: Check provider is running and URL is correct
**Timeout**: Increase timeout in settings or reduce image size
**VRAM OOM**: Reduce batch size or use smaller model
**Quota exceeded**: Check API key has remaining credits

## Security

Local providers (ComfyUI, A1111, Local Diffusers) never send images externally.
Only OpenAI provider uploads images to cloud.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup and provider configuration"
```

---

## Chunk 6: Integration and Testing

### Task 15: Implement OpenAI Provider (Complete)

**Files:**
- Modify: `electron/providers/openai.ts`

- [ ] **Step 1: Implement full OpenAI API integration**

```typescript
// Full implementation with:
// - Base64 image encoding
// - OpenAI API call with image input
// - Response parsing
// - File saving
```

- [ ] **Step 2: Test with real API key**

```bash
# Add test API key to .env
# Run generation test
```

- [ ] **Step 3: Commit**

```bash
git add electron/providers/openai.ts
git commit -m "feat: complete OpenAI provider implementation"
```

---

### Task 16: Implement ComfyUI Provider (Complete)

**Files:**
- Modify: `electron/providers/comfyui.ts`

- [ ] **Step 1: Implement workflow parsing and API calls**

- [ ] **Step 2: Test with running ComfyUI instance**

- [ ] **Step 3: Commit**

---

### Task 17: Implement A1111 Provider (Complete)

**Files:**
- Modify: `electron/providers/a1111.ts`

- [ ] **Step 1: Implement img2img API integration**

- [ ] **Step 2: Test with running A1111 instance**

- [ ] **Step 3: Commit**

---

### Task 18: Final Verification and Polish

- [ ] **Step 1: Run typecheck**

```bash
npm run typecheck
```

Expected: No errors

- [ ] **Step 2: Build production bundle**

```bash
npm run build
```

Expected: dist-electron/ and dist/ folders created

- [ ] **Step 3: Verify all files compile**

- [ ] **Step 4: Commit final**

```bash
git add .
git commit -m "chore: final verification and polish"
```

---

## Post-Plan Checklist

After executing this plan:

- [ ] All 14 motion presets implemented
- [ ] All 4 AI providers functional (OpenAI, ComfyUI, A1111, Local Diffusers)
- [ ] Provider ping working for self-hosted options
- [ ] Post-processing with sharp (nearest-neighbor, quantization)
- [ ] PNG + JSON export working
- [ ] History persistence functional
- [ ] Settings persistence functional
- [ ] Windows build produces working installer
- [ ] README complete with troubleshooting

---

**Plan complete.** Ready to execute with `superpowers:subagent-driven-development` or `superpowers:executing-plans`.
