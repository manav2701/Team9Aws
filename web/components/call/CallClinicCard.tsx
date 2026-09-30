'use client';

import { useEffect, useRef, useState } from 'react';
import { Phone } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { PatientContext } from '@/lib/types/journey';

// Places a real booking call through M2's Twilio Lambda and shows the live transcript.
// On the Twilio trial account only verified numbers can be called.

type CallStatus = 'idle' | 'starting' | 'dialing' | 'in_progress' | 'success' | 'needs_info' | 'failed';

interface CallLine {
  role: string;
  text: string;
}

const STATUS_LABEL: Record<CallStatus, string> = {
  idle: 'Not started',
  starting: 'Starting the call…',
  dialing: 'Dialing…',
  in_progress: 'On the call',
  success: 'Booked',
  needs_info: 'They need more information',
  failed: 'Not booked',
};

function nextWindows(): string[] {
  // Offer the clinic the next two weekday mornings.
  const out: string[] = [];
  const d = new Date();
  while (out.length < 2) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
    out.push(`${weekday} ${d.toISOString().slice(0, 10)}, 09:00 to 12:00`);
  }
  return out;
}

export function CallClinicCard({ patient }: { patient: PatientContext }) {
  const [toNumber, setToNumber] = useState('');
  const [status, setStatus] = useState<CallStatus>('idle');
  const [lines, setLines] = useState<CallLine[]>([]);
  const [outcome, setOutcome] = useState<Record<string, unknown>>({});
  const [error, setError] = useState('');
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (poll.current) clearInterval(poll.current);
  }, []);

  const start = async () => {
    setError('');
    setLines([]);
    setOutcome({});
    setStatus('starting');
    const res = await fetch('/api/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callType: 'booking',
        toNumber: toNumber.trim(),
        journeyId: `web-${patient.profile.id}`,
        context: {
          provider_name: 'Central Clinic Neurology',
          specialty: 'neurology',
          urgency: 'SOON',
          patient_windows: nextWindows(),
          patient_name: patient.profile.name,
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      setStatus('idle');
      return;
    }
    setStatus('dialing');
    poll.current = setInterval(async () => {
      const r = await fetch(`/api/call/${data.callId}`);
      if (!r.ok) return;
      const call = await r.json();
      setStatus(call.status);
      setLines(call.history);
      setOutcome(call.outcome);
      if (!['dialing', 'in_progress'].includes(call.status) && poll.current) {
        clearInterval(poll.current);
        poll.current = null;
      }
    }, 3000);
  };

  const busy = ['starting', 'dialing', 'in_progress'].includes(status);

  return (
    <Card>
      <CardHeader title="Call the clinic to book" />
      <div className="space-y-md">
        <p className="text-body-sm text-slate-muted">
          Shifa phones the clinic, asks for a neurology slot for {patient.profile.name}, and reports back.
        </p>
        <Input
          id="call-to-number"
          label="Clinic phone (verified number)"
          placeholder="+971501234567"
          value={toNumber}
          onChange={(e) => setToNumber(e.target.value)}
          disabled={busy}
          error={error || undefined}
        />
        <Button onClick={start} loading={busy} disabled={busy || !toNumber.trim()} icon={<Phone size={16} />} fullWidth>
          {busy ? STATUS_LABEL[status] : 'Call now'}
        </Button>
        {status !== 'idle' && (
          <p className="text-body-sm font-medium text-navy" aria-live="polite">
            Status: {STATUS_LABEL[status] ?? status}
          </p>
        )}
        {lines.length > 0 && (
          <div className="max-h-56 overflow-y-auto space-y-1 text-body-sm border-t border-border pt-sm">
            {lines.map((l, i) => (
              <p key={i}>
                <span className="font-medium text-navy">{l.role === 'shifa' ? 'Shifa' : 'Clinic'}:</span>{' '}
                <span className="text-slate">{l.text}</span>
              </p>
            ))}
          </div>
        )}
        {status === 'success' && (
          <p className="text-body-sm text-navy">
            Appointment: {String(outcome.weekday ?? '')} {String(outcome.date ?? '')} at {String(outcome.time ?? '')}
            {outcome.doctor_name ? ` with ${String(outcome.doctor_name)}` : ''}
          </p>
        )}
        {status === 'failed' && outcome.reason ? (
          <p className="text-body-sm text-slate">Reason: {String(outcome.reason).replace('_', ' ')}</p>
        ) : null}
      </div>
    </Card>
  );
}
