'use client';

import React, { memo, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MorseOutputDisplayProps {
  morseCode: string;
  highlightIndex: number | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
  highlightRef: React.RefObject<HTMLSpanElement | null>;
  currentDotDashType: 'dot' | 'dash' | null;
}

// Convert morse code to audio format representation
const convertToAudioFormat = (morse: string): string => {
  return morse.replace(/\./g, '·').replace(/-/g, '—').replace(/ /g, ' | ');
};

const MorseOutputDisplay = memo(function MorseOutputDisplay({
  morseCode,
  highlightIndex,
  containerRef,
  highlightRef,
  currentDotDashType,
}: MorseOutputDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (format: 'standard' | 'audio') => {
    const textToCopy =
      format === 'audio' ? convertToAudioFormat(morseCode) : morseCode;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className='space-y-3'>
      {/* Morse Code Display with Copy Button */}
      <div className='relative min-h-[80px] overflow-hidden rounded-lg border bg-muted/30'>
        {/* Copy Button */}
        {morseCode.length > 0 && (
          <div className='absolute top-2 right-2 z-10'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8'
                  title='Copy morse code'
                >
                  {copied ? (
                    <Check className='h-4 w-4 text-green-500' />
                  ) : (
                    <Copy className='h-4 w-4' />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => handleCopy('standard')}>
                  Copy as dots/dashes (.-)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCopy('audio')}>
                  Copy as audio (· —)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        <div
          id='morse-output-container'
          className='h-full w-full overflow-y-auto p-4 font-mono text-2xl leading-relaxed tracking-widest'
          ref={containerRef}
        >
          {morseCode.length > 0 ? (
            morseCode
              .split('')
              .map((char, idx) => (
                <MorseChar
                  key={idx}
                  char={char}
                  isHighlighted={idx === highlightIndex}
                  currentDotDashType={
                    idx === highlightIndex ? currentDotDashType : null
                  }
                  ref={idx === highlightIndex ? highlightRef : undefined}
                />
              ))
          ) : (
            <span className='text-muted-foreground/50 italic'>
              Morse code will appear here...
            </span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className='flex items-center gap-4 text-xs text-muted-foreground'>
        <div className='flex items-center gap-1.5'>
          <span className='inline-block w-3 h-3 rounded bg-blue-500/20 text-center leading-3 text-blue-500'>
            ·
          </span>
          <span>Dot</span>
        </div>
        <div className='flex items-center gap-1.5'>
          <span className='inline-block w-3 h-3 rounded bg-orange-500/20 text-center leading-3 text-orange-500'>
            −
          </span>
          <span>Dash</span>
        </div>
        <div className='flex items-center gap-1.5'>
          <span className='text-primary/60'>|</span>
          <span>Letter gap</span>
        </div>
      </div>
    </div>
  );
});

interface MorseCharProps {
  char: string;
  isHighlighted: boolean;
  currentDotDashType: 'dot' | 'dash' | null;
}

const MorseChar = memo(
  React.forwardRef<HTMLSpanElement, MorseCharProps>(
    ({ char, isHighlighted, currentDotDashType }, ref) => {
      // Styling based on character type
      let charClass = '';
      if (char === '.') {
        charClass = 'text-blue-500 font-bold';
      } else if (char === '-') {
        charClass = 'text-orange-500 font-bold';
      } else if (char === ' ') {
        charClass = 'text-muted-foreground/40';
      } else {
        charClass = 'text-foreground';
      }

      // Different highlight colors for dots vs dashes
      const getHighlightClass = () => {
        if (!isHighlighted) return charClass;

        if (currentDotDashType === 'dot') {
          // Blue glow for dots
          return 'scale-125 bg-blue-500 text-white shadow-lg shadow-blue-500/50 rounded px-0.5';
        } else if (currentDotDashType === 'dash') {
          // Orange glow for dashes
          return 'scale-125 bg-orange-500 text-white shadow-lg shadow-orange-500/50 rounded px-0.5';
        }
        // Default highlight
        return 'scale-125 bg-primary text-primary-foreground shadow-lg shadow-primary/30 rounded px-0.5';
      };

      return (
        <span
          ref={ref}
          className={`inline-block transition-all duration-100 ${getHighlightClass()}`}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      );
    },
  ),
);

export default MorseOutputDisplay;
