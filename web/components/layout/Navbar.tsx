'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Menu, X, Globe } from 'lucide-react';
import { ShifaLogo } from '@/components/ui/ShifaLogo';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

export function Navbar() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const [mobileOpen, setMobileOpen] = useState(false);

  const otherLocale = locale === 'ar' ? 'en' : 'ar';
  const otherLocaleLabel = locale === 'ar' ? 'English' : 'العربية';

  const navLinks = [
    { label: t('howItWorks'), href: `/${locale}#how-it-works` },
    { label: t('myJourney'), href: `/${locale}/journey/demo` },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-content mx-auto px-lg md:px-xl 2xl:px-2xl">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href={`/${locale}`}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
              aria-label="Shifa — Home"
            >
              <ShifaLogo variant="compact" />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-lg" aria-label="Main navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-body text-slate hover:text-navy transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm px-1"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop right actions */}
            <div className="hidden md:flex items-center gap-sm">
              {/* Language switcher */}
              <Link
                href={`/${otherLocale}`}
                className={cn(
                  'inline-flex items-center gap-1.5 h-9 px-3 rounded-sm',
                  'text-body-sm text-slate hover:text-navy hover:bg-subtle',
                  'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                )}
                aria-label={`Switch to ${otherLocaleLabel}`}
              >
                <Globe size={15} aria-hidden="true" />
                {otherLocaleLabel}
              </Link>

              {/* Primary CTA */}
              <Link href={`/${locale}/intake`}>
                <Button size="sm" variant="primary">
                  {t('startJourney')}
                </Button>
              </Link>
            </div>

            {/* Mobile menu toggle */}
            <button
              className={cn(
                'md:hidden inline-flex items-center justify-center w-10 h-10 rounded-sm',
                'text-slate hover:text-navy hover:bg-subtle transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
              )}
              onClick={() => setMobileOpen((o) => !o)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label={mobileOpen ? t('close') : t('menu')}
            >
              {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          className="md:hidden fixed inset-0 z-30 bg-navy/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile menu drawer */}
      <div
        id="mobile-menu"
        className={cn(
          'md:hidden fixed top-16 inset-x-0 z-40 bg-card border-b border-border',
          'transform transition-all duration-200 ease-in-out',
          mobileOpen ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0 pointer-events-none'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <div className="px-lg py-xl space-y-lg max-w-content mx-auto">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-body-lg text-navy hover:text-primary transition-colors py-sm"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <div className="border-t border-border pt-lg">
            <Link
              href={`/${otherLocale}`}
              className="flex items-center gap-2 text-body text-slate hover:text-navy transition-colors py-sm"
              onClick={() => setMobileOpen(false)}
            >
              <Globe size={16} aria-hidden="true" />
              {otherLocaleLabel}
            </Link>
          </div>

          <Link href={`/${locale}/intake`} onClick={() => setMobileOpen(false)}>
            <Button variant="primary" fullWidth size="lg">
              {t('startJourney')}
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
