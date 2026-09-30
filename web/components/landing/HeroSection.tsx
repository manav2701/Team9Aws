import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

interface HeroSectionProps {
  locale: string;
}

// Journey preview card — shows a simulated care journey state
function JourneyPreviewCard() {
  const t = useTranslations('landing.hero.journeyCard');

  const steps = [
    { key: 'intake' as const, done: true },
    { key: 'urgency' as const, done: true },
    { key: 'appointment' as const, done: false, active: true },
    { key: 'insurance' as const, done: false },
    { key: 'pharmacy' as const, done: false },
  ];

  return (
    <div className="bg-card rounded-card-lg border border-border shadow-elevated p-xl w-full max-w-sm mx-auto">
      <div className="flex items-center justify-between mb-xl">
        <h3 className="text-h4 font-semibold text-navy">{t('title')}</h3>
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
      </div>

      <div className="space-y-sm">
        {steps.map((step) => (
          <div
            key={step.key}
            className={cn(
              'flex items-center gap-md px-md py-sm rounded-sm',
              'active' in step && step.active ? 'bg-primary-light' : 'transparent'
            )}
          >
            <div
              className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px]',
                step.done
                  ? 'bg-primary text-white'
                  : 'active' in step && step.active
                  ? 'bg-white border-2 border-primary text-primary'
                  : 'bg-subtle border border-border-strong text-slate-muted'
              )}
              aria-hidden="true"
            >
              {step.done ? (
                <Check size={10} strokeWidth={3} />
              ) : 'active' in step && step.active ? (
                <ChevronRight size={10} strokeWidth={3} />
              ) : null}
            </div>
            <span
              className={cn(
                'text-body-sm',
                step.done
                  ? 'text-slate line-through'
                  : 'active' in step && step.active
                  ? 'text-primary font-medium'
                  : 'text-slate-muted'
              )}
            >
              {t(step.key)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-xl pt-lg border-t border-border">
        <p className="text-caption text-slate-muted">{t('coordinating')}</p>
      </div>
    </div>
  );
}

export function HeroSection({ locale }: HeroSectionProps) {
  const t = useTranslations('landing.hero');

  return (
    <section className="bg-app py-3xl md:py-5xl">
      <div className="max-w-content mx-auto px-lg md:px-xl 2xl:px-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2xl lg:gap-3xl items-center">
          {/* Left column — copy + CTAs */}
          <div className="order-2 lg:order-1">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 mb-xl">
              <div className="w-6 h-px bg-primary" aria-hidden="true" />
              <span className="text-caption font-semibold tracking-widest text-primary uppercase">
                {t('eyebrow')}
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-h1 lg:text-display font-bold text-navy leading-tight mb-xl whitespace-pre-line">
              {t('headline')}
            </h1>

            {/* Supporting copy */}
            <p className="text-body-lg text-slate leading-relaxed mb-2xl max-w-lg">
              {t('subheadline')}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-sm mb-xl">
              <Link href={`/${locale}/intake`}>
                <Button
                  size="lg"
                  variant="primary"
                  icon={<ArrowRight size={18} />}
                  iconPosition="end"
                >
                  {t('primaryCta')}
                </Button>
              </Link>
              <Link href={`/${locale}#how-it-works`}>
                <Button size="lg" variant="secondary">
                  {t('secondaryCta')}
                </Button>
              </Link>
            </div>

            {/* Safety microcopy */}
            <p className="text-caption text-slate-muted flex items-center gap-1.5">
              <span
                className="w-4 h-4 rounded-full bg-primary-light flex items-center justify-center"
                aria-hidden="true"
              >
                <Check size={9} className="text-primary" strokeWidth={3} />
              </span>
              {t('safetyCopy')}
            </p>
          </div>

          {/* Right column — journey preview */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <JourneyPreviewCard />
          </div>
        </div>
      </div>
    </section>
  );
}
