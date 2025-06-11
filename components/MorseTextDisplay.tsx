import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import React, { memo, useLayoutEffect } from 'react';

interface MorseTextDisplayProps {
  inputText: string;
  currentTextIndex: number | null;
  textContainerRef: React.RefObject<HTMLDivElement | null>;
  textHighlightRef: React.RefObject<HTMLSpanElement | null>;
  setInputText: (value: string) => void;
}

const MorseTextDisplay = memo(function MorseTextDisplay({
  inputText,
  currentTextIndex,
  textContainerRef,
  textHighlightRef,
  setInputText,
}: MorseTextDisplayProps) {
  // Add the scrolling effect for text highlight
  useLayoutEffect(() => {
    if (
      currentTextIndex !== null &&
      textHighlightRef.current &&
      textContainerRef.current
    ) {
      const container = textContainerRef.current;
      const highlight = textHighlightRef.current;

      // Get container bounds
      const containerRect = container.getBoundingClientRect();
      const highlightRect = highlight.getBoundingClientRect();

      // Calculate if highlight is visible
      const containerTop = containerRect.top;
      const containerBottom = containerRect.bottom;
      const highlightTop = highlightRect.top;
      const highlightBottom = highlightRect.bottom;

      // Scroll if highlight is outside visible area
      if (highlightTop < containerTop || highlightBottom > containerBottom) {
        highlight.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTextIndex]);

  return (
    <div className='space-y-2'>
      <Label htmlFor='input-text'>Enter Text</Label>
      <div className='relative h-[100px] overflow-hidden rounded-md border'>
        <div
          className='h-full w-full overflow-y-auto p-2 bg-background scroll-smooth'
          ref={textContainerRef}
          style={{
            scrollBehavior: 'smooth',
            // Ensure hardware acceleration for smooth scrolling
            willChange: 'scroll-position',
            transform: 'translateZ(0)',
          }}
        >
          {inputText.split('').map((char, idx) => (
            <span
              key={idx}
              className={`inline-block px-[1px] rounded-sm transition-colors duration-150 ${
                idx === currentTextIndex
                  ? 'bg-blue-500/30 text-blue-600 font-bold shadow-sm'
                  : 'text-foreground'
              }`}
              ref={idx === currentTextIndex ? textHighlightRef : undefined}
              style={{
                // Optimize for smooth highlighting
                backfaceVisibility: 'hidden',
                transform: 'translateZ(0)',
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </div>
      </div>
      <Textarea
        id='input-text'
        placeholder='Type your message here...'
        value={inputText}
        onChange={e => setInputText(e.target.value)}
        className='min-h-[100px] max-h-40'
      />
    </div>
  );
});

export default MorseTextDisplay;
