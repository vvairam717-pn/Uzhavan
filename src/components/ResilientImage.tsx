import { useState } from 'react';
import { Droplets, FlaskConical, Leaf, ShieldCheck, Sprout, Wrench } from 'lucide-react';

interface ResilientImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

function getCategoryIcon(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes('sprayer') || lower.includes('pump') || lower.includes('tractor')) {
    return Wrench;
  }
  if (lower.includes('drip') || lower.includes('irrigation')) {
    return Droplets;
  }
  if (lower.includes('npk') || lower.includes('dap') || lower.includes('urea')) {
    return FlaskConical;
  }
  if (lower.includes('neem') || lower.includes('protection')) {
    return ShieldCheck;
  }
  if (lower.includes('organic') || lower.includes('compost')) {
    return Leaf;
  }
  return Sprout;
}

export function ResilientImage({ src, alt, className = '', fallbackLabel }: ResilientImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    const label = fallbackLabel || alt;
    const Icon = getCategoryIcon(label);
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-stone-100 via-emerald-50/70 to-stone-200/70 dark:from-neutral-900 dark:via-emerald-950/30 dark:to-neutral-900 text-emerald-800 dark:text-emerald-300 p-5 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <div className="w-11 h-11 rounded-xl border border-emerald-200 dark:border-emerald-800/70 bg-white/80 dark:bg-neutral-900/80 flex items-center justify-center mb-2">
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
        <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 leading-snug line-clamp-2 max-w-[180px]">
          {label}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
