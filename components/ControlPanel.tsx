import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Play, Square, UploadCloud, Download } from 'lucide-react';
import ResetDialog from './reset-dialog';
import React from 'react';

interface ControlPanelProps {
  speed: number[];
  setSpeed: (val: number[]) => void;
  frequency: number[];
  setFrequency: (val: number[]) => void;
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
}

export default function ControlPanel({
  speed,
  setSpeed,
  frequency,
  setFrequency,
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
}: ControlPanelProps) {
  return (
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
              className='flex items-center bg-red-200 hover:bg-red-300 text-black'
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
          onClick={() => fileInputRef.current?.click()}
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
  );
}
