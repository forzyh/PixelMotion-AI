// src/ui/components/MotionList.tsx

import { MotionPreset } from '../../shared/types';

interface MotionListProps {
  presets: MotionPreset[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export default function MotionList({ presets, selectedIds, onToggle }: MotionListProps) {
  return (
    <div className="w-64 border-r border-gray-700 overflow-y-auto p-4 flex-shrink-0">
      <h2 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Motion Presets</h2>
      <div className="space-y-1">
        {presets.map(preset => (
          <label
            key={preset.id}
            className={`flex items-start gap-2 p-2 rounded cursor-pointer transition-colors ${
              selectedIds.includes(preset.id)
                ? 'bg-blue-600/20 border border-blue-500/50'
                : 'hover:bg-gray-800 border border-transparent'
            }`}
          >
            <input
              type="radio"
              name="motion"
              checked={selectedIds.includes(preset.id)}
              onChange={() => onToggle(preset.id)}
              className="mt-0.5 accent-blue-500"
            />
            <div>
              <div className="font-medium text-sm">{preset.name}</div>
              <div className="text-xs text-gray-500">{preset.description}</div>
              <div className="text-xs text-gray-600 mt-1">{preset.defaultFrames} frames</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
