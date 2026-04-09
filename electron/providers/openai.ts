// electron/providers/openai.ts

import { AIProvider, GeneratedImageResult, SpriteGenerationOptions } from './types';
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';

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
    const client = new OpenAI({ apiKey: this.settings.apiKey });

    // Read and encode input image as base64
    const imageBuffer = await fs.promises.readFile(inputImagePath);
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;

    // Call OpenAI image generation API
    const response = await client.images.generate({
      model: this.settings.modelName,
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'url'
    });

    const imageUrl = response.data[0].url;
    if (!imageUrl) {
      throw new Error('OpenAI did not return an image URL');
    }

    // Download the generated image
    const imageResponse = await fetch(imageUrl);
    const imageBufferResult = await imageResponse.arrayBuffer();
    const resultBuffer = Buffer.from(imageBufferResult);

    // Save to temp path
    const tempPath = path.join(
      require('os').tmpdir(),
      `openai_${Date.now()}.png`
    );
    await fs.promises.writeFile(tempPath, resultBuffer);

    // Get dimensions
    const metadata = await require('sharp')(tempPath).metadata();

    return {
      imagePath: tempPath,
      width: metadata.width || 1024,
      height: metadata.height || 1024
    };
  }
}
