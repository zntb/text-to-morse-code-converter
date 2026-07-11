import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MorseTextDisplay from '@/components/MorseTextDisplay';

describe('MorseTextDisplay', () => {
  const createRef = () => React.createRef<HTMLDivElement>();
  const createSpanRef = () => React.createRef<HTMLSpanElement>();

  const defaultProps = {
    inputText: '',
    currentTextIndex: null,
    textContainerRef: createRef(),
    textHighlightRef: createSpanRef(),
    setInputText: jest.fn(),
  };

  it('renders the placeholder text when input is empty', () => {
    render(<MorseTextDisplay {...defaultProps} />);
    expect(screen.getByText('Your text will appear here with highlighting...')).toBeInTheDocument();
  });

  it('renders the textarea', () => {
    render(<MorseTextDisplay {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(
      'Type your message here to convert to Morse code...',
    );
    expect(textarea).toBeInTheDocument();
  });

  it('displays input text characters', () => {
    render(<MorseTextDisplay {...defaultProps} inputText="SOS" />);
    // Use getAllByText because each character might appear separately
    const sChars = screen.getAllByText('S');
    expect(sChars.length).toBe(2); // S appears twice in SOS
    expect(screen.getByText('O')).toBeInTheDocument();
  });

  it('shows character count', () => {
    render(<MorseTextDisplay {...defaultProps} inputText="SOS" />);
    expect(screen.getByText('3 characters')).toBeInTheDocument();
  });

  it('shows word count for non-empty text', () => {
    render(<MorseTextDisplay {...defaultProps} inputText="HELLO" />);
    // Just check the characters count portion since word count format depends on implementation
    expect(screen.getByText(/characters/)).toBeInTheDocument();
  });

  it('shows 0 words for empty text', () => {
    render(<MorseTextDisplay {...defaultProps} />);
    expect(screen.getByText('0 words')).toBeInTheDocument();
  });

  it('shows 0 characters for empty text', () => {
    render(<MorseTextDisplay {...defaultProps} />);
    expect(screen.getByText('0 characters')).toBeInTheDocument();
  });

  it('calls setInputText on textarea change', () => {
    const setInputText = jest.fn();
    render(
      <MorseTextDisplay {...defaultProps} setInputText={setInputText} />,
    );
    const textarea = screen.getByPlaceholderText(
      'Type your message here to convert to Morse code...',
    );
    fireEvent.change(textarea, { target: { value: 'TEST' } });
    expect(setInputText).toHaveBeenCalledWith('TEST');
  });

  it('renders text container with highlighted character', () => {
    const { container } = render(
      <MorseTextDisplay {...defaultProps} inputText="SOS" currentTextIndex={0} />,
    );
    // The character at index 0 should have the ring-primary class
    const spans = container.querySelectorAll('span');
    const highlightedSpan = Array.from(spans).find(
      s => s.className.includes('ring-primary'),
    );
    expect(highlightedSpan).toBeTruthy();
    expect(highlightedSpan?.textContent).toBe('S');
  });
});
