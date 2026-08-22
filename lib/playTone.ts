import { AUDIO_CONFIG, TIMING_CONFIG, getGain } from '@/lib/constants';

export interface PlayToneOptions {
  /** Frequency in Hz */
  frequency: number;
  /** Volume as a percentage (0-100) */
  volume: number;
  /** Oscillator waveform type */
  waveform: OscillatorType;
  /** Optional AnalyserNode to route audio through (for waveform visualization) */
  analyser?: AnalyserNode | null;
  /** Override duration in seconds. If omitted, calculated from type and speed. */
  duration?: number;
  /** WPM speed — used to calculate duration when duration is not provided */
  speed?: number;
}

/**
 * Play a single Morse code tone (dot or dash) via the Web Audio API.
 *
 * Creates an oscillator, applies fade in/out to prevent clicks, and
 * waits for the tone to finish.
 *
 * @returns The actual duration played (in seconds).
 */
export async function playTone(
  context: AudioContext,
  type: 'dot' | 'dash',
  options: PlayToneOptions,
): Promise<number> {
  const {
    frequency,
    volume,
    waveform,
    analyser = null,
    duration: overrideDuration,
    speed,
  } = options;

  // Calculate duration from type and speed if not overridden
  const duration =
    overrideDuration ??
    (type === 'dot'
      ? TIMING_CONFIG.DOT_MULTIPLIER / (speed ?? 15)
      : TIMING_CONFIG.DASH_MULTIPLIER / (speed ?? 15));

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = waveform;
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);

  oscillator.connect(gainNode);
  if (analyser) {
    gainNode.connect(analyser);
    analyser.connect(context.destination);
  } else {
    gainNode.connect(context.destination);
  }

  const currentTime = context.currentTime;
  const gainValue = getGain(volume / 100);
  gainNode.gain.setValueAtTime(0, currentTime);
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

  await new Promise(resolve => setTimeout(resolve, duration * 1000));

  return duration;
}
