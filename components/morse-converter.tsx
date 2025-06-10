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
  const textHighlightRef = useRef<HTMLSpanElement>(
    null,
  ) as React.RefObject<HTMLSpanElement>;

  // --- Effects for Highlight Scrolling ---
  useEffect(() => {
    if (
      highlightIndex !== null &&
      highlightRef.current &&
      containerRef.current
    ) {
      const container = containerRef.current;
      const highlight = highlightRef.current;
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const highlightTop = highlight.offsetTop;
      const highlightHeight = highlight.clientHeight;
      if (highlightTop < scrollTop) {
        container.scrollTop = highlightTop;
      } else if (highlightTop + highlightHeight > scrollTop + containerHeight) {
        container.scrollTop = highlightTop - containerHeight + highlightHeight;
      }
    }
  }, [highlightIndex]);

  // useEffect(() => {
  //   if (
  //     currentTextIndex !== null &&
  //     textHighlightRef.current &&
  //     textContainerRef.current
  //   ) {
  //     const container = textContainerRef.current;
  //     const highlight = textHighlightRef.current;
  //     const scrollTop = container.scrollTop;
  //     const containerHeight = container.clientHeight;
  //     const highlightTop = highlight.offsetTop;
  //     const highlightHeight = highlight.clientHeight;
  //     if (highlightTop < scrollTop) {
  //       container.scrollTop = highlightTop;
  //     } else if (highlightTop + highlightHeight > scrollTop + containerHeight) {
  //       container.scrollTop = highlightTop - containerHeight + highlightHeight;
  //     }
  //   }
  // }, [currentTextIndex]);

  useLayoutEffect(() => {
    if (
      highlightIndex !== null &&
      highlightRef.current &&
      containerRef.current
    ) {
      const container = containerRef.current;
      const highlight = highlightRef.current;
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const highlightTop = highlight.offsetTop;
      const highlightHeight = highlight.clientHeight;

      if (highlightTop < scrollTop) {
        container.scrollTop = highlightTop;
      } else if (highlightTop + highlightHeight > scrollTop + containerHeight) {
        container.scrollTop = highlightTop - containerHeight + highlightHeight;
      }
    }
  }, [highlightIndex]);

  // Inside your Converter component
  const debouncedSetInputText = useMemo(
    () => debounce((text: string) => setInputText(text), 300),
    [],
  );

  // --- Audio Context ---
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 1024;
    }
    return audioContextRef.current;
  };

  useEffect(() => {
    return () => {
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  // --- Morse Code Conversion ---
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

  // --- Mapping Morse Index to Text Index ---
  const morseToTextMapping = useMemo(() => {
    const mapping: number[] = [];
    for (let i = 0; i < inputText.length; i++) {
      const char = inputText[i].toUpperCase();
      const morse = MORSE_CODE_MAP[char] || '?';
      for (let j = 0; j < morse.length; j++) {
        mapping.push(i);
      }
      if (i < inputText.length - 1) {
        mapping.push(i);
      }
    }
    return mapping;
  }, [inputText]);

  // --- Playback Logic ---
  const playTone = async (type: 'dot' | 'dash', wpm: number): Promise<void> => {
    const context = initAudioContext();
    if (context.state === 'suspended') await context.resume();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency[0], context.currentTime);

    oscillator.connect(analyserRef.current!);
    analyserRef.current!.connect(gainNode);
    gainNode.connect(context.destination);

    gainNode.gain.setValueAtTime(0.2, context.currentTime);

    const duration = type === 'dot' ? 1.2 / wpm : 3.6 / wpm;
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
    await sleep(duration * 1000);
  };

  const startPlayback = () => {
    setIsPlaying(true);
    isPlayingRef.current = true;
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    setHighlightIndex(null);
    setCurrentTextIndex(null);
  };

  const playMorseCode = async () => {
    if (isPlayingRef.current) {
      stopPlayback();
      return;
    }
    startPlayback();
    const context = initAudioContext();
    await context.resume();
    const wpm = speed[0];
    const dotDuration = 1.2 / wpm;
    const letterGap = dotDuration * 3;
    const wordGap = dotDuration * 7;
    const elementGap = dotDuration;
    try {
      do {
        for (let i = 0; i < morseCode.length; i++) {
          if (!isPlayingRef.current) break;
          const char = morseCode[i];
          setHighlightIndex(i);
          const textIdx = morseToTextMapping[i];
          if (textIdx !== undefined) setCurrentTextIndex(textIdx);
          if (char === '.') {
            await playTone('dot', wpm);
          } else if (char === '-') {
            await playTone('dash', wpm);
          } else if (char === ' ') {
            await sleep(letterGap * 1000);
          } else if (char === '/') {
            await sleep(wordGap * 1000);
          }
          const next = morseCode[i + 1];
          if (
            (char === '.' || char === '-') &&
            next &&
            next !== ' ' &&
            next !== '/'
          ) {
            await sleep(elementGap * 1000);
          }
        }
        if (repeat && isPlayingRef.current) await sleep(1000);
      } while (repeat && isPlayingRef.current);
    } catch (err) {
      console.error('Playback error:', err);
    } finally {
      stopPlayback();
    }
  };

  // --- File Upload/Download ---
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      let text = '';
      try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(arrayBuffer);
      } catch {
        text = new TextDecoder('iso-8859-1').decode(arrayBuffer);
      }
      setInputText(text);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownload = () => {
    const blob = new Blob([`Original:\n${inputText}\n\nMorse:\n${morseCode}`], {
      type: 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `morse_code_${new Date()
      .toISOString()
      .replace(/[:.]/g, '-')}.txt`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  // --- Keyboard Shortcut for Reset ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopPlayback();
        setInputText('');
        setSpeed([15]);
        setRepeat(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
            stopPlayback={stopPlayback}
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
