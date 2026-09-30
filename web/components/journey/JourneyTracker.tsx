import { useTranslations } from 'next-intl';
import { Check, Circle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { JourneyState } from '@/lib/types/journey';

// Journey state order — maps to backend contract
const JOURNEY_STEPS: JourneyState[] = [
  'Intake',
  'Triaged',
  'BookingCall',
  'Booked',
  'VisitDone',
  'InsuranceCall',
  'Approved',
  'PharmacyOrder',
  'Delivered',
];

const STATE_INDEX: Partial<Record<JourneyState, number>> = Object.fromEntries(
  JOURNEY_STEPS.map((s, i) => [s, i])
);

// Static label map — avoids dynamic key lookup (TypeScript-safe)
const STEP_LABELS: Record<JourneyState, string> = {
  Intake: 'Intake',
  Triaged: 'Triaged',
  Emergency: 'Emergency',
  BookingCall: 'Booking call',
  Booked: 'Booked',
  VisitDone: 'Visit done',
  InsuranceCall: 'Insurance call',
  NeedsInfo: 'Needs information',
  Approved: 'Approved',
  PharmacyOrder: 'Pharmacy order',
  Delivered: 'Delivered',
};

type StepStatus = 'completed' | 'current' | 'upcoming';

function getStepStatus(step: JourneyState, currentState: JourneyState): StepStatus {
  const stepIdx = STATE_INDEX[step] ?? 0;
  const currentIdx = STATE_INDEX[currentState] ?? 0;
  if (stepIdx < currentIdx) return 'completed';
  if (stepIdx === currentIdx) return 'current';
  return 'upcoming';
}

interface JourneyTrackerProps {
  currentState: JourneyState;
  className?: string;
}

export function JourneyTracker({ currentState, className }: JourneyTrackerProps) {
  const t = useTranslations('journey');

  // Emergency state — full-screen override
  if (currentState === 'Emergency') {
    return (
      <div
        className={cn(
          'bg-emergency-bg border-2 border-emergency rounded-card-lg p-xl',
          className
        )}
      >
        <div className="flex items-center gap-md mb-lg">
          <AlertTriangle size={24} className="text-emergency" aria-hidden="true" />
          <h2 className="text-h3 font-bold text-emergency">EMERGENCY</h2>
        </div>
        <p className="text-body text-navy mb-lg">
          Your symptoms may require immediate professional attention.
        </p>
        <a
          href="tel:998"
          className="inline-flex items-center gap-2 bg-emergency text-white px-xl py-md rounded-card font-semibold text-body hover:bg-red-700 transition-colors"
        >
          Call 998 in the UAE
        </a>
        <p className="text-body-sm text-slate mt-lg">
          Shifa will not continue routine booking in this state.
        </p>
      </div>
    );
  }

  const stepsToShow = JOURNEY_STEPS;

  return (
    <div
      className={cn('space-y-0', className)}
      role="list"
      aria-label={t('title')}
    >
      {stepsToShow.map((step, i) => {
        const status = getStepStatus(step, currentState);
        const isLast = i === stepsToShow.length - 1;

        return (
          <div key={step} className="flex items-start gap-md" role="listitem">
            {/* Step indicator + connector */}
            <div className="flex flex-col items-center">
              <StepIcon status={status} />
              {!isLast && (
                <div
                  className={cn(
                    'w-px flex-1 min-h-[32px]',
                    status === 'completed' ? 'bg-primary' : 'bg-border-strong'
                  )}
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Step label */}
            <div className={cn('pb-xl pt-0.5', isLast && 'pb-0')}>
              <p
                className={cn(
                  'text-body font-medium',
                  status === 'current'
                    ? 'text-navy'
                    : status === 'completed'
                    ? 'text-slate'
                    : 'text-slate-muted'
                )}
              >
                {STEP_LABELS[step]}
              </p>
              {status === 'current' && (
                <p className="text-body-sm text-primary mt-0.5">{t('currentStep')}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface StepIconProps {
  status: StepStatus;
}

function StepIcon({ status }: StepIconProps) {
  return (
    <div
      className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0',
        status === 'completed'
          ? 'bg-primary border-primary text-white'
          : status === 'current'
          ? 'bg-white border-primary'
          : 'bg-white border-border-strong'
      )}
      aria-hidden="true"
    >
      {status === 'completed' ? (
        <Check size={14} strokeWidth={3} className="text-white" />
      ) : status === 'current' ? (
        <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
      ) : (
        <Circle size={8} className="text-slate-muted" />
      )}
    </div>
  );
}
