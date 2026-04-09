// src/ui/App.tsx

import { useState, useEffect } from 'react';
import { MOTION_PRESETS, getMotionPresetById } from '../shared/motion-presets';
import { AppSettings, ProviderId, GenerateRequest, HistoryEntry } from '../shared/types';
import { buildBasePrompt } from '../shared/prompt-templates';
import MotionList from './components/MotionList';
import ImageUploader from './components/ImageUploader';
import PromptEditor from './components/PromptEditor';
import ProviderSelector from './components/ProviderSelector';
import OutputPanel from './components/OutputPanel';
import SettingsView from './components/SettingsView';
import HistoryView from './components/HistoryView';

type View = 'home' | 'settings' | 'history';

export default function App() {
  const [currentView, setCurrentView] = useState<View | string>('home');
  const [selectedMotions, setSelectedMotions] = useState<string[]>([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImagePath, setUploadedImagePath] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [providers, setProviders] = useState<Array<{ id: ProviderId; displayName: string; isConfigured: boolean; isLocal: boolean }>>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<ProviderId>('openai');
  const [frameCount, setFrameCount] = useState(8);
  const [frameWidth, setFrameWidth] = useState(32);
  const [frameHeight, setFrameHeight] = useState(32);
  const [extraInstructions, setExtraInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<{ outputPath: string; jsonPath: string; gifPath?: string } | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Load settings and providers on mount
  useEffect(() => {
    if (!window.electronAPI) {
      console.error('electronAPI not available');
      return;
    }
    window.electronAPI.getSettings().then(setSettings);
    window.electronAPI.getProviders().then(setProviders);
    window.electronAPI.getHistory().then(setHistory);
  }, []);

  // Update selected provider from settings
  useEffect(() => {
    if (settings?.selectedProviderId) {
      setSelectedProviderId(settings.selectedProviderId);
    }
  }, [settings]);

  // Auto-set frame dimensions based on uploaded image
  useEffect(() => {
    if (uploadedImage) {
      const img = new Image();
      img.onload = () => {
        setFrameWidth(img.width);
        setFrameHeight(img.height);
      };
      img.src = uploadedImage;
    }
  }, [uploadedImage]);

  const handleGenerate = async () => {
    if (!uploadedImagePath || selectedMotions.length === 0) {
      alert('Please upload an image and select at least one motion');
      return;
    }

    setIsGenerating(true);
    setGenerationResult(null);

    const motionPreset = getMotionPresetById(selectedMotions[0]);
    if (!motionPreset) return;

    const request: GenerateRequest = {
      providerId: selectedProviderId,
      inputImagePath: uploadedImagePath,
      motionPreset,
      frameCount: frameCount || motionPreset.defaultFrames,
      frameWidth,
      frameHeight,
      basePrompt: buildBasePrompt(),
      motionPrompt: motionPreset.motionPrompt,
      extraInstructions
    };

    const result = await window.electronAPI.generate(request);

    setIsGenerating(false);

    if (result.success && result.outputPath && result.jsonPath) {
      setGenerationResult({ outputPath: result.outputPath, jsonPath: result.jsonPath });
      // Refresh history
      const updatedHistory = await window.electronAPI.getHistory();
      setHistory(updatedHistory);
    } else {
      alert(`Generation failed: ${result.error}`);
    }
  };

  const handleCancel = async () => {
    await window.electronAPI.cancelGeneration();
    setIsGenerating(false);
  };

  if (currentView === 'settings') {
    return (
      <SettingsView
        settings={settings}
        onSettingsChange={setSettings}
        onBack={() => setCurrentView('home')}
        onProvidersRefresh={async () => {
          const updatedProviders = await window.electronAPI.getProviders();
          setProviders(updatedProviders);
        }}
      />
    );
  }

  if (currentView === 'history') {
    return <HistoryView entries={history} onBack={() => setCurrentView('home')} onDelete={(id) => {
      window.electronAPI.deleteHistoryEntry(id);
      setHistory(history.filter(h => h.id !== id));
    }} />;
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="h-14 border-b border-gray-700 flex items-center px-4 justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-lg font-bold">PixelMotion AI</h1>
          <nav className="flex gap-2">
            <button
              className={`px-3 py-1.5 rounded text-sm ${currentView === 'home' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-700'}`}
              onClick={() => setCurrentView('home')}
            >
              Home
            </button>
            <button
              className={`px-3 py-1.5 rounded text-sm ${currentView === 'history' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-700'}`}
              onClick={() => setCurrentView('history')}
            >
              History
            </button>
            <button
              className={`px-3 py-1.5 rounded text-sm ${currentView === 'settings' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-700'}`}
              onClick={() => setCurrentView('settings')}
            >
              Settings
            </button>
          </nav>
        </div>
        <div className="text-xs text-gray-400">
          {providers.find(p => p.id === selectedProviderId)?.isLocal ? '🟢 Offline Mode' : '☁️ Cloud Mode'}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left: Motion List */}
        <MotionList
          presets={MOTION_PRESETS}
          selectedIds={selectedMotions}
          onToggle={(id) => {
            setSelectedMotions(prev =>
              prev.includes(id) ? prev.filter(m => m !== id) : [id]
            );
          }}
        />

        {/* Center: Image Upload + Preview */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-shrink-0">
            <ImageUploader
              image={uploadedImage}
              onImageSelect={(dataUrl, path) => {
                setUploadedImage(dataUrl);
                setUploadedImagePath(path);
              }}
            />
          </div>

          {/* Prompt Editor + Provider */}
          <div className="flex-1 flex min-h-0 overflow-hidden">
            <PromptEditor
              selectedMotionId={selectedMotions[0]}
              frameCount={frameCount}
              frameWidth={frameWidth}
              frameHeight={frameHeight}
              extraInstructions={extraInstructions}
              onFrameCountChange={setFrameCount}
              onFrameWidthChange={setFrameWidth}
              onFrameHeightChange={setFrameHeight}
              onExtraInstructionsChange={setExtraInstructions}
            />
            <ProviderSelector
              providers={providers}
              selectedProviderId={selectedProviderId}
              onSelect={setSelectedProviderId}
              onPing={(id) => window.electronAPI.pingProvider(id)}
            />
          </div>

          {/* Output Panel */}
          <div className="flex-shrink-0">
            <OutputPanel
              isGenerating={isGenerating}
              result={generationResult}
              onGenerate={handleGenerate}
              onCancel={handleCancel}
              canGenerate={!!uploadedImagePath && selectedMotions.length > 0}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
