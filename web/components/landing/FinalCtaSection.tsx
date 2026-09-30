import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface FinalCtaSectionProps {
  locale: string;
}

export function FinalCtaSection({ locale }: FinalCtaSectionProps) {
  const t = useTranslations('landing.cta');

  return (
    <section className="bg-primary py-3xl md:py-5xl">
      <div className="max-w-content mx-auto px-lg md:px-xl 2xl:px-2xl text-center">
        <h2 className="text-h2 font-bold text-white mb-2xl">{t('title')}</h2>
        <Link href={`/${locale}/intake`}>
          <Button
            size="lg"
            variant="secondary"
            icon={<ArrowRight size={18} />}
            iconPosition="end"
            className="bg-white text-primary border-white hover:bg-primary-light"
          >
            {t('button')}
          </Button>
        </Link>
        <p className="mt-xl text-body-sm text-primary-light flex items-center justify-center gap-1.5">
          <span
            className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center"
            aria-hidden="true"
          >
            <Check size={9} className="text-white" strokeWidth={3} />
          </span>
          {t('safety')}
        </p>
      </div>
    </section>
  );
}
