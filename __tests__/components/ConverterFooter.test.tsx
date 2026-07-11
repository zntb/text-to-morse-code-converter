import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import ConverterFooter from '@/components/ConverterFooter';

describe('ConverterFooter', () => {
  it('renders the keyboard shortcut text', () => {
    render(<ConverterFooter />);
    expect(screen.getByText(/Ctrl \+ Space/i)).toBeInTheDocument();
    expect(screen.getByText(/Esc/i)).toBeInTheDocument();
  });

  it('renders play/pause and reset descriptions', () => {
    render(<ConverterFooter />);
    expect(screen.getByText(/play\/pause/i)).toBeInTheDocument();
    expect(screen.getByText(/reset/i)).toBeInTheDocument();
  });
});
