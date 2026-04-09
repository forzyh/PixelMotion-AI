// src/shared/prompt-templates.ts

import { MotionPreset } from './types';

const PIXEL_CONSTRAINTS = [
  '2D pixel art sprite sheet',
  'side view, facing right',
  'crisp pixels, no blur, no anti-aliasing',
  'consistent character proportions across all frames',
  'plain transparent background',
  'retro game art style, 16-bit aesthetic'
];

const LAYOUT_INSTRUCTION = 'Arrange frames in a single horizontal row';

export interface PromptOptions {
  motionPreset: MotionPreset;
  frameCount: number;
  extraInstructions?: string;
  characterDescription?: string;
}

export function buildBasePrompt(): string {
  return PIXEL_CONSTRAINTS.join(', ');
}

export function buildFullPrompt(options: PromptOptions): string {
  const parts = [
    buildBasePrompt(),
    LAYOUT_INSTRUCTION + ` of ${options.frameCount} frames`,
    options.motionPreset.motionPrompt
  ];

  if (options.characterDescription) {
    parts.push(options.characterDescription);
  }

  if (options.extraInstructions) {
    parts.push(options.extraInstructions);
  }

  return parts.join(', ');
}

export function buildNegativePrompt(): string {
  return [
    'blurry, smooth, gradient, anti-aliased, painterly',
    '3D render, photorealistic, shading',
    'multiple characters, cluttered background',
    'text, watermark, signature',
    'distorted proportions, extra limbs',
    'vertical layout, grid layout'
  ].join(', ');
}
