'use client';

import { HistoryItem } from '@/lib/useConversionHistory';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Clock, Trash2 } from 'lucide-react';

interface HistoryDropdownProps {
  history: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
  onRemoveItem: (id: string) => void;
  onClearHistory: () => void;
  disabled?: boolean;
}

export default function HistoryDropdown({
  history,
  onSelectItem,
  onRemoveItem,
  onClearHistory,
  disabled = false,
}: HistoryDropdownProps) {
  // Format timestamp to readable date
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Truncate text for display
  const truncateText = (text: string, maxLength: number = 30) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          disabled={disabled || history.length === 0}
          className='gap-2'
        >
          <Clock className='h-4 w-4' />
          History
          {history.length > 0 && (
            <span className='ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs'>
              {history.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='start'
        className='w-72 max-h-80 overflow-y-auto'
      >
        {history.length === 0 ? (
          <div className='p-4 text-center text-sm text-muted-foreground'>
            No conversion history yet
          </div>
        ) : (
          <>
            {history.map(item => (
              <DropdownMenuItem
                key={item.id}
                onSelect={() => onSelectItem(item)}
                className='flex cursor-pointer flex-col items-start gap-1 p-3'
              >
                <div className='flex w-full items-center justify-between gap-2'>
                  <span className='truncate font-medium'>
                    {truncateText(item.input)}
                  </span>
                  <span className='shrink-0 text-xs text-muted-foreground'>
                    {formatTimestamp(item.timestamp)}
                  </span>
                </div>
                <div className='flex w-full items-center justify-between gap-2'>
                  <span className='truncate text-xs text-muted-foreground'>
                    {item.mode === 'text-to-morse' ? '→ Morse' : '→ Text'}
                    {': '}
                    {truncateText(item.output, 25)}
                  </span>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-6 w-6 shrink-0 p-0 text-muted-foreground hover:text-destructive'
                    onClick={e => {
                      e.stopPropagation();
                      onRemoveItem(item.id);
                    }}
                  >
                    <Trash2 className='h-3 w-3' />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={onClearHistory}
              className='cursor-pointer text-destructive focus:text-destructive'
            >
              <Trash2 className='mr-2 h-4 w-4' />
              Clear all history
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
