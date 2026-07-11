import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ConverterHeader from '@/components/ConverterHeader';
import { ConversionMode } from '@/components/conversion-mode-toggle';

describe('ConverterHeader', () => {
  const defaultProps = {
    conversionMode: 'text-to-morse' as ConversionMode,
    setConversionMode: jest.fn(),
    isListening: false,
    isPlaying: false,
    playMorseCode: jest.fn(),
    stopPlayback: jest.fn(),
  };

  it('renders the app title', () => {
    render(<ConverterHeader {...defaultProps} />);
    expect(screen.getByText('Morse Converter')).toBeInTheDocument();
  });

  it('shows Text to Morse Code subtitle by default', () => {
    render(<ConverterHeader {...defaultProps} />);
    expect(screen.getByText('Text to Morse Code')).toBeInTheDocument();
  });

  it('shows Morse Code to Text subtitle in morse-to-text mode', () => {
    render(
      <ConverterHeader {...defaultProps} conversionMode="morse-to-text" />,
    );
    expect(screen.getByText('Morse Code to Text')).toBeInTheDocument();
  });

  it('shows Practice / Learn Mode subtitle in practice mode', () => {
    render(<ConverterHeader {...defaultProps} conversionMode="practice" />);
    expect(screen.getByText('Practice / Learn Mode')).toBeInTheDocument();
  });

  it('renders Play button with correct title when not playing', () => {
    render(<ConverterHeader {...defaultProps} isPlaying={false} />);
    expect(screen.getByTitle('Play')).toBeInTheDocument();
  });

  it('renders Stop button with correct title when playing', () => {
    render(<ConverterHeader {...defaultProps} isPlaying={true} />);
    expect(screen.getByTitle('Stop')).toBeInTheDocument();
  });

  it('calls playMorseCode when Play is clicked', () => {
    const playMorseCode = jest.fn();
    render(
      <ConverterHeader {...defaultProps} playMorseCode={playMorseCode} isPlaying={false} />,
    );
    fireEvent.click(screen.getByTitle('Play'));
    expect(playMorseCode).toHaveBeenCalledTimes(1);
  });

  it('calls stopPlayback when Stop is clicked', () => {
    const stopPlayback = jest.fn();
    render(
      <ConverterHeader {...defaultProps} stopPlayback={stopPlayback} isPlaying={true} />,
    );
    fireEvent.click(screen.getByTitle('Stop'));
    expect(stopPlayback).toHaveBeenCalledTimes(1);
  });

  it('renders mode toggle buttons', () => {
    render(<ConverterHeader {...defaultProps} />);
    expect(screen.getByTitle('Encode text to Morse code')).toBeInTheDocument();
    expect(screen.getByTitle('Decode Morse code to text')).toBeInTheDocument();
    expect(screen.getByTitle('Practice and learn Morse code')).toBeInTheDocument();
  });

  it('renders theme toggle button', () => {
    render(<ConverterHeader {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Toggle theme/i })).toBeInTheDocument();
  });
});
