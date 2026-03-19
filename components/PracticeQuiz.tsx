'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Volume2, RotateCcw, Trophy, Target, Zap } from 'lucide-react';
import { MORSE_CODE_MAP } from '@/morse-code-data';
import { TIMING_CONFIG, AUDIO_CONFIG, getGain } from '@/lib/constants';

// Difficulty levels with character sets
export type DifficultyLevel =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'expert';

interface DifficultyConfig {
  name: string;
  characters: string[];
  description: string;
}

const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  beginner: {
    name: 'Beginner',
    characters: ['E', 'T', 'A', 'N', 'O', 'I', 'S', 'H', 'R', 'D'],
    description: '10 most common letters (E, T, A, N, O, I, S, H, R, D)',
  },
  intermediate: {
    name: 'Intermediate',
    characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
    description: 'All 26 letters of the alphabet',
  },
  advanced: {
    name: 'Advanced',
    characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split(''),
    description: 'Letters + Numbers (36 characters)',
  },
  expert: {
    name: 'Expert',
    characters: Object.keys(MORSE_CODE_MAP).filter(char => char !== ' '),
    description: 'All available characters',
  },
};

interface QuizQuestion {
  character: string;
  morse: string;
}

interface QuizStats {
  total: number;
  correct: number;
  incorrect: number;
  streak: number;
  bestStreak: number;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function PracticeQuiz() {
  // Quiz state
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('beginner');
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(
    null,
  );
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stats, setStats] = useState<QuizStats>({
    total: 0,
    correct: 0,
    incorrect: 0,
    streak: 0,
    bestStreak: 0,
  });
  const [options, setOptions] = useState<string[]>([]);
  const [speed, setSpeed] = useState(15);
  const [volume, setVolume] = useState(20);
  const [frequency, setFrequency] = useState(600);

  // Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Initialize audio context
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();

