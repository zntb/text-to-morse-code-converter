import { debounce, cn } from '@/lib/utils';

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
    expect(cn('base', true && 'active')).toBe('base active');
  });

  it('handles undefined and null values', () => {
    // This is a type-check-time thing; at runtime they just get skipped
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });

  it('handles empty string', () => {
    expect(cn('')).toBe('');
    expect(cn('', 'foo')).toBe('foo');
  });
});

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('delays function execution', () => {
    const fn = jest.fn();
    const debouncedFn = debounce(fn, 300);

    debouncedFn();
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('calls the function with the provided arguments', () => {
    const fn = jest.fn();
    const debouncedFn = debounce(fn, 300);

    debouncedFn('hello', 42);
    jest.advanceTimersByTime(300);

    expect(fn).toHaveBeenCalledWith('hello', 42);
  });

  it('resets the timer on subsequent calls', () => {
    const fn = jest.fn();
    const debouncedFn = debounce(fn, 300);

    debouncedFn();
    jest.advanceTimersByTime(200);
    debouncedFn(); // Reset timer
    jest.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled(); // Should not have fired yet

    jest.advanceTimersByTime(100); // Now 300ms since last call
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('only fires once for rapid successive calls', () => {
    const fn = jest.fn();
    const debouncedFn = debounce(fn, 300);

    for (let i = 0; i < 10; i++) {
      debouncedFn();
    }
    jest.advanceTimersByTime(300);

    expect(fn).toHaveBeenCalledTimes(1);
  });
});
