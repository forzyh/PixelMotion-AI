// src/shared/types.ts

// Motion preset definition
export interface MotionPreset {
  id: string;
  name: string;
  description: string;
  defaultFrames: number;
  motionPrompt: string;
}

// AI Provider metadata
export interface ProviderInfo {
  id: ProviderId;
  displayName: string;
  isConfigured: boolean;
  isLocal: boolean;
}

export type ProviderId = 'openai' | 'comfyui' | 'a1111' | 'local-diffusers' | 'aliyun' | 'doubao';

// Generation request from UI to main process
export interface GenerateRequest {
  providerId: ProviderId;
  inputImagePath: string;
  motionPreset: MotionPreset;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  basePrompt: string;
  motionPrompt: string;
  extraInstructions: string;
}

// Generation result
export interface GenerateResult {
  success: boolean;
  outputPath?: string;
  jsonPath?: string;
  error?: string;
  metadata?: SpriteSheetMetadata;
}

// Sprite sheet metadata
export interface SpriteSheetMetadata {
  frameWidth: number;
  frameHeight: number;
  frames: number;
  layout: 'row' | 'column' | 'grid';
  suggestedPivot: { x: number; y: number };
  providerId: ProviderId;
  prompt: string;
  generatedAt: string;
}

// Settings structure
export interface AppSettings {
  openai: {
    apiKey: string;
    modelName: string;
    baseURL?: string;
  };
  doubao: {
    apiKey: string;
    apiUrl: string;
    modelName: string;
    size?: string;
  };
  aliyun: {
    apiKey: string;
    modelName: string;
    endpoint?: string;
  };
  comfyui: {
    serverUrl: string;
    workflowJson: string;
    useBuiltInWorkflow: boolean;
  };
  a1111: {
    baseUrl: string;
    steps: number;
    cfg: number;
    denoise: number;
    sampler: string;
    checkpointName: string;
    loraNames: string;
  };
  localDiffusers: {
    modelPath: string;
    device: 'cuda' | 'directml' | 'cpu';
    loraFolderPath: string;
  };
  output: {
    folderPath: string;
  };
  pixelEnforcement: {
    nearestNeighborOnly: boolean;
    quantizeColors: boolean;
    paletteSize: number;
  };
  selectedProviderId: ProviderId;
}

// History entry
export interface HistoryEntry {
  id: string;
  thumbnailPath: string;
  outputPath: string;
  jsonPath: string;
  providerId: ProviderId;
  motionPresetId: string;
  prompt: string;
  metadata: SpriteSheetMetadata;
  createdAt: string;
}

// IPC Channel types
export type IPCChannels =
  | 'get-settings'
  | 'save-settings'
  | 'get-providers'
  | 'generate'
  | 'cancel-generation'
  | 'ping-provider'
  | 'get-history'
  | 'delete-history-entry'
  | 'select-output-folder'
  | 'get-default-output-folder';

// Window API interface
export interface WindowAPI {
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: AppSettings) => Promise<void>;
  getProviders: () => Promise<ProviderInfo[]>;
  pingProvider: (providerId: ProviderId) => Promise<{ success: boolean; error?: string }>;
  generate: (request: GenerateRequest) => Promise<GenerateResult>;
  cancelGeneration: () => Promise<void>;
  getHistory: () => Promise<HistoryEntry[]>;
  deleteHistoryEntry: (id: string) => Promise<void>;
  selectOutputFolder: () => Promise<string>;
  getDefaultOutputFolder: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI: WindowAPI;
  }
}
