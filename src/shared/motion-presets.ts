// src/shared/motion-presets.ts

import { MotionPreset } from './types';

export const MOTION_PRESETS: MotionPreset[] = [
  {
    id: 'idle',
    name: 'Idle',
    description: 'Breathing loop with subtle secondary motion',
    defaultFrames: 8,
    motionPrompt: 'subtle breathing animation, slight cloak or scarf secondary motion, idle stance, minimal movement'
  },
  {
    id: 'run',
    name: 'Run',
    description: 'Cyclical running movement',
    defaultFrames: 8,
    motionPrompt: 'running cycle, readable leg separation, consistent silhouette, arms pumping, full stride'
  },
  {
    id: 'jump-up',
    name: 'Jump Up',
    description: 'Takeoff to ascent phase',
    defaultFrames: 8,
    motionPrompt: 'jump takeoff, anticipation squat, launch upward, clear arc, arms reaching up'
  },
  {
    id: 'jump-fall',
    name: 'Jump Fall',
    description: 'Descent from apex',
    defaultFrames: 8,
    motionPrompt: 'falling descent, arms flailing slightly, body rotating forward, preparing for landing'
  },
  {
    id: 'land',
    name: 'Land',
    description: 'Landing impact and recovery',
    defaultFrames: 8,
    motionPrompt: 'landing impact, crouch deep, recover to stand, dust particles, weight settling'
  },
  {
    id: 'attack-1',
    name: 'Attack 1',
    description: 'Primary attack animation',
    defaultFrames: 8,
    motionPrompt: 'main attack wind-up, strike extension, follow-through, weapon or fist motion'
  },
  {
    id: 'hit',
    name: 'Hit',
    description: 'Damage reaction',
    defaultFrames: 8,
    motionPrompt: 'hit reaction, recoil backward, stagger, recover balance, pain expression'
  },
  {
    id: 'death',
    name: 'Death',
    description: 'Collapse animation',
    defaultFrames: 8,
    motionPrompt: 'death collapse, fall to ground, final pose, still at end'
  },
  {
    id: 'attack-2',
    name: 'Attack 2',
    description: 'Combo follow-up attack',
    defaultFrames: 8,
    motionPrompt: 'combo follow-up attack, quicker wind-up, horizontal strike, chain from attack 1'
  },
  {
    id: 'attack-3',
    name: 'Attack 3',
    description: 'Combo finisher',
    defaultFrames: 8,
    motionPrompt: 'combo finisher, powerful overhead strike, slam down, final pose hold'
  },
  {
    id: 'dash',
    name: 'Dash',
    description: 'Quick burst movement',
    defaultFrames: 8,
    motionPrompt: 'dash burst, speed lines, low profile pose, quick settle, forward momentum'
  },
  {
    id: 'slide',
    name: 'Slide/Skid',
    description: 'Stopping motion',
    defaultFrames: 8,
    motionPrompt: 'skid stop, feet sliding, dust cloud, settle to stand, momentum bleed'
  },
  {
    id: 'crouch',
    name: 'Crouch',
    description: 'Ducking animation',
    defaultFrames: 8,
    motionPrompt: 'crouch down, lower silhouette, alert stance, ready position'
  },
  {
    id: 'climb',
    name: 'Climb/Ledge Grab',
    description: 'Ledge climbing action',
    defaultFrames: 8,
    motionPrompt: 'ledge grab hang, pull up, swing leg over, stand on ledge'
  }
];

export function getMotionPresetById(id: string): MotionPreset | undefined {
  return MOTION_PRESETS.find(p => p.id === id);
}
