// src/ui/components/PromptEditor.tsx

import { getMotionPresetById } from '../../shared/motion-presets';
import { buildBasePrompt } from '../../shared/prompt-templates';

interface PromptEditorProps {
  selectedMotionId: string | undefined;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  extraInstructions: string;
  onFrameCountChange: (value: number) => void;
  onFrameWidthChange: (value: number) => void;
  onFrameHeightChange: (value: number) => void;
  onExtraInstructionsChange: (value: string) => void;
}

export default function PromptEditor({
  selectedMotionId,
  frameCount,
  frameWidth,
  frameHeight,
  extraInstructions,
  onFrameCountChange,
  onFrameWidthChange,
  onFrameHeightChange,
  onExtraInstructionsChange
}: PromptEditorProps) {
  const motionPreset = selectedMotionId ? getMotionPresetById(selectedMotionId) : null;
  const basePrompt = buildBasePrompt();

  return (
    <div className="flex-1 p-4 overflow-y-auto border-r border-gray-700 min-w-80">
      <h2 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Prompt Settings</h2>

      <div className="space-y-4">
        {/* Base Style (read-only preview) */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">Base Style (locked)</label>
          <textarea
            value={basePrompt}
            readOnly
            className="w-full h-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-xs text-gray-400 resize-none"
          />
        </div>

        {/* Motion Prompt */}
        {motionPreset && (
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Motion: {motionPreset.name}</label>
            <textarea
              value={motionPreset.motionPrompt}
              readOnly
              className="w-full h-16 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-xs text-gray-400 resize-none"
            />
          </div>
        )}

        {/* Frame Settings */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Frames</label>
            <input
              type="number"
              min={1}
              max={64}
              value={frameCount}
              onChange={(e) => onFrameCountChange(parseInt(e.target.value) || 8)}
              className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Width</label>
            <input
              type="number"
              min={8}
              max={512}
              value={frameWidth}
              onChange={(e) => onFrameWidthChange(parseInt(e.target.value) || 32)}
              className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Height</label>
            <input
              type="number"
              min={8}
              max={512}
              value={frameHeight}
              onChange={(e) => onFrameHeightChange(parseInt(e.target.value) || 32)}
              className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm"
            />
          </div>
        </div>

        {/* Extra Instructions */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">Extra Instructions</label>
          <textarea
            value={extraInstructions}
            onChange={(e) => onExtraInstructionsChange(e.target.value)}
            placeholder="Add any additional instructions..."
            className="w-full h-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-xs resize-none focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
