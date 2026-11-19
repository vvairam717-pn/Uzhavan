import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CloudRain,
  ExternalLink,
  FileCheck2,
  Search,
  Sun,
  TrendingDown,
  TrendingUp,
  Wind,
} from 'lucide-react';
import type { BootstrapPayload, FarmerEligibilityInput } from '../types';
import type { Translations } from '../i18n/translations';
import { filterMandiPrices, matchEligibleSchemes, recommendSellingAction } from '../utils/agriRules';

interface MandiAndSchemesViewProps {
  data: BootstrapPayload;
  t: Translations;
}

export function MandiAndSchemesView({ data, t }: MandiAndSchemesViewProps) {
  const { weatherByDistrict, alerts, mandiPrices, schemes, farmerProfile } = data;

  const [weatherDistrict, setWeatherDistrict] = useState(farmerProfile.district);
  const [mandiDistrict, setMandiDistrict] = useState('All');
  const [mandiQuery, setMandiQuery] = useState('');

  // Eligibility checker inputs
  const [eligibility, setEligibility] = useState<FarmerEligibilityInput>({
    acres: farmerProfile.acres,
    crop: farmerProfile.primaryCrop,
    district: farmerProfile.district,
    category: 'Small / Marginal',
  });

  const activeWeather =
    weatherByDistrict.find((w) => w.district === weatherDistrict) ?? weatherByDistrict[0];
  const filteredPrices = useMemo(
    () => filterMandiPrices(mandiPrices, mandiDistrict, mandiQuery),
    [mandiPrices, mandiDistrict, mandiQuery]
  );
  const matchedSchemes = useMemo(() => matchEligibleSchemes(eligibility, schemes), [eligibility, schemes]);

  function renderSparkline(values: number[]) {
    if (values.length < 2) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const points = values
      .map((val, idx) => {
        const x = (idx / (values.length - 1)) * 76 + 2;
        const y = 22 - ((val - min) / range) * 18;
        return `${x},${y}`;
      })
      .join(' ');
    const up = values[values.length - 1] >= values[0];
    return (
      <svg width="80" height="24" viewBox="0 0 80 24" className="inline-block" aria-hidden="true">
        <polyline
          fill="none"
          stroke={up ? '#15803d' : '#dc2626'}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  }

  return (
    <div className="space-y-8">
      {/* Weather Intelligence & 7-Day Forecast */}
      <section className="bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">{t.mandiTitle}</h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              District-level rainfall, temperature, wind alerts & AGMARKNET / e-NAM mandi price comparison
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="weather-dist" className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Weather District:
            </label>
            <select
              id="weather-dist"
              value={weatherDistrict}
              onChange={(e) => setWeatherDistrict(e.target.value)}
              className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-sm"
            >
              {weatherByDistrict.map((w) => (
                <option key={w.district} value={w.district}>
                  {w.district}
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeWeather && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-4 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/50 space-y-2">
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Current · {activeWeather.district}
              </p>
              <p className="text-3xl font-bold font-mono-tabular text-neutral-900 dark:text-neutral-50">
                {activeWeather.currentTemp}°C
              </p>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{activeWeather.condition}</p>
              <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400 pt-2">
                <span className="inline-flex items-center gap-1">
                  <CloudRain className="w-3.5 h-3.5" aria-hidden="true" />
                  Rain {activeWeather.rainChancePct}%
                </span>
                <span className="inline-flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5" aria-hidden="true" />
                  {activeWeather.windKmh} km/h
                </span>
                <span>Humidity {activeWeather.humidityPct}%</span>
              </div>
            </div>

            <div className="lg:col-span-8 flex overflow-x-auto pb-1 sm:grid sm:grid-cols-4 md:grid-cols-7 gap-2.5">
              {activeWeather.forecast7d.map((day) => (
                <div
                  key={day.day}
                  className="min-w-[84px] sm:min-w-0 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between text-center shrink-0"
                >
                  <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">{day.day}</span>
                  <div className="my-2 flex justify-center">
                    {day.rainMm > 10 ? (
                      <CloudRain className="w-5 h-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                    ) : (
                      <Sun className="w-5 h-5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                    )}
                  </div>
                  <p className="text-xs font-mono-tabular font-semibold text-neutral-900 dark:text-neutral-100">
                    {day.tempMax}°/{day.tempMin}°
                  </p>
                  <p className="text-[11px] font-mono-tabular text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {day.rainMm}mm
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {alerts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {alerts.map((al) => (
              <div
                key={al.id}
                className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/70 bg-amber-50/50 dark:bg-amber-950/20 space-y-1"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{al.district} · {al.type} {al.severity}</span>
                </div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{al.title}</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-300">{al.message}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* AGMARKNET / e-NAM Live Mandi Prices */}
      <section className="bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
              AGMARKNET & e-NAM Daily Mandi Prices
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Compare modal rates against MSP with 7-day trend & selling guidance
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <label htmlFor="mandi-search" className="sr-only">Search crop or mandi</label>
              <input
                id="mandi-search"
                type="search"
                value={mandiQuery}
                onChange={(e) => setMandiQuery(e.target.value)}
                placeholder="Search Paddy, Turmeric..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              />
            </div>
            <select
              aria-label="Filter mandi by district"
              value={mandiDistrict}
              onChange={(e) => setMandiDistrict(e.target.value)}
              className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs"
            >
              <option value="All">All Districts</option>
              {Array.from(new Set(mandiPrices.map((m) => m.district))).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400">
                <th className="py-2.5 pr-4 font-semibold">Crop & Variety</th>
                <th className="py-2.5 pr-4 font-semibold">Mandi / District</th>
                <th className="py-2.5 pr-4 font-semibold text-right">Modal (₹/Q)</th>
                <th className="py-2.5 pr-4 font-semibold text-right">Min – Max</th>
                <th className="py-2.5 pr-4 font-semibold">7-Day Trend</th>
                <th className="py-2.5 pr-4 font-semibold">Selling Guidance</th>
                <th className="py-2.5 font-semibold text-right">Buyer Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {filteredPrices.map((row) => {
                const advice = recommendSellingAction(row);
                return (
                  <tr key={row.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/40">
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {row.crop} ({row.tamilCrop})
                      </p>
                      <p className="text-neutral-500 dark:text-neutral-400">{row.variety}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-neutral-900 dark:text-neutral-100">{row.mandi}</p>
                      <p className="text-neutral-500 dark:text-neutral-400">{row.district}</p>
                    </td>
                    <td className="py-3 pr-4 text-right font-mono-tabular font-bold text-neutral-900 dark:text-neutral-50">
                      ₹{row.modalPrice.toLocaleString('en-IN')}
                      {row.mspPrice > 0 && (
                        <span className="block text-[11px] font-normal text-neutral-500 dark:text-neutral-400">
                          MSP ₹{row.mspPrice}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono-tabular text-neutral-600 dark:text-neutral-300">
                      ₹{row.minPrice.toLocaleString('en-IN')} – ₹{row.maxPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        {renderSparkline(row.history7d)}
                        <span
                          className={`inline-flex items-center gap-0.5 font-mono-tabular font-semibold ${
                            advice.deltaPct7d >= 0
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {advice.deltaPct7d >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {advice.deltaPct7d > 0 ? `+${advice.deltaPct7d}%` : `${advice.deltaPct7d}%`}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 max-w-xs">
                      <p className="font-semibold text-emerald-700 dark:text-emerald-400">{advice.action}</p>
                      <p className="text-neutral-500 dark:text-neutral-400">{advice.rationale}</p>
                    </td>
                    <td className="py-3 text-right font-mono-tabular text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                      {row.buyerContact}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Government Schemes Eligibility Checker */}
      <section className="bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 space-y-5">
        <div className="border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">{t.schemesTitle}</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Central & Tamil Nadu agricultural subsidies, required documents checklist, and application steps
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
          <div>
            <label htmlFor="sch-acres" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
              Land Size (Acres)
            </label>
            <input
              id="sch-acres"
              type="number"
              step="0.5"
              min="0.1"
              value={eligibility.acres}
              onChange={(e) =>
                setEligibility((prev) => ({ ...prev, acres: Math.max(0.1, Number(e.target.value) || 0.5) }))
              }
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm font-mono-tabular"
            />
          </div>

          <div>
            <label htmlFor="sch-crop" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
              Primary Crop
            </label>
            <select
              id="sch-crop"
              value={eligibility.crop}
              onChange={(e) => setEligibility((prev) => ({ ...prev, crop: e.target.value }))}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
            >
              {['Paddy', 'Coconut', 'Banana', 'Turmeric', 'Groundnut', 'Cotton', 'Maize', 'Vegetables'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sch-dist" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
              District
            </label>
            <select
              id="sch-dist"
              value={eligibility.district}
              onChange={(e) => setEligibility((prev) => ({ ...prev, district: e.target.value }))}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
            >
              {['Thanjavur', 'Coimbatore', 'Madurai', 'Erode', 'Salem', 'Trichy', 'Tiruvarur'].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sch-cat" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
              Farmer Category
            </label>
            <select
              id="sch-cat"
              value={eligibility.category}
              onChange={(e) =>
                setEligibility((prev) => ({
                  ...prev,
                  category: e.target.value as FarmerEligibilityInput['category'],
                }))
              }
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
            >
              <option value="Small / Marginal">Small / Marginal (&lt; 5 ac)</option>
              <option value="Medium">Medium Farmer</option>
              <option value="Women Farmer">Women Farmer</option>
              <option value="Tenant">Tenant / Lessee</option>
              <option value="All">Show All Categories</option>
            </select>
          </div>
        </div>

        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          {matchedSchemes.length} Eligible Schemes Found for {eligibility.acres} Acres · {eligibility.crop} · {eligibility.district}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {matchedSchemes.map(({ scheme, matchReasons }) => (
            <article
              key={scheme.id}
              className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      {scheme.authority} Govt · {scheme.category} · Deadline{' '}
                      <span className="font-mono-tabular">{scheme.deadline}</span>
                    </p>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-50 mt-0.5">
                      {scheme.name}
                    </h3>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">{scheme.tamilName}</p>
                  </div>
                  <span className="font-mono-tabular text-sm font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                    Up to ₹{scheme.maxBenefitInr.toLocaleString('en-IN')}
                  </span>
                </div>

                <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  {scheme.subsidySummary} — {scheme.description}
                </p>

                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Match: {matchReasons.join(' · ')}
                </p>

                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1 mb-1">
                      <FileCheck2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                      <span>Required Documents</span>
                    </p>
                    <ul className="space-y-0.5 text-neutral-600 dark:text-neutral-400">
                      {scheme.documents.map((doc) => (
                        <li key={doc}>• {doc}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-800 dark:text-neutral-200 mb-1">Application Steps</p>
                    <ol className="space-y-0.5 text-neutral-600 dark:text-neutral-400">
                      {scheme.steps.map((st, idx) => (
                        <li key={st}>
                          {idx + 1}. {st}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={scheme.officialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  <span>Visit Official Government Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
