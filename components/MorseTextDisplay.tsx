'use client';

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
    <div className='space-y-3'>
      {/* Hidden display for character highlighting */}
      <div className='relative min-h-[60px] overflow-hidden rounded-lg border bg-muted/30'>
        <div
          className='h-full w-full overflow-y-auto p-3 font-mono text-xl leading-relaxed tracking-wide'
          ref={textContainerRef}
          style={{
            scrollBehavior: 'smooth',
            willChange: 'scroll-position',
          }}
        >
          {inputText.length > 0 ? (
            inputText.split('').map((char, idx) => (
              <span
                key={idx}
                className={`inline-block px-[1px] rounded-sm transition-all duration-150 ${
                  idx === currentTextIndex
                    ? 'bg-primary/40 text-primary-foreground scale-110 shadow-sm ring-1 ring-primary'
                    : 'text-foreground'
                }`}
                ref={idx === currentTextIndex ? textHighlightRef : undefined}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))
          ) : (
            <span className='text-muted-foreground/50 italic'>
              Your text will appear here with highlighting...
            </span>
          )}
        </div>
      </div>

      {/* Input Textarea */}
      <Textarea
        id='input-text'
        placeholder='Type your message here to convert to Morse code...'
        value={inputText}
        onChange={e => setInputText(e.target.value)}
        className='min-h-[100px] resize-y font-mono text-base'
      />

      {/* Character count */}
      <div className='flex justify-between text-xs text-muted-foreground'>
        <span>{inputText.length} characters</span>
        <span>
          {inputText.length > 0
            ? `${inputText.split('').filter(c => c.trim()).length} words`
            : '0 words'}
        </span>
      </div>
    </div>
  );
});

export default MorseTextDisplay;
