// src/ui/components/HistoryView.tsx

import { HistoryEntry } from '../../shared/types';

interface HistoryViewProps {
  entries: HistoryEntry[];
  onBack: () => void;
  onDelete: (id: string) => void;
}

export default function HistoryView({ entries, onBack, onDelete }: HistoryViewProps) {
  return (
    <div className="flex-1 flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="h-14 border-b border-gray-700 flex items-center px-4 justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-400 hover:text-white">← Back</button>
          <h1 className="text-lg font-bold">History</h1>
        </div>
        <div className="text-sm text-gray-400">{entries.length} generations</div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {entries.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <div className="text-lg">No generations yet</div>
            <div className="text-sm">Your sprite sheets will appear here</div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {entries.map(entry => (
              <div
                key={entry.id}
                className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden group"
              >
                <div className="aspect-video bg-gray-900 flex items-center justify-center overflow-hidden">
                  <img
                    src={`file://${entry.thumbnailPath}`}
                    alt={entry.motionPresetId}
                    className="w-full h-full object-contain"
                    style={{ imageRendering: 'pixelated' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="p-3">
                  <div className="font-medium text-sm truncate">{entry.motionPresetId}</div>
                  <div className="text-xs text-gray-500">{new Date(entry.createdAt).toLocaleDateString()}</div>
                  <div className="text-xs text-gray-600 mt-1">{entry.metadata?.frames} frames</div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => window.open(`file://${entry.outputPath}`)}
                      className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this entry?')) onDelete(entry.id);
                      }}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
