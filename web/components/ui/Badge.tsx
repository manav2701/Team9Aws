import { cn } from '@/lib/utils/cn';
import type { ReactNode } from 'react';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'emergency'
  | 'info'
  | 'muted';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-subtle text-slate border border-border',
  primary: 'bg-primary-light text-primary-dark border border-primary/20',
  success: 'bg-success-bg text-success border border-success/20',
  warning: 'bg-warning-bg text-warning border border-warning/20',
  emergency: 'bg-emergency-bg text-emergency border border-emergency/20',
  info: 'bg-info-bg text-info border border-info/20',
  muted: 'bg-subtle text-slate-muted border border-border',
};

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-caption font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// Urgency badge uses the journey urgency levels
export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';

const urgencyVariant: Record<UrgencyLevel, BadgeVariant> = {
  LOW: 'success',
  MEDIUM: 'warning',
  HIGH: 'info',
  EMERGENCY: 'emergency',
};

interface UrgencyBadgeProps {
  urgency: UrgencyLevel;
  className?: string;
}

export function UrgencyBadge({ urgency, className }: UrgencyBadgeProps) {
  return (
    <Badge variant={urgencyVariant[urgency]} className={className}>
      {urgency}
    </Badge>
  );
}
