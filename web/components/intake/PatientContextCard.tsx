import { useTranslations } from 'next-intl';
import { User, Pill, AlertCircle, MapPin } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { PatientContext } from '@/lib/types/journey';

interface PatientContextCardProps {
  patient: PatientContext;
}

export function PatientContextCard({ patient }: PatientContextCardProps) {
  const t = useTranslations('intake.patientContext');

  return (
    <div className="h-full overflow-y-auto p-lg space-y-lg">
      <h2 className="text-h4 font-semibold text-navy">{t('title')}</h2>

      {/* Profile */}
      <Card>
        <CardHeader title={t('profile')} />
        <div className="flex items-center gap-md">
          <div
            className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center"
            aria-hidden="true"
          >
            <User size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-body font-medium text-navy">{patient.profile.name}</p>
            {patient.profile.insuranceId && (
              <p className="text-body-sm text-slate-muted">{patient.profile.insuranceId}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Medications */}
      {patient.medications.length > 0 && (
        <Card>
          <CardHeader
            title={t('medications')}
            action={
              <Pill size={16} className="text-slate-muted" aria-hidden="true" />
            }
          />
          <ul className="space-y-sm" role="list">
            {patient.medications.map((med) => (
              <li key={med.name} className="flex items-start justify-between gap-sm">
                <span className="text-body-sm text-navy">{med.name}</span>
                {med.dose && (
                  <Badge variant="muted" className="shrink-0">
                    {med.dose}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Allergies */}
      {patient.allergies.length > 0 && (
        <Card>
          <CardHeader
            title={t('allergies')}
            action={
              <AlertCircle size={16} className="text-warning" aria-hidden="true" />
            }
          />
          <div className="flex flex-wrap gap-xs">
            {patient.allergies.map((allergy) => (
              <Badge key={allergy} variant="warning">
                {allergy}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Current journey */}
      {patient.currentJourneyId && (
        <Card>
          <CardHeader title={t('currentJourney')} />
          <div className="flex items-center gap-sm text-body-sm text-slate">
            <MapPin size={14} className="text-primary" aria-hidden="true" />
            <span>{patient.currentJourneyId}</span>
          </div>
        </Card>
      )}
    </div>
  );
}
