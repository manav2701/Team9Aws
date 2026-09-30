import { useTranslations } from 'next-intl';
import { FeatureCard } from '@/components/ui/Card';

export function HowItHelpsSection() {
  const t = useTranslations('landing.howItHelps');

  const steps = [
    { num: '01', titleKey: 'step1Title', descKey: 'step1Desc' },
    { num: '02', titleKey: 'step2Title', descKey: 'step2Desc' },
    { num: '03', titleKey: 'step3Title', descKey: 'step3Desc' },
    { num: '04', titleKey: 'step4Title', descKey: 'step4Desc' },
  ] as const;

  return (
    <section id="how-it-works" className="bg-app py-3xl md:py-5xl">
      <div className="max-w-content mx-auto px-lg md:px-xl 2xl:px-2xl">
        <div className="text-center mb-2xl">
          <h2 className="text-h2 font-bold text-navy mb-lg">{t('title')}</h2>
          <p className="text-body-lg text-slate max-w-xl mx-auto">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
          {steps.map((step) => (
            <FeatureCard
              key={step.num}
              number={step.num}
              title={t(step.titleKey)}
              description={t(step.descKey)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
