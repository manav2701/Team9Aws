import { getLocale } from 'next-intl/server';
import { HeroSection } from '@/components/landing/HeroSection';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { HowItHelpsSection } from '@/components/landing/HowItHelpsSection';
import { SafetySection } from '@/components/landing/SafetySection';
import { JourneyTimelineSection } from '@/components/landing/JourneyTimelineSection';
import { BilingualSection } from '@/components/landing/BilingualSection';
import { FinalCtaSection } from '@/components/landing/FinalCtaSection';

export default async function LandingPage() {
  const locale = await getLocale();

  return (
    <>
      <HeroSection locale={locale} />
      <ProblemSection />
      <HowItHelpsSection />
      <SafetySection />
      <JourneyTimelineSection />
      <BilingualSection />
      <FinalCtaSection locale={locale} />
    </>
  );
}
