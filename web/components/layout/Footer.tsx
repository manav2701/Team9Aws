'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Phone } from 'lucide-react';
import { ShifaLogo } from '@/components/ui/ShifaLogo';
import { Divider } from '@/components/ui/Divider';

export function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();

  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-content mx-auto px-lg md:px-xl 2xl:px-2xl py-2xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2xl">
          {/* Brand */}
          <div className="md:col-span-1">
            <ShifaLogo variant="full" />
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-body-sm font-semibold text-navy mb-lg">{t('navigation')}</h3>
            <ul className="space-y-sm">
              {[
                { label: t('howItWorks'), href: `/${locale}#how-it-works` },
                { label: t('safety'), href: `/${locale}#safety` },
                { label: t('privacy'), href: `/${locale}/privacy` },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-slate hover:text-navy transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Languages */}
          <div>
            <h3 className="text-body-sm font-semibold text-navy mb-lg">{t('languages')}</h3>
            <ul className="space-y-sm">
              <li>
                <Link href="/en" className="text-body-sm text-slate hover:text-navy transition-colors">
                  English
                </Link>
              </li>
              <li>
                <Link href="/ar" className="text-body-sm text-slate hover:text-navy transition-colors">
                  العربية
                </Link>
              </li>
            </ul>
          </div>

          {/* Emergency */}
          <div>
            <h3 className="text-body-sm font-semibold text-navy mb-lg">{t('emergency')}</h3>
            <p className="text-body-sm text-slate leading-relaxed flex items-start gap-2">
              <Phone size={14} className="mt-0.5 shrink-0 text-slate-muted" aria-hidden="true" />
              {t('emergencyText')}
            </p>
          </div>
        </div>

        <Divider className="my-xl" />

        {/* Disclaimer */}
        <p className="text-caption text-slate-muted text-center leading-relaxed max-w-2xl mx-auto">
          {t('disclaimerText')}
        </p>
      </div>
    </footer>
  );
}
