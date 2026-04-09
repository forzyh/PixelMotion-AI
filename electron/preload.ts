// electron/preload.ts

import { contextBridge, ipcRenderer } from 'electron';
import { AppSettings, GenerateRequest, HistoryEntry, ProviderId } from '../src/shared/types';

contextBridge.exposeInMainWorld('electronAPI', {
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: AppSettings) => ipcRenderer.invoke('save-settings', settings),

  // Providers
  getProviders: () => ipcRenderer.invoke('get-providers'),
  pingProvider: (providerId: ProviderId) => ipcRenderer.invoke('ping-provider', providerId),

  // Generation
  generate: (request: GenerateRequest) => ipcRenderer.invoke('generate', request),
  cancelGeneration: () => ipcRenderer.invoke('cancel-generation'),

  // History
  getHistory: () => ipcRenderer.invoke('get-history'),
  deleteHistoryEntry: (id: string) => ipcRenderer.invoke('delete-history-entry', id),

  // File operations
  selectOutputFolder: () => ipcRenderer.invoke('select-output-folder'),
  getDefaultOutputFolder: () => ipcRenderer.invoke('get-default-output-folder'),
  showItemInFolder: (path: string) => ipcRenderer.invoke('show-item-in-folder', path)
});
