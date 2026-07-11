import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CharacterReferenceTable from '@/components/CharacterReferenceTable';

// Mock AudioContext for character playback
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
    smoothingTimeConstant: 0.8,
    minDecibels: -90,
    maxDecibels: -10,
    getByteTimeDomainData: jest.fn(),
    getByteFrequencyData: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  }),
  destination: 'mock-destination',
  state: 'running',
  resume: jest.fn().mockResolvedValue(undefined),
  currentTime: 0,
  close: jest.fn().mockResolvedValue(undefined),
};

const mockAudioContextConstructor = jest.fn().mockImplementation(() => mockAudioContext);

beforeEach(() => {
  jest.clearAllMocks();
  // Mock AudioContext
  (window as any).AudioContext = mockAudioContextConstructor;
  (window as any).webkitAudioContext = undefined;
});

describe('CharacterReferenceTable', () => {
  describe('Collapse/Expand behavior', () => {
    it('renders collapsed by default', () => {
      render(<CharacterReferenceTable />);
      expect(screen.getByText('Character Reference')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/Search characters/)).not.toBeInTheDocument();
    });

    it('renders expanded when startExpanded is true', () => {
      render(<CharacterReferenceTable startExpanded={true} />);
      expect(screen.getByText('Character Reference')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Search characters/)).toBeInTheDocument();
    });

    it('toggles expansion on header click', () => {
      render(<CharacterReferenceTable />);
      // Click header to expand
      fireEvent.click(screen.getByText('Character Reference'));
      expect(screen.getByPlaceholderText(/Search characters/)).toBeInTheDocument();

      // Click header again to collapse
      fireEvent.click(screen.getByText('Character Reference'));
      expect(screen.queryByPlaceholderText(/Search characters/)).not.toBeInTheDocument();
    });
  });

  describe('when expanded', () => {
    beforeEach(() => {
      render(<CharacterReferenceTable startExpanded={true} />);
    });

    it('shows the search input', () => {
      expect(
        screen.getByPlaceholderText('Search characters or morse code...'),
      ).toBeInTheDocument();
    });

    it('shows all category toggle buttons', () => {
      // Category labels appear as both buttons AND section headings.
      // Use getAllByText to verify at least one exists.
      expect(screen.getAllByText('Letters (A-Z)').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Numbers (0-9)').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Punctuation').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Extended').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Collapse All')).toBeInTheDocument();
    });

    it('shows character items', () => {
      // 'A' should be visible in the letters section
      expect(screen.getByText('A')).toBeInTheDocument();
      // J should be visible
      expect(screen.getByText('J')).toBeInTheDocument();
      // 1 should be visible
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('shows Morse code for characters', () => {
      // 'A' has morse code '.-'
      const aCell = screen.getByText('A').closest('button');
      expect(aCell).toBeInTheDocument();
      expect(aCell?.querySelector('.font-mono')?.textContent).toBe('.-');
    });

    it('filters characters by text search', () => {
      const searchInput = screen.getByPlaceholderText(
        'Search characters or morse code...',
      );
      fireEvent.change(searchInput, { target: { value: 'A' } });

      // 'A' should match the search
      expect(screen.getByText('A')).toBeInTheDocument();
      // 'B' should NOT match (it's a different character)
      expect(screen.queryByText('B')).not.toBeInTheDocument();
    });

    it('filters characters by morse code search', () => {
      const searchInput = screen.getByPlaceholderText(
        'Search characters or morse code...',
      );
      fireEvent.change(searchInput, { target: { value: '.-' } });

      // Characters with .- in their morse code should appear
      // 'A' has .- (exact match)
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('shows no results message when search matches nothing', () => {
      const searchInput = screen.getByPlaceholderText(
        'Search characters or morse code...',
      );
      fireEvent.change(searchInput, { target: { value: 'ZZZZNOTHING' } });

      expect(
        screen.getByText(/No characters found matching/),
      ).toBeInTheDocument();
    });

    it('shows the description text', () => {
      expect(
        screen.getByText('Hover over or tap any character to hear its morse code'),
      ).toBeInTheDocument();
    });
  });

  describe('Category toggling', () => {
    it('toggles category visibility', () => {
      render(<CharacterReferenceTable startExpanded={true} />);

      // "Letters (A-Z)" appears as both a button and a heading.
      // Find just the toggle button by its role and name.
      const lettersToggle = screen.getAllByRole('button').find(
        btn => btn.textContent === 'Letters (A-Z)',
      );
      expect(lettersToggle).toBeInTheDocument();

      // Click Letters category button to hide it
      if (lettersToggle) fireEvent.click(lettersToggle);
      expect(screen.queryByText('A')).not.toBeInTheDocument();
    });

    it('shows Expand All when all categories are collapsed', () => {
      render(<CharacterReferenceTable startExpanded={true} />);

      // Collapse all categories by clicking each toggle button
      const categoryLabels = ['Letters (A-Z)', 'Numbers (0-9)', 'Punctuation', 'Extended'];
      for (const label of categoryLabels) {
        const btn = screen.getAllByRole('button').find(
          b => b.textContent === label,
        );
        if (btn) fireEvent.click(btn);
      }

      expect(screen.getByText('Expand All')).toBeInTheDocument();
    });
  });

  describe('Character playback', () => {
    it('calls AudioContext when character is clicked', () => {
      render(<CharacterReferenceTable startExpanded={true} />);

      const aButton = screen.getByText('A').closest('button');
      expect(aButton).toBeInTheDocument();

      if (aButton) {
        fireEvent.click(aButton);
        expect(mockAudioContextConstructor).toHaveBeenCalled();
      }
    });

    it('triggers AudioContext on mouseEnter', () => {
      render(<CharacterReferenceTable startExpanded={true} />);

      const bButton = screen.getByText('B').closest('button');
      expect(bButton).toBeInTheDocument();

      if (bButton) {
        fireEvent.mouseEnter(bButton);
        expect(mockAudioContextConstructor).toHaveBeenCalled();
      }
    });
  });

  describe('Edge cases', () => {
    it('renders with valid morse for known character', () => {
      render(<CharacterReferenceTable startExpanded={true} />);

      expect(screen.getByText('Z')).toBeInTheDocument();
      const zCell = screen.getByText('Z').closest('button');
      expect(zCell?.querySelector('.font-mono')?.textContent).toBe('--..');
    });
  });
});
