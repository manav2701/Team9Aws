import { useTranslations } from 'next-intl';
import { Languages } from 'lucide-react';

export function BilingualSection() {
  const t = useTranslations('landing.bilingual');

  return (
    <section className="bg-subtle py-3xl md:py-5xl">
      <div className="max-w-content mx-auto px-lg md:px-xl 2xl:px-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2xl items-center">
          {/* Text */}
          <div>
            <div className="inline-flex items-center gap-2 mb-xl">
              <Languages size={20} className="text-primary" aria-hidden="true" />
              <span className="text-caption font-semibold tracking-widest text-primary uppercase">
                Bilingual
              </span>
            </div>
            <h2 className="text-h2 font-bold text-navy mb-lg">{t('title')}</h2>
            <p className="text-body-lg text-slate leading-relaxed">{t('subtitle')}</p>
          </div>

          {/* Language display */}
          <div className="grid grid-cols-2 gap-lg">
            {/* Arabic */}
            <div className="bg-card rounded-card-lg border border-border shadow-card p-xl text-center">
              <div className="text-h2 font-bold text-primary mb-sm" lang="ar" dir="rtl">
                {t('arabic')}
              </div>
              <div className="text-caption text-slate-muted">Arabic</div>
              <div className="mt-lg text-body-sm text-slate" dir="rtl" lang="ar">
                كيف تشعر اليوم؟
              </div>
            </div>

            {/* English */}
            <div className="bg-card rounded-card-lg border border-border shadow-card p-xl text-center">
              <div className="text-h2 font-bold text-primary mb-sm" lang="en" dir="ltr">
                {t('english')}
              </div>
              <div className="text-caption text-slate-muted">English</div>
              <div className="mt-lg text-body-sm text-slate" dir="ltr" lang="en">
                How are you feeling today?
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
