// electron/providers/doubao.ts

import { AIProvider, GeneratedImageResult, SpriteGenerationOptions } from './types';
import * as fs from 'fs';
import * as path from 'path';

interface DoubaoSettings {
  apiKey: string;
  apiUrl: string;
  modelName: string;
  size?: string;
}

export class DoubaoProvider implements AIProvider {
  readonly id = 'doubao' as const;
  readonly displayName = 'Doubao (ByteDance)';
  readonly isLocal = false;

  constructor(private settings: DoubaoSettings) {}

  isConfigured(): boolean {
    return !!this.settings.apiKey && !!this.settings.apiUrl && !!this.settings.modelName;
  }

  async generateSpriteSheet(
    inputImagePath: string,
    prompt: string,
    _options: SpriteGenerationOptions
  ): Promise<GeneratedImageResult> {
    // Read input image and convert to base64
    const imageBuffer = fs.readFileSync(inputImagePath);
    const base64Image = imageBuffer.toString('base64');

    // Call Doubao image-to-image API
    const response = await fetch(this.settings.apiUrl, {
      method: 'POST',
      headers: {
        'api-key': this.settings.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.settings.modelName,
        prompt: prompt,
        img_url: `data:image/jpeg;base64,${base64Image}`,
        response_format: 'url',
        size: this.settings.size || '2560x1440',
        seed: Math.floor(Math.random() * 1000000),
        extra_body: {
          watermark: false
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Doubao API error: ${response.status} ${errorText}`);
    }

    const result: any = await response.json();
    const imageUrl = result.data?.[0]?.url;

    if (!imageUrl) {
      throw new Error('Doubao did not return image URL');
    }

    // Download the generated image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to download generated image');
    }

    const imageBufferResult = Buffer.from(await imageResponse.arrayBuffer());

    // Save to temp path
    const tempPath = path.join(
      require('os').tmpdir(),
      `doubao_${Date.now()}.png`
    );
    await fs.promises.writeFile(tempPath, imageBufferResult);

    // Get dimensions
    const metadata = await require('sharp')(tempPath).metadata();

    return {
      imagePath: tempPath,
      width: metadata.width || 2560,
      height: metadata.height || 1440
    };
  }
}
