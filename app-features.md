## Recommended Improvements for Morse Code Converter

### 1. **Bidirectional Conversion (High Priority)**

- Add **Morse-to-Text** mode to convert incoming morse code (from microphone or audio file) back to text
- Implement real-time audio input recognition using Web Audio API
- This would make the app useful for both encoding and decoding

### 2. **Audio Export Feature**

- Add ability to **export as WAV file** using the Web Audio API's MediaRecorder or OfflineAudioContext
- Allow users to download the generated morse code as an audio file for use in other applications

### 3. **Volume Control**

- Currently the gain is fixed at 0.2 in [`lib/constants.ts`](lib/constants.ts:3)
- Add a **volume slider** to the ControlPanel component for user-adjustable audio levels

### 4. **Preset Messages**

- Add quick-access buttons for common morse messages like:
  - SOS (... --- ...)
  - MAYDAY
  - CQ (general call)
  - 73 (best regards)
  - Custom saved presets

### 5. **Practice/Learn Mode**

- Quiz system to test users on morse code characters
- Display random characters and track accuracy
- Progressive difficulty levels

### 6. **Enhanced Visual Feedback**

- Add **LED-style indicator** that lights up during dot/dash playback
- Implement **character highlighting** with different colors for dots vs dashes
- Add **flash effect** on screen synchronized with audio playback

### 7. **Progress & Statistics**

- Playback progress bar showing current position
- Characters per minute (CPM) / Words per minute (WPM) display
- Session statistics (total characters played, time spent)

### 8. **Copy to Clipboard**

- Add one-click **copy button** for the morse output
- Include "Copy as audio" option for formatted representation like `· – —`

### 9. **History Feature**

- Store recent conversions in localStorage
- Allow users to restore previous inputs
- Quick access dropdown for recent messages

### 10. **Improved Accessibility**

- Add ARIA labels to all interactive elements
- Add keyboard navigation for the control panel
- Screen reader announcements for playback status
- Focus indicators for keyboard users

### 11. **PWA / Offline Support**

- Add service worker for offline functionality
- Make installable as a Progressive Web App
- Cache assets for faster loading

### 12. **Mobile Enhancements**

- Larger touch targets for controls
- Bottom sheet for settings on mobile
- Swipe gestures for play/pause

### 13. **Character Reference Table**

- Expandable morse code cheat sheet
- Searchable alphabet/number table
- Audio playback on hover/tap for each character

### 14. **Farnsworth Timing Support**

- Implement alternative timing method where inter-character gaps are longer at lower speeds
- This is how professional morse code is typically taught

### 15. **Multiple Audio Waveforms**

- Add option to choose between sine, square, sawtooth, or triangle wave tones
- Different tones can help distinguish playback

---

Would you like me to implement any of these improvements? I recommend starting with:

1. **Bidirectional conversion** - Most impactful feature
2. **Volume control** - Quick win with high usability
3. **Copy to clipboard** - Simple but frequently useful
