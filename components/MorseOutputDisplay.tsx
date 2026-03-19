'use client';

import React, { memo } from 'react';

interface MorseOutputDisplayProps {
  morseCode: string;
  highlightIndex: number | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
  highlightRef: React.RefObject<HTMLSpanElement | null>;
}

const MorseOutputDisplay = memo(function MorseOutputDisplay({
  morseCode,
  highlightIndex,
  containerRef,
  highlightRef,
}: MorseOutputDisplayProps) {
  return (
    <div className='space-y-3'>
      {/* Morse Code Display */}
      <div className='relative min-h-[80px] overflow-hidden rounded-lg border bg-muted/30'>
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
          <span className='inline-block w-3 h-3 rounded bg-primary/20 text-center leading-3 text-primary'>
            ·
          </span>
          <span>Dot</span>
        </div>
        <div className='flex items-center gap-1.5'>
          <span className='inline-block w-3 h-3 rounded bg-primary/20 text-center leading-3 text-primary'>
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
}

const MorseChar = memo(
  React.forwardRef<HTMLSpanElement, MorseCharProps>(
    ({ char, isHighlighted }, ref) => {
      // Styling based on character type
      let charClass = '';
      if (char === '.') {
        charClass = 'text-primary font-bold';
      } else if (char === '-') {
        charClass = 'text-primary font-bold';
      } else if (char === ' ') {
        charClass = 'text-muted-foreground/40';
      } else {
        charClass = 'text-foreground';
      }

      return (
        <span
          ref={ref}
          className={`inline-block transition-all duration-100 ${
            isHighlighted
              ? 'scale-125 bg-primary text-primary-foreground shadow-lg shadow-primary/30 rounded px-0.5'
              : charClass
          }`}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      );
    },
  ),
);

export default MorseOutputDisplay;
