import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface MedicalDisclaimerProps {
  className?: string;
  compact?: boolean;
}

export function MedicalDisclaimer({ className, compact = false }: MedicalDisclaimerProps) {
  if (compact) {
    return (
      <p className={cn('text-caption text-slate-muted', className)}>
        This is not medical advice.
      </p>
    );
  }

  return (
    <div
      className={cn(
        'flex items-start gap-md bg-subtle border border-border rounded-card p-lg',
        className
      )}
      role="note"
      aria-label="Medical disclaimer"
    >
      <ShieldCheck size={16} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        <p className="text-body-sm text-navy font-medium mb-0.5">Not medical advice</p>
        <p className="text-caption text-slate-muted leading-relaxed">
          Shifa is an AI care coordinator. It does not diagnose, prescribe, or provide medical advice.
          Always consult a qualified healthcare professional for medical decisions.
        </p>
      </div>
    </div>
  );
}
