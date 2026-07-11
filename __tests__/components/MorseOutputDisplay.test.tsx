import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MorseOutputDisplay from '@/components/MorseOutputDisplay';

describe('MorseOutputDisplay', () => {
  const createRef = () => React.createRef<HTMLDivElement>();
  const createSpanRef = () => React.createRef<HTMLSpanElement>();

  const defaultProps = {
    morseCode: '',
    highlightIndex: null,
    containerRef: createRef(),
    highlightRef: createSpanRef(),
    currentDotDashType: null as 'dot' | 'dash' | null,
  };

  it('shows placeholder when morseCode is empty', () => {
    render(<MorseOutputDisplay {...defaultProps} />);
    expect(
      screen.getByText('Morse code will appear here...'),
    ).toBeInTheDocument();
  });

  it('renders the morse output container when morse code is present', () => {
    const { container } = render(
      <MorseOutputDisplay {...defaultProps} morseCode="..." />,
    );
    const outputContainer = container.querySelector('#morse-output-container');
    expect(outputContainer).toBeInTheDocument();
    expect(outputContainer?.textContent).toContain('...');
  });

  it('shows copy button when morse code is present', () => {
    render(
      <MorseOutputDisplay {...defaultProps} morseCode="..." />,
    );
    expect(screen.getByTitle('Copy morse code')).toBeInTheDocument();
  });

  it('does not show copy button when morse code is empty', () => {
    render(<MorseOutputDisplay {...defaultProps} />);
    expect(screen.queryByTitle('Copy morse code')).not.toBeInTheDocument();
  });

  it('renders the legend with Dot, Dash, and Letter gap labels', () => {
    render(<MorseOutputDisplay {...defaultProps} morseCode="..." />);
    expect(screen.getByText('Dot')).toBeInTheDocument();
    expect(screen.getByText('Dash')).toBeInTheDocument();
    expect(screen.getByText('Letter gap')).toBeInTheDocument();
  });

  it('shows copy dropdown trigger exists', () => {
    render(
      <MorseOutputDisplay {...defaultProps} morseCode=".-" />,
    );
    const copyBtn = screen.getByTitle('Copy morse code');
    expect(copyBtn).toBeInTheDocument();
    // Click to open dropdown (Radix may not render portal in jsdom)
    fireEvent.click(copyBtn);
    // Just verify no crash - Radix dropdown may not render portal content in jsdom
  });

  it('applies text-blue-500 class to dot characters', () => {
    const { container } = render(
      <MorseOutputDisplay {...defaultProps} morseCode="." />,
    );
    const dotSpan = container.querySelector('.text-blue-500');
    expect(dotSpan).toBeInTheDocument();
    // The display shows the original dot character, not the audio format
    expect(dotSpan?.textContent).toBe('.');
  });

  it('applies text-orange-500 class to dash characters', () => {
    const { container } = render(
      <MorseOutputDisplay {...defaultProps} morseCode="-" />,
    );
    const dashSpan = container.querySelector('.text-orange-500');
    expect(dashSpan).toBeInTheDocument();
    // The display shows the original dash character, not the audio format
    expect(dashSpan?.textContent).toBe('-');
  });

  it('renders highlighted character with scale class', () => {
    const { container } = render(
      <MorseOutputDisplay {...defaultProps} morseCode=".-" highlightIndex={0} />,
    );
    const highlighted = container.querySelector('.scale-125');
    expect(highlighted).toBeInTheDocument();
  });
});
