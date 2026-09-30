import { useTranslations } from 'next-intl';
import { ArrowDown } from 'lucide-react';

export function ProblemSection() {
  const t = useTranslations('landing.problem');

  const steps = [
    t('patient'),
    t('clinic'),
    t('insurance'),
    t('pharmacy'),
  ];

  return (
    <section id="problem" className="bg-subtle py-3xl md:py-5xl">
      <div className="max-w-content mx-auto px-lg md:px-xl 2xl:px-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2xl lg:gap-3xl items-center">
          {/* Text */}
          <div>
            <h2 className="text-h2 font-bold text-navy mb-lg">{t('title')}</h2>
            <p className="text-body-lg text-slate leading-relaxed mb-xl">{t('subtitle')}</p>
            <p className="text-body text-primary font-medium">{t('description')}</p>
          </div>

          {/* Fragmented journey diagram */}
          <div className="flex flex-col items-center gap-sm">
            {steps.map((step, i) => (
              <div key={step} className="flex flex-col items-center gap-sm w-full max-w-xs">
                <div className="bg-card border border-border rounded-card shadow-card px-xl py-md w-full text-center">
                  <span className="text-body font-medium text-navy">{step}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex flex-col items-center gap-0.5 text-slate-muted">
                    <div className="w-px h-3 bg-border-strong" aria-hidden="true" />
                    <ArrowDown size={14} aria-hidden="true" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
