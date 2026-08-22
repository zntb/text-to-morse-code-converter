# Code Review — Duplicate Detection & Refactoring Opportunities

This file documents duplicated functions, components, and patterns across the codebase that should be refactored for reusability.

---

## 1. ~~`sleep` Utility Function~~ ✅ DONE

**Files:** `components/morse-converter.tsx`, `components/PracticeQuiz.tsx`, `components/CharacterReferenceTable.tsx`

**Status:** Extracted to `lib/utils.ts` and imported everywhere. All 250 tests pass.

---

## 2. ~~`initAudioContext` Function~~ ✅ DONE

**Files:** `components/morse-converter.tsx`, `components/PracticeQuiz.tsx`, `components/CharacterReferenceTable.tsx`

**Status:** Extracted to shared `useAudioContext()` hook in `lib/useAudioContext.ts`. All 250 tests pass.

---

## 3. ~~`playTone` Function~~ ✅ DONE

**Files:** `components/morse-converter.tsx`, `components/PracticeQuiz.tsx`, `components/CharacterReferenceTable.tsx`

**Status:** Extracted to shared `playTone(context, type, options)` utility in `lib/playTone.ts`. All 250 tests pass.

---

## 4. ~~`PresetMessage` Interface~~ ✅ DONE

**Files:** `components/morse-converter.tsx`, `components/PresetButtons.tsx`

**Status:** Moved to shared `lib/types.ts`. All 250 tests pass.

---

## 5. ~~Microphone Error Handling Logic~~ ✅ DONE

**Files:** `components/morse-converter.tsx` (in `startAudioRecognition` and `startTestMicrophone`)

**Status:** Extracted to `getMicrophoneErrorMessage()` in `lib/utils.ts`. All 250 tests pass.

---

## 6. ~~Toggle Button Component Pattern~~ ✅ DONE

**Files:** `components/ControlPanel.tsx` (used for both "Repeat" and "Farnsworth timing" toggles)

**Status:** Extracted to reusable `SwitchToggle` component in `components/SwitchToggle.tsx`. All 250 tests pass.

---

## 7. ~~Audio Settings Sliders (Speed / Volume / Frequency)~~ ✅ DONE

**Files:** `components/ControlPanel.tsx`, `components/PracticeQuiz.tsx`

**Status:** Extracted shared `AUDIO_SLIDER_CONFIG` constants in `lib/constants.ts` and reusable `AudioSlider` component in `components/AudioSlider.tsx` (supports both Radix Slider and native input variants). All 250 tests pass.

---

## 8. ~~Morse Timing Calculation Inline~~ ✅ DONE

**Files:** `components/morse-converter.tsx`, `components/PracticeQuiz.tsx`, `components/CharacterReferenceTable.tsx`

**Status:** Replaced inline `DOT_MULTIPLIER / wpm` calculations in PracticeQuiz and CharacterReferenceTable with `calculateTiming(speed, false)`. morse-converter already used `calculateTiming()`. All 250 tests pass.

---

## 9. ~~`audioBufferToWav` Helper~~ ✅ DONE

**File:** `components/morse-converter.tsx` (defined as a closure inside the component)

**Status:** Moved to `lib/audio-utils.ts`. All 250 tests pass. Also fixed a pre-existing eslint error (`audioBufferToWav` accessed before declared).

---

## 10. ~~`formatTimestamp` and `truncateText` Helpers~~ ✅ DONE

**File:** `components/HistoryDropdown.tsx` (defined inside the component)

**Status:** Moved to `lib/utils.ts`. All 250 tests pass.

---

## 11. ~~`MORSE_CODE_MAP` and `TEXT_TO_MORSE_MAP` Data Duplication~~ ✅ DONE

**File:** `morse-code-data.ts`

**Status:** Refactored to single source of truth (`MORSE_CODE_ENTRIES` array). Both `MORSE_CODE_MAP` and `TEXT_TO_MORSE_MAP` are derived from it. All 250 tests pass.

---

## 12. ~~localStorage Persistence Pattern~~ ✅ DONE

**Files:** `components/morse-converter.tsx`, `lib/useConversionHistory.ts`

**Status:** Created `useLocalStorage<T>(key, defaultValue)` hook in `lib/useLocalStorage.ts`. Refactored morse-converter.tsx (selectedDeviceId, customPresets) and useConversionHistory.ts to use it, eliminating manual try/catch, JSON parse/stringify, and SSR checks. All 250 tests pass.

---

## Summary Table

| # | Duplicate | Occurrences | Location(s) |
|---|-----------|-------------|-------------|
| 1 | ~~`sleep` utility~~ ✅ | ~~3~~ 0 | ~~morse-converter, PracticeQuiz, CharacterReferenceTable~~ extracted to `lib/utils.ts` |
| 2 | ~~`initAudioContext`~~ ✅ | ~~3~~ 0 | ~~morse-converter, PracticeQuiz, CharacterReferenceTable~~ extracted to `lib/useAudioContext.ts` |
| 3 | ~~`playTone` function~~ ✅ | ~~3~~ 0 | ~~morse-converter, PracticeQuiz, CharacterReferenceTable~~ extracted to `lib/playTone.ts` |
| 4 | ~~`PresetMessage` interface~~ ✅ | ~~2~~ 0 | ~~morse-converter, PresetButtons~~ moved to `lib/types.ts` |
| 5 | ~~Microphone error handling~~ ✅ | ~~2~~ 0 | ~~morse-converter (2 functions)~~ extracted to `lib/utils.ts` |
| 6 | ~~Toggle switch pattern~~ ✅ | ~~2~~ 0 | ~~ControlPanel (repeat + Farnsworth)~~ extracted to `components/SwitchToggle.tsx` |
| 7 | ~~Audio settings sliders~~ ✅ | ~~2~~ 0 | ~~ControlPanel, PracticeQuiz~~ extracted to `components/AudioSlider.tsx` + `lib/constants.ts` |
| 8 | ~~Inline timing calculation~~ ✅ | ~~2~~ 0 | ~~PracticeQuiz, CharacterReferenceTable~~ replaced with `calculateTiming()` |
| 9 | ~~`audioBufferToWav`~~ ✅ | ~~1~~ 0 | ~~morse-converter~~ moved to `lib/audio-utils.ts` |
| 10 | ~~`formatTimestamp` / `truncateText`~~ ✅ | ~~1~~ 0 | ~~HistoryDropdown~~ moved to `lib/utils.ts` |
| 11 | ~~Mapping data duplication~~ ✅ | ~~1~~ 0 | ~~morse-code-data.ts~~ refactored to single `MORSE_CODE_ENTRIES` source |
| 12 | ~~localStorage pattern~~ ✅ | ~~2+~~ 0 | ~~morse-converter, useConversionHistory~~ extracted to `lib/useLocalStorage.ts` |
