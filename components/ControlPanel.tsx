'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Square,
  UploadCloud,
  Download,
  RotateCcw,
  Repeat,
  Volume2,
} from 'lucide-react';
import ResetDialog from './reset-dialog';
import React from 'react';

interface ControlPanelProps {
  speed: number[];
  setSpeed: (val: number[]) => void;
  frequency: number[];
  setFrequency: (val: number[]) => void;
  volume: number[];
  setVolume: (val: number[]) => void;
  repeat: boolean;
  setRepeat: (flag: boolean) => void;
  playMorseCode: () => void;
  isPlaying: boolean;
  morseCode: string;
  stopPlayback: () => void;
  setInputText: (v: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDownload: () => void;
  exportAsWav: () => void;
  currentDotDashType: 'dot' | 'dash' | null;
}

export default function ControlPanel({
  speed,
  setSpeed,
  frequency,
  setFrequency,
  volume,
  setVolume,
  repeat,
  setRepeat,
  playMorseCode,
  isPlaying,
  morseCode,
  stopPlayback,
  setInputText,
  fileInputRef,
  handleUpload,
  handleDownload,
  exportAsWav,
  currentDotDashType,
}: ControlPanelProps) {
  const hasContent = morseCode.trim();

  // LED indicator color based on current dot/dash type
  const getLedColor = () => {
    if (currentDotDashType === 'dot')
      return 'bg-blue-500 shadow-lg shadow-blue-500/70';
    if (currentDotDashType === 'dash')
      return 'bg-orange-500 shadow-lg shadow-orange-500/70';
    return 'bg-gray-400';
  };

  return (
    <div className='space-y-6'>
      {/* Speed, Frequency, and Volume Sliders */}
      <div className='grid gap-6 sm:grid-cols-3'>
        {/* Speed Control */}
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <Label htmlFor='speed-slider' className='text-sm font-medium'>
              Speed
            </Label>
            <span className='rounded-md bg-primary/10 px-2 py-0.5 text-xs font-mono text-primary'>
              {speed[0]} WPM
            </span>
          </div>
          <Slider
            id='speed-slider'
            min={5}
            max={40}
            step={1}
            value={speed}
            onValueChange={setSpeed}
            className='py-1'
          />
          <div className='flex justify-between text-xs text-muted-foreground'>
            <span>Slow</span>
            <span>Fast</span>
          </div>
        </div>

        {/* Frequency Control */}
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <Label htmlFor='freq-slider' className='text-sm font-medium'>
              Frequency
            </Label>
            <span className='rounded-md bg-primary/10 px-2 py-0.5 text-xs font-mono text-primary'>
              {frequency[0]} Hz
            </span>
          </div>
          <Slider
            id='freq-slider'
            min={300}
            max={1000}
            step={10}
            value={frequency}
            onValueChange={setFrequency}
            className='py-1'
          />
          <div className='flex justify-between text-xs text-muted-foreground'>
            <span>300 Hz</span>
            <span>1000 Hz</span>
          </div>
        </div>

        {/* Volume Control */}
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <Label htmlFor='volume-slider' className='text-sm font-medium'>
              Volume
            </Label>
            <span className='rounded-md bg-primary/10 px-2 py-0.5 text-xs font-mono text-primary'>
              {volume[0]}%
            </span>
          </div>
          <Slider
            id='volume-slider'
            min={0}
            max={100}
            step={1}
            value={volume}
            onValueChange={setVolume}
            className='py-1'
          />
          <div className='flex justify-between text-xs text-muted-foreground'>
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Main Controls */}
      <div className='space-y-4'>
        {/* LED Indicator and Play/Stop Button */}
        <div className='flex items-center gap-3'>
          {/* LED Indicator */}
          <div className='flex flex-col items-center gap-1'>
            <div
              className={`h-4 w-4 rounded-full transition-all duration-75 ${getLedColor()} ${
                currentDotDashType ? 'scale-110' : ''
              }`}
            />
            <span className='text-[10px] text-muted-foreground uppercase tracking-wider'>
              {currentDotDashType === 'dot'
                ? 'DOT'
                : currentDotDashType === 'dash'
                ? 'DASH'
                : 'LED'}
            </span>
          </div>
          {/* Play/Stop Button */}
          <Button
            onClick={playMorseCode}
            disabled={!hasContent}
            size='lg'
            className={`flex-1 gap-2 transition-all ${
              isPlaying
                ? 'bg-destructive hover:bg-destructive/90 animate-pulse-glow'
                : ''
            }`}
          >
            {isPlaying ? (
              <>
                <Square className='h-4 w-4' />
                Stop
              </>
            ) : (
              <>
                <Play className='h-4 w-4' />
                Play Morse Code
              </>
            )}
          </Button>
        </div>

        {/* Secondary Controls */}
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
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
                variant='outline'
                size='sm'
                className='w-full gap-1'
                disabled={!hasContent}
              >
                <RotateCcw className='h-3 w-3' />
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
            size='sm'
            className='w-full gap-1'
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className='h-3 w-3' />
            Upload
          </Button>

          <Button
            variant='outline'
            size='sm'
            className='w-full gap-1'
            onClick={handleDownload}
            disabled={!hasContent}
          >
            <Download className='h-3 w-3' />
            Export
          </Button>

          <Button
            variant='outline'
            size='sm'
            className='w-full gap-1'
            onClick={exportAsWav}
            disabled={!hasContent}
          >
            <Volume2 className='h-3 w-3' />
            Audio
          </Button>

          <Button
            variant={repeat ? 'default' : 'outline'}
            size='sm'
            className={`w-full gap-1 ${repeat ? '' : 'opacity-70'}`}
            onClick={() => setRepeat(!repeat)}
          >
            <Repeat className='h-3 w-3' />
            Repeat
          </Button>
        </div>
      </div>

      {/* Repeat Toggle (Mobile-friendly alternative) */}
      <div className='flex items-center gap-3 rounded-lg bg-muted/50 p-3'>
        <button
          type='button'
          id='repeat-toggle'
          onClick={() => setRepeat(!repeat)}
          className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
            repeat ? 'bg-primary' : 'bg-muted-foreground/30'
          }`}
          role='switch'
          aria-checked={repeat}
        >
          <span
            className={`block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
              repeat ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
        <Label
          htmlFor='repeat-toggle'
          className='cursor-pointer text-sm text-muted-foreground'
        >
          Repeat playback
        </Label>
      </div>
    </div>
  );
}
