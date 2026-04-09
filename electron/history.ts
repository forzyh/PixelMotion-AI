// electron/history.ts

import Store from 'electron-store';
import { HistoryEntry } from '../src/shared/types';
import * as fs from 'fs';

const store = new Store<{ history: HistoryEntry[] }>({
  name: 'history',
  defaults: { history: [] }
});

export function getHistory(): HistoryEntry[] {
  const data = store.get('history');
  // Sort by createdAt descending
  return data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addToHistory(entry: HistoryEntry): void {
  const history = getHistory();
  history.unshift(entry);
  // Keep last 100 entries
  store.set('history', history.slice(0, 100));
}

export function deleteHistoryEntry(id: string): void {
  const history = getHistory();
  const entry = history.find(h => h.id === id);
  if (entry) {
    // Delete associated files
    try {
      if (entry.outputPath && fs.existsSync(entry.outputPath)) {
        fs.unlinkSync(entry.outputPath);
      }
      if (entry.jsonPath && fs.existsSync(entry.jsonPath)) {
        fs.unlinkSync(entry.jsonPath);
      }
      if (entry.thumbnailPath && fs.existsSync(entry.thumbnailPath)) {
        fs.unlinkSync(entry.thumbnailPath);
      }
    } catch (e) {
      console.error('Failed to delete history files:', e);
    }
    // Remove from store
    store.set('history', history.filter(h => h.id !== id));
  }
}
