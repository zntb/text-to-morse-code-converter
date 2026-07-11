import {
  calculateTiming,
  getGain,
  AUDIO_CONFIG,
  TIMING_CONFIG,
} from '@/lib/constants';

describe('AUDIO_CONFIG', () => {
  it('has expected default values', () => {
    expect(AUDIO_CONFIG.DEFAULT_GAIN).toBe(0.2);
    expect(AUDIO_CONFIG.FFT_SIZE).toBe(1024);
    expect(AUDIO_CONFIG.FADE_TIME).toBe(0.01);
  });
});

describe('TIMING_CONFIG', () => {
  it('has expected multiplier values', () => {
    expect(TIMING_CONFIG.DOT_MULTIPLIER).toBe(1.2);
    expect(TIMING_CONFIG.DASH_MULTIPLIER).toBe(3.6);
    expect(TIMING_CONFIG.LETTER_GAP_MULTIPLIER).toBe(3);
    expect(TIMING_CONFIG.WORD_GAP_MULTIPLIER).toBe(7);
    expect(TIMING_CONFIG.ELEMENT_GAP_MULTIPLIER).toBe(1);
  });

  it('has valid Farnsworth timing bounds', () => {
    expect(TIMING_CONFIG.FARNSWORTH_REFERENCE_WPM).toBe(18);
    expect(TIMING_CONFIG.MIN_FARNSWORTH_WPM).toBe(5);
    expect(TIMING_CONFIG.MAX_SPEED_WPM).toBe(40);
    expect(TIMING_CONFIG.MIN_SPEED_WPM).toBe(5);
  });
});

describe('getGain', () => {
  it('returns the provided volume value', () => {
    expect(getGain(0.5)).toBe(0.5);
    expect(getGain(1)).toBe(1);
    expect(getGain(0)).toBe(0);
  });

  it('falls back to DEFAULT_GAIN when no volume is provided', () => {
    expect(getGain()).toBe(0.2);
    expect(getGain(undefined)).toBe(0.2);
  });
});

describe('calculateTiming', () => {
  describe('Standard timing (without Farnsworth)', () => {
    it('calculates dot duration as DOT_MULTIPLIER / wpm', () => {
      const timing = calculateTiming(20, false);
      expect(timing.dotDuration).toBeCloseTo(1.2 / 20, 5);
    });

    it('calculates dash duration as 3x dot duration', () => {
      const timing = calculateTiming(20, false);
      expect(timing.dashDuration).toBeCloseTo(timing.dotDuration * 3, 5);
    });

    it('dash is exactly DASH_MULTIPLIER / wpm', () => {
      const timing = calculateTiming(20, false);
      expect(timing.dashDuration).toBeCloseTo(3.6 / 20, 5);
    });

    it('element gap equals dot duration', () => {
      const timing = calculateTiming(20, false);
      expect(timing.elementGap).toBeCloseTo(timing.dotDuration, 5);
    });

    it('letter gap is 3x dot duration', () => {
      const timing = calculateTiming(20, false);
      expect(timing.letterGap).toBeCloseTo(timing.dotDuration * 3, 5);
    });

    it('word gap is 7x dot duration', () => {
      const timing = calculateTiming(20, false);
      expect(timing.wordGap).toBeCloseTo(timing.dotDuration * 7, 5);
    });

    it('scales with WPM - faster WPM means shorter durations', () => {
      const slow = calculateTiming(10, false);
      const fast = calculateTiming(30, false);
      expect(slow.dotDuration).toBeGreaterThan(fast.dotDuration);
      expect(slow.dashDuration).toBeGreaterThan(fast.dashDuration);
    });
  });

  describe('Farnsworth timing', () => {
    it('uses standard timing when WPM >= reference (18)', () => {
      const farnsworth = calculateTiming(20, true);
      const standard = calculateTiming(20, false);
      expect(farnsworth.dotDuration).toBe(standard.dotDuration);
      expect(farnsworth.dashDuration).toBe(standard.dashDuration);
    });

    it('keeps dot/dash at reference speed when WPM < 18', () => {
      const farnsworth = calculateTiming(10, true);
      const reference = calculateTiming(18, false);
      expect(farnsworth.dotDuration).toBeCloseTo(reference.dotDuration, 5);
      expect(farnsworth.dashDuration).toBeCloseTo(reference.dashDuration, 5);
    });

    it('stretches letter gap when WPM < 18 compared to standard timing', () => {
      const farnsworth = calculateTiming(10, true);
      const standard = calculateTiming(10, false);
      expect(farnsworth.letterGap).toBeGreaterThan(standard.letterGap);
    });

    it('stretches word gap when WPM < 18 compared to standard timing', () => {
      const farnsworth = calculateTiming(10, true);
      const standard = calculateTiming(10, false);
      expect(farnsworth.wordGap).toBeGreaterThan(standard.wordGap);
    });

    it('element gap stays same as standard at reference speed', () => {
      const farnsworth = calculateTiming(10, true);
      const reference = calculateTiming(18, false);
      expect(farnsworth.elementGap).toBeCloseTo(reference.elementGap, 5);
    });

    it('gaps are longest at minimum WPM (5)', () => {
      const at5 = calculateTiming(5, true);
      const at10 = calculateTiming(10, true);
      expect(at5.letterGap).toBeGreaterThan(at10.letterGap);
      expect(at5.wordGap).toBeGreaterThan(at10.wordGap);
    });
  });

  describe('Edge cases', () => {
    it('handles high WPM values', () => {
      const timing = calculateTiming(40, false);
      expect(timing.dotDuration).toBeGreaterThan(0);
      expect(timing.dotDuration).toBeLessThan(0.1);
    });

    it('handles low WPM values', () => {
      const timing = calculateTiming(5, false);
      expect(timing.dotDuration).toBeGreaterThan(0);
    });

    it('all timing values are positive', () => {
      const timings = [
        calculateTiming(5, false),
        calculateTiming(20, false),
        calculateTiming(40, false),
        calculateTiming(5, true),
        calculateTiming(15, true),
      ];
      for (const t of timings) {
        expect(t.dotDuration).toBeGreaterThan(0);
        expect(t.dashDuration).toBeGreaterThan(0);
        expect(t.elementGap).toBeGreaterThan(0);
        expect(t.letterGap).toBeGreaterThan(0);
        expect(t.wordGap).toBeGreaterThan(0);
      }
    });

    it('maintains dot < dash <= letter < word duration ordering in standard mode', () => {
      const timing = calculateTiming(20, false);
      expect(timing.dotDuration).toBeLessThan(timing.dashDuration);
      expect(timing.dashDuration).toBeLessThanOrEqual(timing.letterGap);
      expect(timing.letterGap).toBeLessThan(timing.wordGap);
    });
  });
});
