/* eslint-disable @typescript-eslint/no-unused-vars */
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

import { Volume2, Settings2, Smartphone } from 'lucide-react';
import { MORSE_CODE_MAP, TEXT_TO_MORSE_MAP } from '@/morse-code-data';

import { AudioInputMode } from './conversion-mode-toggle';
import PresetButtons from './PresetButtons';
import ConverterHeader from './ConverterHeader';
import MorseToTextConverter from './MorseToTextConverter';
import ConverterFooter from './ConverterFooter';
import MorseTextDisplay from './MorseTextDisplay';
import MorseOutputDisplay from './MorseOutputDisplay';
import ControlPanel from './ControlPanel';
import WaveformCanvas from './WaveformCanvas';
import PracticeQuiz from './PracticeQuiz';
import PlaybackProgress from './PlaybackProgress';
import CharacterReferenceTable from './CharacterReferenceTable';
// Preset messages interface
interface PresetMessage {
  id: string;
  name: string;
  text: string;
}

import { debounce } from '@/lib/utils';
import { useConversionHistory } from '@/lib/useConversionHistory';
import HistoryDropdown from '@/components/HistoryDropdown';
import {
  AUDIO_CONFIG,
  TIMING_CONFIG,
  getGain,
  calculateTiming,
} from '@/lib/constants';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function Converter() {
  // --- State Management ---
  const [inputText, setInputText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState([15]);
  const [repeat, setRepeat] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const [currentTextIndex, setCurrentTextIndex] = useState<number | null>(null);
  const [currentDotDashType, setCurrentDotDashType] = useState<
    'dot' | 'dash' | null
  >(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [frequency, setFrequency] = useState([600]);
  const [volume, setVolume] = useState([20]);
  const [waveform, setWaveform] = useState<
    'sine' | 'square' | 'sawtooth' | 'triangle'
  >('sine');
  const [showControls, setShowControls] = useState(true);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const [showReferenceSheet, setShowReferenceSheet] = useState(false);

  // Conversion mode state
  const [conversionMode, setConversionMode] = useState<
    'text-to-morse' | 'morse-to-text' | 'practice'
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

  // Custom presets state
  const [customPresets, setCustomPresets] = useState<PresetMessage[]>([]);
  const [showPresetInput, setShowPresetInput] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetText, setNewPresetText] = useState('');

  // Session statistics state
  const [sessionStats, setSessionStats] = useState({
    totalCharactersPlayed: 0,
    totalTimeSpent: 0, // in seconds
  });

  // Farnsworth timing state
  const [useFarnsworthTiming, setUseFarnsworthTiming] = useState(false);

  // History state for recent conversions
  const { history, addToHistory, removeFromHistory, clearHistory } =
    useConversionHistory();

  // Track session time
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isPlaying) {
      interval = setInterval(() => {
        setSessionStats(prev => ({
          ...prev,
          totalTimeSpent: prev.totalTimeSpent + 1,
        }));
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying]);

  // Load custom presets from localStorage
  useEffect(() => {
    const savedPresets = localStorage.getItem('morse-custom-presets');
    if (savedPresets) {
      try {
        setCustomPresets(JSON.parse(savedPresets));
      } catch {
        console.error('Failed to parse saved presets');
      }
    }
  }, []);

  // Save custom presets to localStorage
  const saveCustomPreset = useCallback(
    (name: string, text: string) => {
      const newPreset: PresetMessage = {
        id: `custom-${Date.now()}`,
        name,
        text,
      };
      const updatedPresets = [...customPresets, newPreset];
      setCustomPresets(updatedPresets);
      localStorage.setItem(
        'morse-custom-presets',
        JSON.stringify(updatedPresets),
      );
      setNewPresetName('');
      setNewPresetText('');
      setShowPresetInput(false);
    },
    [customPresets],
  );

  // Delete custom preset
  const deleteCustomPreset = useCallback(
    (id: string) => {
      const updatedPresets = customPresets.filter(p => p.id !== id);
      setCustomPresets(updatedPresets);
      localStorage.setItem(
        'morse-custom-presets',
        JSON.stringify(updatedPresets),
      );
    },
    [customPresets],
  );

  // Apply preset message
  const applyPreset = useCallback((text: string) => {
    setInputText(text);
  }, []);

  // Handle history item selection
  const handleHistorySelect = useCallback(
    (item: {
      input: string;
      output: string;
      mode: 'text-to-morse' | 'morse-to-text';
    }) => {
      if (item.mode === 'text-to-morse') {
        setConversionMode('text-to-morse');
        setInputText(item.input);
      } else {
        setConversionMode('morse-to-text');
        setMorseInput(item.output);
      }
    },
    [],
  );

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
  const charactersPlayedThisRunRef = useRef(0);
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

  // Save to history when input changes (debounced)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saveToHistoryDebounced = useCallback(
    debounce(
      (
        text: string,
        output: string,
        mode: 'text-to-morse' | 'morse-to-text',
      ) => {
        if (text.trim()) {
          addToHistory(text, output, mode);
        }
      },
      2000,
    ),
    [addToHistory],
  );

  // Effect to save text-to-morse conversions to history
  useEffect(() => {
    if (inputText && morseCode) {
      saveToHistoryDebounced(inputText, morseCode, 'text-to-morse');
    }
  }, [inputText, morseCode, saveToHistoryDebounced]);

  // Effect to save morse-to-text conversions to history
  useEffect(() => {
    if (morseInput && decodedText) {
      saveToHistoryDebounced(morseInput, decodedText, 'morse-to-text');
    }
  }, [morseInput, decodedText, saveToHistoryDebounced]);

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
  // Pre-schedule all audio events for smooth, precise playback
  const playAllTonesScheduled = useCallback(
    async (
      morseString: string,
      timing: {
        dotDuration: number;
        dashDuration: number;
        letterGap: number;
        wordGap: number;
        elementGap: number;
      },
      abortSignal: AbortSignal,
    ): Promise<number> => {
      const context = initAudioContext();
      if (!context) throw new Error('AudioContext not available');

      if (context.state === 'suspended') {
        await context.resume();
      }

      if (abortSignal.aborted) return 0;

      const { dotDuration, dashDuration, letterGap, wordGap, elementGap } =
        timing;
      const gainValue = getGain(volume[0] / 100);
      const fadeTime = AUDIO_CONFIG.FADE_TIME;

      // Build a schedule of events for UI updates
      interface ScheduleEvent {
        time: number;
        type: 'start' | 'end';
        morseIndex: number;
        textIndex: number | null;
        dotDashType: 'dot' | 'dash' | null;
      }

      const schedule: ScheduleEvent[] = [];
      let currentTime = context.currentTime + 0.05; // Small initial delay

      // Calculate total duration first
      let totalDurationSeconds = 0;
      for (let i = 0; i < morseString.length; i++) {
        const char = morseString[i];
        if (char === '.') {
          totalDurationSeconds += dotDuration + elementGap;
        } else if (char === '-') {
          totalDurationSeconds += dashDuration + elementGap;
        } else if (char === ' ') {
          totalDurationSeconds += letterGap - elementGap;
        } else if (char === '/') {
          totalDurationSeconds += wordGap - elementGap;
        }
      }

      // Build the schedule while calculating start times
      for (let i = 0; i < morseString.length; i++) {
        const char = morseString[i];
        const currentTextIdx = morseToTextMapping[i] ?? null;

        if (char === '.') {
          schedule.push({
            time: currentTime,
            type: 'start',
            morseIndex: i,
            textIndex: currentTextIdx,
            dotDashType: 'dot',
          });
          currentTime += dotDuration;
          schedule.push({
            time: currentTime,
            type: 'end',
            morseIndex: i,
            textIndex: currentTextIdx,
            dotDashType: 'dot',
          });
          currentTime += elementGap;
        } else if (char === '-') {
          schedule.push({
            time: currentTime,
            type: 'start',
            morseIndex: i,
            textIndex: currentTextIdx,
            dotDashType: 'dash',
          });
          currentTime += dashDuration;
          schedule.push({
            time: currentTime,
            type: 'end',
            morseIndex: i,
            textIndex: currentTextIdx,
            dotDashType: 'dash',
          });
          currentTime += elementGap;
        } else if (char === ' ') {
          currentTime += letterGap - elementGap;
        } else if (char === '/') {
          currentTime += wordGap - elementGap;
        }
      }

      // Now schedule all audio events upfront for precise timing
      const oscillators: OscillatorNode[] = [];
      const gainNodes: GainNode[] = [];

      // Calculate tone start times
      const toneStartTimes: number[] = [];
      let toneTime = context.currentTime + 0.05;
      for (let i = 0; i < morseString.length; i++) {
        const char = morseString[i];
        if (char === '.') {
          toneStartTimes.push(toneTime);
          toneTime += dotDuration + elementGap;
        } else if (char === '-') {
          toneStartTimes.push(toneTime);
          toneTime += dashDuration + elementGap;
        } else if (char === ' ') {
          toneTime += letterGap - elementGap;
        } else if (char === '/') {
          toneTime += wordGap - elementGap;
        }
      }

      // Create and schedule oscillators
      let toneIndex = 0;
      for (let i = 0; i < morseString.length; i++) {
        const char = morseString[i];
        if (char === '.' || char === '-') {
          const duration = char === '.' ? dotDuration : dashDuration;
          const toneStartTime = toneStartTimes[toneIndex];
          toneIndex++;

          const oscillator = context.createOscillator();
          const gainNode = context.createGain();

          oscillator.type = waveform;
          oscillator.frequency.setValueAtTime(frequency[0], toneStartTime);

          oscillator.connect(gainNode);
          if (analyserRef.current) {
            gainNode.connect(analyserRef.current);
            analyserRef.current.connect(context.destination);
          } else {
            gainNode.connect(context.destination);
          }

          // Fade in/out
          gainNode.gain.setValueAtTime(0, toneStartTime);
          gainNode.gain.linearRampToValueAtTime(
            gainValue,
            toneStartTime + fadeTime,
          );
          gainNode.gain.linearRampToValueAtTime(
            gainValue,
            toneStartTime + duration - fadeTime,
          );
          gainNode.gain.linearRampToValueAtTime(0, toneStartTime + duration);

          oscillator.start(toneStartTime);
          oscillator.stop(toneStartTime + duration);

          oscillators.push(oscillator);
          gainNodes.push(gainNode);
        }
      }

      // Handle abort - stop all oscillators
      const cleanup = () => {
        oscillators.forEach(osc => {
          try {
            osc.stop();
            osc.disconnect();
          } catch (e) {
            // Ignore
          }
        });
        gainNodes.forEach(gain => {
          try {
            gain.disconnect();
          } catch (e) {
            // Ignore
          }
        });
      };

      abortSignal.addEventListener('abort', cleanup);

      // Use requestAnimationFrame to sync UI with scheduled audio
      const startTime = context.currentTime;
      let eventIndex = 0;
      const isPlayingScheduled = true;

      const updateUI = () => {
        if (abortSignal.aborted || !isPlayingScheduled) {
          setCurrentDotDashType(null);
          setIsFlashing(false);
          setHighlightIndex(null);
          setCurrentTextIndex(null);
          return;
        }

        const currentAudioTime = context.currentTime;

        // Process all events that should have happened by now
        while (eventIndex < schedule.length) {
          const event = schedule[eventIndex];

          if (currentAudioTime >= event.time) {
            if (event.type === 'start') {
              setHighlightIndex(event.morseIndex);
              setCurrentTextIndex(event.textIndex);
              if (event.dotDashType) {
                setCurrentDotDashType(event.dotDashType);
                setIsFlashing(true);
              }
            } else if (event.type === 'end') {
              setCurrentDotDashType(null);
              setIsFlashing(false);
            }
            eventIndex++;
          } else {
            break;
          }
        }

        // Check if playback is complete
        if (schedule.length > 0) {
          const lastEvent = schedule[schedule.length - 1];
          if (currentAudioTime >= lastEvent.time) {
            setCurrentDotDashType(null);
            setIsFlashing(false);
            setHighlightIndex(null);
            setCurrentTextIndex(null);
            return;
          }
        }

        // Schedule next update
        if (isPlayingScheduled) {
          requestAnimationFrame(updateUI);
        }
      };

      requestAnimationFrame(updateUI);

      // Return a promise that resolves when playback is complete
      return new Promise<number>(resolve => {
        // Listen for abort
        const abortHandler = () => {
          resolve(0);
        };
        abortSignal.addEventListener('abort', abortHandler);

        // Resolve after total duration
        setTimeout(() => {
          abortSignal.removeEventListener('abort', abortHandler);
          resolve(totalDurationSeconds * 1000);
        }, totalDurationSeconds * 1000);
      });
    },
    [frequency, volume, waveform, initAudioContext, morseToTextMapping],
  );

  // Keep the playTone for simple single-tone playback (like in reference table)
  const playTone = useCallback(
    async (
      type: 'dot' | 'dash',
      duration: number,
      abortSignal?: AbortSignal,
    ): Promise<void> => {
      setCurrentDotDashType(type);
      setIsFlashing(true);

      const context = initAudioContext();
      if (!context) throw new Error('AudioContext not available');

      if (context.state === 'suspended') {
        await context.resume();
      }

      if (abortSignal?.aborted) {
        setCurrentDotDashType(null);
        setIsFlashing(false);
        return;
      }

      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.type = waveform;
      oscillator.frequency.setValueAtTime(frequency[0], context.currentTime);

      oscillator.connect(gainNode);
      if (analyserRef.current) {
        gainNode.connect(analyserRef.current);
        analyserRef.current.connect(context.destination);
      } else {
        gainNode.connect(context.destination);
      }

      const currentTime = context.currentTime;
      const gainValue = getGain(volume[0] / 100);
      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(
        gainValue,
        currentTime + AUDIO_CONFIG.FADE_TIME,
      );
      gainNode.gain.linearRampToValueAtTime(
        gainValue,
        currentTime + duration - AUDIO_CONFIG.FADE_TIME,
      );
      gainNode.gain.linearRampToValueAtTime(0, currentTime + duration);

      oscillator.start(currentTime);
      oscillator.stop(currentTime + duration);

      if (abortSignal) {
        abortSignal.addEventListener('abort', () => {
          try {
            oscillator.stop();
            oscillator.disconnect();
            gainNode.disconnect();
          } catch (e) {
            // Ignore
          }
        });
      }

      await sleep(duration * 1000);

      setIsFlashing(false);
      setCurrentDotDashType(null);
    },
    [frequency, volume, waveform, initAudioContext],
  );

  const playMorseCode = useCallback(async () => {
    if (isPlayingRef.current) {
      // Stop current playback
      playbackAbortControllerRef.current?.abort();
      setIsPlaying(false);
      isPlayingRef.current = false;
      setHighlightIndex(null);
      setCurrentTextIndex(null);
      setCurrentDotDashType(null);
      setIsFlashing(false);
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

      // Calculate timing based on whether Farnsworth timing is enabled
      const timing = calculateTiming(wpm, useFarnsworthTiming);

      // Track unique text characters played in this playback session
      charactersPlayedThisRunRef.current = 0;
      const uniqueCharsPlayed = new Set<number>();

      // Count unique characters for stats
      for (let i = 0; i < morseCode.length; i++) {
        const textIdx = morseToTextMapping[i];
        if (textIdx !== undefined && !uniqueCharsPlayed.has(textIdx)) {
          uniqueCharsPlayed.add(textIdx);
          charactersPlayedThisRunRef.current++;
        }
      }

      // Use scheduled playback for smooth, precise audio
      // This schedules all audio events upfront and returns when playback is complete
      await playAllTonesScheduled(morseCode, timing, abortSignal);

      // Handle repeat - schedule additional plays if needed
      if (repeat && !abortSignal.aborted && isPlayingRef.current) {
        // Wait a bit then recursively call to repeat
        await sleep(TIMING_CONFIG.REPEAT_DELAY);
        if (!abortSignal.aborted && isPlayingRef.current) {
          playMorseCode();
          return; // Early return since the new call will handle cleanup
        }
      }
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
      // Update session stats with characters played
      setSessionStats(prev => ({
        ...prev,
        totalCharactersPlayed:
          prev.totalCharactersPlayed +
          (charactersPlayedThisRunRef.current || 0),
      }));

      // Reset the ref for next run
      charactersPlayedThisRunRef.current = 0;

      setIsPlaying(false);
      isPlayingRef.current = false;
      setHighlightIndex(null);
      setCurrentTextIndex(null);
      setCurrentDotDashType(null);
      setIsFlashing(false);
    }
  }, [
    morseCode,
    speed,
    repeat,
    useFarnsworthTiming,
    morseToTextMapping,
    playAllTonesScheduled,
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

      // Calculate timing based on whether Farnsworth timing is enabled
      const timing = calculateTiming(wpm, useFarnsworthTiming);
      const { dotDuration, dashDuration, letterGap, wordGap, elementGap } =
        timing;
      const fadeTime = AUDIO_CONFIG.FADE_TIME;

      // Calculate total duration
      let totalDuration = 0;
      for (let i = 0; i < morseCode.length; i++) {
        const char = morseCode[i];
        const nextChar = morseCode[i + 1];

        switch (char) {
          case '.':
            totalDuration += dotDuration;
            // Add element gap only if next char is a dot or dash
            if (nextChar && (nextChar === '.' || nextChar === '-')) {
              totalDuration += elementGap;
            }
            break;
          case '-':
            totalDuration += dashDuration;
            // Add element gap only if next char is a dot or dash
            if (nextChar && (nextChar === '.' || nextChar === '-')) {
              totalDuration += elementGap;
            }
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
        const nextChar = morseCode[i + 1];
        let duration = 0;
        let gapDuration = 0;

        switch (char) {
          case '.':
            duration = dotDuration;
            // Add element gap only if next char is a dot or dash
            if (nextChar && (nextChar === '.' || nextChar === '-')) {
              gapDuration = elementGap;
            }
            break;
          case '-':
            duration = dashDuration;
            // Add element gap only if next char is a dot or dash
            if (nextChar && (nextChar === '.' || nextChar === '-')) {
              gapDuration = elementGap;
            }
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
          const gainValue = getGain(volume[0] / 100);
          gainNode.gain.linearRampToValueAtTime(
            gainValue,
            currentTime + fadeEnd,
          );
          gainNode.gain.linearRampToValueAtTime(
            gainValue,
            currentTime + duration - fadeEnd,
          );
          gainNode.gain.linearRampToValueAtTime(0, currentTime + duration);

          oscillator.connect(gainNode);
          gainNode.connect(offlineContext.destination);

          oscillator.start(currentTime);
          oscillator.stop(currentTime + duration);
        }

        currentTime += duration + gapDuration;
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
  }, [morseCode, speed, frequency, volume, useFarnsworthTiming]);

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
      <ConverterHeader
        conversionMode={conversionMode}
        setConversionMode={setConversionMode}
        isListening={isListening}
        isPlaying={isPlaying}
        playMorseCode={playMorseCode}
        stopPlayback={() => {
          playbackAbortControllerRef.current?.abort();
        }}
      />

      {/* Main Content */}
      <main className='container mx-auto px-4 py-6'>
        <div className='mx-auto max-w-3xl space-y-6'>
          {/* Character Reference - Always visible */}
          <CharacterReferenceTable startExpanded={true} />
          {conversionMode === 'practice' ? (
            <div className='animate-fade-in-up'>
              <PracticeQuiz />
            </div>
          ) : conversionMode === 'text-to-morse' ? (
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
                    <div className='flex items-center justify-between gap-4'>
                      <PresetButtons
                        customPresets={customPresets}
                        showPresetInput={showPresetInput}
                        newPresetName={newPresetName}
                        newPresetText={newPresetText}
                        onApplyPreset={applyPreset}
                        onDeletePreset={deleteCustomPreset}
                        onShowPresetInput={setShowPresetInput}
                        onNewPresetNameChange={setNewPresetName}
                        onNewPresetTextChange={setNewPresetText}
                        onSavePreset={saveCustomPreset}
                      />
                      <HistoryDropdown
                        history={history}
                        onSelectItem={handleHistorySelect}
                        onRemoveItem={removeFromHistory}
                        onClearHistory={clearHistory}
                      />
                    </div>
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
                <Card
                  className={`overflow-hidden transition-all duration-75 ${
                    isFlashing
                      ? currentDotDashType === 'dot'
                        ? 'ring-4 ring-blue-500/50 shadow-lg shadow-blue-500/30'
                        : 'ring-4 ring-orange-500/50 shadow-lg shadow-orange-500/30'
                      : ''
                  }`}
                >
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
                      currentDotDashType={currentDotDashType}
                    />
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <MorseToTextConverter
              audioInputMode={audioInputMode}
              setAudioInputMode={setAudioInputMode}
              isListening={isListening}
              morseInput={morseInput}
              setMorseInput={setMorseInput}
              decodedText={decodedText}
              audioDevices={audioDevices}
              selectedDeviceId={selectedDeviceId}
              setSelectedDeviceId={setSelectedDeviceId}
              startAudioRecognition={startAudioRecognition}
              stopAudioRecognition={stopAudioRecognition}
              enumerateAudioDevices={enumerateAudioDevices}
              isTestingMic={isTestingMic}
              startTestMicrophone={startTestMicrophone}
              stopTestMicrophone={stopTestMicrophone}
              audioLevel={audioLevel}
              testMicError={testMicError}
            />
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

          {/* Playback Progress & Statistics - Only for Text to Morse mode */}
          {conversionMode === 'text-to-morse' && (
            <div className='animate-fade-in-up stagger-3'>
              <PlaybackProgress
                currentIndex={highlightIndex}
                totalLength={morseCode.length}
                speed={speed}
                sessionStats={sessionStats}
              />
            </div>
          )}

          {/* Controls Toggle - Only for Text to Morse mode */}
          {conversionMode === 'text-to-morse' && (
            <div className='animate-fade-in-up stagger-4'>
              <button
                onClick={() => setShowControls(!showControls)}
                className='flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-accent md:hidden'
              >
                <div className='flex items-center gap-2'>
                  <Smartphone className='h-4 w-4' />
                  <span>Settings</span>
                </div>
                <span
                  className={`transition-transform duration-200 ${
                    showControls ? 'rotate-180' : ''
                  }`}
                >
                  ▼
                </span>
              </button>
              {/* Desktop toggle - always visible on desktop */}
              <button
                onClick={() => setShowControls(!showControls)}
                className='hidden w-full items-center justify-between rounded-lg border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-accent md:flex'
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
              {/* Mobile settings button - opens bottom sheet */}
              <button
                onClick={() => setShowSettingsSheet(true)}
                className='flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-accent md:hidden'
              >
                <div className='flex items-center gap-2'>
                  <Settings2 className='h-4 w-4' />
                  <span>Playback Settings</span>
                </div>
                <span className='text-muted-foreground'>▼</span>
              </button>
            </div>
          )}

          {/* Control Panel - Desktop version - Only visible on md+ screens */}
          {(conversionMode === 'text-to-morse' ||
            conversionMode === 'morse-to-text') &&
            showControls && (
              <div className='animate-fade-in-up stagger-5 hidden md:block'>
                <Card className='overflow-hidden'>
                  <CardContent className='pt-6'>
                    <ControlPanel
                      speed={speed}
                      setSpeed={setSpeed}
                      frequency={frequency}
                      setFrequency={setFrequency}
                      volume={volume}
                      setVolume={setVolume}
                      waveform={waveform}
                      setWaveform={setWaveform}
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
                        setCurrentDotDashType(null);
                        setIsFlashing(false);
                      }}
                      setInputText={setInputText}
                      fileInputRef={fileInputRef}
                      handleUpload={handleUpload}
                      handleDownload={handleDownload}
                      exportAsWav={exportAsWav}
                      currentDotDashType={currentDotDashType}
                      isBottomSheet={false}
                      useFarnsworthTiming={useFarnsworthTiming}
                      setUseFarnsworthTiming={setUseFarnsworthTiming}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

          {/* Bottom Sheet for Mobile Settings */}
          <Sheet open={showSettingsSheet} onOpenChange={setShowSettingsSheet}>
            <SheetContent className='w-full'>
              <SheetHeader>
                <SheetTitle>Playback Settings</SheetTitle>
                <SheetDescription>
                  Adjust speed, frequency, volume and more
                </SheetDescription>
              </SheetHeader>
              <div className='mt-4'>
                <ControlPanel
                  speed={speed}
                  setSpeed={setSpeed}
                  frequency={frequency}
                  setFrequency={setFrequency}
                  volume={volume}
                  setVolume={setVolume}
                  waveform={waveform}
                  setWaveform={setWaveform}
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
                    setCurrentDotDashType(null);
                    setIsFlashing(false);
                    setShowSettingsSheet(false);
                  }}
                  setInputText={setInputText}
                  fileInputRef={fileInputRef}
                  handleUpload={handleUpload}
                  handleDownload={handleDownload}
                  exportAsWav={exportAsWav}
                  currentDotDashType={currentDotDashType}
                  isBottomSheet={true}
                  useFarnsworthTiming={useFarnsworthTiming}
                  setUseFarnsworthTiming={setUseFarnsworthTiming}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Character Reference Sheet */}
          <Sheet open={showReferenceSheet} onOpenChange={setShowReferenceSheet}>
            <SheetContent className='w-full overflow-y-auto'>
              <SheetHeader>
                <SheetTitle>Character Reference</SheetTitle>
                <SheetDescription>
                  Browse the morse code alphabet, numbers, and punctuation.
                  Hover or tap any character to hear its morse code.
                </SheetDescription>
              </SheetHeader>
              <div className='mt-4'>
                <CharacterReferenceTable startExpanded={true} />
              </div>
            </SheetContent>
          </Sheet>

          <ConverterFooter />
        </div>
      </main>
    </div>
  );
}
