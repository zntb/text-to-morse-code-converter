import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/components/theme-provider';

describe('ThemeProvider', () => {
  it('renders children', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div>Test Child</div>
      </ThemeProvider>,
    );
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('renders with dark theme', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <span>Content</span>
      </ThemeProvider>,
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
