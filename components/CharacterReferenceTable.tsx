'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import {
  Search,
  Volume2,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MORSE_CODE_MAP } from '@/morse-code-data';
import { AUDIO_CONFIG, TIMING_CONFIG, getGain } from '@/lib/constants';

// Character categories for organized display

interface CharacterGroup {
  label: string;
  characters: string[];
}

// Organize characters into groups
const CHARACTER_GROUPS: CharacterGroup[] = [
  {
    label: 'Letters (A-Z)',
    characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  },
  { label: 'Numbers (0-9)', characters: '0123456789'.split('') },
  { label: 'Punctuation', characters: '.,?!/()&:;=+-_"$@'.split('') },
  { label: 'Extended', characters: 'ÁÄÀÉÈÍÌÓÖÚÜŐŰÑÇ'.split('') },
];

// Sleep helper
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function CharacterReferenceTable({
  startExpanded = false,
}: {
  startExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(startExpanded);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingCharacter, setPlayingCharacter] = useState<string | null>(null);
  const [activeCategories, setActiveCategories] = useState<string[]>([
    'letters',
  ]);
  const [speed] = useState(15);
  const [frequency] = useState(600);
  const [volume] = useState(20);

  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackAbortRef = useRef(false);

  // Initialize audio context
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).webkitAudioContext)();
      } catch (error) {
        console.error('Failed to initialize AudioContext:', error);
        return null;
      }
    }
    return audioContextRef.current;
  }, []);

  // Play a single tone (dot or dash)
  const playTone = useCallback(
    async (type: 'dot' | 'dash'): Promise<void> => {
      const context = initAudioContext();
      if (!context) return;

      if (context.state === 'suspended') {
        await context.resume();
      }

      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      const currentTime = context.currentTime;
      const duration =
        type === 'dot'
          ? TIMING_CONFIG.DOT_MULTIPLIER / speed
          : TIMING_CONFIG.DASH_MULTIPLIER / speed;

      gainNode.gain.setValueAtTime(0, currentTime);
      const gainValue = getGain(volume / 100);
      gainNode.gain.linearRampToValueAtTime(
        gainValue,
        currentTime + AUDIO_CONFIG.FADE_TIME,
      );
      gainNode.gain.linearRampToValueAtTime(
        gainValue,
        currentTime + duration - AUDIO_CONFIG.FADE_TIME,
      );
      gainNode.gain.linearRampToValueAtTime(0, currentTime + duration);

      oscillator.start(currentTime);
      oscillator.stop(currentTime + duration);

      await sleep(duration * 1000);
    },
    [frequency, speed, volume, initAudioContext],
  );

  // Play morse code for a single character
  const playCharacterMorse = useCallback(
    async (character: string) => {
      if (playingCharacter) return;

      const morse = MORSE_CODE_MAP[character];
      if (!morse) return;

      setPlayingCharacter(character);
      playbackAbortRef.current = false;

      try {
        const context = initAudioContext();
        if (!context) return;

        await context.resume();

        const wpm = speed;
        const dotDuration = TIMING_CONFIG.DOT_MULTIPLIER / wpm;
        const elementGap = dotDuration * TIMING_CONFIG.ELEMENT_GAP_MULTIPLIER;
        const letterGap = dotDuration * TIMING_CONFIG.LETTER_GAP_MULTIPLIER;

        for (let i = 0; i < morse.length; i++) {
          if (playbackAbortRef.current) break;

          const char = morse[i];

          switch (char) {
            case '.':
              await playTone('dot');
              break;
            case '-':
              await playTone('dash');
              break;
            case ' ':
              await sleep(letterGap * 1000);
              break;
          }

          // Add element gap between dots/dashes
          const nextChar = morse[i + 1];
          if ((char === '.' || char === '-') && nextChar && nextChar !== ' ') {
            await sleep(elementGap * 1000);
          }
        }

        // Add letter gap after the character
        if (!playbackAbortRef.current) {
          await sleep(letterGap * 1000);
        }
      } catch (error) {
        console.error('Error playing morse code:', error);
      } finally {
        setPlayingCharacter(null);
      }
    },
    [playingCharacter, speed, playTone, initAudioContext],
  );

  // Handle mouse enter for audio preview
  const handleMouseEnter = useCallback(
    (character: string) => {
      playCharacterMorse(character);
    },
    [playCharacterMorse],
  );

  // Handle click for audio preview (mobile)
  const handleClick = useCallback(
    (character: string) => {
      if (playingCharacter === character) {
        // Stop current playback
        playbackAbortRef.current = true;
        setPlayingCharacter(null);
      } else {
        playCharacterMorse(character);
      }
    },
    [playingCharacter, playCharacterMorse],
  );

  // Filter characters based on search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return CHARACTER_GROUPS;
    }

    const query = searchQuery.toLowerCase();
    return CHARACTER_GROUPS.map(group => ({
      ...group,
      characters: group.characters.filter(
        char =>
          char.toLowerCase().includes(query) ||
          (MORSE_CODE_MAP[char] &&
            MORSE_CODE_MAP[char].toLowerCase().includes(query)),
      ),
    })).filter(group => group.characters.length > 0);
  }, [searchQuery]);

  // Toggle category visibility
  const toggleCategory = useCallback((label: string) => {
    setActiveCategories(prev =>
      prev.includes(label)
        ? prev.filter(cat => cat !== label)
        : [...prev, label],
    );
  }, []);

  // Expand/collapse all categories
  const toggleExpandAll = useCallback(() => {
    if (activeCategories.length === CHARACTER_GROUPS.length) {
      setActiveCategories([]);
    } else {
      setActiveCategories(CHARACTER_GROUPS.map(g => g.label));
    }
  }, [activeCategories]);

  return (
    <Card className='w-full'>
      <CardHeader
        className='cursor-pointer flex flex-row items-center justify-between pb-2'
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className='flex items-center gap-2'>
          <BookOpen className='h-5 w-5' />
          <CardTitle className='text-lg'>Character Reference</CardTitle>
        </div>
        {isExpanded ? (
          <ChevronUp className='h-5 w-5 text-muted-foreground' />
        ) : (
          <ChevronDown className='h-5 w-5 text-muted-foreground' />
        )}
      </CardHeader>

      {isExpanded && (
        <>
          <CardDescription className='px-6 pb-2'>
            Hover over or tap any character to hear its morse code
          </CardDescription>

          <CardContent>
            {/* Search Input */}
            <div className='relative mb-4'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                type='text'
                placeholder='Search characters or morse code...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='pl-9'
              />
            </div>

            {/* Category Toggles */}
            <div className='flex flex-wrap gap-2 mb-4'>
              {CHARACTER_GROUPS.map(group => (
                <Button
                  key={group.label}
                  variant={
                    activeCategories.includes(group.label)
                      ? 'default'
                      : 'outline'
                  }
                  size='sm'
                  onClick={() => toggleCategory(group.label)}
                  className='text-xs'
                >
                  {group.label}
                </Button>
              ))}
              <Button
                variant='outline'
                size='sm'
                onClick={toggleExpandAll}
                className='text-xs'
              >
                {activeCategories.length === CHARACTER_GROUPS.length
                  ? 'Collapse All'
                  : 'Expand All'}
              </Button>
            </div>

            {/* Character Tables */}
            <div className='space-y-4'>
              {filteredGroups.map(group => {
                if (!activeCategories.includes(group.label) && !searchQuery) {
                  return null;
                }

                const displayCharacters = searchQuery
                  ? group.characters
                  : group.characters;

                if (displayCharacters.length === 0) {
                  return null;
                }

                return (
                  <div key={group.label} className='space-y-2'>
                    <h3 className='text-sm font-semibold text-muted-foreground'>
                      {group.label}
                    </h3>
                    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2'>
                      {displayCharacters.map(character => {
                        const morse = MORSE_CODE_MAP[character];
                        const isPlaying = playingCharacter === character;

                        return (
                          <Button
                            key={character}
                            variant='outline'
                            size='sm'
                            className={`h-auto py-2 px-3 flex flex-col items-center justify-center gap-1 transition-all ${
                              isPlaying
                                ? 'bg-primary/20 border-primary ring-2 ring-primary'
                                : 'hover:bg-primary/10 hover:border-primary/50'
                            }`}
                            onMouseEnter={() => handleMouseEnter(character)}
                            onClick={() => handleClick(character)}
                          >
                            <span className='text-lg font-bold'>
                              {character}
                            </span>
                            <span className='text-xs text-muted-foreground font-mono'>
                              {morse || '-'}
                            </span>
                            <div className='mt-1'>
                              <Volume2
                                className={`h-3 w-3 ${
                                  isPlaying
                                    ? 'text-primary animate-pulse'
                                    : 'text-muted-foreground/50'
                                }`}
                              />
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* No Results Message */}
            {filteredGroups.every(g => g.characters.length === 0) && (
              <div className='text-center py-8 text-muted-foreground'>
                {`No characters found matching "${searchQuery}"`}
              </div>
            )}
          </CardContent>
        </>
      )}
    </Card>
  );
}
