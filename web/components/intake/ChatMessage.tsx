import { cn } from '@/lib/utils/cn';
import { ShifaLogo } from '@/components/ui/ShifaLogo';
import { AlertTriangle } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '@/lib/types/journey';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessageBubble({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  if (message.isEmergency) {
    return <EmergencyMessage content={message.content} />;
  }

  if (message.isRefusal) {
    return <RefusalMessage content={message.content} />;
  }

  return (
    <div
      className={cn(
        'flex items-end gap-sm',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="shrink-0 mb-1">
          <ShifaLogo variant="icon-only" iconClassName="w-7 h-7" />
        </div>
      )}

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[75%] rounded-card px-lg py-md text-body leading-relaxed',
          isUser
            ? 'bg-primary text-white rounded-br-sm'
            : 'bg-card border border-border text-navy rounded-bl-sm shadow-card'
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <time
          dateTime={message.timestamp}
          className={cn(
            'block text-caption mt-1',
            isUser ? 'text-primary-light' : 'text-slate-muted'
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </time>
      </div>
    </div>
  );
}

// Safety refusal — not an error, a distinct design
function RefusalMessage({ content }: { content: string }) {
  return (
    <div className="flex items-start gap-sm">
      <div className="shrink-0 mt-1">
        <ShifaLogo variant="icon-only" iconClassName="w-7 h-7" />
      </div>
      <div className="max-w-[80%] bg-warning-bg border border-warning/30 rounded-card p-lg">
        <div className="flex items-center gap-sm mb-sm">
          <AlertTriangle size={14} className="text-warning shrink-0" aria-hidden="true" />
          <span className="text-caption font-semibold text-warning uppercase tracking-wide">
            Shifa
          </span>
        </div>
        <p className="text-body-sm text-navy whitespace-pre-wrap leading-relaxed">{content}</p>
        <p className="text-caption text-slate-muted mt-sm">This is not medical advice.</p>
      </div>
    </div>
  );
}

// Emergency — prominent, red-bordered
function EmergencyMessage({ content }: { content: string }) {
  return (
    <div className="flex items-start gap-sm">
      <div className="max-w-[90%] w-full bg-emergency-bg border-2 border-emergency rounded-card p-lg">
        <div className="flex items-center gap-sm mb-sm">
          <AlertTriangle size={16} className="text-emergency shrink-0" aria-hidden="true" />
          <span className="text-body-sm font-bold text-emergency uppercase tracking-wide">
            Emergency
          </span>
        </div>
        <p className="text-body-sm text-navy whitespace-pre-wrap leading-relaxed">{content}</p>
        <div className="mt-md">
          <a
            href="tel:998"
            className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-emergency hover:underline"
          >
            Call 998 — UAE Ambulance
          </a>
        </div>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex items-end gap-sm">
      <ShifaLogo variant="icon-only" iconClassName="w-7 h-7" />
      <div className="bg-card border border-border rounded-card rounded-bl-sm px-lg py-md shadow-card">
        <div className="flex items-center gap-1" aria-label="Shifa is typing">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-slate-muted animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
