'use client';

import { useState, useEffect } from 'react';

/**
 * A hook that syncs state with localStorage.
 *
 * - Lazily reads from localStorage on mount (SSR-safe).
 * - Automatically writes to localStorage when the value changes.
 * - Handles JSON serialization/deserialization with error handling.
 *
 * @param key - The localStorage key
 * @param defaultValue - The default value if nothing is stored
 * @returns A tuple of [value, setValue] similar to useState
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;

    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        return JSON.parse(stored) as T;
      }
    } catch {
      console.error(`Failed to parse localStorage key "${key}"`);
    }
    return defaultValue;
  });

  // Sync to localStorage whenever value changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      console.error(`Failed to save to localStorage key "${key}"`);
    }
  }, [key, value]);

  return [value, setValue];
}
