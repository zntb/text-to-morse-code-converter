import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModeToggle } from '@/components/mode-toggle';

// Mock next-themes useTheme
const mockSetTheme = jest.fn();
jest.mock('next-themes', () => ({
  useTheme: () => ({
    setTheme: mockSetTheme,
  }),
}));

describe('ModeToggle', () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
  });

  it('renders the theme toggle button', () => {
    render(<ModeToggle />);
    expect(
      screen.getByRole('button', { name: /Toggle theme/i }),
    ).toBeInTheDocument();
  });

  it('renders the sun and moon icons', () => {
    render(<ModeToggle />);
    const button = screen.getByRole('button', { name: /Toggle theme/i });
    const svgs = button.querySelectorAll('svg');
    expect(svgs.length).toBe(2); // Sun and Moon icons
  });

  it('does not crash when clicking the toggle button', () => {
    render(<ModeToggle />);
    const button = screen.getByRole('button', { name: /Toggle theme/i });
    // Radix DropdownMenu may not render portal content in jsdom
    // Just verify click doesn't crash
    fireEvent.click(button);
  });

  it('has correct accessible label', () => {
    render(<ModeToggle />);
    const button = screen.getByRole('button', { name: /Toggle theme/i });
    expect(button).toBeInTheDocument();
  });
});
