// src/ui/components/ImageUploader.tsx

import { useCallback, useState } from 'react';

interface ImageUploaderProps {
  image: string | null;
  onImageSelect: (dataUrl: string, filePath: string) => void;
}

export default function ImageUploader({ image, onImageSelect }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      await processFile(file);
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    // Read as data URL for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      // Save to app data directory and return path
      // For now, we'll use a temp approach - the main process handles actual file paths
      onImageSelect(dataUrl, file.path || '');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="h-48 border-b border-gray-700 p-4">
      <div
        className={`h-full border-2 border-dashed rounded-lg flex items-center justify-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-gray-600 hover:border-gray-500'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {image ? (
          <div className="flex items-center gap-4">
            <img src={image} alt="Uploaded sprite" className="h-24 w-auto" style={{ imageRendering: 'pixelated' }} />
            <div>
              <div className="font-medium">Image loaded</div>
              <div className="text-sm text-gray-400">Drop a new image to replace</div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-lg font-medium">Drop pixel character PNG here</div>
            <div className="text-sm text-gray-400 mt-1">or click to browse</div>
            <label className="inline-block mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded cursor-pointer text-sm">
              Browse Files
              <input type="file" accept="image/png" onChange={handleFileSelect} className="hidden" />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
