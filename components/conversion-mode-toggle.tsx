'use client';

import * as React from 'react';
import { ArrowRightLeft, Mic, FileAudio, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type ConversionMode = 'text-to-morse' | 'morse-to-text' | 'practice';

interface ConversionModeToggleProps {
  mode: ConversionMode;
  setMode: (mode: ConversionMode) => void;
  isListening: boolean;
}

export function ConversionModeToggle({
  mode,
  setMode,
  isListening,
}: ConversionModeToggleProps) {
  return (
    <div className='flex items-center gap-2'>
      <Button
        variant={mode === 'text-to-morse' ? 'default' : 'outline'}
        size='sm'
        onClick={() => setMode('text-to-morse')}
        className='gap-2'
        disabled={isListening}
        title='Encode text to Morse code'
      >
        <ArrowRightLeft className='h-4 w-4' />
        <span className='hidden sm:inline'>Text → Morse</span>
      </Button>

      <Button
        variant={mode === 'morse-to-text' ? 'default' : 'outline'}
        size='sm'
        onClick={() => setMode('morse-to-text')}
        className='gap-2'
        title='Decode Morse code to text'
      >
        <ArrowRightLeft className='h-4 w-4 rotate-180' />
        <span className='hidden sm:inline'>Morse → Text</span>
      </Button>

      <Button
        variant={mode === 'practice' ? 'default' : 'outline'}
        size='sm'
        onClick={() => setMode('practice')}
        className='gap-2'
        title='Practice and learn Morse code'
      >
        <GraduationCap className='h-4 w-4' />
        <span className='hidden sm:inline'>Practice</span>
      </Button>
    </div>
  );
}

// Audio input mode for Morse-to-Text
export type AudioInputMode = 'microphone' | 'file';

interface AudioInputModeToggleProps {
  audioInputMode: AudioInputMode;
  setAudioInputMode: (mode: AudioInputMode) => void;
  isListening: boolean;
}

export function AudioInputModeToggle({
  audioInputMode,
  setAudioInputMode,
  isListening,
}: AudioInputModeToggleProps) {
  return (
    <div className='flex items-center gap-2'>
      <Button
        variant={audioInputMode === 'microphone' ? 'default' : 'outline'}
        size='sm'
        onClick={() => setAudioInputMode('microphone')}
        className='gap-2'
        title='Real-time microphone input'
      >
        <Mic className='h-4 w-4' />
        <span className='hidden sm:inline'>Microphone</span>
      </Button>

      <Button
        variant={audioInputMode === 'file' ? 'default' : 'outline'}
        size='sm'
        onClick={() => setAudioInputMode('file')}
        className='gap-2'
        disabled={isListening}
        title='Load audio file for decoding'
      >
        <FileAudio className='h-4 w-4' />
        <span className='hidden sm:inline'>Audio File</span>
      </Button>
    </div>
  );
}
