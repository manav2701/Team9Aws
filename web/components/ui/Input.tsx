import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-body-sm font-medium text-navy mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full h-10 px-3 rounded-input border text-body text-navy bg-card',
            'placeholder:text-slate-muted',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors',
            error ? 'border-emergency focus:ring-emergency' : 'border-border',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-caption text-emergency">{error}</p>}
        {hint && !error && <p className="mt-1 text-caption text-slate-muted">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-body-sm font-medium text-navy mb-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2 rounded-input border text-body text-navy bg-card resize-none',
            'placeholder:text-slate-muted',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors',
            error ? 'border-emergency focus:ring-emergency' : 'border-border',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-caption text-emergency">{error}</p>}
        {hint && !error && <p className="mt-1 text-caption text-slate-muted">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
