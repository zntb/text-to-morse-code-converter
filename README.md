# 🔊 Morse Code Converter

A modern, feature-rich web application for converting text to Morse code with real-time audio playback and visualization. Built with Next.js 15, React 19, and TypeScript.

[![Next.js](https://img.shields.io/badge/Next.js-15.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

## ✨ Features

### 🎯 Core Functionality

- **Text to Morse Conversion**: Instantly convert any text to standard International Morse Code
- **Audio Playback**: High-quality sine wave audio generation with Web Audio API
- **Multi-Language Support**: Supports Latin, Greek, Cyrillic, Japanese (Katakana/Wabun), and Arabic scripts
- **Real-time Visualization**: Live audio waveform display during playback

### 🎛️ Customization Options

- **Adjustable Speed**: Control playback speed from 5 to 40 WPM (Words Per Minute)
- **Frequency Control**: Adjust tone frequency from 300 Hz to 1000 Hz
- **Repeat Mode**: Continuous playback option for practice sessions
- **Theme Toggle**: Beautiful dark and light mode support

### 🔥 Advanced Features

- **Visual Highlighting**: Real-time character highlighting during playback
- **Auto-scrolling**: Automatic scrolling to keep current character in view
- **File Operations**: Upload `.txt` files and export conversion results
- **Keyboard Shortcuts**:
  - `Escape` - Reset all settings
  - `Ctrl + Space` - Play/Pause
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### 📊 Performance

- Optimized rendering with React memoization
- Debounced input handling
- 30 FPS waveform visualization
- Smooth animations and transitions

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/zntb/nextjs-text-to-morse-code-converter.git
   cd nextjs-text-to-morse-code-converter
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
npm start
```

## 📖 Usage Guide

### Basic Conversion

1. Enter your text in the input textarea
2. The Morse code appears automatically in the output display
3. Click the **Play** button to hear the Morse code
4. Adjust speed and frequency sliders as needed

### File Operations

- **Upload**: Click the upload button to import a `.txt` file
- **Export**: Click the export button to download both original text and Morse code

### Visual Feedback

- **Blue highlighting**: Indicates current character being played in the text
- **Red highlighting**: Shows current Morse symbol during playback
- **Waveform**: Real-time audio visualization

## 🏗️ Project Structure

```text
nextjs-morse-code-converter/
├── app/
│   ├── layout.tsx          # Root layout with theme provider
│   ├── page.tsx            # Main page component
│   └── globals.css         # Global styles and CSS variables
├── components/
│   ├── morse-converter.tsx # Main converter component
│   ├── ControlPanel.tsx    # Control panel with sliders and buttons
│   ├── MorseTextDisplay.tsx # Input text display with highlighting
│   ├── MorseOutputDisplay.tsx # Morse code output display
│   ├── WaveformCanvas.tsx  # Audio waveform visualization
│   ├── mode-toggle.tsx     # Theme toggle component
│   ├── reset-dialog.tsx    # Confirmation dialog for reset
│   ├── theme-provider.tsx  # Theme context provider
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── constants.ts        # Audio and timing configuration
│   └── utils.ts            # Utility functions (cn, debounce)
├── morse-code-data.ts      # Morse code mapping for all languages
├── public/                 # Static assets (SVG icons)
└── package.json            # Project dependencies
```

## 🛠️ Tech Stack

### Core Framework

- **[Next.js 15.3](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type safety

### Styling

- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - Re-usable component library
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible components
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Theme management

### Audio & Visualization

- **[Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)** - Audio generation
- **[Tone.js](https://tonejs.github.io/)** - Audio framework
- **Canvas API** - Waveform visualization

### UI Components

- **[Lucide React](https://lucide.dev/)** - Icon library
- **[class-variance-authority](https://cva.style/)** - Component variants
- **[clsx](https://github.com/lukeed/clsx)** - Conditional classnames
- **[tailwind-merge](https://github.com/dcastil/tailwind-merge)** - Tailwind class merging

## ⚙️ Configuration

### Audio Settings

Edit `lib/constants.ts` to customize audio parameters:

```typescript
export const AUDIO_CONFIG = {
  GAIN: 0.2, // Audio volume (0.0 - 1.0)
  FFT_SIZE: 1024, // Frequency analysis resolution
  FADE_TIME: 0.01, // Fade in/out duration (seconds)
} as const;
```

### Timing Settings

Adjust Morse code timing in `lib/constants.ts`:

```typescript
export const TIMING_CONFIG = {
  DOT_MULTIPLIER: 1.2, // Duration of a dot
  DASH_MULTIPLIER: 3.6, // Duration of a dash
  LETTER_GAP_MULTIPLIER: 3, // Gap between letters
  WORD_GAP_MULTIPLIER: 7, // Gap between words
  ELEMENT_GAP_MULTIPLIER: 1, // Gap between dots/dashes
  REPEAT_DELAY: 1000, // Delay before repeat (ms)
} as const;
```

### Theme Customization

Modify CSS variables in `app/globals.css` for custom themes.

## 🎨 Supported Characters

The converter supports the following character sets:

- **Latin Alphabet**: A-Z, 0-9, common punctuation
- **Extended Latin**: Accented characters (Á, É, Ñ, Ç, etc.)
- **Greek**: Α-Ω (Alpha to Omega)
- **Cyrillic**: А-Я (Russian alphabet)
- **Japanese**: Katakana (ア-ン) using Wabun code
- **Arabic**: Standard Arabic alphabet

See `morse-code-data.ts` for the complete character mapping.

## 🧪 Development

### Run Linting

```bash
npm run lint
```

### Type Checking

TypeScript is configured with strict mode. The project uses:

- Path aliases: `@/*` maps to project root
- ES2017 target
- ESNext modules

## 📝 Code Quality Features

- **React 19 Features**: Uses latest React hooks and patterns
- **TypeScript Strict Mode**: Full type safety
- **Performance Optimizations**:
  - React.memo for component memoization
  - useCallback for function memoization
  - useMemo for computed values
  - Debounced input handling
  - Optimized canvas rendering
  - AbortController for playback cancellation
- **Accessibility**: ARIA labels and keyboard navigation
- **Error Handling**: Graceful degradation and error boundaries

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Add TypeScript types for all new code
- Test thoroughly before submitting
- Update documentation as needed

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- International Morse Code standard (ITU-R M.1677-1)
- [shadcn/ui](https://ui.shadcn.com/) for the component system
- [Radix UI](https://www.radix-ui.com/) for accessible primitives
- [Vercel](https://vercel.com/) for Next.js and hosting platform

## 📧 Contact

For questions, suggestions, or issues, please open an issue on GitHub.

---

**Built with ❤️ using Next.js and modern web technologies** 🚀
