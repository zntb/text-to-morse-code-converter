// Setup file for Jest — runs before test framework (setupFiles)
// NOTE: Do NOT import @testing-library/jest-dom here — it needs setupFilesAfterFramework

// Mock ResizeObserver (used by Radix UI components and slider)
class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

(global as any).ResizeObserver = MockResizeObserver;

// Mock window.matchMedia (used by next-themes)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock requestAnimationFrame
(global as any).requestAnimationFrame = (cb: FrameRequestCallback) =>
  setTimeout(() => cb(Date.now()), 16) as unknown as number;

(global as any).cancelAnimationFrame = (id: number) => clearTimeout(id);

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
  createLinearGradient: jest.fn().mockReturnValue({ addColorStop: jest.fn() }),
  fillStyle: '',
  fillRect: jest.fn(),
  shadowBlur: 0,
  shadowColor: '',
  lineWidth: 0,
  strokeStyle: '',
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  scale: jest.fn(),
  getContext: jest.fn(),
});
