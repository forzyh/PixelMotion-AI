// src/ui/components/SettingsView.tsx

import { useState } from 'react';
import { AppSettings, ProviderId } from '../../shared/types';

interface SettingsViewProps {
  settings: AppSettings | null;
  onSettingsChange: (settings: AppSettings) => void;
  onBack: () => void;
  onProvidersRefresh?: () => void;
}

export default function SettingsView({ settings, onSettingsChange, onBack, onProvidersRefresh }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<ProviderId | 'output' | 'pixel'>('openai');
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings || getDefaultSettings());

  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    onSettingsChange(updated);
  };

  // Ensure doubao settings exist (fix for existing users without doubao config)
  const doubaoSettings = localSettings.doubao || getDefaultSettings().doubao;

  const handleSave = async () => {
    await window.electronAPI.saveSettings(localSettings);
    // Refresh provider list to show updated configuration status
    if (onProvidersRefresh) {
      await onProvidersRefresh();
    }
    alert('Settings saved!');
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="h-14 border-b border-gray-700 flex items-center px-4">
        <button onClick={onBack} className="mr-4 text-gray-400 hover:text-white">← Back</button>
        <h1 className="text-lg font-bold">Settings</h1>
      </header>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tabs */}
        <div className="w-48 border-r border-gray-700 p-2">
          <TabButton active={activeTab === 'openai'} onClick={() => setActiveTab('openai')}>OpenAI</TabButton>
          <TabButton active={activeTab === 'doubao'} onClick={() => setActiveTab('doubao')}>Doubao</TabButton>
          <TabButton active={activeTab === 'aliyun'} onClick={() => setActiveTab('aliyun')}>阿里云</TabButton>
          <TabButton active={activeTab === 'comfyui'} onClick={() => setActiveTab('comfyui')}>ComfyUI</TabButton>
          <TabButton active={activeTab === 'a1111'} onClick={() => setActiveTab('a1111')}>A1111</TabButton>
          <TabButton active={activeTab === 'local-diffusers'} onClick={() => setActiveTab('local-diffusers')}>Local Diffusers</TabButton>
          <TabButton active={activeTab === 'output'} onClick={() => setActiveTab('output')}>Output</TabButton>
          <TabButton active={activeTab === 'pixel'} onClick={() => setActiveTab('pixel')}>Pixel Options</TabButton>
        </div>

        {/* Panel */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'openai' && (
            <div className="max-w-md space-y-4">
              <h2 className="text-xl font-bold mb-4">OpenAI Settings</h2>
              <div>
                <label className="block text-sm font-medium mb-1">API Key</label>
                <input
                  type="password"
                  value={localSettings.openai.apiKey}
                  onChange={(e) => handleChange('openai', { ...localSettings.openai, apiKey: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="sk-..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Model Name</label>
                <input
                  type="text"
                  value={localSettings.openai.modelName}
                  onChange={(e) => handleChange('openai', { ...localSettings.openai, modelName: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="dall-e-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Base URL (Optional)</label>
                <input
                  type="text"
                  value={localSettings.openai.baseURL || ''}
                  onChange={(e) => handleChange('openai', { ...localSettings.openai, baseURL: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="https://api.openai.com/v1"
                />
              </div>
            </div>
          )}

          {activeTab === 'doubao' && (
            <div className="max-w-md space-y-4">
              <h2 className="text-xl font-bold mb-4">Doubao Settings</h2>
              <div>
                <label className="block text-sm font-medium mb-1">API Key</label>
                <input
                  type="password"
                  value={doubaoSettings.apiKey}
                  onChange={(e) => handleChange('doubao', { ...doubaoSettings, apiKey: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="300001216:..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">API URL</label>
                <input
                  type="text"
                  value={doubaoSettings.apiUrl}
                  onChange={(e) => handleChange('doubao', { ...doubaoSettings, apiUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="http://ai-service.tal.com/openai-compatible/v1/images/generations"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Model Name</label>
                <input
                  type="text"
                  value={doubaoSettings.modelName}
                  onChange={(e) => handleChange('doubao', { ...doubaoSettings, modelName: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="doubao-seedream-5-0-lite"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Size (Optional)</label>
                <input
                  type="text"
                  value={doubaoSettings.size || ''}
                  onChange={(e) => handleChange('doubao', { ...doubaoSettings, size: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="2560x1440"
                />
              </div>
            </div>
          )}

          {activeTab === 'aliyun' && (
            <div className="max-w-md space-y-4">
              <h2 className="text-xl font-bold mb-4">阿里云 DashScope 设置</h2>
              <div>
                <label className="block text-sm font-medium mb-1">API Key</label>
                <input
                  type="password"
                  value={localSettings.aliyun.apiKey}
                  onChange={(e) => handleChange('aliyun', { ...localSettings.aliyun, apiKey: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="sk-..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  在 <a href="https://dashscope.console.aliyun.com/apiKey" target="_blank" className="text-blue-400 hover:underline">阿里云 DashScope 控制台</a> 获取
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">模型名称</label>
                <input
                  type="text"
                  value={localSettings.aliyun.modelName}
                  onChange={(e) => handleChange('aliyun', { ...localSettings.aliyun, modelName: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="wanx-v1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  支持：wanx-v1, wanx2.1, 或其他 DashScope 文生图模型
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">API 端点</label>
                <input
                  type="text"
                  value={localSettings.aliyun.endpoint}
                  onChange={(e) => handleChange('aliyun', { ...localSettings.aliyun, endpoint: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="https://dashscope.aliyuncs.com"
                />
              </div>
            </div>
          )}

          {activeTab === 'comfyui' && (
            <div className="max-w-md space-y-4">
              <h2 className="text-xl font-bold mb-4">ComfyUI Settings</h2>
              <div>
                <label className="block text-sm font-medium mb-1">Server URL</label>
                <input
                  type="text"
                  value={localSettings.comfyui.serverUrl}
                  onChange={(e) => handleChange('comfyui', { ...localSettings.comfyui, serverUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="http://127.0.0.1:8188"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localSettings.comfyui.useBuiltInWorkflow}
                  onChange={(e) => handleChange('comfyui', { ...localSettings.comfyui, useBuiltInWorkflow: e.target.checked })}
                  className="accent-blue-500"
                />
                <label className="text-sm">Use Built-in Workflow</label>
              </div>
              {!localSettings.comfyui.useBuiltInWorkflow && (
                <div>
                  <label className="block text-sm font-medium mb-1">Workflow JSON</label>
                  <textarea
                    value={localSettings.comfyui.workflowJson}
                    onChange={(e) => handleChange('comfyui', { ...localSettings.comfyui, workflowJson: e.target.value })}
                    className="w-full h-48 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-xs font-mono focus:border-blue-500 focus:outline-none"
                    placeholder='{"1": {...}}'
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'a1111' && (
            <div className="max-w-md space-y-4">
              <h2 className="text-xl font-bold mb-4">Automatic1111 Settings</h2>
              <div>
                <label className="block text-sm font-medium mb-1">Base URL</label>
                <input
                  type="text"
                  value={localSettings.a1111.baseUrl}
                  onChange={(e) => handleChange('a1111', { ...localSettings.a1111, baseUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="http://127.0.0.1:7860"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Steps</label>
                  <input
                    type="number"
                    value={localSettings.a1111.steps}
                    onChange={(e) => handleChange('a1111', { ...localSettings.a1111, steps: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CFG Scale</label>
                  <input
                    type="number"
                    step="0.5"
                    value={localSettings.a1111.cfg}
                    onChange={(e) => handleChange('a1111', { ...localSettings.a1111, cfg: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Denoise Strength</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={localSettings.a1111.denoise}
                    onChange={(e) => handleChange('a1111', { ...localSettings.a1111, denoise: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sampler</label>
                  <input
                    type="text"
                    value={localSettings.a1111.sampler}
                    onChange={(e) => handleChange('a1111', { ...localSettings.a1111, sampler: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
                    placeholder="Euler a"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Checkpoint Name</label>
                <input
                  type="text"
                  value={localSettings.a1111.checkpointName}
                  onChange={(e) => handleChange('a1111', { ...localSettings.a1111, checkpointName: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
                  placeholder="pixel_art_model.safetensors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">LoRA Names (comma-separated)</label>
                <input
                  type="text"
                  value={localSettings.a1111.loraNames}
                  onChange={(e) => handleChange('a1111', { ...localSettings.a1111, loraNames: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
                  placeholder="pixel_lora_1, pixel_lora_2"
                />
              </div>
            </div>
          )}

          {activeTab === 'local-diffusers' && (
            <div className="max-w-md space-y-4">
              <h2 className="text-xl font-bold mb-4">Local Diffusers Settings</h2>
              <div>
                <label className="block text-sm font-medium mb-1">Model Path</label>
                <input
                  type="text"
                  value={localSettings.localDiffusers.modelPath}
                  onChange={(e) => handleChange('localDiffusers', { ...localSettings.localDiffusers, modelPath: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="C:/models/stable-diffusion-v1-5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Device</label>
                <select
                  value={localSettings.localDiffusers.device}
                  onChange={(e) => handleChange('localDiffusers', { ...localSettings.localDiffusers, device: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
                >
                  <option value="cuda">CUDA (NVIDIA GPU)</option>
                  <option value="directml">DirectML (AMD/Intel)</option>
                  <option value="cpu">CPU Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">LoRA Folder Path</label>
                <input
                  type="text"
                  value={localSettings.localDiffusers.loraFolderPath}
                  onChange={(e) => handleChange('localDiffusers', { ...localSettings.localDiffusers, loraFolderPath: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
                  placeholder="C:/models/loras"
                />
              </div>
            </div>
          )}

          {activeTab === 'output' && (
            <div className="max-w-md space-y-4">
              <h2 className="text-xl font-bold mb-4">Output Settings</h2>
              <div>
                <label className="block text-sm font-medium mb-1">Output Folder</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={localSettings.output.folderPath}
                    onChange={(e) => handleChange('output', { ...localSettings.output, folderPath: e.target.value })}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded"
                    placeholder="Leave empty for default"
                  />
                  <button
                    onClick={async () => {
                      const path = await window.electronAPI.selectOutputFolder();
                      if (path) handleChange('output', { ...localSettings.output, folderPath: path });
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
                  >
                    Browse
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pixel' && (
            <div className="max-w-md space-y-4">
              <h2 className="text-xl font-bold mb-4">Pixel Enforcement Options</h2>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localSettings.pixelEnforcement.nearestNeighborOnly}
                  onChange={(e) => handleChange('pixelEnforcement', { ...localSettings.pixelEnforcement, nearestNeighborOnly: e.target.checked })}
                  className="accent-blue-500"
                />
                <label className="text-sm">Nearest-Neighbor Scaling Only</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localSettings.pixelEnforcement.quantizeColors}
                  onChange={(e) => handleChange('pixelEnforcement', { ...localSettings.pixelEnforcement, quantizeColors: e.target.checked })}
                  className="accent-blue-500"
                />
                <label className="text-sm">Quantize Colors</label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Palette Size</label>
                <input
                  type="number"
                  min="2"
                  max="256"
                  value={localSettings.pixelEnforcement.paletteSize}
                  onChange={(e) => handleChange('pixelEnforcement', { ...localSettings.pixelEnforcement, paletteSize: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
                />
              </div>
            </div>
          )}

          <div className="mt-8">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded text-sm mb-1 ${
        active ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'
      }`}
    >
      {children}
    </button>
  );
}

function getDefaultSettings(): AppSettings {
  return {
    openai: { apiKey: '', modelName: 'dall-e-3', baseURL: '' },
    doubao: { apiKey: '', apiUrl: 'http://ai-service.tal.com/openai-compatible/v1/images/generations', modelName: 'doubao-seedream-5-0-lite', size: '2560x1440' },
    aliyun: { apiKey: '', modelName: 'wanx-v1', endpoint: 'https://dashscope.aliyuncs.com' },
    comfyui: { serverUrl: 'http://127.0.0.1:8188', workflowJson: '', useBuiltInWorkflow: true },
    a1111: { baseUrl: 'http://127.0.0.1:7860', steps: 20, cfg: 7, denoise: 0.75, sampler: 'Euler a', checkpointName: '', loraNames: '' },
    localDiffusers: { modelPath: '', device: 'cuda', loraFolderPath: '' },
    output: { folderPath: '' },
    pixelEnforcement: { nearestNeighborOnly: true, quantizeColors: true, paletteSize: 32 },
    selectedProviderId: 'aliyun'
  };
}
