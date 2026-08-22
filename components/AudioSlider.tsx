'use client';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface AudioSliderProps {
  /** Unique ID for the slider and label association */
  id: string;
  /** Slider label text */
  label: string;
  /** Current value — array for Radix Slider compat, number for native input */
  value: number[];
  /** Callback when value changes — receives array for Radix Slider compat */
  onValueChange: (value: number[]) => void;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Step increment */
  step: number;
  /** Unit suffix for display (e.g. 'WPM', 'Hz', '%') */
  unit: string;
  /** Optional min/max labels shown below the slider */
  minLabel?: string;
  /** Optional min/max labels shown below the slider */
  maxLabel?: string;
  /** Whether the slider is rendered in bottom sheet mode (larger sizing) */
  isBottomSheet?: boolean;
  /** Variant: 'radix' uses Radix Slider, 'native' uses HTML input[type=range] */
  variant?: 'radix' | 'native';
}

export default function AudioSlider({
  id,
  label,
  value,
  onValueChange,
  min,
  max,
  step,
  unit,
  minLabel,
  maxLabel,
  isBottomSheet = false,
  variant = 'radix',
}: AudioSliderProps) {
  const displayValue = value[0];
  const valueDisplay = unit === '%' ? `${displayValue}%` : `${displayValue} ${unit}`;
  const minDisplay = minLabel ?? (unit === '%' ? `${min}%` : `${min} ${unit}`);
  const maxDisplay = maxLabel ?? (unit === '%' ? `${max}%` : `${max} ${unit}`);

  return (
    <div className={isBottomSheet ? 'space-y-4' : 'space-y-3'}>
      <div className='flex items-center justify-between'>
        <Label
          htmlFor={id}
          className={
            isBottomSheet ? 'text-base font-medium' : 'text-sm font-medium'
          }
        >
          {label}
        </Label>
        <span className='rounded-md bg-primary/10 px-3 py-1 text-sm font-mono text-primary'>
          {valueDisplay}
        </span>
      </div>

      {variant === 'radix' ? (
        <Slider
          id={id}
          min={min}
          max={max}
          step={step}
          value={value}
          onValueChange={onValueChange}
          className={isBottomSheet ? 'py-3' : 'py-1'}
        />
      ) : (
        <input
          id={id}
          type='range'
          min={min}
          max={max}
          step={step}
          value={displayValue}
          onChange={e => onValueChange([Number(e.target.value)])}
          className='w-full'
        />
      )}

      <div className='flex justify-between text-sm text-muted-foreground'>
        <span>{minDisplay}</span>
        <span>{maxDisplay}</span>
      </div>
    </div>
  );
}
