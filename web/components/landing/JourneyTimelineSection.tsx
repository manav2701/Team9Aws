import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';

export function JourneyTimelineSection() {
  const t = useTranslations('landing.journey');

  const steps = [
    t('intake'),
    t('triage'),
    t('appointment'),
    t('doctor'),
    t('insurance'),
    t('pharmacy'),
    t('delivered'),
  ];

  return (
    <section className="bg-app py-3xl md:py-5xl overflow-hidden">
      <div className="max-w-content mx-auto px-lg md:px-xl 2xl:px-2xl">
        <div className="text-center mb-2xl">
          <h2 className="text-h2 font-bold text-navy">{t('title')}</h2>
        </div>

        {/* Desktop — horizontal timeline */}
        <div className="hidden md:flex items-center justify-between relative">
          {/* Connecting line */}
          <div
            className="absolute top-5 left-0 right-0 h-px bg-border-strong"
            aria-hidden="true"
          />

          {steps.map((step, i) => (
            <div
              key={step}
              className="flex flex-col items-center gap-md relative z-10"
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 text-body-sm font-semibold',
                  i === 0
                    ? 'bg-primary border-primary text-white'
                    : 'bg-card border-border-strong text-slate'
                )}
                aria-current={i === 0 ? 'step' : undefined}
              >
                {i + 1}
              </div>
              <span className="text-body-sm text-center text-slate font-medium max-w-[80px]">
                {step}
              </span>
            </div>
          ))}
        </div>

        {/* Mobile — vertical timeline */}
        <div className="md:hidden flex flex-col items-start gap-0">
          {steps.map((step, i) => (
            <div key={step} className="flex items-start gap-md">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center border-2 text-body-sm font-semibold shrink-0',
                    i === 0
                      ? 'bg-primary border-primary text-white'
                      : 'bg-card border-border-strong text-slate'
                  )}
                  aria-current={i === 0 ? 'step' : undefined}
                >
                  {i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className="w-px h-8 bg-border-strong" aria-hidden="true" />
                )}
              </div>
              <span
                className={cn(
                  'text-body-sm font-medium pt-1.5 pb-8',
                  i === 0 ? 'text-navy' : 'text-slate'
                )}
              >
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
