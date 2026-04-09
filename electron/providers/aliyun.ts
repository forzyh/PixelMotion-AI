// electron/providers/aliyun.ts

import { AIProvider, GeneratedImageResult, SpriteGenerationOptions } from './types';
import * as fs from 'fs';
import * as path from 'path';

interface AliyunSettings {
  apiKey: string;
  modelName: string;
  endpoint?: string;
}

export class AliyunProvider implements AIProvider {
  readonly id = 'aliyun' as const;
  readonly displayName = '阿里云 DashScope (通义万相)';
  readonly isLocal = false;

  constructor(private settings: AliyunSettings) {}

  isConfigured(): boolean {
    return !!this.settings.apiKey && !!this.settings.modelName;
  }

  async generateSpriteSheet(
    inputImagePath: string,
    prompt: string,
    options: SpriteGenerationOptions
  ): Promise<GeneratedImageResult> {
    // Read and encode input image as base64
    const imageBuffer = await fs.promises.readFile(inputImagePath);
    const base64Image = imageBuffer.toString('base64');

    // Use wanx model for image generation
    const model = this.settings.modelName || 'wanx-v1';
    const endpoint = this.settings.endpoint || 'https://dashscope.aliyuncs.com';

    // Add frame count instruction to prompt
    const frameInstruction = `, ${options.frameCount} frames sprite sheet, arrange frames in 2 rows`;
    const fullPrompt = prompt + frameInstruction;

    // Call Aliyun DashScope API
    const response = await fetch(`${endpoint}/api/v1/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.settings.apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-WorkSpace': 'pixelmotion'
      },
      body: JSON.stringify({
        model: model,
        input: {
          prompt: fullPrompt,
          // For image-to-image, use the ref_img parameter if supported
          ref_img: `data:image/png;base64,${base64Image}`
        },
        parameters: {
          style: '<pixel art>',
          size: '1024x1024',
          n: 1
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Aliyun API failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    // Parse response based on model
    let imageUrl: string;
    if (result.output?.url) {
      imageUrl = result.output.url;
    } else if (result.output?.results?.[0]?.url) {
      imageUrl = result.output.results[0].url;
    } else {
      throw new Error('Aliyun did not return an image URL');
    }

    // Download the generated image
    const imageResponse = await fetch(imageUrl);
    const imageBufferResult = await imageResponse.arrayBuffer();
    const resultBuffer = Buffer.from(imageBufferResult);

    // Save to temp path
    const tempPath = path.join(
      require('os').tmpdir(),
      `aliyun_${Date.now()}.png`
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

  async ping(): Promise<{ success: boolean; error?: string }> {
    try {
      const endpoint = this.settings.endpoint || 'https://dashscope.aliyuncs.com';
      const response = await fetch(`${endpoint}/api/v1/models`, {
        headers: {
          'Authorization': `Bearer ${this.settings.apiKey}`
        }
      });

      if (response.ok || response.status === 404) {
        // 200 means API is accessible, 404 is also fine (endpoint exists)
        return { success: true };
      }
      return { success: false, error: `API returned ${response.status}` };
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: `Cannot reach Aliyun: ${error.message}` };
      }
      return { success: false, error: 'Unknown connection error' };
    }
  }
}
