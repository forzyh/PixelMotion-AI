// electron/postprocess.ts

import * as path from 'path';
import * as fs from 'fs';
import { SpriteSheetMetadata } from '../src/shared/types';
import gifenc from 'gifenc';

// Dynamic require for sharp to work with Electron
const sharp = require('sharp');

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

  // Apply color quantization using png() option
  const pngOptions: any = {};
  if (options.quantizeColors) {
    pngOptions.palette = true;
    pngOptions.colors = options.paletteSize;
  }

  // Save as PNG
  await pipeline.png(pngOptions).toFile(outputPath);
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

/**
 * Extract individual frames from a sprite sheet and create a GIF
 */
export async function createGifFromSpriteSheet(
  spriteSheetPath: string,
  gifPath: string,
  frameWidth: number,
  frameHeight: number,
  frameCount: number,
  fps: number = 8,
  quantizeColors: boolean = true,
  paletteSize: number = 32
): Promise<void> {
  // Read the sprite sheet
  const spriteSheet = sharp(spriteSheetPath);
  const metadata = await spriteSheet.metadata();

  const spriteWidth = metadata.width;
  const spriteHeight = metadata.height;

  console.log(`Creating GIF: ${spriteWidth}x${spriteHeight}, frame: ${frameWidth}x${frameHeight}, frames: ${frameCount}`);

  // Extract each frame and collect raw pixels
  const frames: Buffer[] = [];

  for (let i = 0; i < frameCount; i++) {
    const x = i * frameWidth;

    // Boundary check - skip frames that exceed sprite sheet bounds
    if (x + frameWidth > spriteWidth || frameHeight > spriteHeight) {
      console.warn(`Frame ${i} exceeds sprite sheet bounds (${x}+${frameWidth} > ${spriteWidth}), skipping`);
      continue;
    }

    // Extract frame
    const frameBuffer = await sharp(spriteSheetPath)
      .extract({
        left: x,
        top: 0,
        width: frameWidth,
        height: frameHeight
      })
      .raw()
      .toBuffer();

    frames.push(frameBuffer);
  }

  console.log(`Extracted ${frames.length} frames for GIF`);

  // Check if we have any frames
  if (frames.length === 0) {
    console.error('No frames extracted, cannot create GIF');
    throw new Error(`No valid frames extracted from sprite sheet. Sprite: ${spriteWidth}x${spriteHeight}, Frame: ${frameWidth}x${frameHeight}, Count: ${frameCount}`);
  }

  // Create GIF using gifenc
  const fpsClamped = Math.max(1, Math.min(30, fps));
  const duration = Math.round(1000 / fpsClamped);

  // First frame as global palette source
  const firstFrame = frames[0];
  const width = frameWidth;
  const height = frameHeight;

  // Create GIF
  const gif = gifenc(firstFrame, width, height, {
    loop: 0, // Infinite loop
    palette: quantizeColors ? 'neuquant' : 'rgbquant',
    colors: paletteSize,
    delay: duration
  });

  // Add remaining frames
  for (let i = 1; i < frames.length; i++) {
    gif.writeFrame(frames[i], width, height, {
      palette: quantizeColors ? 'neuquant' : 'rgbquant',
      colors: paletteSize,
      delay: duration
    });
  }

  // Finalize and save
  const gifBuffer = Buffer.from(gif.bytes());
  await fs.promises.writeFile(gifPath, gifBuffer);
  console.log(`GIF created: ${gifPath}, ${gifBuffer.length} bytes`);
}
