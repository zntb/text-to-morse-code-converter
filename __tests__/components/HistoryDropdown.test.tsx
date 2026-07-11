import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HistoryDropdown from '@/components/HistoryDropdown';
import { HistoryItem } from '@/lib/useConversionHistory';

const mockHistory: HistoryItem[] = [
  {
    id: '1',
    input: 'SOS',
    output: '... --- ...',
    mode: 'text-to-morse',
    timestamp: Date.now(),
  },
  {
    id: '2',
    input: '... --- ...',
    output: 'SOS',
    mode: 'morse-to-text',
    timestamp: Date.now() - 60000,
  },
];

describe('HistoryDropdown', () => {
  const defaultProps = {
    history: mockHistory,
    onSelectItem: jest.fn(),
    onRemoveItem: jest.fn(),
    onClearHistory: jest.fn(),
    disabled: false,
  };

  it('renders the History button with count badge', () => {
    render(<HistoryDropdown {...defaultProps} />);
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('disables the button when history is empty', () => {
    render(<HistoryDropdown {...defaultProps} history={[]} />);
    expect(screen.getByRole('button', { name: /History/i })).toBeDisabled();
  });

  it('disables the button when disabled prop is true', () => {
    render(<HistoryDropdown {...defaultProps} disabled={true} />);
    expect(screen.getByRole('button', { name: /History/i })).toBeDisabled();
  });

  it('renders the clock icon', () => {
    const { container } = render(<HistoryDropdown {...defaultProps} />);
    const clockIcon = container.querySelector('svg');
    expect(clockIcon).toBeInTheDocument();
  });

  it('handles empty history gracefully', () => {
    const { container } = render(
      <HistoryDropdown {...defaultProps} history={[]} />,
    );
    expect(container).toBeInTheDocument();
  });

  it('shows history count of 2 for two items', () => {
    render(<HistoryDropdown {...defaultProps} />);
    const badge = screen.getByText('2');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('rounded-full');
  });

  it('handles click on history button without crashing', () => {
    render(<HistoryDropdown {...defaultProps} />);
    const button = screen.getByRole('button', { name: /History/i });
    fireEvent.click(button);
    // Clicking should not crash - Radix dropdown content may not render in jsdom
  });
});
