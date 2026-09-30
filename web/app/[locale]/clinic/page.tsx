import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { ChevronRight, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge, UrgencyBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ShifaLogo } from '@/components/ui/ShifaLogo';
import { demoClinicAppointments } from '@/lib/utils/demo-data';

export default async function ClinicDashboard() {
  const t = await getTranslations('clinic');
  const locale = await getLocale();

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-subtle">
      {/* Clinic header — distinct from patient app */}
      <div className="bg-navy">
        <div className="max-w-content mx-auto px-lg md:px-xl 2xl:px-2xl py-lg flex items-center justify-between">
          <div className="flex items-center gap-lg">
            <ShifaLogo
              variant="compact"
              textClassName="[&>span:first-child]:text-white"
            />
            <div className="w-px h-6 bg-white/20" aria-hidden="true" />
            <span className="text-body text-white/80">{t('title')}</span>
          </div>
          <nav className="hidden md:flex items-center gap-lg" aria-label="Clinic navigation">
            <Link
              href={`/${locale}/clinic`}
              className="text-body-sm text-white/80 hover:text-white transition-colors"
            >
              {t('appointments')}
            </Link>
            <Link
              href={`/${locale}/clinic`}
              className="text-body-sm text-white/80 hover:text-white transition-colors"
            >
              {t('patients')}
            </Link>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-content mx-auto px-lg md:px-xl 2xl:px-2xl py-2xl">
        {/* Today header */}
        <div className="flex items-center justify-between mb-2xl">
          <div>
            <h1 className="text-h2 font-bold text-navy">{t('todayTitle')}</h1>
            <div className="flex items-center gap-2 mt-1 text-slate-muted">
              <Calendar size={14} aria-hidden="true" />
              <span className="text-body-sm">{today}</span>
            </div>
          </div>
          <Badge variant="primary">{demoClinicAppointments.length} appointments</Badge>
        </div>

        {/* Appointments table */}
        <Card elevated noPadding>
          <div className="overflow-x-auto">
            <table className="w-full" role="table">
              <thead>
                <tr className="border-b border-border bg-subtle">
                  <th className="text-start px-lg py-md text-body-sm font-semibold text-slate">
                    Patient
                  </th>
                  <th className="text-start px-lg py-md text-body-sm font-semibold text-slate">
                    Time
                  </th>
                  <th className="text-start px-lg py-md text-body-sm font-semibold text-slate">
                    Specialty
                  </th>
                  <th className="text-start px-lg py-md text-body-sm font-semibold text-slate">
                    Urgency
                  </th>
                  <th className="text-start px-lg py-md text-body-sm font-semibold text-slate">
                    Status
                  </th>
                  <th className="px-lg py-md" />
                </tr>
              </thead>
              <tbody>
                {demoClinicAppointments.map((appt) => (
                  <tr
                    key={appt.id}
                    className="border-b border-border last:border-0 hover:bg-subtle/50 transition-colors bg-card"
                  >
                    <td className="px-lg py-md text-body font-medium text-navy">
                      {appt.patientName}
                    </td>
                    <td className="px-lg py-md text-body-sm text-slate font-medium">
                      {appt.time}
                    </td>
                    <td className="px-lg py-md text-body-sm text-slate">{appt.specialty}</td>
                    <td className="px-lg py-md">
                      <UrgencyBadge urgency={appt.urgency} />
                    </td>
                    <td className="px-lg py-md">
                      <Badge variant={appt.status === 'confirmed' ? 'success' : 'warning'}>
                        {appt.status === 'confirmed' ? '✓ Confirmed' : 'Pending'}
                      </Badge>
                    </td>
                    <td className="px-lg py-md text-end">
                      <Link href={`/${locale}/clinic/${appt.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<ChevronRight size={14} />}
                          iconPosition="end"
                        >
                          {t('open')}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
