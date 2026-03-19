'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => onOpenChange(false)}
      />

      {/* Sheet */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 max-h-[85vh] transform rounded-t-2xl bg-background p-4 pb-6 shadow-lg transition-transform duration-300 ease-in-out md:hidden',
          open ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        {/* Handle bar */}
        <div className='mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted-foreground/30' />

        {/* Content */}
        <div className='overflow-y-auto max-h-[80vh]'>{children}</div>

        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className='absolute right-4 top-4 rounded-full p-2 hover:bg-muted md:hidden'
          aria-label='Close'
        >
          <X className='h-5 w-5' />
        </button>
      </div>
    </>
  );
}

interface SheetHeaderProps {
  children: React.ReactNode;
}

export function SheetHeader({ children }: SheetHeaderProps) {
  return <div className='mb-4'>{children}</div>;
}

interface SheetTitleProps {
  children: React.ReactNode;
}

export function SheetTitle({ children }: SheetTitleProps) {
  return <h2 className='text-lg font-semibold text-foreground'>{children}</h2>;
}

interface SheetDescriptionProps {
  children: React.ReactNode;
}

export function SheetDescription({ children }: SheetDescriptionProps) {
  return <p className='text-sm text-muted-foreground'>{children}</p>;
}

interface SheetContentProps {
  children: React.ReactNode;
  className?: string;
}

export function SheetContent({ children, className }: SheetContentProps) {
  return <div className={className}>{children}</div>;
}

// Mobile-only sheet trigger component
interface SheetTriggerProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}

export function SheetTrigger({
  children,
  onClick,
  className,
}: SheetTriggerProps) {
  return (
    <button onClick={onClick} className={cn('md:hidden', className)}>
      {children}
    </button>
  );
}

// Desktop fallback - renders content normally
interface DesktopSheetProps {
  children: React.ReactNode;
}

export function DesktopSheet({ children }: DesktopSheetProps) {
  return <div className='hidden md:block'>{children}</div>;
}
