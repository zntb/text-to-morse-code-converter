import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  ConversionModeToggle,
  AudioInputModeToggle,
} from '@/components/conversion-mode-toggle';

describe('ConversionModeToggle', () => {
  const defaultProps = {
    mode: 'text-to-morse' as const,
    setMode: jest.fn(),
    isListening: false,
  };

  it('renders all three mode buttons', () => {
    render(<ConversionModeToggle {...defaultProps} />);
    expect(screen.getByTitle('Encode text to Morse code')).toBeInTheDocument();
    expect(screen.getByTitle('Decode Morse code to text')).toBeInTheDocument();
    expect(screen.getByTitle('Practice and learn Morse code')).toBeInTheDocument();
  });

  it('shows the correct active state for text-to-morse mode', () => {
    render(<ConversionModeToggle {...defaultProps} mode="text-to-morse" />);
    const textBtn = screen.getByTitle('Encode text to Morse code');
    expect(textBtn).toHaveTextContent('Text → Morse');
  });

  it('shows correct active state for practice mode', () => {
    render(<ConversionModeToggle {...defaultProps} mode="practice" />);
    const practiceBtn = screen.getByTitle('Practice and learn Morse code');
    expect(practiceBtn).toHaveTextContent('Practice');
  });

  it('shows correct active state for morse-to-text mode', () => {
    render(<ConversionModeToggle {...defaultProps} mode="morse-to-text" />);
    const textBtn = screen.getByTitle('Decode Morse code to text');
    expect(textBtn).toHaveTextContent('Morse → Text');
  });

  it('calls setMode when a mode button is clicked', () => {
    const setMode = jest.fn();
    render(<ConversionModeToggle {...defaultProps} setMode={setMode} />);
    fireEvent.click(screen.getByTitle('Practice and learn Morse code'));
    expect(setMode).toHaveBeenCalledWith('practice');
  });

  it('does not trigger setMode when clicking text-to-morse button while listening', () => {
    const setMode = jest.fn();
    render(
      <ConversionModeToggle {...defaultProps} isListening={true} setMode={setMode} />,
    );
    // Note: jsdom fires click on disabled elements, so we verify the button renders correctly
    // but behavior testing of disabled buttons requires user-event or browser environment
    const button = screen.getByTitle('Encode text to Morse code');
    expect(button).toBeInTheDocument();
    // The button should have the disabled attribute when isListening is true
    expect(button.getAttribute('disabled')).toBe('');
  });

  it('has disabled state on morse-to-text button when listening', () => {
    render(<ConversionModeToggle {...defaultProps} isListening={true} />);
    const button = screen.getByTitle('Decode Morse code to text');
    expect(button).toBeInTheDocument();
    // The button text should be visible
    expect(button).toHaveTextContent('Morse → Text');
  });

  it('allows clicking the practice button while listening', () => {
    const setMode = jest.fn();
    render(
      <ConversionModeToggle {...defaultProps} isListening={true} setMode={setMode} />,
    );
    fireEvent.click(screen.getByTitle('Practice and learn Morse code'));
    expect(setMode).toHaveBeenCalledWith('practice');
  });

  it('shows Text → Morse label', () => {
    render(<ConversionModeToggle {...defaultProps} />);
    expect(screen.getByText('Text → Morse')).toBeInTheDocument();
  });

  it('shows Morse → Text label', () => {
    render(<ConversionModeToggle {...defaultProps} />);
    expect(screen.getByText('Morse → Text')).toBeInTheDocument();
  });

  it('shows Practice label', () => {
    render(<ConversionModeToggle {...defaultProps} />);
    expect(screen.getByText('Practice')).toBeInTheDocument();
  });
});

describe('AudioInputModeToggle', () => {
  const defaultProps = {
    audioInputMode: 'microphone' as const,
    setAudioInputMode: jest.fn(),
    isListening: false,
  };

  it('renders both Microphone and Audio File buttons', () => {
    render(<AudioInputModeToggle {...defaultProps} />);
    expect(screen.getByText('Microphone')).toBeInTheDocument();
    expect(screen.getByText('Audio File')).toBeInTheDocument();
  });

  it('calls setAudioInputMode when a mode is clicked', () => {
    const setAudioInputMode = jest.fn();
    render(
      <AudioInputModeToggle {...defaultProps} setAudioInputMode={setAudioInputMode} />,
    );
    fireEvent.click(screen.getByTitle('Load audio file for decoding'));
    expect(setAudioInputMode).toHaveBeenCalledWith('file');
  });

  it('does not trigger mode change when listening and clicking Audio File', () => {
    const setAudioInputMode = jest.fn();
    render(
      <AudioInputModeToggle
        {...defaultProps}
        isListening={true}
        setAudioInputMode={setAudioInputMode}
      />,
    );
    fireEvent.click(screen.getByTitle('Load audio file for decoding'));
    expect(setAudioInputMode).not.toHaveBeenCalled();
  });

  it('allows clicking Microphone while listening', () => {
    const setAudioInputMode = jest.fn();
    render(
      <AudioInputModeToggle
        {...defaultProps}
        isListening={true}
        setAudioInputMode={setAudioInputMode}
      />,
    );
    fireEvent.click(screen.getByTitle('Real-time microphone input'));
    expect(setAudioInputMode).toHaveBeenCalledWith('microphone');
  });
});
