// electron/postprocess.ts

import * as path from 'path';
import * as fs from 'fs';
import { SpriteSheetMetadata } from '../src/shared/types';
import gifenc from 'gifenc';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// Dynamic require for sharp to work with Electron
const sharp = require('sharp');

interface PostProcessOptions {
  nearestNeighbor: boolean;
  quantizeColors: boolean;
  paletteSize: number;
  targetScale?: number;
  removeBackground?: boolean;
}

/**
 * Remove background from image using rembg
 */
export async function removeBackground(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const scriptPath = path.join(__dirname, 'remove-bg.py');

  try {
    const result = await execFileAsync('python3', [scriptPath, inputPath, outputPath]);
    console.log(`Background removed: ${outputPath}`);
  } catch (error: any) {
    console.error('Error removing background:', error.message);
    throw new Error(`Failed to remove background: ${error.message}`);
  }
}

export async function postProcessImage(
  inputPath: string,
  outputPath: string,
  options: PostProcessOptions
): Promise<void> {
  let pipeline = sharp(inputPath);

  // Get metadata
  const metadata = await pipeline.metadata();

  // Remove background if requested
  if (options.removeBackground) {
    const tempPath = outputPath.replace('.png', '_temp.png');
    await pipeline.png().toFile(tempPath);

    await removeBackground(tempPath, outputPath);

    // Clean up temp file
    try {
      await fs.promises.unlink(tempPath);
    } catch (e) {
      // Ignore temp file cleanup error
    }

    // Re-open the background-removed image for further processing
    pipeline = sharp(outputPath);
  }

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
  // Determine layout based on frame count (2 rows for more frames)
  const layout: 'row' | 'grid' = frames > 8 ? 'grid' : 'row';
  const framesPerRow = layout === 'grid' ? Math.ceil(frames / 2) : frames;

  return {
    frameWidth,
    frameHeight,
    frames,
    layout: layout as any,
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

  // Calculate frames per row (assuming 2 rows)
  const framesPerRow = Math.ceil(frameCount / 2);

  console.log(`Sprite sheet layout: ${framesPerRow} frames per row, 2 rows`);

  // Extract each frame and collect raw pixels
  const frames: Buffer[] = [];

  for (let i = 0; i < frameCount; i++) {
    // Calculate position for 2-row layout
    const rowIndex = Math.floor(i / framesPerRow);
    const colIndex = i % framesPerRow;
    const x = colIndex * frameWidth;
    const y = rowIndex * frameHeight;

    // Boundary check - skip frames that exceed sprite sheet bounds
    if (x + frameWidth > spriteWidth || y + frameHeight > spriteHeight) {
      console.warn(`Frame ${i} exceeds sprite sheet bounds (${x},${y}), skipping`);
      continue;
    }

    // Extract frame
    const frameBuffer = await sharp(spriteSheetPath)
      .extract({
        left: x,
        top: y,
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
