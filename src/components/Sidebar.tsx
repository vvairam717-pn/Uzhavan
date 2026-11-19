import {
  CloudSun,
  FileDown,
  LayoutDashboard,
  MessageSquareHeart,
  Mic,
  Moon,
  ShieldCheck,
  ShoppingBag,
  Stethoscope,
  Store,
  Sun,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import type { FarmerView, LanguageCode, UserRole } from '../types';
import type { Translations } from '../i18n/translations';

interface SidebarProps {
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
  farmerView: FarmerView;
  onFarmerViewChange: (view: FarmerView) => void;
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  largeButtons: boolean;
  onToggleLargeButtons: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  t: Translations;
}

const NAV_ICONS: Record<FarmerView, typeof LayoutDashboard> = {
  overview: LayoutDashboard,
  'ai-helpline': Mic,
  marketplace: ShoppingBag,
  'mandi-schemes': CloudSun,
  'finance-services': Wallet,
  'community-support': Users,
};

export function Sidebar({
  role,
  onRoleChange,
  farmerView,
  onFarmerViewChange,
  language,
  onLanguageChange,
  darkMode,
  onToggleDarkMode,
  largeButtons,
  onToggleLargeButtons,
  mobileOpen,
  onCloseMobile,
  t,
}: SidebarProps) {
  const farmerNavKeys: FarmerView[] = [
    'overview',
    'ai-helpline',
    'marketplace',
    'mandi-schemes',
    'finance-services',
    'community-support',
  ];

  const roleOptions: Array<{ id: UserRole; icon: typeof Users }> = [
    { id: 'farmer', icon: Users },
    { id: 'seller', icon: Store },
    { id: 'expert', icon: Stethoscope },
    { id: 'admin', icon: ShieldCheck },
  ];

  const content = (
    <div className="flex flex-col h-full bg-white dark:bg-[#121A15] border-r border-neutral-200 dark:border-neutral-800 w-64">
      <div className="h-16 px-5 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <span className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-50 whitespace-nowrap">
          {t.brandName}
        </span>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
        <label
          htmlFor="workspace-role-select"
          className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2"
        >
          {t.roleLabel}
        </label>
        <div className="grid grid-cols-2 gap-1.5" role="group" aria-label={t.roleLabel}>
          {roleOptions.map((item) => {
            const Icon = item.icon;
            const active = role === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onRoleChange(item.id);
                  onCloseMobile();
                }}
                className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-emerald-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{t.roles[item.id]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1" aria-label="Primary Workspace Navigation">
        {role === 'farmer' ? (
          farmerNavKeys.map((key) => {
            const Icon = NAV_ICONS[key];
            const active = farmerView === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  onFarmerViewChange(key);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3 ${
                  largeButtons ? 'py-3.5 text-base' : 'py-2.5 text-sm'
                } font-medium rounded-lg text-left transition-colors ${
                  active
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/70 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{t.nav[key]}</span>
              </button>
            );
          })
        ) : (
          <div className="px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400">
            <div className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
              <MessageSquareHeart className="w-4 h-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
              <span>{t.roles[role]} Portal</span>
            </div>
            <p className="text-xs leading-relaxed">
              Manage active queues, approvals, and live farmer requests in real time.
            </p>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 space-y-3 shrink-0">
        <div>
          <span className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
            {t.languageLabel}
          </span>
          <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg">
            {(
              [
                { code: 'ta', label: 'தமிழ்' },
                { code: 'en', label: 'EN' },
                { code: 'hi', label: 'हिन्दी' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.code}
                type="button"
                onClick={() => onLanguageChange(opt.code)}
                className={`py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  language === opt.code
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label={darkMode ? t.lightMode : t.darkMode}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 whitespace-nowrap"
          >
            {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{darkMode ? t.lightMode : t.darkMode}</span>
          </button>
          <button
            type="button"
            onClick={onToggleLargeButtons}
            aria-pressed={largeButtons}
            title={t.largeControls}
            className={`px-3 py-2 text-xs font-medium rounded-lg border whitespace-nowrap ${
              largeButtons
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
            }`}
          >
            A+
          </button>
        </div>

        <a
          href="/api/pitch-deck.pptx"
          download="Uzhavan_AI_Pitch_Deck.pptx"
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-emerald-700/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors whitespace-nowrap"
        >
          <FileDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Download Pitch Deck (.pptx)</span>
        </a>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block lg:sticky lg:top-0 lg:h-screen shrink-0">{content}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 h-full">{content}</aside>
        </div>
      )}
    </>
  );
}
