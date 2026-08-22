'use client';

import { Label } from '@/components/ui/label';

interface SwitchToggleProps {
  /** Unique ID for the toggle and label association */
  id: string;
  /** Whether the toggle is on or off */
  checked: boolean;
  /** Callback when the toggle state changes */
  onCheckedChange: (checked: boolean) => void;
  /** Label text displayed next to the toggle */
  label: string;
  /** Whether the toggle is rendered in bottom sheet mode (larger sizing) */
  isBottomSheet?: boolean;
}

export default function SwitchToggle({
  id,
  checked,
  onCheckedChange,
  label,
  isBottomSheet = false,
}: SwitchToggleProps) {
  return (
    <div
      className={
        isBottomSheet
          ? 'flex items-center gap-4 rounded-lg bg-muted/50 p-4'
          : 'flex items-center gap-3 rounded-lg bg-muted/50 p-3'
      }
    >
      <button
        type='button'
        id={id}
        onClick={() => onCheckedChange(!checked)}
        className={`relative h-8 w-14 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
          checked ? 'bg-primary' : 'bg-muted-foreground/30'
        }`}
        role='switch'
        aria-checked={checked}
      >
        <span
          className={`block h-7 w-7 rounded-full bg-white shadow-md transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-0.5'
          }`}
        />
      </button>
      <Label
        htmlFor={id}
        className={
          isBottomSheet
            ? 'cursor-pointer text-base text-muted-foreground'
            : 'cursor-pointer text-sm text-muted-foreground'
        }
      >
        {label}
      </Label>
    </div>
  );
}
