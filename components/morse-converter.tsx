/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
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
import { Play, Square, Volume2 } from 'lucide-react';

const MORSE_CODE_MAP: { [key: string]: string } = {
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
  '0': '-----',
  ' ': '/',
};

export default function Converter() {
  const [inputText, setInputText] = useState('');
  const [morseCode, setMorseCode] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState([15]);
  const [repeat, setRepeat] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const currentTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef = useRef(false);

  const startPlayback = () => {
    setIsPlaying(true);
    isPlayingRef.current = true;
  };

  // Initialize audio context on first user interaction
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (currentTimeoutRef.current) {
        clearTimeout(currentTimeoutRef.current);
      }
    };
  }, []);

  const convertToMorse = useCallback((text: string) => {
    return text
      .toUpperCase()
      .split('')
      .map(char => MORSE_CODE_MAP[char] || char)
      .join(' ');
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);
    setMorseCode(convertToMorse(text));
  };

  const playTone = async (type: 'dot' | 'dash', wpm: number): Promise<void> => {
    const context = initAudioContext();
    if (context.state === 'suspended') {
      await context.resume();
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    const duration = type === 'dot' ? 1.2 / wpm : 3.6 / wpm;
    const frequency = 600;

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gainNode.gain.setValueAtTime(0.2, context.currentTime);

    oscillator.start();
    oscillator.stop(context.currentTime + duration);

    await new Promise(resolve => setTimeout(resolve, duration * 1000));
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

          if (char === '.') {
            await playTone('dot', wpm);
          } else if (char === '-') {
            await playTone('dash', wpm);
          } else if (char === ' ') {
            await new Promise(resolve => setTimeout(resolve, letterGap * 1000));
          } else if (char === '/') {
            await new Promise(resolve => setTimeout(resolve, wordGap * 1000));
          }

          const next = morseCode[i + 1];
          if (
            (char === '.' || char === '-') &&
            next !== ' ' &&
            next !== '/' &&
            next
          ) {
            await new Promise(resolve =>
              setTimeout(resolve, elementGap * 1000),
            );
          }
        }

        if (repeat && isPlayingRef.current) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // ⏸ Pause between loops
        }
      } while (repeat && isPlayingRef.current);
    } catch (err) {
      console.error('Playback error:', err);
    } finally {
      stopPlayback();
    }
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    isPlayingRef.current = false;
  };

  return (
    <div className='w-full max-w-2xl mx-auto p-4'>
      <Card>
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
              value={morseCode}
              readOnly
              className='min-h-[100px] font-mono bg-muted'
              placeholder='Morse code will appear here...'
            />
          </div>

          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='speed-slider'>
                Speed: {speed[0]} WPM (Words Per Minute)
              </Label>
              <Slider
                id='speed-slider'
                min={5}
                max={40}
                step={1}
                value={speed}
                onValueChange={setSpeed}
                className='w-full'
              />
              <div className='flex justify-between text-xs text-muted-foreground'>
                <span>Slow (5 WPM)</span>
                <span>Fast (40 WPM)</span>
              </div>
            </div>

            <div className='flex gap-2'>
              <Button
                onClick={playMorseCode}
                disabled={!morseCode.trim()}
                className='flex-1'
              >
                {isPlaying ? (
                  <>
                    <Square className='h-4 w-4 mr-2' />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className='h-4 w-4 mr-2' />
                    Play Morse Code
                  </>
                )}
              </Button>
              <div className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  id='repeat-toggle'
                  checked={repeat}
                  onChange={() => setRepeat(!repeat)}
                  className='h-4 w-4'
                />
                <Label htmlFor='repeat-toggle'>Repeat Morse code</Label>
              </div>
            </div>
          </div>

          <div className='text-sm text-muted-foreground space-y-1'>
            <p>
              <strong>Legend:</strong>
            </p>
            <p>• Dot (.) = Short beep (600Hz)</p>
            <p>• Dash (-) = Long beep (600Hz)</p>
            <p>• Space = Letter separation</p>
            <p>• / = Word separation</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
