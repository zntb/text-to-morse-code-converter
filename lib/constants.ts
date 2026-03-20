// Constants for better maintainability
export const AUDIO_CONFIG = {
  DEFAULT_GAIN: 0.2,
  FFT_SIZE: 1024,
  FADE_TIME: 0.01, // Small fade to prevent audio clicks
} as const;

// Helper to get the gain value (can be overridden with volume parameter)
export const getGain = (volume?: number) => volume ?? AUDIO_CONFIG_DEFAULT_GAIN;

export const TIMING_CONFIG = {
  DOT_MULTIPLIER: 1.2,
  DASH_MULTIPLIER: 3.6,
  LETTER_GAP_MULTIPLIER: 3,
  WORD_GAP_MULTIPLIER: 7,
  ELEMENT_GAP_MULTIPLIER: 1,
  REPEAT_DELAY: 1000,
  // Farnsworth timing configuration
  FARNSWORTH_REFERENCE_WPM: 18, // Standard "fist" speed for Farnsworth timing
  MIN_FARNSWORTH_WPM: 5, // Minimum effective WPM for Farnsworth gaps
  MAX_SPEED_WPM: 40,
  MIN_SPEED_WPM: 5,
} as const;

// Backward compatibility aliases (deprecated - use TIMING_CONFIG values directly)
const AUDIO_CONFIG_DEFAULT_GAIN = AUDIO_CONFIG.DEFAULT_GAIN;
const TIMING_CONFIG_DOT_MULTIPLIER = TIMING_CONFIG.DOT_MULTIPLIER;
const TIMING_CONFIG_DASH_MULTIPLIER = TIMING_CONFIG.DASH_MULTIPLIER;
const TIMING_CONFIG_LETTER_GAP_MULTIPLIER = TIMING_CONFIG.LETTER_GAP_MULTIPLIER;
const TIMING_CONFIG_WORD_GAP_MULTIPLIER = TIMING_CONFIG.WORD_GAP_MULTIPLIER;
const TIMING_CONFIG_ELEMENT_GAP_MULTIPLIER =
  TIMING_CONFIG.ELEMENT_GAP_MULTIPLIER;

// Export constants for backward compatibility
export {
  AUDIO_CONFIG_DEFAULT_GAIN,
  TIMING_CONFIG_DOT_MULTIPLIER,
  TIMING_CONFIG_DASH_MULTIPLIER,
  TIMING_CONFIG_LETTER_GAP_MULTIPLIER,
  TIMING_CONFIG_WORD_GAP_MULTIPLIER,
  TIMING_CONFIG_ELEMENT_GAP_MULTIPLIER,
};

/**
 * Calculate Farnsworth timing values.
 *
 * Farnsworth timing keeps the "fist" (dot/dash rhythm) at a fixed reference speed
 * while stretching the gaps between characters and words to achieve the overall WPM.
 * This is how professional morse code is typically taught.
 *
 * @param overallWpm - The target overall words per minute
 * @param useFarnsworth - Whether to use Farnsworth timing
 * @returns Object with timing values in seconds
 */
export function calculateTiming(
  overallWpm: number,
  useFarnsworth: boolean,
): {
  dotDuration: number;
  dashDuration: number;
  elementGap: number;
  letterGap: number;
  wordGap: number;
} {
  const {
    DOT_MULTIPLIER,
    DASH_MULTIPLIER,
    ELEMENT_GAP_MULTIPLIER,
    FARNSWORTH_REFERENCE_WPM,
  } = TIMING_CONFIG;

  if (!useFarnsworth || overallWpm >= FARNSWORTH_REFERENCE_WPM) {
    // Standard timing: everything scales with the WPM
    const dotDuration = DOT_MULTIPLIER / overallWpm;
    return {
      dotDuration,
      dashDuration: DASH_MULTIPLIER / overallWpm,
      elementGap: dotDuration * ELEMENT_GAP_MULTIPLIER,
      letterGap: dotDuration * TIMING_CONFIG.LETTER_GAP_MULTIPLIER,
      wordGap: dotDuration * TIMING_CONFIG.WORD_GAP_MULTIPLIER,
    };
  }

  // Farnsworth timing: keep the fist at reference speed, stretch the gaps
  // Base timing at reference WPM (the "fist")
  const baseDotDuration = DOT_MULTIPLIER / FARNSWORTH_REFERENCE_WPM;
  const baseElementGap = baseDotDuration * ELEMENT_GAP_MULTIPLIER;

  // For Farnsworth, we keep marks at reference speed and add extra gap time
  // to slow down the overall effective speed.
  // We scale linearly between reference speed and minimum speed.
  const minWpm = TIMING_CONFIG.MIN_FARNSWORTH_WPM;
  const stretchFactor =
    (FARNSWORTH_REFERENCE_WPM - overallWpm) /
    (FARNSWORTH_REFERENCE_WPM - minWpm);

  // Minimum gap multipliers at reference speed
  const minLetterGapMult = 3;
  const minWordGapMult = 7;

  // Maximum gap multipliers at slowest speed
  const maxLetterGapMult = 12; // 3 + 9
  const maxWordGapMult = 24; // 7 + 17

  const letterGapMultiplier =
    minLetterGapMult + stretchFactor * (maxLetterGapMult - minLetterGapMult);
  const wordGapMultiplier =
    minWordGapMult + stretchFactor * (maxWordGapMult - minWordGapMult);

  return {
    dotDuration: baseDotDuration,
    dashDuration: DASH_MULTIPLIER / FARNSWORTH_REFERENCE_WPM,
    elementGap: baseElementGap,
    letterGap: baseDotDuration * letterGapMultiplier,
    wordGap: baseDotDuration * wordGapMultiplier,
  };
}
