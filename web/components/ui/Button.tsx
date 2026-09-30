'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'start' | 'end';
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-dark active:bg-primary-dark focus-visible:ring-primary',
  secondary:
    'bg-white text-primary border border-border-strong hover:bg-subtle active:bg-subtle focus-visible:ring-primary',
  tertiary:
    'bg-transparent text-primary hover:bg-primary-light active:bg-primary-light focus-visible:ring-primary',
  danger:
    'bg-emergency text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-emergency',
  ghost:
    'bg-transparent text-slate hover:bg-subtle active:bg-subtle focus-visible:ring-slate',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-body-sm gap-1.5',
  md: 'h-10 px-4 text-body gap-2',
  lg: 'h-12 px-6 text-body-lg gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'start',
      fullWidth = false,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base
          'inline-flex items-center justify-center font-medium rounded-sm transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // Variant
          variantClasses[variant],
          // Size
          sizeClasses[size],
          // Full width
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <Spinner size="sm" className="text-current" />
            {children}
          </>
        ) : (
          <>
            {icon && iconPosition === 'start' && <span aria-hidden="true">{icon}</span>}
            {children}
            {icon && iconPosition === 'end' && <span aria-hidden="true">{icon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
