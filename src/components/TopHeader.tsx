import { Menu, PhoneCall, ShoppingCart } from 'lucide-react';
import type { FarmerView, UserRole } from '../types';
import type { Translations } from '../i18n/translations';

interface TopHeaderProps {
  role: UserRole;
  farmerView: FarmerView;
  district: string;
  cartCount: number;
  onOpenMobileMenu: () => void;
  onOpenHelpline: () => void;
  onOpenCart: () => void;
  t: Translations;
}

export function TopHeader({
  role,
  farmerView,
  district,
  cartCount,
  onOpenMobileMenu,
  onOpenHelpline,
  onOpenCart,
  t,
}: TopHeaderProps) {
  const sectionName = role === 'farmer' ? t.nav[farmerView] : `${t.roles[role]} Portal`;

  return (
    <header className="h-16 bg-white dark:bg-[#121A15] border-b border-neutral-200 dark:border-neutral-800 px-4 lg:px-8 flex items-center justify-between gap-6 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm min-w-0">
          <span className="font-semibold text-neutral-900 dark:text-neutral-100 whitespace-nowrap shrink-0">
            {t.roles[role]}
          </span>
          <span className="text-neutral-400" aria-hidden="true">/</span>
          <span className="text-neutral-700 dark:text-neutral-300 truncate">{sectionName}</span>
          <span className="hidden sm:inline text-neutral-400" aria-hidden="true">·</span>
          <span className="hidden sm:inline text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
            {district}
          </span>
        </nav>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {role === 'farmer' && (
          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`${t.cartLabel} (${cartCount} items)`}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 hover:border-emerald-600 transition-colors whitespace-nowrap shrink-0"
          >
            <ShoppingCart className="w-4 h-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
            <span>{t.cartLabel}</span>
            <span className="font-mono-tabular text-emerald-700 dark:text-emerald-400">({cartCount})</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenHelpline}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors whitespace-nowrap shrink-0"
        >
          <PhoneCall className="w-4 h-4" aria-hidden="true" />
          <span>{t.askHelplineCta}</span>
        </button>
      </div>
    </header>
  );
}
