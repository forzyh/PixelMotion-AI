// src/ui/components/ProviderSelector.tsx

import { ProviderId } from '../../shared/types';

interface ProviderSelectorProps {
  providers: Array<{ id: ProviderId; displayName: string; isConfigured: boolean; isLocal: boolean }>;
  selectedProviderId: ProviderId;
  onSelect: (id: ProviderId) => void;
  onPing: (id: ProviderId) => Promise<{ success: boolean; error?: string }>;
}

export default function ProviderSelector({ providers, selectedProviderId, onSelect, onPing }: ProviderSelectorProps) {
  return (
    <div className="w-64 p-4 border-l border-gray-700 flex-shrink-0">
      <h2 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">AI Provider</h2>

      <div className="space-y-2">
        {providers.map(provider => (
          <div
            key={provider.id}
            className={`p-3 rounded border transition-colors ${
              selectedProviderId === provider.id
                ? 'bg-blue-600/20 border-blue-500/50'
                : 'bg-gray-800 border-gray-700 hover:border-gray-600'
            }`}
          >
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="provider"
                checked={selectedProviderId === provider.id}
                onChange={() => onSelect(provider.id)}
                className="mt-0.5 accent-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-sm">{provider.displayName}</div>
                <div className="text-xs text-gray-500">
                  {provider.isLocal ? 'Local / Offline' : 'Cloud'}
                </div>
                {!provider.isConfigured && (
                  <div className="text-xs text-amber-500 mt-1">Not configured</div>
                )}
              </div>
            </label>
            {provider.isLocal && (
              <button
                onClick={async () => {
                  const result = await onPing(provider.id);
                  alert(result.success ? 'Connection successful!' : `Connection failed: ${result.error}`);
                }}
                className="mt-2 w-full px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
              >
                Ping Server
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-gray-800 rounded border border-gray-700">
        <div className="text-xs text-gray-400">
          {providers.find(p => p.id === selectedProviderId)?.isLocal
            ? '🟢 Local mode - images stay on your machine'
            : '☁️ Cloud mode - images sent to external API'}
        </div>
      </div>
    </div>
  );
}
