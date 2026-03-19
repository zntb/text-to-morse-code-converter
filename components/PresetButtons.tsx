'use client';

import { Button } from '@/components/ui/button';

interface PresetMessage {
  id: string;
  name: string;
  text: string;
}

interface PresetButtonsProps {
  customPresets: PresetMessage[];
  showPresetInput: boolean;
  newPresetName: string;
  newPresetText: string;
  onApplyPreset: (text: string) => void;
  onDeletePreset: (id: string) => void;
  onShowPresetInput: (show: boolean) => void;
  onNewPresetNameChange: (name: string) => void;
  onNewPresetTextChange: (text: string) => void;
  onSavePreset: (name: string, text: string) => void;
}

// Built-in preset messages
const BUILT_IN_PRESETS: PresetMessage[] = [
  { id: 'sos', name: 'SOS', text: 'SOS' },
  { id: 'mayday', name: 'MAYDAY', text: 'MAYDAY' },
  { id: 'cq', name: 'CQ', text: 'CQ' },
  { id: '73', name: '73', text: '73' },
];

export default function PresetButtons({
  customPresets,
  showPresetInput,
  newPresetName,
  newPresetText,
  onApplyPreset,
  onDeletePreset,
  onShowPresetInput,
  onNewPresetNameChange,
  onNewPresetTextChange,
  onSavePreset,
}: PresetButtonsProps) {
  return (
    <div className='space-y-3'>
      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
        <span>Quick Presets:</span>
      </div>
      <div className='flex flex-wrap gap-2'>
        {/* Built-in Presets */}
        {BUILT_IN_PRESETS.map(preset => (
          <Button
            key={preset.id}
            variant='outline'
            size='sm'
            onClick={() => onApplyPreset(preset.text)}
            className='text-xs'
          >
            {preset.name}
          </Button>
        ))}
        {/* Custom Presets */}
        {customPresets.map(preset => (
          <div key={preset.id} className='flex items-center gap-1'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onApplyPreset(preset.text)}
              className='text-xs'
            >
              {preset.name}
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => onDeletePreset(preset.id)}
              className='h-6 w-6 p-0 text-destructive hover:text-destructive'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='14'
                height='14'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='M18 6 6 18' />
                <path d='m6 6 12 12' />
              </svg>
            </Button>
          </div>
        ))}
        {/* Add Custom Preset Button */}
        {showPresetInput ? (
          <div className='flex items-center gap-1'>
            <input
              type='text'
              placeholder='Name'
              value={newPresetName}
              onChange={e => onNewPresetNameChange(e.target.value)}
              className='h-8 w-20 rounded-md border border-input bg-background px-2 text-xs'
            />
            <input
              type='text'
              placeholder='Message'
              value={newPresetText}
              onChange={e => onNewPresetTextChange(e.target.value)}
              className='h-8 w-24 rounded-md border border-input bg-background px-2 text-xs'
            />
            <Button
              size='sm'
              onClick={() => {
                if (newPresetName.trim() && newPresetText.trim()) {
                  onSavePreset(newPresetName.trim(), newPresetText.trim());
                }
              }}
              disabled={!newPresetName.trim() || !newPresetText.trim()}
              className='h-8'
            >
              Save
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                onShowPresetInput(false);
                onNewPresetNameChange('');
                onNewPresetTextChange('');
              }}
              className='h-8'
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant='secondary'
            size='sm'
            onClick={() => onShowPresetInput(true)}
            className='text-xs'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='14'
              height='14'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='mr-1'
            >
              <path d='M5 12h14' />
              <path d='M12 5v14' />
            </svg>
            Add Custom
          </Button>
        )}
      </div>
    </div>
  );
}
