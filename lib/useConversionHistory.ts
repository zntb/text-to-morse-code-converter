'use client';

import { useState, useCallback } from 'react';

export interface HistoryItem {
  id: string;
  input: string;
  output: string;
  mode: 'text-to-morse' | 'morse-to-text';
  timestamp: number;
}

const STORAGE_KEY = 'morse-conversion-history';
const MAX_HISTORY_ITEMS = 20;

// Initialize state from localStorage (lazy initialization)
function getInitialHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const savedHistory = localStorage.getItem(STORAGE_KEY);
    if (savedHistory) {
      return JSON.parse(savedHistory);
    }
  } catch {
    console.error('Failed to parse saved history');
  }
  return [];
}

export function useConversionHistory() {
  const [history, setHistory] = useState<HistoryItem[]>(getInitialHistory);

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

        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
        return newHistory;
      });
    },
    [],
  );

  // Remove an item from history
  const removeFromHistory = useCallback((id: string) => {
    setHistory(prev => {
      const newHistory = prev.filter(item => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  // Clear all history
  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}
