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
