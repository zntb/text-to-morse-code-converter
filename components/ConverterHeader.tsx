'use client';

import { Radio } from 'lucide-react';
import { ConversionModeToggle } from './conversion-mode-toggle';
import { ModeToggle } from './mode-toggle';
import { ConversionMode } from './conversion-mode-toggle';

interface ConverterHeaderProps {
  conversionMode: ConversionMode;
  setConversionMode: (mode: ConversionMode) => void;
  isListening: boolean;
  isPlaying: boolean;
}

export default function ConverterHeader({
  conversionMode,
  setConversionMode,
  isListening,
  isPlaying,
}: ConverterHeaderProps) {
  return (
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
                : conversionMode === 'morse-to-text'
                ? 'Morse Code to Text'
                : 'Practice / Learn Mode'}
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
  );
}
