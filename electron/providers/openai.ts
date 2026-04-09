// electron/providers/openai.ts

import { AIProvider, GeneratedImageResult, SpriteGenerationOptions } from './types';
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';

interface OpenAISettings {
  apiKey: string;
  modelName: string;
  baseURL?: string;
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
    _inputImagePath: string,
    prompt: string,
    _options: SpriteGenerationOptions
  ): Promise<GeneratedImageResult> {
    const client = new OpenAI({
      apiKey: this.settings.apiKey,
      ...(this.settings.baseURL && { baseURL: this.settings.baseURL })
    });

    console.log('[OpenAI] Generating image with model:', this.settings.modelName);
    console.log('[OpenAI] Base URL:', this.settings.baseURL || 'default (api.openai.com)');
    console.log('[OpenAI] Prompt:', prompt);

    try {
      // Use text-to-image mode (more widely supported)
      const response = await client.images.generate({
        model: this.settings.modelName,
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        response_format: 'b64_json'
      });

      console.log('[OpenAI] Response received');

      const imageData = response.data?.[0]?.b64_json;
      if (!imageData) {
        throw new Error('OpenAI did not return image data');
      }

      // Decode base64 and save
      const resultBuffer = Buffer.from(imageData, 'base64');

      // Save to temp path
      const tempPath = path.join(
        require('os').tmpdir(),
        `openai_${Date.now()}.png`
      );
      await fs.promises.writeFile(tempPath, resultBuffer);

      // Get dimensions
      const metadata = await require('sharp')(tempPath).metadata();

      console.log('[OpenAI] Image saved to:', tempPath);

      return {
        imagePath: tempPath,
        width: metadata.width || 1024,
        height: metadata.height || 1024
      };
    } catch (error: any) {
      console.error('[OpenAI] Error:', error.message);
      console.error('[OpenAI] Full error:', JSON.stringify(error, null, 2));
      throw error;
    }
  }
}
