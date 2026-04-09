// src/ui/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Development mode polyfill for window.electronAPI
if (typeof window !== 'undefined' && !window.electronAPI) {
  window.electronAPI = {
    getSettings: async () => ({
      openai: { apiKey: '', modelName: 'dall-e-3' },
      doubao: { apiKey: '', apiUrl: 'http://ai-service.tal.com/openai-compatible/v1/images/generations', modelName: 'doubao-seedream-5-0-lite', size: '2560x1440' },
      aliyun: { apiKey: '', modelName: 'wanx-v1' },
      comfyui: { serverUrl: 'http://127.0.0.1:8188', workflowJson: '', useBuiltInWorkflow: true },
      a1111: { baseUrl: 'http://127.0.0.1:7860', steps: 20, cfg: 7, denoise: 0.6, sampler: 'DPM++ 2M Karras' },
      'local-diffusers': { modelPath: '', device: 'cuda' as const },
      output: { folderPath: '' },
      pixelEnforcement: { nearestNeighborOnly: true, quantizeColors: true, paletteSize: 32 },
      selectedProviderId: 'aliyun' as const
    }),
    saveSettings: async () => {},
    getProviders: async () => [
      { id: 'openai' as const, displayName: 'OpenAI', isConfigured: false, isLocal: false },
      { id: 'doubao' as const, displayName: 'Doubao (ByteDance)', isConfigured: false, isLocal: false },
      { id: 'aliyun' as const, displayName: '阿里云', isConfigured: false, isLocal: false },
      { id: 'comfyui' as const, displayName: 'ComfyUI', isConfigured: false, isLocal: true },
      { id: 'a1111' as const, displayName: 'A1111', isConfigured: false, isLocal: true },
      { id: 'local-diffusers' as const, displayName: 'Local Diffusers', isConfigured: false, isLocal: true }
    ],
    generate: async () => ({ success: false, error: 'Development mode - Electron not available' }),
    cancelGeneration: async () => {},
    pingProvider: async () => ({ success: false, error: 'Development mode' }),
    getHistory: async () => [],
    deleteHistoryEntry: async () => {},
    selectOutputFolder: async () => '',
    getDefaultOutputFolder: async () => '',
    showItemInFolder: async () => {}
  };
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
