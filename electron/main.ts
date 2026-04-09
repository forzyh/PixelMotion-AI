// electron/main.ts

import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { getSettings, saveSettings, getProviderSettings } from './settings';
import { createProvider, getAllProviderInfo } from './providers/factory';
import { GenerateRequest, GenerateResult, HistoryEntry, SpriteSheetMetadata } from '../src/shared/types';
import { postProcessImage, createSpriteSheetMetadata, saveMetadata, createThumbnail } from './postprocess';
import { addToHistory, getHistory, deleteHistoryEntry } from './history';

let mainWindow: BrowserWindow | null = null;
let currentGeneration: { cancel: () => void } | null = null;
let generationCancelled = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // Development fallback: try common dev server ports
    const devServerUrl = process.env.VITE_RENDERER_URL || 'http://localhost:5174';
    mainWindow.loadURL(devServerUrl);
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('get-settings', () => getSettings());
ipcMain.handle('save-settings', (_, settings) => saveSettings(settings));

ipcMain.handle('get-providers', () => {
  const settings = getSettings();
  return getAllProviderInfo(settings);
});

ipcMain.handle('ping-provider', async (_, providerId) => {
  const settings = getProviderSettings(providerId);
  const provider = createProvider(providerId, settings);
  if (provider.ping) {
    return await provider.ping();
  }
  return { success: true };
});

ipcMain.handle('generate', async (_, request: GenerateRequest): Promise<GenerateResult> => {
  generationCancelled = false;

  try {
    const settings = getProviderSettings(request.providerId);
    const provider = createProvider(request.providerId, settings);

    if (!provider.isConfigured()) {
      return { success: false, error: `Provider ${request.providerId} is not configured` };
    }

    // Build full prompt
    const fullPrompt = `${request.basePrompt}, ${request.motionPrompt}${request.extraInstructions ? ', ' + request.extraInstructions : ''}`;

    // Set up cancellation
    const controller = new AbortController();
    currentGeneration = { cancel: () => {
      generationCancelled = true;
      controller.abort();
    }};

    // Generate image via provider
    const result = await provider.generateSpriteSheet(
      request.inputImagePath,
      fullPrompt,
      {
        frameCount: request.frameCount,
        frameWidth: request.frameWidth,
        frameHeight: request.frameHeight,
        negativePrompt: 'blurry, smooth, 3D, photorealistic',
        extraInstructions: request.extraInstructions
      }
    );

    if (generationCancelled) {
      return { success: false, error: 'Generation cancelled by user' };
    }

    // Ensure output folder exists
    const outputSettings = getSettings();
    if (!outputSettings.output.folderPath) {
      outputSettings.output.folderPath = await getDefaultOutputFolder();
      saveSettings(outputSettings);
    }

    await fs.promises.mkdir(outputSettings.output.folderPath, { recursive: true });

    // Post-process
    const pixelSettings = getSettings().pixelEnforcement;
    const finalPath = path.join(
      outputSettings.output.folderPath,
      `sprite_${Date.now()}.png`
    );

    await postProcessImage(result.imagePath, finalPath, {
      nearestNeighbor: pixelSettings.nearestNeighborOnly,
      quantizeColors: pixelSettings.quantizeColors,
      paletteSize: pixelSettings.paletteSize
    });

    // Create metadata
    const metadata: SpriteSheetMetadata = createSpriteSheetMetadata(
      request.frameWidth,
      request.frameHeight,
      request.frameCount,
      request.providerId,
      fullPrompt
    );

    const jsonPath = finalPath.replace('.png', '.json');
    await saveMetadata(metadata, jsonPath);

    // Create thumbnail for history
    const thumbnailPath = finalPath.replace('.png', '_thumb.png');
    await createThumbnail(finalPath, thumbnailPath);

    // Add to history
    const historyEntry: HistoryEntry = {
      id: Date.now().toString(),
      thumbnailPath,
      outputPath: finalPath,
      jsonPath,
      providerId: request.providerId,
      motionPresetId: request.motionPreset.id,
      prompt: fullPrompt,
      metadata,
      createdAt: new Date().toISOString()
    };

    addToHistory(historyEntry);

    currentGeneration = null;

    return {
      success: true,
      outputPath: finalPath,
      jsonPath,
      metadata
    };
  } catch (error) {
    currentGeneration = null;
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

ipcMain.handle('cancel-generation', () => {
  if (currentGeneration) {
    currentGeneration.cancel();
    currentGeneration = null;
  }
});

ipcMain.handle('get-history', () => getHistory());

ipcMain.handle('delete-history-entry', (_, id) => deleteHistoryEntry(id));

ipcMain.handle('show-item-in-folder', (_, filePath: string) => {
  shell.showItemInFolder(filePath);
});

ipcMain.handle('select-output-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory']
  });
  return result.filePaths[0];
});

async function getDefaultOutputFolder(): Promise<string> {
  return path.join(app.getPath('documents'), 'PixelMotion', 'output');
}

ipcMain.handle('get-default-output-folder', getDefaultOutputFolder);
