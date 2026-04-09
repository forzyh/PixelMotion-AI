// src/ui/components/OutputPanel.tsx

interface OutputPanelProps {
  isGenerating: boolean;
  result: { outputPath: string; jsonPath: string } | null;
  onGenerate: () => void;
  onCancel: () => void;
  canGenerate: boolean;
}

export default function OutputPanel({ isGenerating, result, onGenerate, onCancel, canGenerate }: OutputPanelProps) {
  return (
    <div className="h-32 border-t border-gray-700 p-4 flex items-center justify-between">
      <div className="flex-1">
        {isGenerating ? (
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <div>
              <div className="font-medium">Generating sprite sheet...</div>
              <div className="text-sm text-gray-400">This may take 30-60 seconds</div>
            </div>
          </div>
        ) : result ? (
          <div>
            <div className="font-medium text-green-400">Generation complete!</div>
            <div className="text-sm text-gray-400">Saved to output folder</div>
          </div>
        ) : (
          <div className="text-gray-500">
            {canGenerate
              ? 'Click Generate to create sprite sheet'
              : 'Upload an image and select a motion to begin'}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {isGenerating ? (
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-medium text-sm"
          >
            Cancel
          </button>
        ) : (
          <>
            {result && (
              <>
                <button
                  onClick={() => require('electron').shell.showItemInFolder(result.outputPath)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-medium text-sm"
                >
                  Open Folder
                </button>
                <button
                  onClick={() => window.open(result.outputPath)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-medium text-sm"
                >
                  Open Image
                </button>
              </>
            )}
            <button
              onClick={onGenerate}
              disabled={!canGenerate}
              className={`px-6 py-2 rounded font-medium text-sm ${
                canGenerate
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              Generate
            </button>
          </>
        )}
      </div>
    </div>
  );
}
