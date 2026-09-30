import { cn } from '@/lib/utils/cn';

interface DividerProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function Divider({ className, orientation = 'horizontal' }: DividerProps) {
  return (
    <div
      role="separator"
      className={cn(
        'bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px self-stretch',
        className
      )}
    />
  );
}
