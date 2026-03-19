// Constants for better maintainability
export const AUDIO_CONFIG = {
  DEFAULT_GAIN: 0.2,
  FFT_SIZE: 1024,
  FADE_TIME: 0.01, // Small fade to prevent audio clicks
} as const;

// Helper to get the gain value (can be overridden with volume parameter)
export const getGain = (volume?: number) => volume ?? AUDIO_CONFIG.DEFAULT_GAIN;

export const TIMING_CONFIG = {
  DOT_MULTIPLIER: 1.2,
  DASH_MULTIPLIER: 3.6,
  LETTER_GAP_MULTIPLIER: 3,
  WORD_GAP_MULTIPLIER: 7,
  ELEMENT_GAP_MULTIPLIER: 1,
  REPEAT_DELAY: 1000,
} as const;
