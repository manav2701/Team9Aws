import { getTranslations } from 'next-intl/server';
import { JourneyTracker } from '@/components/journey/JourneyTracker';
import { AppointmentCard } from '@/components/journey/AppointmentCard';
import { InsuranceCard } from '@/components/journey/InsuranceCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { demoJourney } from '@/lib/utils/demo-data';
import type { JourneyState } from '@/lib/types/journey';

const JOURNEY_STATE_LABELS: Record<JourneyState, string> = {
  Intake: 'Intake',
  Triaged: 'Triaged',
  Emergency: 'Emergency',
  BookingCall: 'Booking call',
  Booked: 'Booked',
  VisitDone: 'Visit done',
  InsuranceCall: 'Insurance call',
  NeedsInfo: 'Needs information',
  Approved: 'Approved',
  PharmacyOrder: 'Pharmacy order',
  Delivered: 'Delivered',
};

interface JourneyPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function JourneyPage({ params }: JourneyPageProps) {
  const { id } = await params;
  void id; // Backend not connected yet — using demo data

  const t = await getTranslations('journey');
  const journey = demoJourney;

  const urgencyVariant = ({
    LOW: 'success',
    MEDIUM: 'warning',
    HIGH: 'info',
    EMERGENCY: 'emergency',
  } as const)[journey.urgency ?? 'LOW'];

  return (
    <div className="bg-app min-h-screen">
      {/* Page header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-content mx-auto px-lg md:px-xl 2xl:px-2xl py-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-h2 font-bold text-navy">{t('title')}</h1>
              <p className="text-body-sm text-slate-muted mt-1 font-mono">{journey.id}</p>
            </div>
            {journey.urgency && (
              <Badge variant={urgencyVariant}>{journey.urgency}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="max-w-content mx-auto px-lg md:px-xl 2xl:px-2xl py-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2xl">
          {/* Left: tracker */}
          <div className="lg:col-span-1">
            <Card elevated>
              <CardHeader title={t('title')} />
              <JourneyTracker currentState={journey.state} />
            </Card>
          </div>

          {/* Right: detail cards */}
          <div className="lg:col-span-2 space-y-lg">
            {/* Current state summary */}
            <Card elevated>
              <CardHeader title={t('currentStep')} />
              <p className="text-body-lg font-semibold text-navy mb-sm">
                {JOURNEY_STATE_LABELS[journey.state]}
              </p>
              <p className="text-body-sm text-slate-muted">
                {journey.state === 'Booked'
                  ? 'Your appointment has been confirmed. Shifa is monitoring the next steps.'
                  : 'Shifa is coordinating the next step in your care journey.'}
              </p>
            </Card>

            {/* Appointment */}
            {journey.appointment && (
              <AppointmentCard appointment={journey.appointment} />
            )}

            {/* Insurance */}
            {journey.insurance && (
              <InsuranceCard insurance={journey.insurance} />
            )}

            {/* Prescription placeholder */}
            {journey.prescription && (
              <Card>
                <CardHeader title={t('prescription')} />
                <p className="text-body-sm text-slate-muted">
                  {journey.prescription.uploaded
                    ? 'Prescription uploaded and being processed.'
                    : 'Prescription will be uploaded after the doctor visit.'}
                </p>
              </Card>
            )}

            {/* Delivery placeholder */}
            {journey.delivery && (
              <Card>
                <CardHeader title={t('delivery')} />
                <p className="text-body-sm text-slate-muted">
                  {journey.delivery.status === 'not_started'
                    ? 'Delivery will be arranged after prescription approval.'
                    : journey.delivery.status}
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
