import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ControlPanel from '@/components/ControlPanel';

// Mock the ResetDialog to avoid Radix dialog complexity in test env
jest.mock('@/components/reset-dialog', () => ({
  __esModule: true,
  default: ({ onConfirm, trigger }: { onConfirm: () => void; trigger: React.ReactNode }) => (
    <div data-testid="reset-dialog">
      {trigger}
      <button data-testid="confirm-reset" onClick={onConfirm}>Confirm Reset</button>
    </div>
  ),
}));

describe('ControlPanel', () => {
  const createFileRef = () => React.createRef<HTMLInputElement>();

  const defaultProps = {
    speed: [15],
    setSpeed: jest.fn(),
    frequency: [600],
    setFrequency: jest.fn(),
    volume: [50],
    setVolume: jest.fn(),
    waveform: 'sine' as const,
    setWaveform: jest.fn(),
    repeat: false,
    setRepeat: jest.fn(),
    playMorseCode: jest.fn(),
    isPlaying: false,
    morseCode: '... --- ...',
    stopPlayback: jest.fn(),
    setInputText: jest.fn(),
    fileInputRef: createFileRef(),
    handleUpload: jest.fn(),
    handleDownload: jest.fn(),
    exportAsWav: jest.fn(),
    currentDotDashType: null as 'dot' | 'dash' | null,
    isBottomSheet: false,
    useFarnsworthTiming: false,
    setUseFarnsworthTiming: jest.fn(),
  };

  describe('Sliders', () => {
    it('shows Speed slider with current value', () => {
      render(<ControlPanel {...defaultProps} />);
      expect(screen.getByText('Speed')).toBeInTheDocument();
      expect(screen.getByText('15 WPM')).toBeInTheDocument();
    });

    it('shows Frequency slider with current value', () => {
      render(<ControlPanel {...defaultProps} />);
      expect(screen.getByText('Frequency')).toBeInTheDocument();
      expect(screen.getByText('600 Hz')).toBeInTheDocument();
    });

    it('shows Volume slider with current value', () => {
      render(<ControlPanel {...defaultProps} />);
      expect(screen.getByText('Volume')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('shows slider range labels', () => {
      render(<ControlPanel {...defaultProps} />);
      expect(screen.getByText('Slow')).toBeInTheDocument();
      expect(screen.getByText('Fast')).toBeInTheDocument();
      expect(screen.getByText('300 Hz')).toBeInTheDocument();
      expect(screen.getByText('1000 Hz')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Waveform selection', () => {
    it('shows Waveform label with current type displayed', () => {
      render(<ControlPanel {...defaultProps} />);
      expect(screen.getByText('Waveform')).toBeInTheDocument();
      // "sine" appears as the current waveform display AND as a waveform button
      // Use getAllByText to verify at least one exists
      const sineElements = screen.getAllByText('sine');
      expect(sineElements.length).toBeGreaterThanOrEqual(1);
    });

    it('renders all waveform type buttons', () => {
      render(<ControlPanel {...defaultProps} />);
      expect(screen.getByText('square')).toBeInTheDocument();
      expect(screen.getByText('sawtooth')).toBeInTheDocument();
      expect(screen.getByText('triangle')).toBeInTheDocument();
    });

    it('calls setWaveform when a waveform button is clicked', () => {
      const setWaveform = jest.fn();
      render(
        <ControlPanel {...defaultProps} setWaveform={setWaveform} />,
      );
      fireEvent.click(screen.getByText('square'));
      expect(setWaveform).toHaveBeenCalledWith('square');
    });
  });

  describe('Play/Stop button', () => {
    it('shows Play Morse Code button when not playing', () => {
      render(<ControlPanel {...defaultProps} />);
      expect(screen.getByText('Play Morse Code')).toBeInTheDocument();
    });

    it('shows Stop button when playing', () => {
      render(<ControlPanel {...defaultProps} isPlaying={true} />);
      expect(screen.getByText('Stop')).toBeInTheDocument();
    });

    it('calls playMorseCode when Play is clicked', () => {
      const playMorseCode = jest.fn();
      render(
        <ControlPanel {...defaultProps} playMorseCode={playMorseCode} />,
      );
      fireEvent.click(screen.getByText('Play Morse Code'));
      expect(playMorseCode).toHaveBeenCalledTimes(1);
    });

    it('disables Play button when there is no morse code content', () => {
      render(
        <ControlPanel {...defaultProps} morseCode="" />,
      );
      expect(screen.getByText('Play Morse Code')).toBeDisabled();
    });
  });

  describe('LED indicator', () => {
    it('shows LED indicator', () => {
      render(<ControlPanel {...defaultProps} />);
      expect(screen.getByText('LED')).toBeInTheDocument();
    });

    it('shows DOT indicator when currentDotDashType is dot', () => {
      render(
        <ControlPanel {...defaultProps} currentDotDashType="dot" />,
      );
      expect(screen.getByText('DOT')).toBeInTheDocument();
    });

    it('shows DASH indicator when currentDotDashType is dash', () => {
      render(
        <ControlPanel {...defaultProps} currentDotDashType="dash" />,
      );
      expect(screen.getByText('DASH')).toBeInTheDocument();
    });
  });

  describe('Secondary controls', () => {
    it('shows Reset button', () => {
      render(<ControlPanel {...defaultProps} />);
      expect(screen.getByText('Reset')).toBeInTheDocument();
    });

    it('shows Upload button', () => {
      render(<ControlPanel {...defaultProps} />);
      expect(screen.getByText('Upload')).toBeInTheDocument();
    });

    it('shows Export button', () => {
      render(<ControlPanel {...defaultProps} />);
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('shows Audio button', () => {
      render(<ControlPanel {...defaultProps} />);
      expect(screen.getByText('Audio')).toBeInTheDocument();
    });

    it('shows Repeat button', () => {
      render(<ControlPanel {...defaultProps} />);
      expect(screen.getByText('Repeat')).toBeInTheDocument();
    });

    it('disables Reset when no content', () => {
      render(<ControlPanel {...defaultProps} morseCode="" />);
      expect(screen.getByText('Reset').closest('button')).toBeDisabled();
    });

    it('disables Export when no content', () => {
      render(<ControlPanel {...defaultProps} morseCode="" />);
      expect(screen.getByText('Export').closest('button')).toBeDisabled();
    });

    it('disables Audio when no content', () => {
      render(<ControlPanel {...defaultProps} morseCode="" />);
      expect(screen.getByText('Audio').closest('button')).toBeDisabled();
    });

    it('calls handleDownload when Export is clicked', () => {
      const handleDownload = jest.fn();
      render(
        <ControlPanel {...defaultProps} handleDownload={handleDownload} />,
      );
      fireEvent.click(screen.getByText('Export'));
      expect(handleDownload).toHaveBeenCalledTimes(1);
    });

    it('calls exportAsWav when Audio is clicked', () => {
      const exportAsWav = jest.fn();
      render(
        <ControlPanel {...defaultProps} exportAsWav={exportAsWav} />,
      );
      fireEvent.click(screen.getByText('Audio'));
      expect(exportAsWav).toHaveBeenCalledTimes(1);
    });

    it('toggles repeat state when Repeat button is clicked', () => {
      const setRepeat = jest.fn();
      render(
        <ControlPanel {...defaultProps} setRepeat={setRepeat} />,
      );
      fireEvent.click(screen.getByText('Repeat'));
      expect(setRepeat).toHaveBeenCalledWith(true);
    });
  });

  describe('Toggle switches', () => {
    it('shows Repeat playback label', () => {
      render(<ControlPanel {...defaultProps} />);
      expect(screen.getByText('Repeat playback')).toBeInTheDocument();
    });

    it('shows Farnsworth timing label', () => {
      render(<ControlPanel {...defaultProps} />);
      expect(screen.getByText('Farnsworth timing')).toBeInTheDocument();
    });

    it('renders toggle switch buttons', () => {
      render(<ControlPanel {...defaultProps} />);
      // Find buttons with role="switch"
      const switches = screen.getAllByRole('switch');
      expect(switches.length).toBeGreaterThanOrEqual(2);
    });

    it('does not show Farnsworth timing when setUseFarnsworthTiming is not provided', () => {
      render(
        <ControlPanel
          {...defaultProps}
          setUseFarnsworthTiming={undefined}
        />,
      );
      expect(screen.queryByText('Farnsworth timing')).not.toBeInTheDocument();
    });
  });

  describe('Bottom sheet mode', () => {
    it('shows Play Morse Code in bottom sheet mode', () => {
      render(
        <ControlPanel {...defaultProps} isBottomSheet={true} />,
      );
      expect(screen.getByText('Play Morse Code')).toBeInTheDocument();
    });

    it('shows Stop Playback in bottom sheet when playing', () => {
      render(
        <ControlPanel {...defaultProps} isBottomSheet={true} isPlaying={true} />,
      );
      expect(screen.getByText('Stop Playback')).toBeInTheDocument();
    });

    it('shows swipe hint in bottom sheet mode', () => {
      render(
        <ControlPanel {...defaultProps} isBottomSheet={true} />,
      );
      expect(screen.getByText(/Swipe right to play/)).toBeInTheDocument();
    });

    it('does not show swipe hint in normal mode', () => {
      render(<ControlPanel {...defaultProps} />);
      expect(screen.queryByText(/Swipe right to play/)).not.toBeInTheDocument();
    });
  });
});
