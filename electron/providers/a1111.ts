// electron/providers/a1111.ts

import { AIProvider, GeneratedImageResult, SpriteGenerationOptions } from './types';
import * as fs from 'fs';
import * as path from 'path';

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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.settings.baseUrl}/sdapi/v1/sd-models`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return { success: false, error: `Server returned ${response.status}` };
      }
      return { success: true };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { success: false, error: 'Connection timeout (5s)' };
        }
        return { success: false, error: `Cannot reach A1111 at ${this.settings.baseUrl}: ${error.message}` };
      }
      return { success: false, error: 'Unknown connection error' };
    }
  }

  async generateSpriteSheet(
    inputImagePath: string,
    prompt: string,
    options: SpriteGenerationOptions
  ): Promise<GeneratedImageResult> {
    // Read and encode input image
    const imageBuffer = await fs.promises.readFile(inputImagePath);
    const base64Image = imageBuffer.toString('base64');

    // Build prompt with LoRA if specified
    let fullPrompt = prompt;
    if (this.settings.loraNames) {
      const loras = this.settings.loraNames.split(',').map((l: string) => l.trim());
      for (const lora of loras) {
        if (lora) {
          fullPrompt += `, <lora:${lora}:1>`;
        }
      }
    }

    // Build img2img request
    const requestBody: any = {
      init_images: [base64Image],
      prompt: fullPrompt,
      negative_prompt: options.negativePrompt || 'blurry, smooth, 3D, photorealistic, text, watermark',
      steps: this.settings.steps,
      cfg_scale: this.settings.cfg,
      denoising_strength: this.settings.denoise,
      sampler_name: this.settings.sampler,
      width: options.frameWidth * options.frameCount,
      height: options.frameHeight,
      override_settings: {}
    };

    // Set checkpoint if specified
    if (this.settings.checkpointName) {
      requestBody.override_settings.sd_model_checkpoint = this.settings.checkpointName;
    }

    // Call img2img API
    const response = await fetch(`${this.settings.baseUrl}/sdapi/v1/img2img`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`A1111 img2img failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (!result.images || result.images.length === 0) {
      throw new Error('A1111 returned no images');
    }

    // Save first result image
    const resultBase64 = result.images[0];
    const resultBuffer = Buffer.from(resultBase64, 'base64');
    const tempPath = path.join(
      require('os').tmpdir(),
      `a1111_${Date.now()}.png`
    );
    await fs.promises.writeFile(tempPath, resultBuffer);

    const metadata = await require('sharp')(tempPath).metadata();

    return {
      imagePath: tempPath,
      width: metadata.width || 512,
      height: metadata.height || 512
    };
  }
}
