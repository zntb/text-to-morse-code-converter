import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import PlaybackProgress from '@/components/PlaybackProgress';

describe('PlaybackProgress', () => {
  const defaultProps = {
    currentIndex: null,
    totalLength: 0,
    speed: [15],
    sessionStats: {
      totalCharactersPlayed: 0,
      totalTimeSpent: 0,
    },
  };

  it('shows Progress label', () => {
    render(<PlaybackProgress {...defaultProps} />);
    expect(screen.getByText('Progress')).toBeInTheDocument();
  });

  it('shows 0 / 0 when no playback', () => {
    render(<PlaybackProgress {...defaultProps} />);
    expect(screen.getByText('0 / 0')).toBeInTheDocument();
  });

  it('shows current position when playing', () => {
    render(
      <PlaybackProgress
        {...defaultProps}
        currentIndex={4}
        totalLength={10}
      />,
    );
    expect(screen.getByText('5 / 10')).toBeInTheDocument();
  });

  it('shows CPM stat (WPM * 5)', () => {
    render(<PlaybackProgress {...defaultProps} speed={[20]} />);
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('CPM')).toBeInTheDocument();
  });

  it('shows WPM stat', () => {
    render(<PlaybackProgress {...defaultProps} speed={[15]} />);
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('WPM')).toBeInTheDocument();
  });

  it('shows total characters played stat', () => {
    render(
      <PlaybackProgress
        {...defaultProps}
        sessionStats={{ totalCharactersPlayed: 42, totalTimeSpent: 0 }}
      />,
    );
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('chars')).toBeInTheDocument();
  });

  it('shows time spent in seconds', () => {
    render(
      <PlaybackProgress
        {...defaultProps}
        sessionStats={{ totalCharactersPlayed: 0, totalTimeSpent: 30 }}
      />,
    );
    expect(screen.getByText('30s')).toBeInTheDocument();
  });

  it('shows time spent in minutes and seconds', () => {
    render(
      <PlaybackProgress
        {...defaultProps}
        sessionStats={{ totalCharactersPlayed: 0, totalTimeSpent: 125 }}
      />,
    );
    expect(screen.getByText('2m 5s')).toBeInTheDocument();
  });
});
