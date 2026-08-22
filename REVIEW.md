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

## 4. `PresetMessage` Interface

**Files:** `components/morse-converter.tsx`, `components/PresetButtons.tsx`

The `PresetMessage` interface (`{ id: string; name: string; text: string }`) is defined identically in both files.

**Recommendation:** Move the interface definition to a shared types file (e.g., `lib/types.ts` or add to `lib/constants.ts`) and import it.

---

## 5. Microphone Error Handling Logic

**Files:** `components/morse-converter.tsx` (in `startAudioRecognition` and `startTestMicrophone`)

The error handling for `getUserMedia` is duplicated nearly verbatim in both `startAudioRecognition` and `startTestMicrophone`, mapping `NotAllowedError`, `NotFoundError`, `NotReadableError`, `OverconstrainedError`, and `TypeError` to user-friendly messages.

**Recommendation:** Extract a `getMicrophoneErrorMessage(error: unknown): string` utility function.

---

## 6. Toggle Button Component Pattern

**Files:** `components/ControlPanel.tsx` (used for both "Repeat" and "Farnsworth timing" toggles)

The repeat toggle and Farnsworth timing toggle in `ControlPanel.tsx` share identical markup for the switch button (a `<button>` with `role='switch'`, `aria-checked`, sliding `<span>`, and adjacent `<Label>`). This pattern appears twice in the same file.

**Recommendation:** Extract a reusable `SwitchToggle` component (similar to Radix's `Switch`) that accepts `checked`, `onCheckedChange`, `id`, and `label` props.

---

## 7. Audio Settings Sliders (Speed / Volume / Frequency)

**Files:** `components/ControlPanel.tsx`, `components/PracticeQuiz.tsx`

Both components implement audio parameter sliders (speed in WPM, volume in %, frequency in Hz). `ControlPanel` uses the Radix `Slider` component, while `PracticeQuiz` uses native `<input type="range">`. The underlying logic (min/max values, labels, value formatting) is duplicated.

**Recommendation:** Create a shared `AudioSettingsPanel` component or at minimum share the configuration (min/max/step/label) as constants and a reusable slider wrapper.

---

## 8. Morse Timing Calculation Inline

**Files:** `components/morse-converter.tsx`, `components/PracticeQuiz.tsx`, `components/CharacterReferenceTable.tsx`

The pattern of calculating `dotDuration = DOT_MULTIPLIER / wpm` and deriving `elementGap` and `letterGap` from it is repeated in `PracticeQuiz.tsx` and `CharacterReferenceTable.tsx` rather than using the existing `calculateTiming()` from `lib/constants.ts`.

**Recommendation:** Use the centralized `calculateTiming()` function from `lib/constants.ts` in all three locations.

---

## 9. `audioBufferToWav` Helper

**File:** `components/morse-converter.tsx` (defined as a closure inside the component)

This is a pure, stateless utility function that converts an `AudioBuffer` to a WAV `Blob`. It has no dependency on React state or props.

**Recommendation:** Move to `lib/audio-utils.ts` (new file) for reusability and testability.

---

## 10. `formatTimestamp` and `truncateText` Helpers

**File:** `components/HistoryDropdown.tsx` (defined inside the component)

These are pure utility functions with no component dependency:
- `formatTimestamp(timestamp: number)` — converts timestamps to relative time strings.
- `truncateText(text, maxLength)` — truncates text with ellipsis.

**Recommendation:** Move to `lib/utils.ts`.

---

## 11. `MORSE_CODE_MAP` and `TEXT_TO_MORSE_MAP` Data Duplication

**File:** `morse-code-data.ts`

The same character-to-morse mapping data is defined twice: once as the `MORSE_CODE_MAP` object literal (explicit key-value pairs) and once as an inline object in the `forEach` loop that builds `TEXT_TO_MORSE_MAP`. The entire mapping table (100+ entries) is effectively duplicated.

**Recommendation:** Build both maps from a single source of truth. For example, define the entries once and use `Object.fromEntries(entries.map(([k, v]) => [v, k]))` to build the reverse map.

---

## 12. localStorage Persistence Pattern

**Files:** `components/morse-converter.tsx`, `lib/useConversionHistory.ts`

The pattern of reading from and writing to `localStorage` with JSON parse/stringify and error handling is repeated across multiple locations (custom presets, history, selected device). Each instance has its own try/catch and key management.

**Recommendation:** Create a reusable `useLocalStorage<T>(key: string, defaultValue: T)` hook in `lib/` that handles serialization, deserialization, error handling, and SSR safety.

---

## Summary Table

| # | Duplicate | Occurrences | Location(s) |
|---|-----------|-------------|-------------|
| 1 | ~~`sleep` utility~~ ✅ | ~~3~~ 0 | ~~morse-converter, PracticeQuiz, CharacterReferenceTable~~ extracted to `lib/utils.ts` |
| 2 | ~~`initAudioContext`~~ ✅ | ~~3~~ 0 | ~~morse-converter, PracticeQuiz, CharacterReferenceTable~~ extracted to `lib/useAudioContext.ts` |
| 3 | ~~`playTone` function~~ ✅ | ~~3~~ 0 | ~~morse-converter, PracticeQuiz, CharacterReferenceTable~~ extracted to `lib/playTone.ts` |
| 4 | `PresetMessage` interface | 2 | morse-converter, PresetButtons |
| 5 | Microphone error handling | 2 | morse-converter (2 functions) |
| 6 | Toggle switch pattern | 2 | ControlPanel (repeat + Farnsworth) |
| 7 | Audio settings sliders | 2 | ControlPanel, PracticeQuiz |
| 8 | Inline timing calculation | 2 | PracticeQuiz, CharacterReferenceTable |
| 9 | `audioBufferToWav` | 1 (move) | morse-converter |
| 10 | `formatTimestamp` / `truncateText` | 1 (move) | HistoryDropdown |
| 11 | Mapping data duplication | 1 (refactor) | morse-code-data.ts |
| 12 | localStorage pattern | 2+ | morse-converter, useConversionHistory |
