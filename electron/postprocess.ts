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
  await pipeline.png().toFile(outputPath);
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
    .png()
    .toFile(thumbnailPath);
}
