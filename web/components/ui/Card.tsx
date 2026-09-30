import { cn } from '@/lib/utils/cn';
import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  elevated?: boolean;
  noPadding?: boolean;
}

export function Card({ children, elevated = false, noPadding = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-card rounded-card border border-border',
        elevated ? 'shadow-elevated' : 'shadow-card',
        !noPadding && 'p-lg',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-sm mb-lg', className)}>
      <div>
        <h3 className="text-h4 text-navy font-semibold">{title}</h3>
        {subtitle && <p className="text-body-sm text-slate-muted mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

interface FeatureCardProps {
  number: string;
  title: string;
  description: string;
  className?: string;
}

export function FeatureCard({ number, title, description, className }: FeatureCardProps) {
  return (
    <div
      className={cn(
        'bg-card rounded-card-lg border border-border shadow-card p-xl',
        'hover:shadow-elevated transition-shadow duration-200',
        className
      )}
    >
      <div className="text-caption font-semibold text-primary mb-md tracking-widest">{number}</div>
      <h3 className="text-h4 text-navy mb-sm">{title}</h3>
      <p className="text-body-sm text-slate-muted leading-relaxed">{description}</p>
    </div>
  );
}
