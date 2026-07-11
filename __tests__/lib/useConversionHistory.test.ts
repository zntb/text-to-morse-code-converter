/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useConversionHistory } from '@/lib/useConversionHistory';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    length: 0,
    key: jest.fn(),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock Date.now() to return increasing timestamps
let nowCounter = 1000;
const originalDateNow = Date.now;
Date.now = jest.fn(() => {
  nowCounter++;
  return nowCounter;
});

describe('useConversionHistory', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    nowCounter = 1000;
  });

  it('starts with empty history', () => {
    const { result } = renderHook(() => useConversionHistory());
    expect(result.current.history).toEqual([]);
  });

  it('adds an item to history', () => {
    const { result } = renderHook(() => useConversionHistory());

    act(() => {
      result.current.addToHistory('SOS', '... --- ...', 'text-to-morse');
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].input).toBe('SOS');
    expect(result.current.history[0].output).toBe('... --- ...');
    expect(result.current.history[0].mode).toBe('text-to-morse');
  });

  it('does not add empty input to history', () => {
    const { result } = renderHook(() => useConversionHistory());

    act(() => {
      result.current.addToHistory('', '', 'text-to-morse');
    });

    expect(result.current.history).toHaveLength(0);
  });

  it('adds morse-to-text items to history', () => {
    const { result } = renderHook(() => useConversionHistory());

    act(() => {
      result.current.addToHistory('... --- ...', 'SOS', 'morse-to-text');
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].mode).toBe('morse-to-text');
    expect(result.current.history[0].input).toBe('... --- ...');
    expect(result.current.history[0].output).toBe('SOS');
  });

  it('moves duplicate inputs to top and updates timestamp', () => {
    const { result } = renderHook(() => useConversionHistory());

    act(() => {
      result.current.addToHistory('SOS', '... --- ...', 'text-to-morse');
    });

    const firstTimestamp = result.current.history[0].timestamp;
    const firstId = result.current.history[0].id;

    // Wait for Date.now() to advance
    act(() => {
      result.current.addToHistory('SOS', '... --- ...', 'text-to-morse');
    });

    // Should still have 1 item (duplicate was updated in place)
    expect(result.current.history).toHaveLength(1);
    // ID stays the same (same item, just updated timestamp)
    expect(result.current.history[0].id).toBe(firstId);
    // Timestamp should be newer
    expect(result.current.history[0].timestamp).toBeGreaterThan(firstTimestamp);
  });

  it('removes an item from history', () => {
    const { result } = renderHook(() => useConversionHistory());

    act(() => {
      result.current.addToHistory('SOS', '... --- ...', 'text-to-morse');
    });

    const firstId = result.current.history[0].id;

    act(() => {
      result.current.addToHistory('HI', '.... ..', 'text-to-morse');
    });

    // Each item gets a unique ID now because Date.now() returns increasing values
    const secondId = result.current.history[0].id;
    expect(firstId).not.toBe(secondId);
    expect(result.current.history).toHaveLength(2);

    // Remove the SOS item
    act(() => {
      result.current.removeFromHistory(firstId);
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].id).toBe(secondId);
  });

  it('clears all history', () => {
    const { result } = renderHook(() => useConversionHistory());

    act(() => {
      result.current.addToHistory('SOS', '... --- ...', 'text-to-morse');
      result.current.addToHistory('HI', '.... ..', 'text-to-morse');
    });

    expect(result.current.history).toHaveLength(2);

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.history).toHaveLength(0);
  });

  it('saves to localStorage when adding', () => {
    const { result } = renderHook(() => useConversionHistory());

    act(() => {
      result.current.addToHistory('TEST', '- . ... -', 'text-to-morse');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'morse-conversion-history',
      expect.any(String),
    );

    // Get the last call
    const calls = localStorageMock.setItem.mock.calls;
    const savedData = JSON.parse(calls[calls.length - 1][1]);
    expect(savedData).toHaveLength(1);
    expect(savedData[0].input).toBe('TEST');
  });

  it('limits history to 20 items', () => {
    const { result } = renderHook(() => useConversionHistory());

    // Add 25 items
    act(() => {
      for (let i = 0; i < 25; i++) {
        result.current.addToHistory(`ITEM${i}`, `---`, 'text-to-morse');
      }
    });

    expect(result.current.history).toHaveLength(20);
  });

  it('restores history from localStorage on mount', () => {
    // Pre-populate localStorage
    const savedItems = [
      { id: 'history-1', input: 'SAVED', output: '... .- ...- . -..', mode: 'text-to-morse', timestamp: 100 },
    ];
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedItems));

    const { result } = renderHook(() => useConversionHistory());

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].input).toBe('SAVED');
  });
});
