import { MORSE_CODE_MAP, TEXT_TO_MORSE_MAP } from '@/morse-code-data';

/**
 * Convert text to Morse code.
 * Each character is mapped to its Morse representation, separated by spaces.
 */
export function convertToMorse(text: string): string {
  return text
    .toUpperCase()
    .split('')
    .map(char => MORSE_CODE_MAP[char] || '?')
    .join(' ');
}

/**
 * Convert Morse code back to text.
 * Expects dots (.) and dashes (-) separated by spaces, with " / " for word gaps.
 */
export function convertToText(morse: string): string {
  // Normalize the morse string
  const normalized = morse.trim().replace(/\s+/g, ' ');
  if (!normalized) return '';

  const words = normalized.split(' / ');
  return words
    .map(word => {
      const letters = word.split(' ');
      return letters.map(code => TEXT_TO_MORSE_MAP[code] || '?').join('');
    })
    .join(' ');
}
