import { cn } from '@/lib/utils/cn';

export type LogoVariant = 'full' | 'compact' | 'icon-only';

interface ShifaLogoProps {
  variant?: LogoVariant;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

/**
 * ShifaLogo — abstract connected-care symbol + wordmark.
 * Symbol: two overlapping arcs forming a care-connection motif, in Shifa Teal.
 * All SVG, no external assets required.
 */
export function ShifaLogo({
  variant = 'full',
  className,
  iconClassName,
  textClassName,
}: ShifaLogoProps) {
  const showText = variant !== 'icon-only';
  const showTagline = variant === 'full';

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      {/* Abstract connected-care icon */}
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={cn('shrink-0', iconClassName)}
      >
        {/* Outer arc — guidance / journey path */}
        <path
          d="M6 22 C6 12, 14 6, 22 8"
          stroke="#0F766E"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Inner arc — connection / care */}
        <path
          d="M10 26 C10 18, 17 12, 26 14"
          stroke="#0F766E"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Node dots — patient and care */}
        <circle cx="6" cy="22" r="2.5" fill="#0F766E" />
        <circle cx="22" cy="8" r="2.5" fill="#0F766E" />
        <circle cx="26" cy="14" r="2" fill="#CCFBF1" stroke="#0F766E" strokeWidth="1.5" />
        <circle cx="10" cy="26" r="2" fill="#CCFBF1" stroke="#0F766E" strokeWidth="1.5" />
      </svg>

      {showText && (
        <div className={cn('flex flex-col leading-none', textClassName)}>
          <span className="text-h4 font-bold text-navy tracking-tight">Shifa</span>
          {showTagline && (
            <span className="text-caption text-slate-muted font-medium tracking-wide mt-0.5">
              AI Care Coordinator
            </span>
          )}
        </div>
      )}
    </div>
  );
}
