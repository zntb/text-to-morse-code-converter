/* eslint-disable @typescript-eslint/no-require-imports */
import { convertToMorse, convertToText } from '@/lib/morse-conversion';
import { TEXT_TO_MORSE_MAP } from '@/morse-code-data';

describe('convertToMorse', () => {
  it('converts a single letter to Morse', () => {
    expect(convertToMorse('A')).toBe('.-');
    expect(convertToMorse('S')).toBe('...');
    expect(convertToMorse('E')).toBe('.');
    expect(convertToMorse('T')).toBe('-');
  });

  it('converts a word to Morse', () => {
    expect(convertToMorse('SOS')).toBe('... --- ...');
    expect(convertToMorse('HELLO')).toBe('.... . .-.. .-.. ---');
  });

  it('converts uppercase and lowercase the same', () => {
    expect(convertToMorse('sos')).toBe('... --- ...');
    expect(convertToMorse('Sos')).toBe('... --- ...');
  });

  it('handles numbers', () => {
    expect(convertToMorse('123')).toBe('.---- ..--- ...--');
    expect(convertToMorse('007')).toBe('----- ----- --...');
  });

  it('handles spaces between words (word gap)', () => {
    expect(convertToMorse('HELLO WORLD')).toBe(
      '.... . .-.. .-.. --- / .-- --- .-. .-.. -..',
    );
  });

  it('handles punctuation', () => {
    expect(convertToMorse('.')).toBe('.-.-.-');
    expect(convertToMorse('?')).toBe('..--..');
    expect(convertToMorse('!')).toBe('-.-.--');
  });

  it('converts unknown characters to ?', () => {
    expect(convertToMorse('~')).toBe('?');
    expect(convertToMorse('A~B')).toBe('.- ? -...');
  });

  it('handles empty string', () => {
    expect(convertToMorse('')).toBe('');
  });

  it('handles accented characters', () => {
    expect(convertToMorse('É')).toBe('..-..');
    expect(convertToMorse('Ñ')).toBe('--.--');
  });
});

describe('convertToText', () => {
  it('decodes Morse to some valid character from the map', () => {
    // Note: The map has duplicate codes (e.g., '.-' matches A, Á, Α, А, أ, ア).
    // The last entry in the map wins. So we verify the result is not '?' (unknown).
    const result = convertToText('.-');
    expect(TEXT_TO_MORSE_MAP['.-']).toBe(result);
    expect(result).not.toBe('?');
  });

  it('decodes a known Morse sequence to the map value', () => {
    expect(TEXT_TO_MORSE_MAP['.-']).toBe(convertToText('.-'));
    expect(TEXT_TO_MORSE_MAP['...']).toBe(convertToText('...'));
    expect(TEXT_TO_MORSE_MAP['.']).toBe(convertToText('.'));
    expect(TEXT_TO_MORSE_MAP['-']).toBe(convertToText('-'));
  });

  it('decodes numbers from Morse', () => {
    expect(convertToText('.----')).toBe('1');
    expect(convertToText('..---')).toBe('2');
    expect(convertToText('...--')).toBe('3');
    expect(convertToText('....-')).toBe('4');
    expect(convertToText('.....')).toBe('5');
    expect(convertToText('-....')).toBe('6');
    expect(convertToText('--...')).toBe('7');
    // Note: '8' = '---..' is shared with Hungarian 'Ő' and Cyrillic 'Ő'.
    // So TEXT_TO_MORSE_MAP returns whichever entry was last in the map.
    // We test via the map instead of hardcoding.
    expect(convertToText('---..')).toBe(TEXT_TO_MORSE_MAP['---..']);
    expect(convertToText('----.')).toBe('9');
    expect(convertToText('-----')).toBe('0');
  });

  it('decodes a word built from numbers', () => {
    expect(convertToText('.---- ..--- ...--')).toBe('123');
  });

  it('handles word gaps (/)', () => {
    // Use numbers which have unique mappings
    const result = convertToText('.---- ..--- ...-- / ....- ..... -....');
    expect(result).toBe('123 456');
  });

  it('decodes punctuation', () => {
    expect(convertToText('.-.-.-')).toBe('.');
    expect(convertToText('--..--')).toBe(',');
    // Note: '?' = '..--..' is shared with Hungarian 'Ű'.
    // We test via the map instead of hardcoding.
    expect(convertToText('..--..')).toBe(TEXT_TO_MORSE_MAP['..--..']);
  });

  it('decodes unknown Morse sequences as ?', () => {
    expect(convertToText('........')).toBe('?');
  });

  it('handles empty string', () => {
    expect(convertToText('')).toBe('');
    expect(convertToText('   ')).toBe('');
  });

  it('normalizes extra whitespace', () => {
    expect(convertToText('...   ---   ...')).toBe(convertToText('... --- ...'));
  });
});

describe('Roundtrip: text → morse → text', () => {
  // Most numbers have unique Morse codes (0-7, 9 have unique codes; 8 is shared)
  it('roundtrips number sequences correctly', () => {
    expect(convertToText(convertToMorse('1234567'))).toBe('1234567');
    expect(convertToText(convertToMorse('90'))).toBe('90');
    expect(convertToText(convertToMorse('404'))).toBe('404');
    expect(convertToText(convertToMorse('007'))).toBe('007');
  });

  it('roundtrips unique punctuation', () => {
    expect(convertToText(convertToMorse('.'))).toBe('.');
    expect(convertToText(convertToMorse(','))).toBe(',');
    expect(convertToText(convertToMorse('!'))).toBe('!');
  });
});

describe('Bidirectional map integrity', () => {
  it('every MORSE_CODE_MAP entry has a corresponding TEXT_TO_MORSE_MAP entry', () => {
    const { MORSE_CODE_MAP } = require('@/morse-code-data');

    for (const [char, morse] of Object.entries(MORSE_CODE_MAP)) {
      // Skip space which maps to '/' as a special case
      if (char === ' ') continue;
      const morseStr = morse as string;
      expect(TEXT_TO_MORSE_MAP[morseStr]).toBeDefined();
    }
  });

  it('TEXT_TO_MORSE_MAP has valid keys (dots/dashes or slash for space)', () => {
    for (const [code] of Object.entries(TEXT_TO_MORSE_MAP)) {
      // Keys should be dots/dashes, with '/' representing a space
      expect(code).toMatch(/^[.\/-]+$/);
    }
  });

  it('every TEXT_TO_MORSE_MAP entry has a corresponding MORSE_CODE_MAP entry', () => {
    const { MORSE_CODE_MAP } = require('@/morse-code-data');
    const morseValues = new Set(Object.values(MORSE_CODE_MAP) as string[]);

    for (const [code] of Object.entries(TEXT_TO_MORSE_MAP)) {
      // '/' is the space word separator, not a real Morse code
      if (code === '/') continue;
      expect(morseValues.has(code)).toBe(true);
    }
  });
});
