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
import React, { useRef, useCallback } from 'react';

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
  isBottomSheet?: boolean;
  useFarnsworthTiming?: boolean;
  setUseFarnsworthTiming?: (val: boolean) => void;
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
  isBottomSheet = false,
  useFarnsworthTiming = false,
  setUseFarnsworthTiming,
}: ControlPanelProps) {
  const hasContent = morseCode.trim();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const SWIPE_THRESHOLD = 50;

  // Handle swipe gestures for play/pause
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX.current;
      const deltaY = touchEndY - touchStartY.current;

      // Only trigger if horizontal swipe is dominant
      if (
        Math.abs(deltaX) > Math.abs(deltaY) &&
        Math.abs(deltaX) > SWIPE_THRESHOLD
      ) {
        if (deltaX > 0) {
          // Swipe right - Play
          if (!isPlaying && hasContent) {
            playMorseCode();
          }
        } else {
          // Swipe left - Stop
          if (isPlaying) {
            stopPlayback();
          }
        }
      }

      touchStartX.current = null;
      touchStartY.current = null;
    },
    [isPlaying, hasContent, playMorseCode, stopPlayback],
  );

  // LED indicator color based on current dot/dash type
  const getLedColor = () => {
    if (currentDotDashType === 'dot')
      return 'bg-blue-500 shadow-lg shadow-blue-500/70';
    if (currentDotDashType === 'dash')
      return 'bg-orange-500 shadow-lg shadow-orange-500/70';
    return 'bg-gray-400';
  };

  // Button sizes based on mode
  const buttonSize = isBottomSheet ? 'lg' : 'default';
  const secondaryButtonSize = isBottomSheet ? 'default' : 'sm';
  const iconSize = isBottomSheet ? 'h-5 w-5' : 'h-3 w-3';
  const playButtonIconSize = isBottomSheet ? 'h-6 w-6' : 'h-4 w-4';

  return (
    <div className={isBottomSheet ? 'space-y-6 pb-8' : 'space-y-6'}>
      {/* Speed, Frequency, and Volume Sliders */}
      <div
        className={isBottomSheet ? 'grid gap-6' : 'grid gap-6 sm:grid-cols-3'}
      >
        {/* Speed Control */}
        <div className={isBottomSheet ? 'space-y-4' : 'space-y-3'}>
          <div className='flex items-center justify-between'>
            <Label
              htmlFor='speed-slider'
              className={
                isBottomSheet ? 'text-base font-medium' : 'text-sm font-medium'
              }
            >
              Speed
            </Label>
            <span className='rounded-md bg-primary/10 px-3 py-1 text-sm font-mono text-primary'>
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
            className={isBottomSheet ? 'py-3' : 'py-1'}
          />
          <div className='flex justify-between text-sm text-muted-foreground'>
            <span>Slow</span>
            <span>Fast</span>
          </div>
        </div>

        {/* Frequency Control */}
        <div className={isBottomSheet ? 'space-y-4' : 'space-y-3'}>
          <div className='flex items-center justify-between'>
            <Label
              htmlFor='freq-slider'
              className={
                isBottomSheet ? 'text-base font-medium' : 'text-sm font-medium'
              }
            >
              Frequency
            </Label>
            <span className='rounded-md bg-primary/10 px-3 py-1 text-sm font-mono text-primary'>
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
            className={isBottomSheet ? 'py-3' : 'py-1'}
          />
          <div className='flex justify-between text-sm text-muted-foreground'>
            <span>300 Hz</span>
            <span>1000 Hz</span>
          </div>
        </div>

        {/* Volume Control */}
        <div className={isBottomSheet ? 'space-y-4' : 'space-y-3'}>
          <div className='flex items-center justify-between'>
            <Label
              htmlFor='volume-slider'
              className={
                isBottomSheet ? 'text-base font-medium' : 'text-sm font-medium'
              }
            >
              Volume
            </Label>
            <span className='rounded-md bg-primary/10 px-3 py-1 text-sm font-mono text-primary'>
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
            className={isBottomSheet ? 'py-3' : 'py-1'}
          />
          <div className='flex justify-between text-sm text-muted-foreground'>
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Main Controls */}
      <div className={isBottomSheet ? 'space-y-5' : 'space-y-4'}>
        {/* LED Indicator and Play/Stop Button */}
        <div className='flex items-center gap-3'>
          {/* LED Indicator */}
          <div className='flex flex-col items-center gap-1'>
            <div
              className={`h-5 w-5 rounded-full transition-all duration-75 ${getLedColor()} ${
                currentDotDashType ? 'scale-110' : ''
              }`}
            />
            <span
              className={
                isBottomSheet
                  ? 'text-xs text-muted-foreground uppercase tracking-wider'
                  : 'text-[10px] text-muted-foreground uppercase tracking-wider'
              }
            >
              {currentDotDashType === 'dot'
                ? 'DOT'
                : currentDotDashType === 'dash'
                ? 'DASH'
                : 'LED'}
            </span>
          </div>

          {/* Play/Stop Button with touch/swipe support */}
          <div
            className='flex-1 touch-pan-y'
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <Button
              onClick={playMorseCode}
              disabled={!hasContent}
              size={buttonSize}
              className={`w-full gap-2 transition-all ${
                isPlaying
                  ? 'bg-destructive hover:bg-destructive/90 animate-pulse-glow'
                  : ''
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className={playButtonIconSize} />
                  {isBottomSheet ? 'Stop Playback' : 'Stop'}
                </>
              ) : (
                <>
                  <Play className={playButtonIconSize} />
                  {isBottomSheet ? 'Play Morse Code' : 'Play Morse Code'}
                </>
              )}
            </Button>
            {/* Swipe hint for mobile */}
            {isBottomSheet && (
              <p className='mt-2 text-center text-xs text-muted-foreground'>
                Swipe right to play • Swipe left to stop
              </p>
            )}
          </div>
        </div>

        {/* Secondary Controls */}
        <div
          className={
            isBottomSheet
              ? 'grid grid-cols-2 gap-3'
              : 'grid grid-cols-2 sm:grid-cols-4 gap-2'
          }
        >
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
                size={secondaryButtonSize}
                className='w-full gap-1'
                disabled={!hasContent}
              >
                <RotateCcw className={iconSize} />
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
            size={secondaryButtonSize}
            className='w-full gap-1'
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className={iconSize} />
            Upload
          </Button>

          <Button
            variant='outline'
            size={secondaryButtonSize}
            className='w-full gap-1'
            onClick={handleDownload}
            disabled={!hasContent}
          >
            <Download className={iconSize} />
            Export
          </Button>

          <Button
            variant='outline'
            size={secondaryButtonSize}
            className='w-full gap-1'
            onClick={exportAsWav}
            disabled={!hasContent}
          >
            <Volume2 className={iconSize} />
            Audio
          </Button>

          <Button
            variant={repeat ? 'default' : 'outline'}
            size={secondaryButtonSize}
            className={`w-full gap-1 ${repeat ? '' : 'opacity-70'}`}
            onClick={() => setRepeat(!repeat)}
          >
            <Repeat className={iconSize} />
            Repeat
          </Button>
        </div>
      </div>

      {/* Repeat Toggle (Mobile-friendly alternative) */}
      <div
        className={
          isBottomSheet
            ? 'flex items-center gap-4 rounded-lg bg-muted/50 p-4'
            : 'flex items-center gap-3 rounded-lg bg-muted/50 p-3'
        }
      >
        <button
          type='button'
          id='repeat-toggle'
          onClick={() => setRepeat(!repeat)}
          className={`relative h-8 w-14 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
            repeat ? 'bg-primary' : 'bg-muted-foreground/30'
          }`}
          role='switch'
          aria-checked={repeat}
        >
          <span
            className={`block h-7 w-7 rounded-full bg-white shadow-md transition-transform duration-200 ${
              repeat ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
        <Label
          htmlFor='repeat-toggle'
          className={
            isBottomSheet
              ? 'cursor-pointer text-base text-muted-foreground'
              : 'cursor-pointer text-sm text-muted-foreground'
          }
        >
          Repeat playback
        </Label>
      </div>

      {/* Farnsworth Timing Toggle */}
      {setUseFarnsworthTiming && (
        <div
          className={
            isBottomSheet
              ? 'flex items-center gap-4 rounded-lg bg-muted/50 p-4'
              : 'flex items-center gap-3 rounded-lg bg-muted/50 p-3'
          }
        >
          <button
            type='button'
            id='farnsworth-toggle'
            onClick={() => setUseFarnsworthTiming(!useFarnsworthTiming)}
            className={`relative h-8 w-14 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              useFarnsworthTiming ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
            role='switch'
            aria-checked={useFarnsworthTiming}
          >
            <span
              className={`block h-7 w-7 rounded-full bg-white shadow-md transition-transform duration-200 ${
                useFarnsworthTiming ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
          <Label
            htmlFor='farnsworth-toggle'
            className={
              isBottomSheet
                ? 'cursor-pointer text-base text-muted-foreground'
                : 'cursor-pointer text-sm text-muted-foreground'
            }
          >
            Farnsworth timing
          </Label>
        </div>
      )}
    </div>
  );
}
