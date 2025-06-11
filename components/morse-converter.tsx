'use client';

import {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
  useLayoutEffect,
} from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Volume2 } from 'lucide-react';
import { MORSE_CODE_MAP } from '@/morse-code-data';

import { ModeToggle } from './mode-toggle';
import MorseTextDisplay from './MorseTextDisplay';
import MorseOutputDisplay from './MorseOutputDisplay';
import ControlPanel from './ControlPanel';
import WaveformCanvas from './WaveformCanvas';
import { debounce } from '@/lib/utils';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Constants for better maintainability
const AUDIO_CONFIG = {
  GAIN: 0.2,
  FFT_SIZE: 1024,
  FADE_TIME: 0.01, // Small fade to prevent audio clicks
} as const;

const TIMING_CONFIG = {
  DOT_MULTIPLIER: 1.2,
  DASH_MULTIPLIER: 3.6,
  LETTER_GAP_MULTIPLIER: 3,
  WORD_GAP_MULTIPLIER: 7,
  ELEMENT_GAP_MULTIPLIER: 1,
  REPEAT_DELAY: 1000,
} as const;

export default function Converter() {
  // --- State Management ---
  const [inputText, setInputText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState([15]);
  const [repeat, setRepeat] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const [currentTextIndex, setCurrentTextIndex] = useState<number | null>(null);
  const [frequency, setFrequency] = useState([600]);

  // --- Refs ---
  const audioContextRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const textHighlightRef = useRef<HTMLSpanElement>(null);
  const playbackAbortControllerRef = useRef<AbortController | null>(null);

  // --- Debounced Input Handler (Moved to useCallback for stability) ---
  const debouncedSetInputText = useCallback(
    debounce((text: string) => setInputText(text), 300),
    [],
  );

  // --- Audio Context Management ---
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).webkitAudioContext)();

        // Create analyser only once
        if (!analyserRef.current) {
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = AUDIO_CONFIG.FFT_SIZE;
        }
      } catch (error) {
        console.error('Failed to initialize AudioContext:', error);
        return null;
      }
    }
    return audioContextRef.current;
  }, []);

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      playbackAbortControllerRef.current?.abort();
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    };
  }, []);

  // --- Morse Code Conversion (Memoized for performance) ---
  const convertToMorse = useCallback((text: string) => {
    return text
      .toUpperCase()
      .split('')
      .map(char => MORSE_CODE_MAP[char] || '?')
      .join(' ');
  }, []);

  const morseCode = useMemo(
    () => convertToMorse(inputText),
    [inputText, convertToMorse],
  );

  // --- Mapping Morse Index to Text Index (Optimized) ---
  const morseToTextMapping = useMemo(() => {
    if (!inputText) return [];

    const mapping: number[] = [];
    for (let i = 0; i < inputText.length; i++) {
      const char = inputText[i].toUpperCase();
      const morse = MORSE_CODE_MAP[char] || '?';

      // Map each morse character to its corresponding text character
      for (let j = 0; j < morse.length; j++) {
        mapping.push(i);
      }

      // Add space mapping if not the last character
      if (i < inputText.length - 1) {
        mapping.push(i);
      }
    }
    return mapping;
  }, [inputText]);

  // --- Scroll Management (Combined effects to prevent duplicate) ---
  const scrollToHighlight = useCallback(() => {
    if (
      highlightIndex === null ||
      !highlightRef.current ||
      !containerRef.current
    ) {
      return;
    }

    const container = containerRef.current;
    const highlight = highlightRef.current;
    const containerRect = container.getBoundingClientRect();
    const highlightRect = highlight.getBoundingClientRect();

    // Use getBoundingClientRect for more accurate positioning
    const isAbove = highlightRect.top < containerRect.top;
    const isBelow = highlightRect.bottom > containerRect.bottom;

    if (isAbove || isBelow) {
      highlight.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
  }, [highlightIndex]);

  useLayoutEffect(() => {
    scrollToHighlight();
  }, [scrollToHighlight]);

  // --- Enhanced Playback Logic ---
  const playTone = useCallback(
    async (
      type: 'dot' | 'dash',
      wpm: number,
      abortSignal?: AbortSignal,
    ): Promise<void> => {
      const context = initAudioContext();
      if (!context) throw new Error('AudioContext not available');

      if (context.state === 'suspended') {
        await context.resume();
      }

      if (abortSignal?.aborted) return;

      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency[0], context.currentTime);

      // Connect audio nodes
      oscillator.connect(gainNode);
      if (analyserRef.current) {
        gainNode.connect(analyserRef.current);
        analyserRef.current.connect(context.destination);
      } else {
        gainNode.connect(context.destination);
      }

      // Add fade in/out to prevent audio clicks
      const currentTime = context.currentTime;
      const duration =
        type === 'dot'
          ? TIMING_CONFIG.DOT_MULTIPLIER / wpm
          : TIMING_CONFIG.DASH_MULTIPLIER / wpm;

      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(
        AUDIO_CONFIG.GAIN,
        currentTime + AUDIO_CONFIG.FADE_TIME,
      );
      gainNode.gain.linearRampToValueAtTime(
        AUDIO_CONFIG.GAIN,
        currentTime + duration - AUDIO_CONFIG.FADE_TIME,
      );
      gainNode.gain.linearRampToValueAtTime(0, currentTime + duration);

      oscillator.start(currentTime);
      oscillator.stop(currentTime + duration);

      // Cleanup on abort
      if (abortSignal) {
        abortSignal.addEventListener('abort', () => {
          try {
            oscillator.stop();
            oscillator.disconnect();
            gainNode.disconnect();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (e) {
            // Ignore errors during cleanup
          }
        });
      }

      await sleep(duration * 1000);
    },
    [frequency, initAudioContext],
  );

  const playMorseCode = useCallback(async () => {
    if (isPlayingRef.current) {
      // Stop current playback
      playbackAbortControllerRef.current?.abort();
      setIsPlaying(false);
      isPlayingRef.current = false;
      setHighlightIndex(null);
      setCurrentTextIndex(null);
      return;
    }

    if (!morseCode.trim()) return;

    // Start new playback
    setIsPlaying(true);
    isPlayingRef.current = true;
    playbackAbortControllerRef.current = new AbortController();

    const abortSignal = playbackAbortControllerRef.current.signal;
    const context = initAudioContext();

    if (!context) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      return;
    }

    try {
      await context.resume();

      const wpm = speed[0];
      const dotDuration = TIMING_CONFIG.DOT_MULTIPLIER / wpm;
      const letterGap = dotDuration * TIMING_CONFIG.LETTER_GAP_MULTIPLIER;
      const wordGap = dotDuration * TIMING_CONFIG.WORD_GAP_MULTIPLIER;
      const elementGap = dotDuration * TIMING_CONFIG.ELEMENT_GAP_MULTIPLIER;

      do {
        for (let i = 0; i < morseCode.length && isPlayingRef.current; i++) {
          if (abortSignal.aborted) break;

          const char = morseCode[i];
          setHighlightIndex(i);

          const textIdx = morseToTextMapping[i];
          if (textIdx !== undefined) {
            setCurrentTextIndex(textIdx);
          }

          switch (char) {
            case '.':
              await playTone('dot', wpm, abortSignal);
              break;
            case '-':
              await playTone('dash', wpm, abortSignal);
              break;
            case ' ':
              await sleep(letterGap * 1000);
              break;
            case '/':
              await sleep(wordGap * 1000);
              break;
          }

          // Add element gap between dots/dashes
          const nextChar = morseCode[i + 1];
          if (
            (char === '.' || char === '-') &&
            nextChar &&
            nextChar !== ' ' &&
            nextChar !== '/'
          ) {
            await sleep(elementGap * 1000);
          }
        }

        if (repeat && isPlayingRef.current && !abortSignal.aborted) {
          await sleep(TIMING_CONFIG.REPEAT_DELAY);
        }
      } while (repeat && isPlayingRef.current && !abortSignal.aborted);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        (error as { name: string }).name !== 'AbortError'
      ) {
        console.error('Playback error:', error);
      }
    } finally {
      setIsPlaying(false);
      isPlayingRef.current = false;
      setHighlightIndex(null);
      setCurrentTextIndex(null);
    }
  }, [
    morseCode,
    speed,
    repeat,
    morseToTextMapping,
    playTone,
    initAudioContext,
  ]);

  // --- File Operations (Enhanced error handling) ---
  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic file validation
    if (file.size > 1024 * 1024) {
      // 1MB limit
      console.warn('File too large (max 1MB)');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      let text = '';

      try {
        // Try UTF-8 first
        text = new TextDecoder('utf-8', { fatal: true }).decode(arrayBuffer);
      } catch {
        try {
          // Fallback to ISO-8859-1
          text = new TextDecoder('iso-8859-1').decode(arrayBuffer);
        } catch (error) {
          console.error('Failed to decode file:', error);
          return;
        }
      }

      setInputText(text);
    };

    reader.onerror = () => {
      console.error('Failed to read file');
    };

    reader.readAsArrayBuffer(file);
  }, []);

  const handleDownload = useCallback(() => {
    try {
      const content = `Original Text:\n${inputText}\n\nMorse Code:\n${morseCode}`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.download = `morse_code_${new Date()
        .toISOString()
        .replace(/[:.]/g, '-')}.txt`;
      link.href = url;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, [inputText, morseCode]);

  // --- Keyboard Shortcuts (Enhanced) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          playbackAbortControllerRef.current?.abort();
          setIsPlaying(false);
          isPlayingRef.current = false;
          setInputText('');
          setSpeed([15]);
          setRepeat(false);
          setHighlightIndex(null);
          setCurrentTextIndex(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          break;
        case ' ':
          if (e.ctrlKey) {
            e.preventDefault();
            playMorseCode();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playMorseCode]);

  // --- Render ---
  return (
    <div className='relative w-full max-w-2xl mx-auto p-4'>
      <div className='flex justify-end mb-3'>
        <ModeToggle />
      </div>
      <Card className='dark:bg-zinc-900 dark:text-white'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Volume2 className='h-5 w-5' />
            Morse Code Converter
          </CardTitle>
          <CardDescription>
            Convert text to Morse code and play it back with adjustable speed
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <MorseTextDisplay
            inputText={inputText}
            currentTextIndex={currentTextIndex}
            textContainerRef={textContainerRef}
            textHighlightRef={textHighlightRef}
            setInputText={debouncedSetInputText}
          />
          <MorseOutputDisplay
            morseCode={morseCode}
            highlightIndex={highlightIndex}
            containerRef={containerRef}
            highlightRef={highlightRef}
          />
          <ControlPanel
            speed={speed}
            setSpeed={setSpeed}
            frequency={frequency}
            setFrequency={setFrequency}
            repeat={repeat}
            setRepeat={setRepeat}
            playMorseCode={playMorseCode}
            isPlaying={isPlaying}
            morseCode={morseCode}
            stopPlayback={() => {
              playbackAbortControllerRef.current?.abort();
              setIsPlaying(false);
              isPlayingRef.current = false;
              setHighlightIndex(null);
              setCurrentTextIndex(null);
            }}
            setInputText={setInputText}
            fileInputRef={fileInputRef}
            handleUpload={handleUpload}
            handleDownload={handleDownload}
          />
          <WaveformCanvas
            canvasRef={canvasRef}
            isPlaying={isPlaying}
            analyserRef={analyserRef}
          />
        </CardContent>
      </Card>
    </div>
  );
}