        if (!analyserRef.current) {
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = AUDIO_CONFIG.FFT_SIZE;
        }
      } catch (error) {
        console.error('Failed to initialize AudioContext:', error);
        return null;
      }
    }
    return audioContextRef.current;
  }, []);

  // Play a single tone
  const playTone = useCallback(
    async (type: 'dot' | 'dash'): Promise<void> => {
      const context = initAudioContext();
      if (!context) throw new Error('AudioContext not available');

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

  // Play morse code for current question
  const playMorseCode = useCallback(async () => {
    if (!currentQuestion || isPlaying) return;

    setIsPlaying(true);
    const context = initAudioContext();

    if (!context) {
      setIsPlaying(false);
      return;
    }

    try {
      await context.resume();
      const wpm = speed;
      const dotDuration = TIMING_CONFIG.DOT_MULTIPLIER / wpm;
      const elementGap = dotDuration * TIMING_CONFIG.ELEMENT_GAP_MULTIPLIER;
      const letterGap = dotDuration * TIMING_CONFIG.LETTER_GAP_MULTIPLIER;

      const morse = currentQuestion.morse;

      for (let i = 0; i < morse.length; i++) {
        const char = morse[i];

        switch (char) {
          case '.':
            await playTone('dot');
            break;
          case '-':
            await playTone('dash');
            break;
        }

        // Add element gap between dots/dashes
        const nextChar = morse[i + 1];
        if ((char === '.' || char === '-') && nextChar && nextChar !== ' ') {
          await sleep(elementGap * 1000);
        }
      }

      // Add letter gap after the character
      await sleep(letterGap * 1000);
    } catch (error) {
      console.error('Error playing morse code:', error);
    } finally {
      setIsPlaying(false);
    }
  }, [currentQuestion, isPlaying, speed, playTone, initAudioContext]);

  // Generate a new question
  const generateQuestion = useCallback(() => {
    const config = DIFFICULTY_CONFIGS[difficulty];
    const randomIndex = Math.floor(Math.random() * config.characters.length);
    const character = config.characters[randomIndex];
    const morse = MORSE_CODE_MAP[character] || '?';

    setCurrentQuestion({ character, morse });
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(null);

    // Generate multiple choice options
    const allChars = config.characters;
    const optionsSet = new Set<string>();
    optionsSet.add(character);

    // Add more wrong options based on difficulty
    const numOptions =
      difficulty === 'beginner' ? 4 : difficulty === 'intermediate' ? 5 : 6;

    while (optionsSet.size < numOptions && optionsSet.size < allChars.length) {
      const randomChar = allChars[Math.floor(Math.random() * allChars.length)];
      optionsSet.add(randomChar);
    }

    // Shuffle options
    const shuffledOptions = Array.from(optionsSet).sort(
      () => Math.random() - 0.5,
    );
    setOptions(shuffledOptions);
  }, [difficulty]);

  // Start a new quiz
  const startQuiz = useCallback(() => {
    setStats({
      total: 0,
      correct: 0,
      incorrect: 0,
      streak: 0,
      bestStreak: 0,
    });
    generateQuestion();
  }, [generateQuestion]);

  // Handle answer selection
  const handleAnswer = useCallback(
    (answer: string) => {
      if (!currentQuestion || showResult) return;

      setSelectedAnswer(answer);
      setShowResult(true);

      const correct = answer === currentQuestion.character;
      setIsCorrect(correct);

      setStats(prev => ({
        total: prev.total + 1,
        correct: prev.correct + (correct ? 1 : 0),
        incorrect: prev.incorrect + (correct ? 0 : 1),
        streak: correct ? prev.streak + 1 : 0,
        bestStreak: correct
          ? Math.max(prev.bestStreak, prev.streak + 1)
          : prev.bestStreak,
      }));
    },
    [currentQuestion, showResult],
  );

  // Handle next question
  const handleNextQuestion = useCallback(() => {
    generateQuestion();
  }, [generateQuestion]);

  // Auto-play morse code when question changes
  useEffect(() => {
    if (currentQuestion && !showResult) {
      // Small delay to ensure audio context is ready
      const timeout = setTimeout(() => {
        playMorseCode();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [currentQuestion, showResult, playMorseCode]);

  // Calculate accuracy percentage
  const accuracy =
    stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  // Clean up audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    };
  }, []);

  return (
    <Card className='w-full max-w-2xl mx-auto'>
      <CardHeader className='text-center'>
        <CardTitle className='flex items-center justify-center gap-2 text-2xl'>
          <Target className='h-6 w-6' />
          Practice / Learn Mode
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Difficulty Selection */}
        <div className='space-y-2'>
          <label className='text-sm font-medium'>Difficulty Level</label>
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
            {(Object.keys(DIFFICULTY_CONFIGS) as DifficultyLevel[]).map(
              level => (
                <Button
                  key={level}
                  variant={difficulty === level ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => {
                    setDifficulty(level);
                    // Reset stats when difficulty changes
                    setStats({
                      total: 0,
                      correct: 0,
                      incorrect: 0,
                      streak: 0,
                      bestStreak: 0,
                    });
                  }}
                  className='text-xs'
                >
                  {DIFFICULTY_CONFIGS[level].name}
                </Button>
              ),
            )}
          </div>
          <p className='text-xs text-muted-foreground'>
            {DIFFICULTY_CONFIGS[difficulty].description}
          </p>
        </div>

        {/* Stats Display */}
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
          <div className='text-center p-3 bg-muted rounded-lg'>
            <div className='text-2xl font-bold'>{stats.total}</div>
            <div className='text-xs text-muted-foreground'>Total</div>
          </div>
          <div className='text-center p-3 bg-muted rounded-lg'>
            <div className='text-2xl font-bold text-green-600'>
              {stats.correct}
            </div>
            <div className='text-xs text-muted-foreground'>Correct</div>
          </div>
          <div className='text-center p-3 bg-muted rounded-lg'>
            <div className='text-2xl font-bold text-red-600'>
              {stats.incorrect}
            </div>
            <div className='text-xs text-muted-foreground'>Incorrect</div>
          </div>
          <div className='text-center p-3 bg-muted rounded-lg'>
            <div className='text-2xl font-bold text-blue-600'>{accuracy}%</div>
            <div className='text-xs text-muted-foreground'>Accuracy</div>
          </div>
        </div>

        {/* Streak Display */}
        <div className='flex justify-center gap-6'>
          <div className='flex items-center gap-2'>
            <Zap className='h-5 w-5 text-orange-500' />
            <span className='text-sm'>
              Current Streak: <strong>{stats.streak}</strong>
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <Trophy className='h-5 w-5 text-yellow-500' />
            <span className='text-sm'>
              Best Streak: <strong>{stats.bestStreak}</strong>
            </span>
          </div>
        </div>

        {/* Quiz Area */}
        <div className='space-y-4'>
          {currentQuestion ? (
            <>
              {/* Morse Code Display */}
              <div className='text-center space-y-4'>
                <div className='text-4xl font-mono tracking-widest py-4 px-6 bg-muted rounded-lg'>
                  {currentQuestion.morse}
                </div>

                {/* Play Button */}
                <Button
                  onClick={playMorseCode}
                  disabled={isPlaying}
                  variant='outline'
                  className='gap-2'
                >
                  <Volume2
                    className={`h-4 w-4 ${isPlaying ? 'animate-pulse' : ''}`}
                  />
                  {isPlaying ? 'Playing...' : 'Play Again'}
                </Button>
              </div>

              {/* Answer Options */}
              <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
                {options.map(option => (
                  <Button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    disabled={showResult}
                    variant={
                      showResult
                        ? option === currentQuestion.character
                          ? 'default'
                          : option === selectedAnswer
                          ? 'destructive'
                          : 'outline'
                        : 'outline'
                    }
                    className='text-lg font-bold h-12'
                  >
                    {option}
                  </Button>
                ))}
              </div>

              {/* Result Feedback */}
              {showResult && (
                <div className='text-center space-y-4'>
                  <div
                    className={`text-xl font-bold ${
                      isCorrect ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {isCorrect
                      ? '✓ Correct!'
                      : `✗ Wrong! The answer was "${currentQuestion.character}"`}
                  </div>
                  <Button onClick={handleNextQuestion} className='gap-2'>
                    Next Question
                    <RotateCcw className='h-4 w-4' />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className='text-center space-y-4'>
              <p className='text-muted-foreground'>
                Click &quot;Start Quiz&quot; to begin practicing your morse code
                skills!
              </p>
              <Button onClick={startQuiz} size='lg' className='gap-2'>
                <Target className='h-4 w-4' />
                Start Quiz
              </Button>
            </div>
          )}

          {/* Start Over Button */}
          {stats.total > 0 && (
            <div className='text-center'>
              <Button
                onClick={startQuiz}
                variant='ghost'
                size='sm'
                className='gap-2'
              >
                <RotateCcw className='h-4 w-4' />
                Start Over
              </Button>
            </div>
          )}
        </div>

        {/* Audio Settings */}
        <div className='grid grid-cols-3 gap-4 pt-4 border-t'>
          <div className='space-y-2'>
            <label className='text-xs text-muted-foreground'>Speed (WPM)</label>
            <input
              type='range'
              min='5'
              max='30'
              value={speed}
              onChange={e => setSpeed(Number(e.target.value))}
              className='w-full'
            />
            <div className='text-xs text-center'>{speed} WPM</div>
          </div>
          <div className='space-y-2'>
            <label className='text-xs text-muted-foreground'>Volume</label>
            <input
              type='range'
              min='0'
              max='100'
              value={volume}
              onChange={e => setVolume(Number(e.target.value))}
              className='w-full'
            />
            <div className='text-xs text-center'>{volume}%</div>
          </div>
          <div className='space-y-2'>
            <label className='text-xs text-muted-foreground'>
              Frequency (Hz)
            </label>
            <input
              type='range'
              min='300'
              max='1000'
              value={frequency}
              onChange={e => setFrequency(Number(e.target.value))}
              className='w-full'
            />
            <div className='text-xs text-center'>{frequency} Hz</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
