'use client';

import { useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { Timer, Zap, Clock } from 'lucide-react';

interface PlaybackProgressProps {
  currentIndex: number | null;
  totalLength: number;
  speed: number[];
  sessionStats: {
    totalCharactersPlayed: number;
    totalTimeSpent: number; // in seconds
  };
  onSeek?: (position: number) => void;
}

export default function PlaybackProgress({
  currentIndex,
  totalLength,
  speed,
  sessionStats,
  onSeek,
}: PlaybackProgressProps) {
  // Calculate progress percentage
  const progress = useMemo(() => {
    if (totalLength === 0 || currentIndex === null) return 0;
    return ((currentIndex + 1) / totalLength) * 100;
  }, [currentIndex, totalLength]);

  // Calculate CPM (Characters Per Minute)
  // At WPM speed, each "word" is considered 5 characters (standard Paris standard)
  // So CPM = WPM * 5
  const cpm = useMemo(() => {
    return speed[0] * 5;
  }, [speed]);

  // Calculate WPM directly from speed
  const wpm = speed[0];

  // Format time spent
  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Handle seek
  const handleSeek = (value: number[]) => {
    if (onSeek && totalLength > 0) {
      const position = Math.floor((value[0] / 100) * totalLength);
      onSeek(position);
    }
  };

  return (
    <div className='space-y-3 rounded-lg border bg-card p-4'>
      {/* Progress Bar */}
      <div className='space-y-2'>
        <div className='flex items-center justify-between text-sm'>
          <span className='flex items-center gap-1 text-muted-foreground'>
            <Clock className='h-3 w-3' />
            Progress
          </span>
          <span className='text-muted-foreground'>
            {currentIndex !== null ? currentIndex + 1 : 0} / {totalLength}
          </span>
        </div>
        <Slider
          value={[progress]}
          onValueChange={handleSeek}
          max={100}
          step={0.1}
          disabled={totalLength === 0}
          className='cursor-pointer'
        />
        <div className='h-1.5 w-full overflow-hidden rounded-full bg-secondary'>
          <div
            className='h-full bg-primary transition-all duration-300'
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className='flex flex-wrap gap-4 text-sm'>
        {/* CPM */}
        <div className='flex items-center gap-1.5 rounded-md bg-secondary/50 px-2 py-1'>
          <Zap className='h-3.5 w-3.5 text-yellow-500' />
          <span className='font-medium'>{cpm}</span>
          <span className='text-muted-foreground'>CPM</span>
        </div>

        {/* WPM */}
        <div className='flex items-center gap-1.5 rounded-md bg-secondary/50 px-2 py-1'>
          <Timer className='h-3.5 w-3.5 text-green-500' />
          <span className='font-medium'>{wpm}</span>
          <span className='text-muted-foreground'>WPM</span>
        </div>

        {/* Total Characters Played */}
        <div className='flex items-center gap-1.5 rounded-md bg-secondary/50 px-2 py-1'>
          <span className='font-medium'>
            {sessionStats.totalCharactersPlayed}
          </span>
          <span className='text-muted-foreground'>chars</span>
        </div>

        {/* Time Spent */}
        <div className='flex items-center gap-1.5 rounded-md bg-secondary/50 px-2 py-1'>
          <Clock className='h-3.5 w-3.5 text-blue-500' />
          <span className='font-medium'>
            {formatTime(sessionStats.totalTimeSpent)}
          </span>
        </div>
      </div>
    </div>
  );
}
