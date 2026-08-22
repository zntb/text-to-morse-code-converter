'use client';

import { useRef, useCallback, useEffect } from 'react';
import { AUDIO_CONFIG } from '@/lib/constants';

interface UseAudioContextOptions {
  /** Whether to create an AnalyserNode alongside the AudioContext */
  createAnalyser?: boolean;
}

interface UseAudioContextReturn {
  /** Initialize (or return existing) AudioContext. Returns null on failure. */
  initAudioContext: () => AudioContext | null;
  /** The AnalyserNode, or null if createAnalyser was false or init not called yet */
  analyserRef: React.RefObject<AnalyserNode | null>;
}

/**
 * Shared hook for managing an AudioContext lifecycle.
 *
 * - Lazily creates an AudioContext (with webkit fallback) on first call to initAudioContext.
 * - Optionally creates an AnalyserNode (for waveform visualization).
 * - Cleans up the AudioContext on unmount.
 */
export function useAudioContext(
  options: UseAudioContextOptions = {},
): UseAudioContextReturn {
  const { createAnalyser = false } = options;

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).webkitAudioContext)();

        // Create analyser only once if requested
        if (createAnalyser && !analyserRef.current) {
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = AUDIO_CONFIG.FFT_SIZE;
        }
      } catch (error) {
        console.error('Failed to initialize AudioContext:', error);
        return null;
      }
    }
    return audioContextRef.current;
  }, [createAnalyser]);

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    };
  }, []);

  return { initAudioContext, analyserRef };
}
