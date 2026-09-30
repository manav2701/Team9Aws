'use client';

import { useState, useRef, type KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Send, Mic, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled = false, placeholder }: ChatInputProps) {
  const t = useTranslations('intake');
  const [value, setValue] = useState('');
  const [voiceState] = useState<VoiceState>('idle');
  const [attachment, setAttachment] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file.name);
    }
  };

  return (
    <div className="bg-card border-t border-border p-lg safe-bottom">
      {/* Attachment indicator */}
      {attachment && (
        <div className="flex items-center gap-sm mb-sm px-1">
          <div className="flex items-center gap-sm bg-subtle rounded-sm px-md py-xs text-body-sm text-slate">
            <span>📎</span>
            <span className="truncate max-w-[200px]">{attachment}</span>
            <button
              onClick={() => {
                setAttachment(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="text-slate-muted hover:text-navy ml-1"
              aria-label="Remove attachment"
            >
              <X size={12} />
            </button>
          </div>
          <span className="text-caption text-slate-muted italic">
            Shifa does not medically interpret photos.
          </span>
        </div>
      )}

      <div className="flex items-end gap-sm">
        {/* Attachment button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className={cn(
            'w-10 h-10 rounded-sm flex items-center justify-center shrink-0',
            'text-slate-muted hover:text-navy hover:bg-subtle transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
          aria-label={t('addPhoto')}
        >
          <Plus size={18} aria-hidden="true" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFileSelect}
          aria-label="Upload photo"
        />

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
            placeholder={placeholder ?? t('placeholder')}
            className={cn(
              'w-full px-md py-2.5 rounded-input border border-border bg-subtle',
              'text-body text-navy placeholder:text-slate-muted',
              'resize-none overflow-y-auto',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors'
            )}
            style={{ minHeight: '40px', maxHeight: '160px' }}
            aria-label={t('placeholder')}
          />
        </div>

        {/* Voice button */}
        <VoiceButton state={voiceState} disabled={disabled} />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className={cn(
            'w-10 h-10 rounded-sm flex items-center justify-center shrink-0',
            'bg-primary text-white',
            'hover:bg-primary-dark active:bg-primary-dark transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
          aria-label={t('send')}
        >
          <Send size={16} aria-hidden="true" />
        </button>
      </div>

      <p className="text-caption text-slate-muted text-center mt-sm">{t('disclaimer')}</p>
    </div>
  );
}

interface VoiceButtonProps {
  state: VoiceState;
  disabled?: boolean;
}

function VoiceButton({ state, disabled }: VoiceButtonProps) {
  const t = useTranslations('intake');

  const isListening = state === 'listening';

  return (
    <button
      disabled={disabled}
      className={cn(
        'w-10 h-10 rounded-sm flex items-center justify-center shrink-0',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        isListening
          ? 'bg-emergency text-white'
          : 'text-slate-muted hover:text-navy hover:bg-subtle'
      )}
      aria-label={t('voice')}
      aria-pressed={isListening}
    >
      <Mic size={18} aria-hidden="true" className={isListening ? 'animate-pulse' : ''} />
    </button>
  );
}
