import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PracticeQuiz from '@/components/PracticeQuiz';

// Mock AudioContext for quiz playback
const mockCreateOscillator = jest.fn().mockReturnValue({
  type: '',
  frequency: { setValueAtTime: jest.fn() },
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  disconnect: jest.fn(),
});

const mockCreateGain = jest.fn().mockReturnValue({
  gain: {
    value: 0,
    setValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
  },
  connect: jest.fn(),
  disconnect: jest.fn(),
});

const mockAudioContext = {
  createOscillator: mockCreateOscillator,
  createGain: mockCreateGain,
  createAnalyser: jest.fn().mockReturnValue({
    fftSize: 512,
    frequencyBinCount: 256,
    connect: jest.fn(),
    disconnect: jest.fn(),
  }),
  destination: 'mock-destination',
  state: 'running',
  resume: jest.fn().mockResolvedValue(undefined),
  currentTime: 0,
  close: jest.fn().mockResolvedValue(undefined),
};

beforeEach(() => {
  jest.clearAllMocks();
  (window as any).AudioContext = jest.fn().mockImplementation(() => mockAudioContext);
  (window as any).webkitAudioContext = undefined;
});

describe('PracticeQuiz', () => {
  it('renders the Practice / Learn Mode title', () => {
    render(<PracticeQuiz />);
    expect(screen.getByText('Practice / Learn Mode')).toBeInTheDocument();
  });

  it('shows difficulty level buttons', () => {
    render(<PracticeQuiz />);
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('Intermediate')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
    expect(screen.getByText('Expert')).toBeInTheDocument();
  });

  it('shows beginner description by default', () => {
    render(<PracticeQuiz />);
    expect(
      screen.getByText('10 most common letters (E, T, A, N, O, I, S, H, R, D)'),
    ).toBeInTheDocument();
  });

  it('shows Start Quiz button when no active question', () => {
    render(<PracticeQuiz />);
    expect(screen.getByText('Start Quiz')).toBeInTheDocument();
  });

  it('shows initial stats with all zeros', () => {
    render(<PracticeQuiz />);
    const totals = screen.getAllByText('0');
    expect(totals.length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Correct')).toBeInTheDocument();
    expect(screen.getByText('Incorrect')).toBeInTheDocument();
    expect(screen.getByText('Accuracy')).toBeInTheDocument();
  });

  it('shows 0% accuracy initially', () => {
    render(<PracticeQuiz />);
    expect(screen.getAllByText('0%').length).toBeGreaterThan(0);
  });

  it('shows streak indicators', () => {
    render(<PracticeQuiz />);
    expect(screen.getByText('Current Streak:')).toBeInTheDocument();
    expect(screen.getByText('Best Streak:')).toBeInTheDocument();
  });

  it('shows audio settings sliders', () => {
    render(<PracticeQuiz />);
    expect(screen.getByText('Speed (WPM)')).toBeInTheDocument();
    expect(screen.getByText('Volume')).toBeInTheDocument();
    expect(screen.getByText('Frequency (Hz)')).toBeInTheDocument();
  });

  it('shows initial speed of 15 WPM', () => {
    render(<PracticeQuiz />);
    expect(screen.getByText('15 WPM')).toBeInTheDocument();
  });

  it('shows initial volume of 20%', () => {
    render(<PracticeQuiz />);
    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  it('shows initial frequency of 600 Hz', () => {
    render(<PracticeQuiz />);
    expect(screen.getByText('600 Hz')).toBeInTheDocument();
  });

  it('changes difficulty description when difficulty is clicked', () => {
    render(<PracticeQuiz />);
    fireEvent.click(screen.getByText('Advanced'));
    expect(
      screen.getByText('Letters + Numbers (36 characters)'),
    ).toBeInTheDocument();
  });

  it('changes to expert description', () => {
    render(<PracticeQuiz />);
    fireEvent.click(screen.getByText('Expert'));
    expect(
      screen.getByText('All available characters'),
    ).toBeInTheDocument();
  });

  it('starts a quiz and shows question when Start Quiz is clicked', () => {
    render(<PracticeQuiz />);
    fireEvent.click(screen.getByText('Start Quiz'));
    // After starting, the Morse code display should appear
    // and the play again button should be visible
    expect(screen.getByText('Play Again')).toBeInTheDocument();
  });

  it('shows answer options after quiz starts', () => {
    render(<PracticeQuiz />);
    fireEvent.click(screen.getByText('Start Quiz'));
    // Answer buttons should appear as letter options
    const optionButtons = screen.getAllByRole('button').filter(
      btn => btn.textContent && btn.textContent.length === 1 && btn.textContent === btn.textContent.toUpperCase(),
    );
    expect(optionButtons.length).toBeGreaterThanOrEqual(4);
  });
});
