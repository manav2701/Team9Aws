'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { ChatMessageBubble, TypingIndicator } from '@/components/intake/ChatMessage';
import { ChatInput } from '@/components/intake/ChatInput';
import { PatientContextCard } from '@/components/intake/PatientContextCard';
import { demoMessages, demoPatient } from '@/lib/utils/demo-data';
import type { ChatMessage } from '@/lib/types/journey';
import { cn } from '@/lib/utils/cn';

export default function IntakePage() {
  const t = useTranslations('intake');
  const [messages, setMessages] = useState<ChatMessage[]>(demoMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);

  const handleSend = (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Simulated response delay — backend not connected yet
    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content:
          'Thank you. I\'ll use that information to help find the right next step for you.\n\nAre you currently experiencing any other symptoms, or is the headache your main concern right now?',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 1500);
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
      <div className="hidden lg:flex flex-col w-80 xl:w-96 border-s border-border bg-subtle shrink-0">
        <PatientContextCard patient={demoPatient} />
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
          <PatientContextCard patient={demoPatient} />
        </div>
      </div>
    </div>
  );
}
