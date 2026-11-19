import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Circle,
  CloudRain,
  Mic,
  ShoppingBag,
  Sprout,
  TrendingUp,
} from 'lucide-react';
import type { BootstrapPayload, FarmerView } from '../types';
import type { Translations } from '../i18n/translations';
import { calculateProfitLoss } from '../utils/agriRules';
import { ResilientImage } from './ResilientImage';

interface OverviewDashboardProps {
  data: BootstrapPayload;
  onNavigate: (view: FarmerView) => void;
  onToggleTask: (taskId: string) => void;
  largeButtons: boolean;
  t: Translations;
}

export function OverviewDashboard({
  data,
  onNavigate,
  onToggleTask,
  largeButtons,
  t,
}: OverviewDashboardProps) {
  const { farmerProfile, weatherByDistrict, alerts, cropTasks, financeEntries, orders, helplineCalls } = data;
  const districtWeather =
    weatherByDistrict.find((w) => w.district === farmerProfile.district) ?? weatherByDistrict[0];
  const primaryAlert = alerts.find((a) => a.district === farmerProfile.district) ?? alerts[0];
  const pnl = calculateProfitLoss(financeEntries);
  const pendingTasks = cropTasks.filter((task) => !task.completed).length;
  const total7dRain = districtWeather
    ? districtWeather.forecast7d.reduce((acc, d) => acc + d.rainMm, 0)
    : 0;

  return (
    <div className="space-y-8">
      {/* Hero Banner Split — Single dominant visual anchor */}
      <section className="grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
        <div className="lg:col-span-7 p-6 lg:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              {farmerProfile.name} · {farmerProfile.village}, {farmerProfile.district} · {farmerProfile.acres} Acres
            </p>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 text-balance leading-tight">
              {t.overviewHeroTitle}
            </h1>
            <p className="text-sm lg:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-2xl">
              {t.overviewHeroSubtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('ai-helpline')}
              className={`inline-flex items-center gap-2 px-5 ${
                largeButtons ? 'py-3.5 text-base' : 'py-2.5 text-sm'
              } font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors whitespace-nowrap`}
            >
              <Mic className="w-4 h-4" aria-hidden="true" />
              <span>Open AI Voice & Crop Doctor</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('marketplace')}
              className={`inline-flex items-center gap-2 px-4 ${
                largeButtons ? 'py-3.5 text-base' : 'py-2.5 text-sm'
              } font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors whitespace-nowrap`}
            >
              <ShoppingBag className="w-4 h-4" aria-hidden="true" />
              <span>Order Farm Inputs</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 relative min-h-56 lg:min-h-full">
          <ResilientImage
            src="/src/assets/images/hero_tamil_farmland_1795098381638.jpg"
            alt="Green rice paddy fields in Tamil Nadu delta at sunrise"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex flex-col justify-end p-5 text-white">
            <p className="text-xs font-medium text-emerald-200">
              {farmerProfile.district} Live Telemetry · {districtWeather?.condition}
            </p>
            <p className="text-lg font-bold font-mono-tabular">
              {districtWeather?.currentTemp}°C · Rain {districtWeather?.rainChancePct}% · Wind {districtWeather?.windKmh} km/h
            </p>
          </div>
        </div>
      </section>

      {/* 4-Column Tabular KPI Strip */}
      <section aria-label="Farm Key Metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-2">
            <span>{t.kpiActiveCrop}</span>
            <Sprout className="w-4 h-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
          </div>
          <p className="text-xl font-bold text-neutral-900 dark:text-neutral-50">{farmerProfile.primaryCrop}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{farmerProfile.soilType}</p>
        </div>

        <div className="bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-2">
            <span>{t.kpiRainfall}</span>
            <CloudRain className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          </div>
          <p className="text-xl font-bold font-mono-tabular text-neutral-900 dark:text-neutral-50">{total7dRain} mm</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Peak {Math.max(...(districtWeather?.forecast7d.map((d) => d.rainMm) ?? [0]))} mm on Friday
          </p>
        </div>

        <div className="bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-2">
            <span>{t.kpiNetProfit}</span>
            <TrendingUp className="w-4 h-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
          </div>
          <p className={`text-xl font-bold font-mono-tabular ${pnl.netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            ₹{pnl.netProfit.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-mono-tabular">
            Income ₹{pnl.totalIncome.toLocaleString('en-IN')} · Expense ₹{pnl.totalExpense.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-2">
            <span>{t.kpiPendingTasks}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
          </div>
          <p className="text-xl font-bold font-mono-tabular text-neutral-900 dark:text-neutral-50">
            {pendingTasks} Due
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {cropTasks.length - pendingTasks} of {cropTasks.length} tasks completed
          </p>
        </div>
      </section>

      {/* Active Weather Advisory Banner (Clean hairline border, no thick left accent border) */}
      {primaryAlert && (
        <section className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{t.weatherAlertHeading} · {primaryAlert.district} · {primaryAlert.severity}</span>
            </div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{primaryAlert.title}</h2>
            <p className="text-sm text-neutral-700 dark:text-neutral-300">{primaryAlert.irrigationAdvice}</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('mandi-schemes')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-neutral-900 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 whitespace-nowrap shrink-0"
          >
            <span>View 7-Day Forecast</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </section>
      )}

      {/* Two-Column Split: Crop Calendar + Recent Activity */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50">{t.cropCalendarHeading}</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Stage-by-stage sowing, fertilizer, irrigation & pest monitoring schedule
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('ai-helpline')}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap"
            >
              Ask Crop AI
            </button>
          </div>

          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800 mt-2">
            {cropTasks.map((task) => (
              <li key={task.id} className="py-3.5 flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => onToggleTask(task.id)}
                  aria-label={`Mark "${task.taskTitle}" as ${task.completed ? 'incomplete' : 'complete'}`}
                  className="mt-0.5 text-emerald-700 dark:text-emerald-400 hover:opacity-80 shrink-0"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5 text-neutral-400" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium ${
                      task.completed
                        ? 'line-through text-neutral-400 dark:text-neutral-500'
                        : 'text-neutral-900 dark:text-neutral-100'
                    }`}
                  >
                    {task.taskTitle}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {task.crop} · {task.stage} · {task.category} · Due <span className="font-mono-tabular">{task.dueDate}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-5 bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50">{t.recentOrdersHeading}</h2>
              <button
                type="button"
                onClick={() => onNavigate('marketplace')}
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap"
              >
                Marketplace
              </button>
            </div>

            <div className="divide-y divide-neutral-200 dark:divide-neutral-800 mt-2">
              {orders.slice(0, 3).map((ord) => (
                <div key={ord.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                      {ord.items.map((i) => `${i.productName} ×${i.quantity}`).join(', ')}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      <span className="font-mono-tabular">{ord.id}</span> · {ord.shopName} · {ord.status}
                    </p>
                  </div>
                  <span className="text-sm font-semibold font-mono-tabular text-neutral-900 dark:text-neutral-100 shrink-0">
                    ₹{ord.total.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}

              {helplineCalls.slice(0, 2).map((call) => (
                <div key={call.id} className="py-3">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {call.querySummary}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {call.callType} · {call.language.toUpperCase()} · {call.status}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onNavigate('mandi-schemes')}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-center"
            >
              Mandi & Subsidies
            </button>
            <button
              type="button"
              onClick={() => onNavigate('finance-services')}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-center"
            >
              Tractor & Labour
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
