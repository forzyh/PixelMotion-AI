// electron/providers/local-diffusers.ts

import { AIProvider, GeneratedImageResult, SpriteGenerationOptions } from './types';
import * as fs from 'fs';
import * as path from 'path';
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
  private isRunning = false;

  constructor(private settings: LocalDiffusersSettings) {}

  isConfigured(): boolean {
    return !!this.settings?.modelPath && fs.existsSync(this.settings.modelPath);
  }

  async start(): Promise<{ success: boolean; error?: string }> {
    if (this.isRunning) {
      return { success: true };
    }

    // Check if Python service script exists
    const servicePath = path.join(__dirname, '../../python-service/app.py');
    if (!fs.existsSync(servicePath)) {
      return { success: false, error: `Python service not found at ${servicePath}` };
    }

    // Spawn Python FastAPI process
    try {
      this.pythonProcess = spawn('python', [
        servicePath,
        '--model-path', this.settings.modelPath,
        '--device', this.settings.device,
        '--port', '8765'
      ], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      this.pythonProcess.stdout?.on('data', (data) => {
        console.log(`[LocalDiffusers] ${data}`);
      });

      this.pythonProcess.stderr?.on('data', (data) => {
        console.error(`[LocalDiffusers] ${data}`);
      });

      // Wait for service to be ready
      for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const health = await this.ping();
        if (health.success) {
          this.isRunning = true;
          return { success: true };
        }
      }

      return { success: false, error: 'Python service failed to start' };
    } catch (error) {
      return { success: false, error: `Failed to start Python service: ${error}` };
    }
  }

  async stop(): Promise<void> {
    if (this.pythonProcess) {
      this.pythonProcess.kill();
      this.pythonProcess = null;
      this.isRunning = false;
    }
  }

  async ping(): Promise<{ success: boolean; error?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

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
    // Ensure service is running
    if (!this.isRunning) {
      const startResult = await this.start();
      if (!startResult.success) {
        throw new Error(startResult.error);
      }
    }

    // Read image as form data
    const imageBuffer = await fs.promises.readFile(inputImagePath);
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    formData.append('image', blob, 'input.png');
    formData.append('prompt', prompt);
    formData.append('negative_prompt', options.negativePrompt || '');
    formData.append('num_frames', options.frameCount.toString());
    formData.append('steps', '20');
    formData.append('cfg', '7.0');

    // POST to Python service
    const response = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Local diffusers failed: ${response.status} - ${errorText}`);
    }

    // Save result
    const resultBuffer = await response.arrayBuffer();
    const tempPath = path.join(
      require('os').tmpdir(),
      `local_${Date.now()}.png`
    );
    await fs.promises.writeFile(tempPath, Buffer.from(resultBuffer));

    const metadata = await require('sharp')(tempPath).metadata();

    return {
      imagePath: tempPath,
      width: metadata.width || 512,
      height: metadata.height || 512
    };
  }
}
