// src/ui/hooks/useHistory.ts

import { useState, useEffect, useCallback } from 'react';
import { HistoryEntry } from '../../shared/types';

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    const history = await window.electronAPI.getHistory();
    setEntries(history);
    setLoading(false);
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    await window.electronAPI.deleteHistoryEntry(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return { entries, loading, deleteEntry, refresh: loadHistory };
}
