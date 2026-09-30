import { useTranslations } from 'next-intl';
import { ShieldCheck, Loader2, AlertCircle, CheckCircle2, XCircle, Info } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';
import type { JourneyInsurance } from '@/lib/types/journey';

interface InsuranceCardProps {
  insurance: JourneyInsurance;
}

const statusConfig = {
  not_started: {
    label: 'Not started',
    badgeVariant: 'muted' as const,
    icon: Info,
    description: 'Insurance pre-approval has not started yet.',
  },
  calling: {
    label: 'Calling insurer',
    badgeVariant: 'info' as const,
    icon: Loader2,
    description: 'Shifa is contacting your insurer to request pre-approval.',
  },
  pending: {
    label: 'Waiting for insurer',
    badgeVariant: 'warning' as const,
    icon: Loader2,
    description: 'Shifa is contacting your insurer to request pre-approval.',
  },
  needs_info: {
    label: 'More information required',
    badgeVariant: 'warning' as const,
    icon: AlertCircle,
    description: 'Your insurer requires additional information.',
  },
  approved: {
    label: 'Approved',
    badgeVariant: 'success' as const,
    icon: CheckCircle2,
    description: 'Your insurance pre-approval has been approved.',
  },
  rejected: {
    label: 'Rejected',
    badgeVariant: 'emergency' as const,
    icon: XCircle,
    description: 'Your insurance pre-approval was not approved.',
  },
};

export function InsuranceCard({ insurance }: InsuranceCardProps) {
  const t = useTranslations('journey');
  const config = statusConfig[insurance.status];
  const StatusIcon = config.icon;
  const isSpinning = insurance.status === 'calling' || insurance.status === 'pending';

  return (
    <Card>
      <CardHeader
        title={t('insurance')}
        action={
          <ShieldCheck size={16} className="text-slate-muted" aria-hidden="true" />
        }
      />

      <div className="flex items-center gap-sm mb-lg">
        <StatusIcon
          size={16}
          className={cn(
            isSpinning ? 'animate-spin text-info' : '',
            insurance.status === 'approved' ? 'text-success' : '',
            insurance.status === 'rejected' ? 'text-emergency' : '',
            insurance.status === 'needs_info' ? 'text-warning' : '',
            insurance.status === 'not_started' ? 'text-slate-muted' : ''
          )}
          aria-hidden="true"
        />
        <Badge variant={config.badgeVariant}>{config.label}</Badge>
      </div>

      <p className="text-body-sm text-slate leading-relaxed mb-lg">{config.description}</p>

      {insurance.status === 'approved' && insurance.approvalRef && (
        <div className="bg-success-bg rounded-sm px-md py-sm mb-lg">
          <p className="text-caption text-slate-muted">Approval reference</p>
          <p className="text-body-sm font-medium text-navy font-mono">{insurance.approvalRef}</p>
        </div>
      )}

      {insurance.status === 'needs_info' && insurance.infoRequired && (
        <div className="bg-warning-bg border border-warning/30 rounded-sm px-md py-sm mb-lg">
          <p className="text-caption font-semibold text-warning mb-1">Information required</p>
          <p className="text-body-sm text-navy">{insurance.infoRequired}</p>
        </div>
      )}

      <Button variant="tertiary" size="sm">
        View details
      </Button>
    </Card>
  );
}
