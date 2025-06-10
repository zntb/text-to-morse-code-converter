'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Play, Square, Volume2, UploadCloud, Download } from 'lucide-react';
import { MORSE_CODE_MAP } from '@/morse-code-data';
import ResetDialog from './ResetDialog';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function Converter() {
  const [inputText, setInputText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState([15]);
  const [repeat, setRepeat] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const [frequency, setFrequency] = useState([600]); // Default 600Hz

  const audioContextRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

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

  useEffect(() => {
    let animationId: number | undefined;

    const drawWaveform = () => {
      const canvas = canvasRef.current;
      const analyser = analyserRef.current;
      if (!canvas || !analyser) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bufferLength = analyser.fftSize;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animationId = requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(dataArray);

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.lineWidth = 2;
        ctx.strokeStyle = 'lime';
        ctx.beginPath();

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * canvas.height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      };

      draw();
    };

    if (isPlaying) drawWaveform();
    else if (animationId !== undefined) cancelAnimationFrame(animationId);

    return () => {
      if (animationId !== undefined) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isPlaying]);

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

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputText(e.target.value);
    },
    [],
  );

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
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

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

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;

      // Try UTF-8 first
      let text = '';
      try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(arrayBuffer);
      } catch {
        // Fallback to ISO-8859-1 if UTF-8 fails
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopPlayback();
        setInputText('');
        setSpeed([15]);
        setRepeat(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className='w-full max-w-2xl mx-auto p-4'>
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
          <div className='space-y-2'>
            <Label htmlFor='input-text'>Enter Text</Label>
            <Textarea
              id='input-text'
              placeholder='Type your message here...'
              value={inputText}
              onChange={handleTextChange}
              className='min-h-[100px]'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='morse-output'>Morse Code</Label>
            <Textarea
              id='morse-output'
              value={morseCode
                .split('')
                .map((char, idx) =>
                  idx === highlightIndex ? `🔴${char}🔴` : char,
                )
                .join('')}
              readOnly
              className='min-h-[100px] font-mono bg-muted dark:bg-zinc-800'
              placeholder='Morse code will appear here...'
            />
          </div>

          <div className='space-y-4'>
            <Label htmlFor='speed-slider'>Speed: {speed[0]} WPM</Label>
            <Slider
              id='speed-slider'
              min={5}
              max={40}
              step={1}
              value={speed}
              onValueChange={setSpeed}
            />

            <div className='space-y-2'>
              <Label htmlFor='freq-slider'>Frequency: {frequency[0]} Hz</Label>
              <Slider
                id='freq-slider'
                min={300}
                max={1000}
                step={10}
                value={frequency}
                onValueChange={setFrequency}
                className='w-full'
              />
              <div className='flex justify-between text-xs text-muted-foreground'>
                <span>Low (300 Hz)</span>
                <span>High (1000 Hz)</span>
              </div>
            </div>

            <div className='grid grid-cols-2 md:grid-cols-4 gap-2 items-center'>
              <Button
                onClick={playMorseCode}
                disabled={!morseCode.trim()}
                className='flex-1'
              >
                {isPlaying ? (
                  <>
                    <Square className='mr-2 w-4 h-4' />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className='mr-2 w-4 h-4' />
                    Play
                  </>
                )}
              </Button>

              <ResetDialog
                onConfirm={() => {
                  stopPlayback();
                  setInputText('');
                  setSpeed([15]);
                  setRepeat(false);
                  setFrequency([600]);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                trigger={
                  <Button
                    variant='secondary'
                    className='flex items-center bg-red-200 hover:bg-red-300'
                    disabled={!morseCode.trim()}
                  >
                    Reset
                  </Button>
                }
              />

              <input
                type='file'
                accept='.txt'
                onChange={handleUpload}
                ref={fileInputRef}
                className='hidden'
              />
              <Button
                variant='outline'
                className='flex items-center'
                onClick={handleUploadClick}
              >
                <UploadCloud className='mr-1 h-4 w-4' />
                Upload
              </Button>

              <Button
                variant='outline'
                onClick={handleDownload}
                className='flex items-center'
                disabled={!morseCode.trim()}
              >
                <Download className='mr-1 h-4 w-4' />
                Export
              </Button>
            </div>

            <div>
              <canvas
                ref={canvasRef}
                width={500}
                height={100}
                className='w-full h-24 bg-black rounded shadow'
              />
            </div>

            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                id='repeat-toggle'
                checked={repeat}
                onChange={() => setRepeat(!repeat)}
              />
              <Label htmlFor='repeat-toggle'>Repeat Morse code</Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
