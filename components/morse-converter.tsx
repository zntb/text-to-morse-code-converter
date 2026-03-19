'use client';

import {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
  useLayoutEffect,
} from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Radio, Volume2, Settings2, Mic, MicOff } from 'lucide-react';
import { MORSE_CODE_MAP, TEXT_TO_MORSE_MAP } from '@/morse-code-data';

import { ModeToggle } from './mode-toggle';
import {
  ConversionModeToggle,
  AudioInputModeToggle,
  AudioInputMode,
} from './conversion-mode-toggle';
import MorseTextDisplay from './MorseTextDisplay';
import MorseOutputDisplay from './MorseOutputDisplay';
import ControlPanel from './ControlPanel';
import WaveformCanvas from './WaveformCanvas';
import { debounce } from '@/lib/utils';
import { AUDIO_CONFIG, TIMING_CONFIG } from '@/lib/constants';

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
  const [showControls, setShowControls] = useState(true);

  // Conversion mode state
  const [conversionMode, setConversionMode] = useState<
    'text-to-morse' | 'morse-to-text'
  >('text-to-morse');
  const [audioInputMode, setAudioInputMode] =
    useState<AudioInputMode>('microphone');
  const [isListening, setIsListening] = useState(false);
  const [morseInput, setMorseInput] = useState('');

  // Microphone device selection
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Test Microphone state
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [testMicError, setTestMicError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  // Audio recognition state
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioInputRef = useRef<AudioContext | null>(null);
  const analyserDecodeRef = useRef<AnalyserNode | null>(null);
  const recognitionRef = useRef<number | null>(null);
  const audioBufferRef = useRef<number[]>([]);
  const lastSignalTimeRef = useRef<number>(0);
  const currentDotDashRef = useRef<string>('');
  const selectedDeviceIdRef = useRef<string>('');
  const isListeningRef = useRef(false);

  // Test Microphone refs
  const testMicStreamRef = useRef<MediaStream | null>(null);
  const testMicAnalyserRef = useRef<AnalyserNode | null>(null);
  const testMicAudioContextRef = useRef<AudioContext | null>(null);
  const testMicAnimationRef = useRef<number | null>(null);
  const isTestingMicRef = useRef(false);

  // --- Refs ---
  const audioContextRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const textHighlightRef = useRef<HTMLSpanElement>(null);
  const playbackAbortControllerRef = useRef<AbortController | null>(null);

  // --- Debounced Input Handler (Moved to useCallback for stability) ---
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // --- Morse to Text Decoding ---
  const convertToText = useCallback((morse: string) => {
    // Normalize the morse string
    const normalized = morse.trim().replace(/\s+/g, ' ');
    if (!normalized) return '';

    const words = normalized.split(' / ');
    return words
      .map(word => {
        const letters = word.split(' ');
        return letters.map(code => TEXT_TO_MORSE_MAP[code] || '?').join('');
      })
      .join(' ');
  }, []);

  const decodedText = useMemo(
    () => convertToText(morseInput),
    [morseInput, convertToText],
  );

  // --- Enumerate Audio Devices ---
  const enumerateAudioDevices = useCallback(async () => {
    try {
      // Request permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(
        device => device.kind === 'audioinput',
      );
      setAudioDevices(audioInputs);

      if (audioInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(audioInputs[0].deviceId);
      }
    } catch (error) {
      console.error('Failed to enumerate audio devices:', error);
    }
  }, [selectedDeviceId]);

  // --- Real-time Audio Recognition for Morse Decoding ---
  const startAudioRecognition = useCallback(async () => {
    try {
      // Get audio stream from selected device using ref
      const deviceId = selectedDeviceIdRef.current;
      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      // Create audio context for analysis
      const audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
      audioInputRef.current = audioContext;

      // Create analyser node
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserDecodeRef.current = analyser;

      // Connect microphone to analyser
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Initialize buffers
      audioBufferRef.current = [];
      currentDotDashRef.current = '';
      lastSignalTimeRef.current = Date.now();

      const detectMorse = () => {
        if (!analyserDecodeRef.current || !isListeningRef.current) return;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        // Check if there's a significant audio signal (tone detection)
        // Morse tones are typically around 600Hz, so check that frequency range
        const sampleRate = audioContext.sampleRate;
        const binSize = sampleRate / analyser.fftSize;
        const targetBin = Math.round(600 / binSize);
        const binRange = 5; // Check a range around 600Hz

        let sum = 0;
        for (let i = targetBin - binRange; i <= targetBin + binRange; i++) {
          if (i >= 0 && i < dataArray.length) {
            sum += dataArray[i];
          }
        }
        const avg = sum / (binRange * 2);
        const threshold = 50; // Adjust based on testing

        const now = Date.now();
        const timeSinceLastSignal = now - lastSignalTimeRef.current;

        // Timing thresholds (in ms)
        const dotThreshold = 50; // Minimum for a dot
        const dashThreshold = 150; // Minimum for a dash
        const elementGapThreshold = 100; // Gap between dots/dashes
        const letterGapThreshold = 250; // Gap between letters
        const wordGapThreshold = 500; // Gap between words

        if (avg > threshold) {
          // Signal detected - recording duration
          if (audioBufferRef.current.length === 0) {
            audioBufferRef.current.push(now);
          }
        } else {
          // No signal - check if we need to process a completed element
          if (audioBufferRef.current.length === 1) {
            const signalDuration = now - audioBufferRef.current[0];

            if (
              signalDuration > dotThreshold &&
              signalDuration < dashThreshold
            ) {
              currentDotDashRef.current += '.';
            } else if (signalDuration >= dashThreshold) {
              currentDotDashRef.current += '-';
            }

            audioBufferRef.current = [];
            lastSignalTimeRef.current = now;
          } else if (
            audioBufferRef.current.length === 0 &&
            currentDotDashRef.current.length > 0
          ) {
            // Check for gaps
            if (timeSinceLastSignal > wordGapThreshold) {
              // Word gap - add space
              setMorseInput(prev => prev + ' / ');
              currentDotDashRef.current = '';
            } else if (timeSinceLastSignal > letterGapThreshold) {
              // Letter gap - add space
              setMorseInput(prev => prev + ' ');
              currentDotDashRef.current = '';
            } else if (
              timeSinceLastSignal > elementGapThreshold &&
              currentDotDashRef.current.length > 0
            ) {
              // Element gap within a letter
              setMorseInput(prev => prev + currentDotDashRef.current);
              currentDotDashRef.current = '';
            }
          }
        }

        if (isListening) {
          recognitionRef.current = requestAnimationFrame(detectMorse);
        }
      };

      setIsListening(true);
      detectMorse();
    } catch (error) {
      console.error('Failed to start audio recognition:', error);
      setIsListening(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync selectedDeviceId and isListening with refs
  useEffect(() => {
    selectedDeviceIdRef.current = selectedDeviceId;
  }, [selectedDeviceId]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    isTestingMicRef.current = isTestingMic;
  }, [isTestingMic]);

  // --- Test Microphone Functions ---
  const startTestMicrophone = useCallback(async () => {
    try {
      setTestMicError(null);
      setAudioLevel(0);

      const deviceId = selectedDeviceIdRef.current;
      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      testMicStreamRef.current = stream;

      // Create audio context for analysis
      const audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
      testMicAudioContextRef.current = audioContext;

      // Create analyser node
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      testMicAnalyserRef.current = analyser;

      // Connect microphone to analyser
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const updateAudioLevel = () => {
        if (!testMicAnalyserRef.current || !isTestingMicRef.current) return;

        const dataArray = new Uint8Array(
          testMicAnalyserRef.current.frequencyBinCount,
        );
        testMicAnalyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume level
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        // Convert to 0-100 scale (255 is max byte value)
        const level = Math.min(100, Math.round((average / 255) * 100 * 3));
        setAudioLevel(level);

        if (isTestingMicRef.current) {
          testMicAnimationRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };

      setIsTestingMic(true);
      updateAudioLevel();
    } catch (error) {
      console.error('Failed to start test microphone:', error);
      setTestMicError(
        error instanceof Error
          ? error.message
          : 'Failed to access microphone. Please check permissions.',
      );
      setIsTestingMic(false);
    }
  }, []);

  const stopTestMicrophone = useCallback(() => {
    setIsTestingMic(false);
    setAudioLevel(0);

    if (testMicAnimationRef.current) {
      cancelAnimationFrame(testMicAnimationRef.current);
      testMicAnimationRef.current = null;
    }

    if (testMicStreamRef.current) {
      testMicStreamRef.current.getTracks().forEach(track => track.stop());
      testMicStreamRef.current = null;
    }

    if (
      testMicAudioContextRef.current &&
      testMicAudioContextRef.current.state !== 'closed'
    ) {
      testMicAudioContextRef.current.close();
      testMicAudioContextRef.current = null;
    }

    testMicAnalyserRef.current = null;
  }, []);

  // Cleanup test microphone on unmount
  useEffect(() => {
    return () => {
      stopTestMicrophone();
    };
  }, [stopTestMicrophone]);

  const stopAudioRecognition = useCallback(() => {
    setIsListening(false);

    if (recognitionRef.current) {
      cancelAnimationFrame(recognitionRef.current);
      recognitionRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioInputRef.current && audioInputRef.current.state !== 'closed') {
      audioInputRef.current.close();
      audioInputRef.current = null;
    }

    analyserDecodeRef.current = null;
  }, []);

  // Cleanup audio recognition on unmount
  useEffect(() => {
    return () => {
      stopAudioRecognition();
    };
  }, [stopAudioRecognition]);

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

  // --- WAV Export Function ---
  const exportAsWav = useCallback(async () => {
    if (!morseCode.trim()) return;

    try {
      const sampleRate = 44100;
      const wpm = speed[0];
      const freq = frequency[0];
      const dotDuration = TIMING_CONFIG.DOT_MULTIPLIER / wpm;
      const letterGap = dotDuration * TIMING_CONFIG.LETTER_GAP_MULTIPLIER;
      const wordGap = dotDuration * TIMING_CONFIG.WORD_GAP_MULTIPLIER;
      const elementGap = dotDuration * TIMING_CONFIG.ELEMENT_GAP_MULTIPLIER;
      const fadeTime = AUDIO_CONFIG.FADE_TIME;

      // Calculate total duration
      let totalDuration = 0;
      for (let i = 0; i < morseCode.length; i++) {
        const char = morseCode[i];
        switch (char) {
          case '.':
            totalDuration += dotDuration + elementGap;
            break;
          case '-':
            totalDuration += TIMING_CONFIG.DASH_MULTIPLIER / wpm + elementGap;
            break;
          case ' ':
            totalDuration += letterGap;
            break;
          case '/':
            totalDuration += wordGap;
            break;
        }
      }

      // Add some padding at the end
      totalDuration += 0.5;

      const numSamples = Math.ceil(totalDuration * sampleRate);
      const offlineContext = new OfflineAudioContext(1, numSamples, sampleRate);

      // Generate the morse code audio
      let currentTime = 0;
      for (let i = 0; i < morseCode.length; i++) {
        const char = morseCode[i];
        let duration = 0;

        switch (char) {
          case '.':
            duration = dotDuration;
            break;
          case '-':
            duration = TIMING_CONFIG.DASH_MULTIPLIER / wpm;
            break;
          case ' ':
            duration = letterGap;
            break;
          case '/':
            duration = wordGap;
            break;
        }

        // Create oscillator for tones
        if (char === '.' || char === '-') {
          const oscillator = offlineContext.createOscillator();
          const gainNode = offlineContext.createGain();

          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(freq, currentTime);

          // Apply fade in/out
          const fadeEnd = Math.min(fadeTime, duration / 2);
          gainNode.gain.setValueAtTime(0, currentTime);
          gainNode.gain.linearRampToValueAtTime(
            AUDIO_CONFIG.GAIN,
            currentTime + fadeEnd,
          );
          gainNode.gain.linearRampToValueAtTime(
            AUDIO_CONFIG.GAIN,
            currentTime + duration - fadeEnd,
          );
          gainNode.gain.linearRampToValueAtTime(0, currentTime + duration);

          oscillator.connect(gainNode);
          gainNode.connect(offlineContext.destination);

          oscillator.start(currentTime);
          oscillator.stop(currentTime + duration);
        }

        currentTime += duration;
      }

      // Render audio
      const audioBuffer = await offlineContext.startRendering();

      // Convert to WAV
      const wavBlob = audioBufferToWav(audioBuffer);

      // Trigger download
      const url = URL.createObjectURL(wavBlob);
      const link = document.createElement('a');
      link.download = `morse_code_${new Date()
        .toISOString()
        .replace(/[:.]/g, '-')}.wav`;
      link.href = url;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('WAV export failed:', error);
    }
  }, [morseCode, speed, frequency]);

  // Helper function to convert AudioBuffer to WAV format
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const dataLength = buffer.length * blockAlign;
    const bufferLength = 44 + dataLength;

    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, bufferLength - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    // Write audio data
    const channelData: Float32Array[] = [];
    for (let i = 0; i < numChannels; i++) {
      channelData.push(buffer.getChannelData(i));
    }

    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
        const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, int16, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

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
    <div className='min-h-screen w-full radio-static-bg'>
      {/* Header */}
      <header className='sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md'>
        <div className='container mx-auto flex h-16 items-center justify-between px-4'>
          <div className='flex items-center gap-3'>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl bg-primary ${
                isPlaying || isListening ? 'animate-pulse-glow' : ''
              }`}
            >
              <Radio className='h-5 w-5 text-primary-foreground' />
            </div>
            <div>
              <h1 className='text-lg font-semibold tracking-tight'>
                Morse Converter
              </h1>
              <p className='text-xs text-muted-foreground hidden sm:block'>
                {conversionMode === 'text-to-morse'
                  ? 'Text to Morse Code'
                  : 'Morse Code to Text'}
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <ConversionModeToggle
              mode={conversionMode}
              setMode={setConversionMode}
              isListening={isListening}
            />
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='container mx-auto px-4 py-6'>
        <div className='mx-auto max-w-3xl space-y-6'>
          {conversionMode === 'text-to-morse' ? (
            <>
              {/* Text to Morse Mode */}
              {/* Input Section */}
              <div className='animate-fade-in-up stagger-1'>
                <Card className='overflow-hidden'>
                  <CardHeader className='pb-4'>
                    <div className='flex items-center gap-2'>
                      <Volume2 className='h-4 w-4 text-primary' />
                      <span className='text-sm font-medium'>Input</span>
                    </div>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <MorseTextDisplay
                      inputText={inputText}
                      currentTextIndex={currentTextIndex}
                      textContainerRef={textContainerRef}
                      textHighlightRef={textHighlightRef}
                      setInputText={debouncedSetInputText}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Output Section */}
              <div className='animate-fade-in-up stagger-2'>
                <Card className='overflow-hidden'>
                  <CardHeader className='pb-4'>
                    <div className='flex items-center gap-2'>
                      <span className='text-primary'>· –</span>
                      <span className='text-sm font-medium'>Morse Output</span>
                    </div>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <MorseOutputDisplay
                      morseCode={morseCode}
                      highlightIndex={highlightIndex}
                      containerRef={containerRef}
                      highlightRef={highlightRef}
                    />
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <>
              {/* Morse to Text Mode */}
              {/* Audio Input Mode Toggle */}
              <div className='animate-fade-in-up stagger-1'>
                <Card className='overflow-hidden'>
                  <CardHeader className='pb-4'>
                    <div className='flex items-center gap-2'>
                      <Mic className='h-4 w-4 text-primary' />
                      <span className='text-sm font-medium'>Audio Input</span>
                    </div>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <AudioInputModeToggle
                      audioInputMode={audioInputMode}
                      setAudioInputMode={setAudioInputMode}
                      isListening={isListening}
                    />

                    {/* Microphone Input Section */}
                    {audioInputMode === 'microphone' && (
                      <div className='flex flex-col items-center gap-4 py-4'>
                        {/* Device Selection */}
                        <div className='w-full max-w-xs'>
                          <label className='text-sm font-medium mb-2 block'>
                            Select Microphone
                          </label>
                          <select
                            value={selectedDeviceId}
                            onChange={e => setSelectedDeviceId(e.target.value)}
                            onClick={() => {
                              if (audioDevices.length === 0) {
                                enumerateAudioDevices();
                              }
                            }}
                            className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                            disabled={isListening}
                          >
                            {audioDevices.length === 0 ? (
                              <option value=''>Click to load devices...</option>
                            ) : (
                              audioDevices.map(device => (
                                <option
                                  key={device.deviceId}
                                  value={device.deviceId}
                                >
                                  {device.label ||
                                    `Microphone ${device.deviceId.slice(0, 8)}`}
                                </option>
                              ))
                            )}
                          </select>
                        </div>

                        <Button
                          onClick={
                            isListening
                              ? stopAudioRecognition
                              : startAudioRecognition
                          }
                          size='lg'
                          className={`gap-2 ${
                            isListening
                              ? 'bg-destructive hover:bg-destructive/90 animate-pulse-glow'
                              : ''
                          }`}
                          disabled={
                            !selectedDeviceId && audioDevices.length > 0
                          }
                        >
                          {isListening ? (
                            <>
                              <MicOff className='h-4 w-4' />
                              Stop Listening
                            </>
                          ) : (
                            <>
                              <Mic className='h-4 w-4' />
                              Start Listening
                            </>
                          )}
                        </Button>
                        <p className='text-xs text-muted-foreground text-center'>
                          {isListening
                            ? 'Listening for Morse code... Speak or play Morse audio'
                            : 'Select a microphone and click start to begin'}
                        </p>

                        {/* Test Microphone Section */}
                        <div className='flex flex-col items-center gap-4 py-4 border-t mt-4'>
                          <Button
                            onClick={
                              isTestingMic
                                ? stopTestMicrophone
                                : startTestMicrophone
                            }
                            variant={isTestingMic ? 'secondary' : 'outline'}
                            size='lg'
                            className='gap-2'
                            disabled={
                              !selectedDeviceId && audioDevices.length > 0
                            }
                          >
                            {isTestingMic ? (
                              <>
                                <MicOff className='h-4 w-4' />
                                Stop Test
                              </>
                            ) : (
                              <>
                                <Volume2 className='h-4 w-4' />
                                Test Microphone
                              </>
                            )}
                          </Button>

                          {/* Audio Level Visualization */}
                          {isTestingMic && (
                            <div className='w-full max-w-xs space-y-2'>
                              <div className='flex items-center justify-between text-xs text-muted-foreground'>
                                <span>Volume Level</span>
                                <span
                                  className={`font-medium ${
                                    audioLevel > 10
                                      ? 'text-green-500'
                                      : 'text-yellow-500'
                                  }`}
                                >
                                  {audioLevel > 10
                                    ? 'Microphone Active'
                                    : 'No Input Detected'}
                                </span>
                              </div>
                              <div className='h-3 w-full overflow-hidden rounded-full bg-secondary'>
                                <div
                                  className={`h-full transition-all duration-75 ${
                                    audioLevel > 10
                                      ? 'bg-green-500'
                                      : 'bg-yellow-500'
                                  }`}
                                  style={{ width: `${audioLevel}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Error Display */}
                          {testMicError && (
                            <div className='w-full max-w-xs rounded-md bg-destructive/10 p-3 text-sm text-destructive'>
                              {testMicError}
                            </div>
                          )}

                          <p className='text-xs text-muted-foreground text-center'>
                            {isTestingMic
                              ? 'Testing microphone... Make some noise to see the level'
                              : 'Test your microphone before starting recognition'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* File Input Section */}
                    {audioInputMode === 'file' && (
                      <div className='flex flex-col items-center gap-4 py-4'>
                        <input
                          type='file'
                          accept='audio/*'
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // For file input, we'll parse the morse code manually
                              // In a real app, you'd decode the audio file
                              // For now, we'll just show a prompt
                              const reader = new FileReader();
                              reader.onload = () => {
                                // Placeholder: In production, you'd decode the audio here
                                alert(
                                  'Audio file loaded. For demo, please enter Morse code manually below.',
                                );
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className='hidden'
                          id='audio-file-input'
                        />
                        <Button
                          variant='outline'
                          onClick={() =>
                            document.getElementById('audio-file-input')?.click()
                          }
                          size='lg'
                          className='gap-2'
                        >
                          <Volume2 className='h-4 w-4' />
                          Load Audio File
                        </Button>
                        <p className='text-xs text-muted-foreground text-center'>
                          Load an audio file containing Morse code
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Morse Input Section */}
              <div className='animate-fade-in-up stagger-2'>
                <Card className='overflow-hidden'>
                  <CardHeader className='pb-4'>
                    <div className='flex items-center gap-2'>
                      <span className='text-primary'>· –</span>
                      <span className='text-sm font-medium'>Morse Input</span>
                    </div>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <textarea
                      value={morseInput}
                      onChange={e => setMorseInput(e.target.value)}
                      placeholder='Enter Morse code here (e.g., ... --- ... for SOS)'
                      className='min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                    />
                    <p className='text-xs text-muted-foreground'>
                      Use dots (.) and dashes (-) separated by spaces. Use / for
                      word gaps.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Decoded Text Output */}
              <div className='animate-fade-in-up stagger-3'>
                <Card className='overflow-hidden'>
                  <CardHeader className='pb-4'>
                    <div className='flex items-center gap-2'>
                      <Volume2 className='h-4 w-4 text-primary' />
                      <span className='text-sm font-medium'>Decoded Text</span>
                    </div>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm'>
                      {decodedText || (
                        <span className='text-muted-foreground'>
                          Decoded text will appear here...
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Waveform Section - Only for Text to Morse mode */}
          {conversionMode === 'text-to-morse' && (
            <div className='animate-fade-in-up stagger-3'>
              <WaveformCanvas
                canvasRef={canvasRef}
                isPlaying={isPlaying}
                analyserRef={analyserRef}
              />
            </div>
          )}

          {/* Controls Toggle - Only for Text to Morse mode */}
          {conversionMode === 'text-to-morse' && (
            <div className='animate-fade-in-up stagger-4'>
              <button
                onClick={() => setShowControls(!showControls)}
                className='flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-accent'
              >
                <div className='flex items-center gap-2'>
                  <Settings2 className='h-4 w-4' />
                  <span>Playback Settings</span>
                </div>
                <span
                  className={`transition-transform duration-200 ${
                    showControls ? 'rotate-180' : ''
                  }`}
                >
                  ▼
                </span>
              </button>
            </div>
          )}

          {/* Control Panel - Only for Text to Morse mode */}
          {conversionMode === 'text-to-morse' && showControls && (
            <div className='animate-fade-in-up stagger-5'>
              <Card className='overflow-hidden'>
                <CardContent className='pt-6'>
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
                    exportAsWav={exportAsWav}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Footer Info */}
          <div className='animate-fade-in-up stagger-6'>
            <p className='text-center text-xs text-muted-foreground'>
              Press{' '}
              <kbd className='rounded bg-muted px-1.5 py-0.5 font-mono text-xs'>
                Ctrl + Space
              </kbd>{' '}
              to play/pause •{' '}
              <kbd className='rounded bg-muted px-1.5 py-0.5 font-mono text-xs'>
                Esc
              </kbd>{' '}
              to reset
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
