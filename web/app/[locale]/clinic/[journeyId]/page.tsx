'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowLeft, Upload, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge, UrgencyBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ShifaLogo } from '@/components/ui/ShifaLogo';
import { Divider } from '@/components/ui/Divider';
import { demoJourney } from '@/lib/utils/demo-data';

// Client component — params are not a Promise in client components
interface DoctorVisitPageProps {
  params: { locale: string; journeyId: string };
}

export default function DoctorVisitPage({ params: _params }: DoctorVisitPageProps) {
  const t = useTranslations('clinic');
  const locale = useLocale();
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'done'>('idle');

  // Use demo data — backend not connected yet
  const journey = demoJourney;
  const patient = journey.patient;

  const handleUpload = () => {
    setUploadState('uploading');
    setTimeout(() => setUploadState('done'), 2000);
  };

  return (
    <div className="min-h-screen bg-subtle">
      {/* Clinic header */}
      <div className="bg-navy">
        <div className="max-w-content mx-auto px-lg md:px-xl 2xl:px-2xl py-lg flex items-center gap-lg">
          <ShifaLogo
            variant="compact"
            textClassName="[&>span:first-child]:text-white"
          />
          <div className="w-px h-6 bg-white/20" aria-hidden="true" />
          <span className="text-body text-white/80">{t('title')}</span>
        </div>
      </div>

      <div className="max-w-content mx-auto px-lg md:px-xl 2xl:px-2xl py-2xl">
        {/* Back link */}
        <Link
          href={`/${locale}/clinic`}
          className="inline-flex items-center gap-2 text-body-sm text-slate hover:text-navy transition-colors mb-xl"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          {t('appointments')}
        </Link>

        {/* Page title + urgency */}
        <div className="flex items-center justify-between mb-2xl">
          <h1 className="text-h2 font-bold text-navy">{patient.profile.name}</h1>
          {journey.urgency && <UrgencyBadge urgency={journey.urgency} />}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2xl">
          {/* Patient summary — left column */}
          <div className="lg:col-span-2 space-y-lg">
            <Card elevated>
              <CardHeader title={t('patientSummary')} />

              {/* Reason for visit */}
              <section className="mb-xl" aria-labelledby="reason-heading">
                <h3
                  id="reason-heading"
                  className="text-body-sm font-semibold text-navy mb-sm"
                >
                  {t('reasonForVisit')}
                </h3>
                <p className="text-body text-slate leading-relaxed">
                  Severe headache and dizziness for three days. Pain rated 7/10. No prior
                  neurological history.
                </p>
              </section>

              <Divider />

              {/* Symptom timeline */}
              <section className="my-xl" aria-labelledby="symptoms-heading">
                <h3
                  id="symptoms-heading"
                  className="text-body-sm font-semibold text-navy mb-sm"
                >
                  {t('symptomTimeline')}
                </h3>
                <div className="space-y-sm">
                  {[
                    { day: 'Day 1', desc: 'Onset of frontal headache, mild' },
                    { day: 'Day 2', desc: 'Headache worsened, dizziness began' },
                    { day: 'Day 3', desc: 'Dizziness severe, contacted Shifa' },
                  ].map((item) => (
                    <div key={item.day} className="flex gap-md text-body-sm">
                      <span className="font-medium text-primary w-12 shrink-0">
                        {item.day}
                      </span>
                      <span className="text-slate">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </section>

              <Divider />

              {/* Current medications */}
              <section className="my-xl" aria-labelledby="meds-heading">
                <h3
                  id="meds-heading"
                  className="text-body-sm font-semibold text-navy mb-sm"
                >
                  {t('medications')}
                </h3>
                <div className="space-y-xs">
                  {patient.medications.map((med) => (
                    <div
                      key={med.name}
                      className="flex items-center justify-between text-body-sm"
                    >
                      <span className="text-navy">{med.name}</span>
                      <span className="text-slate-muted">
                        {med.dose} · {med.frequency}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <Divider />

              {/* Allergies */}
              <section className="mt-xl" aria-labelledby="allergies-heading">
                <h3
                  id="allergies-heading"
                  className="text-body-sm font-semibold text-navy mb-sm"
                >
                  {t('allergies')}
                </h3>
                <div className="flex flex-wrap gap-xs">
                  {patient.allergies.map((a) => (
                    <Badge key={a} variant="warning">
                      <AlertTriangle size={10} aria-hidden="true" />
                      {a}
                    </Badge>
                  ))}
                </div>
              </section>
            </Card>

            {/* Doctor responsibility notice */}
            <div className="bg-info-bg border border-info/20 rounded-card p-lg text-body-sm text-slate leading-relaxed">
              <strong className="text-navy">Note:</strong> The prescribing decision is the
              responsibility of the treating physician. Shifa provides intake information only
              and does not make medical recommendations.
            </div>
          </div>

          {/* Prescription upload — right column */}
          <div className="lg:col-span-1">
            <Card elevated>
              <CardHeader title="Prescription" />

              {uploadState === 'idle' && (
                <div
                  className="border-2 border-dashed border-border rounded-card p-xl text-center cursor-pointer hover:border-primary hover:bg-primary-light/30 transition-colors"
                  onClick={handleUpload}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleUpload()}
                  aria-label={t('uploadPrescription')}
                >
                  <Upload
                    size={24}
                    className="text-slate-muted mx-auto mb-md"
                    aria-hidden="true"
                  />
                  <p className="text-body-sm font-medium text-navy mb-xs">
                    {t('uploadPrescription')}
                  </p>
                  <p className="text-caption text-slate-muted">PDF or image</p>
                </div>
              )}

              {uploadState === 'uploading' && (
                <div className="flex flex-col items-center gap-md p-xl text-center">
                  <Loader2
                    size={24}
                    className="text-primary animate-spin"
                    aria-hidden="true"
                  />
                  <p className="text-body-sm font-medium text-navy">
                    {t('prescriptionUploaded')}
                  </p>
                  <p className="text-caption text-slate-muted">{t('processing')}</p>
                </div>
              )}

              {uploadState === 'done' && (
                <div className="flex flex-col items-center gap-md p-xl text-center">
                  <CheckCircle2
                    size={24}
                    className="text-success"
                    aria-hidden="true"
                  />
                  <p className="text-body-sm font-medium text-navy">
                    {t('prescriptionUploaded')}
                  </p>
                  <p className="text-caption text-slate-muted">Processing complete</p>
                </div>
              )}

              <Button
                variant="primary"
                fullWidth
                size="md"
                className="mt-lg"
                onClick={handleUpload}
                disabled={uploadState !== 'idle'}
              >
                {uploadState === 'done' ? '✓ Uploaded' : t('uploadPrescription')}
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
