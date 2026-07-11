import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import WaveformCanvas from '@/components/WaveformCanvas';

describe('WaveformCanvas', () => {
  const createCanvasRef = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 100;
    return { current: canvas } as React.RefObject<HTMLCanvasElement | null>;
  };

  const defaultProps = {
    canvasRef: createCanvasRef(),
    isPlaying: false,
    analyserRef: { current: null } as React.RefObject<AnalyserNode | null>,
  };

  it('renders Audio Waveform title', () => {
    render(<WaveformCanvas {...defaultProps} />);
    expect(screen.getByText('Audio Waveform')).toBeInTheDocument();
  });

  it('shows Idle status when not playing', () => {
    render(<WaveformCanvas {...defaultProps} isPlaying={false} />);
    expect(screen.getByText('Idle')).toBeInTheDocument();
  });

  it('shows Playing status when playing', () => {
    render(<WaveformCanvas {...defaultProps} isPlaying={true} />);
    expect(screen.getByText('Playing')).toBeInTheDocument();
  });

  it('renders a canvas element', () => {
    const { container } = render(<WaveformCanvas {...defaultProps} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('renders the Card component wrapper', () => {
    const { container } = render(<WaveformCanvas {...defaultProps} />);
    const card = container.querySelector('[data-slot="card"]');
    expect(card).toBeInTheDocument();
  });
});
