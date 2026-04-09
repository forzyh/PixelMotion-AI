// src/ui/hooks/useProvider.ts

import { useState, useEffect, useCallback } from 'react';
import { ProviderId, ProviderInfo } from '../../shared/types';

export function useProvider() {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<ProviderId>('openai');

  const loadProviders = useCallback(async () => {
    const prows = await window.electronAPI.getProviders();
    setProviders(prows);
  }, []);

  const pingProvider = useCallback(async (providerId: ProviderId) => {
    return await window.electronAPI.pingProvider(providerId);
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  return { providers, selectedProviderId, setSelectedProviderId, pingProvider };
}
