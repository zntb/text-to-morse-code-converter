import { Label } from '@/components/ui/label';
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
    <div className='space-y-2'>
      <Label htmlFor='morse-output'>Morse Code</Label>
      <div className='relative h-[80px] overflow-hidden rounded-md border'>
        <div
          id='morse-output-container'
          className='h-full w-full overflow-y-auto p-2 font-mono bg-muted dark:bg-zinc-800'
          ref={containerRef}
        >
          {morseCode.split('').map((char, idx) => (
            <MorseChar
              key={idx}
              char={char}
              isHighlighted={idx === highlightIndex}
              ref={idx === highlightIndex ? highlightRef : undefined}
            />
          ))}
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
      return (
        <span
          ref={ref}
          className={`inline-block px-[1px] rounded-sm ${
            isHighlighted
              ? 'bg-red-500/30 text-red-500 font-bold'
              : 'text-foreground'
          }`}
        >
          {char}
        </span>
      );
    },
  ),
);

export default MorseOutputDisplay;
