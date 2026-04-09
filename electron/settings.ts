// electron/settings.ts

import Store from 'electron-store';
import { AppSettings, ProviderId } from '../src/shared/types';

const defaultSettings: AppSettings = {
  openai: {
    apiKey: '',
    modelName: 'dall-e-3',
    baseURL: ''
  },
  doubao: {
    apiKey: '',
    apiUrl: 'http://ai-service.tal.com/openai-compatible/v1/images/generations',
    modelName: 'doubao-seedream-5-0-lite',
    size: '2560x1440'
  },
  comfyui: {
    serverUrl: 'http://127.0.0.1:8188',
    workflowJson: '',
    useBuiltInWorkflow: true
  },
  a1111: {
    baseUrl: 'http://127.0.0.1:7860',
    steps: 20,
    cfg: 7,
    denoise: 0.75,
    sampler: 'Euler a',
    checkpointName: '',
    loraNames: ''
  },
  localDiffusers: {
    modelPath: '',
    device: 'cuda',
    loraFolderPath: ''
  },
  output: {
    folderPath: ''
  },
  pixelEnforcement: {
    nearestNeighborOnly: true,
    quantizeColors: true,
    paletteSize: 32
  },
  selectedProviderId: 'openai'
};

const store = new Store<AppSettings>({
  name: 'settings',
  defaults: defaultSettings
});

// Ensure doubao settings exist for existing users and save back to store
function ensureDoubaoSettings(settings: any): AppSettings {
  if (!settings.doubao) {
    settings.doubao = defaultSettings.doubao;
    // Save back to store to persist the change
    store.set('doubao', defaultSettings.doubao);
  }
  return settings as AppSettings;
}

export function getSettings(): AppSettings {
  return ensureDoubaoSettings(store.store);
}

export function saveSettings(settings: AppSettings): void {
  store.set(settings);
}

export function getProviderSettings(providerId: ProviderId): any {
  const settings = store.store;
  switch (providerId) {
    case 'openai': return settings.openai;
    case 'doubao': return settings.doubao;
    case 'comfyui': return settings.comfyui;
    case 'a1111': return settings.a1111;
    case 'local-diffusers': return settings.localDiffusers;
    default: return defaultSettings[providerId];
  }
}
