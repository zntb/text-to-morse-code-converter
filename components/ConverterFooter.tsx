'use client';

export default function ConverterFooter() {
  return (
    <div className='animate-fade-in-up stagger-6'>
      <p className='text-center text-xs text-muted-foreground'>
        Press{' '}
        <kbd className='rounded bg-muted px-1.5 py-0.5 font-mono text-xs'>
          Ctrl + Space
        </kbd>{' '}
        to play/pause •{' '}
        <kbd className='rounded bg-muted px-1.5 py-0.5 font-mono text-xs'>
          Esc
        </kbd>{' '}
        to reset
      </p>
    </div>
  );
}
