'use client';

import { useCallback } from 'react';
import { useLocalStorage } from '@/lib/useLocalStorage';

export interface HistoryItem {
  id: string;
  input: string;
  output: string;
  mode: 'text-to-morse' | 'morse-to-text';
  timestamp: number;
}

const STORAGE_KEY = 'morse-conversion-history';
const MAX_HISTORY_ITEMS = 20;

export function useConversionHistory() {
  const [history, setHistory] = useLocalStorage<HistoryItem[]>(STORAGE_KEY, []);

  // Add a new conversion to history
  const addToHistory = useCallback(
    (
      input: string,
      output: string,
      mode: 'text-to-morse' | 'morse-to-text',
    ) => {
      if (!input.trim()) return;

      const newItem: HistoryItem = {
        id: `history-${Date.now()}`,
        input: input.trim(),
        output: output.trim(),
        mode,
        timestamp: Date.now(),
      };

      setHistory(prev => {
        // Check if this input already exists in history
        const existingIndex = prev.findIndex(
          item => item.input.toLowerCase() === newItem.input.toLowerCase(),
        );

        let newHistory: HistoryItem[];
        if (existingIndex !== -1) {
          // Move existing item to top and update timestamp
          const existingItem = prev[existingIndex];
          newHistory = [
            { ...existingItem, timestamp: newItem.timestamp },
            ...prev.slice(0, existingIndex),
            ...prev.slice(existingIndex + 1),
          ];
        } else {
          // Add new item at the beginning
          newHistory = [newItem, ...prev];
        }

        // Limit history size
        if (newHistory.length > MAX_HISTORY_ITEMS) {
          newHistory = newHistory.slice(0, MAX_HISTORY_ITEMS);
        }

        return newHistory;
      });
    },
    [setHistory],
  );

  // Remove an item from history
  const removeFromHistory = useCallback((id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  }, [setHistory]);

  // Clear all history
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, [setHistory]);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}
