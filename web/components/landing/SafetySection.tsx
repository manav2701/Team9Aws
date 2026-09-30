import { useTranslations } from 'next-intl';
import { X, ShieldCheck } from 'lucide-react';

export function SafetySection() {
  const t = useTranslations('landing.safety');

  const nevers = [
    t('diagnose'),
    t('prescribe'),
    t('recommendTreatment'),
    t('interpretImages'),
    t('pretendHuman'),
  ];

  return (
    <section id="safety" className="bg-subtle py-3xl md:py-5xl">
      <div className="max-w-content mx-auto px-lg md:px-xl 2xl:px-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2xl lg:gap-3xl items-center">
          {/* Text */}
          <div>
            <div className="inline-flex items-center gap-2 mb-xl">
              <ShieldCheck size={20} className="text-primary" aria-hidden="true" />
              <span className="text-caption font-semibold tracking-widest text-primary uppercase">
                Safety
              </span>
            </div>
            <h2 className="text-h2 font-bold text-navy mb-lg">{t('title')}</h2>
            <p className="text-body-lg text-slate leading-relaxed">{t('subtitle')}</p>
          </div>

          {/* Safety card */}
          <div className="bg-card rounded-card-lg border border-border shadow-card p-xl">
            <p className="text-body-sm font-semibold text-navy mb-lg">{t('neverTitle')}</p>

            <ul className="space-y-sm mb-xl" role="list">
              {nevers.map((item) => (
                <li key={item} className="flex items-center gap-md">
                  <div
                    className="w-5 h-5 rounded-full bg-emergency-bg flex items-center justify-center shrink-0"
                    aria-hidden="true"
                  >
                    <X size={10} className="text-emergency" strokeWidth={3} />
                  </div>
                  <span className="text-body-sm text-slate">{item}</span>
                </li>
              ))}
            </ul>

            <div className="border-t border-border pt-lg">
              <p className="text-body-sm text-primary font-medium">{t('instead')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
