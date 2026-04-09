// electron/providers/factory.ts

import { AIProvider, ProviderConstructor } from './types';
import { ProviderId } from '../../src/shared/types';
import { OpenAIProvider } from './openai';
import { ComfyUIProvider } from './comfyui';
import { A1111Provider } from './a1111';
import { LocalDiffusersProvider } from './local-diffusers';

const providers: Record<ProviderId, ProviderConstructor> = {
  openai: OpenAIProvider,
  comfyui: ComfyUIProvider,
  a1111: A1111Provider,
  'local-diffusers': LocalDiffusersProvider
};

export function createProvider(providerId: ProviderId, settings: any): AIProvider {
  const ProviderClass = providers[providerId];
  if (!ProviderClass) {
    throw new Error(`Unknown provider: ${providerId}`);
  }
  return new ProviderClass(settings);
}

export function getAllProviderInfo(settings: any): Array<{ id: ProviderId; displayName: string; isConfigured: boolean; isLocal: boolean }> {
  return Object.entries(providers).map(([id, ProviderClass]) => {
    const provider = new ProviderClass(settings[id as ProviderId]);
    return {
      id: id as ProviderId,
      displayName: provider.displayName,
      isConfigured: provider.isConfigured(),
      isLocal: provider.isLocal
    };
  });
}
