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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.settings.serverUrl}/system_stats`, {
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
        return { success: false, error: `Cannot reach ComfyUI at ${this.settings.serverUrl}: ${error.message}` };
      }
      return { success: false, error: 'Unknown connection error' };
    }
  }

  async generateSpriteSheet(
    inputImagePath: string,
    prompt: string,
    options: SpriteGenerationOptions
  ): Promise<GeneratedImageResult> {
    const baseUrl = this.settings.serverUrl;

    // Read and encode input image
    const imageBuffer = await fs.promises.readFile(inputImagePath);
    const base64Image = imageBuffer.toString('base64');

    // Upload image to ComfyUI
    const uploadForm = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    uploadForm.append('image', blob, 'input.png');
    uploadForm.append('overwrite', 'true');

    const uploadResponse = await fetch(`${baseUrl}/upload/image`, {
      method: 'POST',
      body: uploadForm
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload image: ${uploadResponse.statusText}`);
    }

    const uploadResult = await uploadResponse.json();
    const uploadedFilename = uploadResult.name || 'input.png';

    // Parse or use built-in workflow
    let workflow: any;
    if (this.settings.useBuiltInWorkflow) {
      workflow = this.getBuiltInWorkflow(prompt, uploadedFilename, options);
    } else {
      workflow = JSON.parse(this.settings.workflowJson);
      // Inject prompt and image into workflow nodes
      workflow = this.injectWorkflowParams(workflow, prompt, uploadedFilename, options);
    }

    // Submit workflow
    const submitResponse = await fetch(`${baseUrl}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow })
    });

    if (!submitResponse.ok) {
      throw new Error(`Failed to submit workflow: ${submitResponse.statusText}`);
    }

    const submitResult = await submitResponse.json();
    const promptId = submitResult.prompt_id;

    // Poll for completion
    const result = await this.pollForCompletion(promptId, baseUrl);

    // Download result image
    const tempPath = path.join(
      require('os').tmpdir(),
      `comfyui_${Date.now()}.png`
    );

    const imageResponse = await fetch(`${baseUrl}/view?filename=${result.filename}&subfolder=${result.subfolder || ''}&type=output`);
    const imageBufferResult = await imageResponse.arrayBuffer();
    await fs.promises.writeFile(tempPath, Buffer.from(imageBufferResult));

    const metadata = await require('sharp')(tempPath).metadata();

    return {
      imagePath: tempPath,
      width: metadata.width || 512,
      height: metadata.height || 512
    };
  }

  private getBuiltInWorkflow(prompt: string, imageName: string, options: SpriteGenerationOptions): any {
    // Built-in pixel art sprite sheet workflow
    return {
      '1': {
        class_type: 'LoadImage',
        inputs: { filename: imageName, upload: 'image' }
      },
      '2': {
        class_type: 'CLIPTextEncode',
        inputs: { text: prompt, clip: ['4', 0] }
      },
      '3': {
        class_type: 'CLIPTextEncode',
        inputs: { text: 'blurry, smooth, 3D, photorealistic', clip: ['4', 0] }
      },
      '4': {
        class_type: 'CheckpointLoaderSimple',
        inputs: { ckpt_name: 'pixel_art_model.safetensors' }
      },
      '5': {
        class_type: 'KSampler',
        inputs: {
          seed: Math.floor(Math.random() * 1000000),
          steps: options.extraInstructions ? 30 : 20,
          cfg: 7,
          sampler_name: 'euler',
          scheduler: 'normal',
          denoise: 0.75,
          model: ['4', 0],
          positive: ['2', 0],
          negative: ['3', 0],
          latent_image: ['6', 0],
          image: ['1', 0]
        }
      },
      '6': {
        class_type: 'VAEEncode',
        inputs: { pixels: ['1', 0], vae: ['4', 2] }
      },
      '7': {
        class_type: 'VAEDecode',
        inputs: { samples: ['5', 0], vae: ['4', 2] }
      },
      '8': {
        class_type: 'SaveImage',
        inputs: { images: ['7', 0], filename_prefix: 'sprite' }
      }
    };
  }

  private injectWorkflowParams(workflow: any, prompt: string, imageName: string, options: SpriteGenerationOptions): any {
    // Simple injection - user may need to customize for their workflow
    for (const nodeId of Object.keys(workflow)) {
      const node = workflow[nodeId];
      if (node.inputs?.text) {
        node.inputs.text = prompt;
      }
      if (node.inputs?.image) {
        node.inputs.image = imageName;
      }
    }
    return workflow;
  }

  private async pollForCompletion(promptId: string, baseUrl: string, timeoutMs: number = 120000): Promise<{ filename: string; subfolder?: string }> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await fetch(`${baseUrl}/history/${promptId}`);
      if (!response.ok) continue;

      const history = await response.json();
      if (history[promptId]?.outputs) {
        const outputs = history[promptId].outputs;
        for (const nodeId of Object.keys(outputs)) {
          const output = outputs[nodeId];
          if (output.images?.length > 0) {
            return {
              filename: output.images[0].filename,
              subfolder: output.images[0].subfolder
            };
          }
        }
      }
    }

    throw new Error('Generation timeout (120s)');
  }
}
