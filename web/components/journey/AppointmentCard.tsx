import { useTranslations } from 'next-intl';
import { Calendar, Clock, MapPin, User, Stethoscope } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { JourneyAppointment } from '@/lib/types/journey';

interface AppointmentCardProps {
  appointment: JourneyAppointment;
}

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  const t = useTranslations('journey');

  const statusVariant = {
    confirmed: 'success' as const,
    pending: 'warning' as const,
    cancelled: 'emergency' as const,
  }[appointment.status];

  const date = new Date(appointment.date);
  const formattedDate = date.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <Card elevated>
      <CardHeader
        title={t('appointment')}
        action={
          <Badge variant={statusVariant}>
            {appointment.status === 'confirmed' ? '✓ Confirmed' : appointment.status}
          </Badge>
        }
      />

      {/* Doctor + specialty */}
      <div className="flex items-center gap-md mb-lg">
        <div
          className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center"
          aria-hidden="true"
        >
          <User size={18} className="text-primary" />
        </div>
        <div>
          <p className="text-body font-semibold text-navy">{appointment.doctorName}</p>
          <p className="text-body-sm text-slate-muted flex items-center gap-1">
            <Stethoscope size={12} aria-hidden="true" />
            {appointment.specialty}
          </p>
        </div>
      </div>

      {/* Date + time */}
      <div className="grid grid-cols-2 gap-md mb-lg">
        <div className="flex items-center gap-sm text-body-sm text-slate">
          <Calendar size={14} className="text-primary" aria-hidden="true" />
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center gap-sm text-body-sm text-slate">
          <Clock size={14} className="text-primary" aria-hidden="true" />
          <span className="font-medium">{appointment.time}</span>
        </div>
      </div>

      {/* Clinic + location */}
      <div className="flex items-start gap-sm text-body-sm text-slate mb-lg">
        <MapPin size={14} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-medium text-navy">{appointment.clinicName}</p>
          <p className="text-slate-muted">{appointment.location}</p>
        </div>
      </div>

      {/* Confirmation reference */}
      <div className="bg-subtle rounded-sm px-md py-sm">
        <p className="text-caption text-slate-muted">Confirmation reference</p>
        <p className="text-body-sm font-medium text-navy font-mono">{appointment.confirmationRef}</p>
      </div>
    </Card>
  );
}
