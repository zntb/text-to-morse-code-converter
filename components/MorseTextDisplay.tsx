import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import React from 'react';

interface MorseTextDisplayProps {
  inputText: string;
  currentTextIndex: number | null;
  textContainerRef: React.RefObject<HTMLDivElement | null>;
  textHighlightRef: React.RefObject<HTMLSpanElement>;
  setInputText: (value: string) => void;
}

export default function MorseTextDisplay({
  inputText,
  currentTextIndex,
  textContainerRef,
  textHighlightRef,
  setInputText,
}: MorseTextDisplayProps) {
  return (
    <div className='space-y-2'>
      <Label htmlFor='input-text'>Enter Text</Label>
      <div className='relative h-[100px] overflow-hidden rounded-md border'>
        <div
          className='h-full w-full overflow-y-auto p-2 bg-background'
          ref={textContainerRef}
        >
          {inputText.split('').map((char, idx) => (
            <span
              key={idx}
              className={`inline-block px-[1px] rounded-sm ${
                idx === currentTextIndex
                  ? 'bg-blue-500/30 text-blue-600 font-bold'
                  : 'text-foreground'
              }`}
              ref={idx === currentTextIndex ? textHighlightRef : undefined}
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
}
