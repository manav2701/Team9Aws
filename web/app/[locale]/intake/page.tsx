'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { ChatMessageBubble, TypingIndicator } from '@/components/intake/ChatMessage';
import { ChatInput } from '@/components/intake/ChatInput';
import { PatientContextCard } from '@/components/intake/PatientContextCard';
import { CallClinicCard } from '@/components/call/CallClinicCard';
import { demoMessages, demoPatient } from '@/lib/utils/demo-data';
import type { ChatMessage, PatientContext } from '@/lib/types/journey';
import { cn } from '@/lib/utils/cn';

// Demo patient in the workshop DynamoDB table (hypertension, amlodipine).
const PATIENT_ID = 'PAT-01';

export default function IntakePage() {
  const t = useTranslations('intake');
  const [messages, setMessages] = useState<ChatMessage[]>(demoMessages.slice(0, 1));
  const [isTyping, setIsTyping] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [patient, setPatient] = useState<PatientContext>(demoPatient);
  const sessionId = useRef(`shifa-${crypto.randomUUID()}`);

  useEffect(() => {
    fetch(`/api/patient/${PATIENT_ID}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p: PatientContext | null) => p && setPatient(p))
      .catch(() => {});
  }, []);

  const handleSend = (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    const reply = (content: string, extra: Partial<ChatMessage> = {}) =>
      setMessages((prev) => [
        ...prev,
        { id: `msg-${Date.now() + 1}`, role: 'assistant', content, timestamp: new Date().toISOString(), ...extra },
      ]);

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        patientId: PATIENT_ID,
        sessionId: sessionId.current,
        history: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? 'The agent did not respond.');
        reply(data.reply, { isRefusal: data.refused, isEmergency: data.urgency === 'EMERGENCY' });
      })
      .catch((err: Error) => reply(err.message))
      .finally(() => setIsTyping(false));
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] bg-app overflow-hidden">
      {/* ── Main chat column ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Chat header */}
        <div className="bg-card border-b border-border px-lg py-md flex items-center justify-between shrink-0">
          <h1 className="text-h4 font-semibold text-navy">{t('title')}</h1>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto px-lg py-xl space-y-xl"
          aria-live="polite"
          aria-label="Conversation"
        >
          {messages.map((msg) => (
            <ChatMessageBubble key={msg.id} message={msg} />
          ))}
          {isTyping && <TypingIndicator />}
        </div>

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={isTyping} />
      </div>

      {/* ── Desktop: patient context sidebar ── */}
      <div className="hidden lg:flex flex-col w-80 xl:w-96 border-s border-border bg-subtle shrink-0 overflow-y-auto">
        <PatientContextCard patient={patient} />
        <div className="px-lg pb-lg">
          <CallClinicCard patient={patient} />
        </div>
      </div>

      {/* ── Mobile: collapsible context panel ── */}
      <div className="lg:hidden border-t border-border bg-card shrink-0">
        <button
          className="w-full flex items-center justify-between px-lg py-md text-body-sm font-medium text-navy"
          onClick={() => setContextOpen((o) => !o)}
          aria-expanded={contextOpen}
          aria-controls="mobile-context"
        >
          {t('patientContext.title')}
          <ChevronDown
            size={16}
            className={cn('text-slate-muted transition-transform', contextOpen && 'rotate-180')}
            aria-hidden="true"
          />
        </button>
        <div
          id="mobile-context"
          className={cn(
            'overflow-hidden transition-all duration-200',
            contextOpen ? 'max-h-96 overflow-y-auto' : 'max-h-0'
          )}
        >
          <PatientContextCard patient={patient} />
          <div className="px-lg pb-lg">
            <CallClinicCard patient={patient} />
          </div>
        </div>
      </div>
    </div>
  );
}
