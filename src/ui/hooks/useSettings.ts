// src/ui/hooks/useSettings.ts

import { useState, useEffect, useCallback } from 'react';
import { AppSettings } from '../../shared/types';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    const s = await window.electronAPI.getSettings();
    setSettings(s);
    setLoading(false);
  }, []);

  const saveSettings = useCallback(async (newSettings: AppSettings) => {
    await window.electronAPI.saveSettings(newSettings);
    setSettings(newSettings);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return { settings, loading, saveSettings };
}
