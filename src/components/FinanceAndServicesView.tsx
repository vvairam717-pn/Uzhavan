import { useMemo, useState, type FormEvent } from 'react';
import { Calendar, Plus, Tractor, Trash2, Users, Wallet } from 'lucide-react';
import type { BootstrapPayload, FinanceEntry, LabourBooking, RentalBooking } from '../types';
import type { Translations } from '../i18n/translations';
import { calculateProfitLoss } from '../utils/agriRules';
import { ResilientImage } from './ResilientImage';

interface FinanceAndServicesViewProps {
  data: BootstrapPayload;
  onFinanceAdded: (entry: FinanceEntry) => void;
  onFinanceDeleted: (id: string) => void;
  onRentalBooked: (booking: RentalBooking) => void;
  onLabourBooked: (booking: LabourBooking) => void;
  t: Translations;
}

export function FinanceAndServicesView({
  data,
  onFinanceAdded,
  onFinanceDeleted,
  onRentalBooked,
  onLabourBooked,
  t,
}: FinanceAndServicesViewProps) {
  const { financeEntries, equipment, rentalBookings, labourCrews, labourBookings, farmerProfile } = data;

  // Finance form
  const [finType, setFinType] = useState<'expense' | 'income'>('expense');
  const [finCat, setFinCat] = useState<FinanceEntry['category']>('Fertilizer');
  const [finCrop, setFinCrop] = useState(farmerProfile.primaryCrop);
  const [finDesc, setFinDesc] = useState('');
  const [finAmount, setFinAmount] = useState('');
  const [finError, setFinError] = useState('');
  const [finSubmitting, setFinSubmitting] = useState(false);

  // Rental booking state
  const [selectedEqId, setSelectedEqId] = useState(equipment[0]?.id || '');
  const [rentalDate, setRentalDate] = useState('2026-11-23');
  const [rentalHours, setRentalHours] = useState(4);
  const [rentalStatus, setRentalStatus] = useState('');

  // Labour booking state
  const [selectedCrewId, setSelectedCrewId] = useState(labourCrews[0]?.id || '');
  const [labourDate, setLabourDate] = useState('2026-11-24');
  const [workersCount, setWorkersCount] = useState(6);
  const [labourStatus, setLabourStatus] = useState('');

  const pnl = useMemo(() => calculateProfitLoss(financeEntries), [financeEntries]);

  async function handleAddFinance(e: FormEvent) {
    e.preventDefault();
    const amt = Number(finAmount);
    if (!finDesc.trim() || !Number.isFinite(amt) || amt <= 0) {
      setFinError('Enter a valid description and positive amount.');
      return;
    }
    setFinError('');
    setFinSubmitting(true);
    try {
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: finType,
          category: finCat,
          crop: finCrop,
          description: finDesc.trim(),
          amount: amt,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Could not save entry');
      onFinanceAdded(payload.entry);
      setFinDesc('');
      setFinAmount('');
    } catch (err) {
      setFinError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setFinSubmitting(false);
    }
  }

  async function handleDeleteFinance(id: string) {
    const res = await fetch(`/api/finance/${id}`, { method: 'DELETE' });
    if (res.ok) {
      onFinanceDeleted(id);
    }
  }

  async function handleBookRental(e: FormEvent) {
    e.preventDefault();
    if (!selectedEqId || !rentalDate || rentalHours <= 0) return;
    setRentalStatus('');
    const res = await fetch('/api/rentals/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        equipmentId: selectedEqId,
        farmerName: farmerProfile.name,
        district: farmerProfile.district,
        date: rentalDate,
        hours: rentalHours,
      }),
    });
    const payload = await res.json();
    if (res.ok) {
      onRentalBooked(payload.booking);
      setRentalStatus(`Booking ${payload.booking.id} submitted for ${payload.booking.date}.`);
    }
  }

  async function handleBookLabour(e: FormEvent) {
    e.preventDefault();
    if (!selectedCrewId || !labourDate || workersCount <= 0) return;
    setLabourStatus('');
    const res = await fetch('/api/labour/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        crewId: selectedCrewId,
        farmerName: farmerProfile.name,
        district: farmerProfile.district,
        date: labourDate,
        workersRequested: workersCount,
      }),
    });
    const payload = await res.json();
    if (res.ok) {
      onLabourBooked(payload.booking);
      setLabourStatus(`Crew booking confirmed for ${payload.booking.workersRequested} workers.`);
    }
  }

  return (
    <div className="space-y-8">
      {/* Farmer Financial Management */}
      <section className="bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
              <span>{t.financeTitle}</span>
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Track seed, fertilizer, labour & irrigation costs against harvest sales and subsidies
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 block">Total Income</span>
              <span className="font-mono-tabular font-bold text-emerald-700 dark:text-emerald-400">
                ₹{pnl.totalIncome.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 block">Total Expense</span>
              <span className="font-mono-tabular font-bold text-neutral-900 dark:text-neutral-100">
                ₹{pnl.totalExpense.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 block">Net Profit / Loss</span>
              <span
                className={`font-mono-tabular font-bold ${
                  pnl.netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                ₹{pnl.netProfit.toLocaleString('en-IN')} ({pnl.roiPercent}% ROI)
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleAddFinance} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <div>
            <label htmlFor="fin-type" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
              Type
            </label>
            <select
              id="fin-type"
              value={finType}
              onChange={(e) => {
                const next = e.target.value as 'expense' | 'income';
                setFinType(next);
                setFinCat(next === 'income' ? 'Harvest Sale' : 'Fertilizer');
              }}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div>
            <label htmlFor="fin-cat" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
              Category
            </label>
            <select
              id="fin-cat"
              value={finCat}
              onChange={(e) => setFinCat(e.target.value as FinanceEntry['category'])}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
            >
              <option value="Seeds">Seeds</option>
              <option value="Fertilizer">Fertilizer</option>
              <option value="Labour">Labour</option>
              <option value="Irrigation">Irrigation</option>
              <option value="Equipment">Equipment</option>
              <option value="Harvest Sale">Harvest Sale</option>
              <option value="Subsidy">Subsidy</option>
            </select>
          </div>

          <div>
            <label htmlFor="fin-crop" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
              Crop
            </label>
            <input
              id="fin-crop"
              type="text"
              value={finCrop}
              onChange={(e) => setFinCrop(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
            />
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="fin-desc" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
              Description
            </label>
            <input
              id="fin-desc"
              type="text"
              value={finDesc}
              onChange={(e) => setFinDesc(e.target.value)}
              placeholder="e.g., 2 bags Potash + sprayer fuel"
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label htmlFor="fin-amt" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                Amount (₹)
              </label>
              <input
                id="fin-amt"
                type="number"
                min="1"
                value={finAmount}
                onChange={(e) => setFinAmount(e.target.value)}
                placeholder="1500"
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm font-mono-tabular"
              />
            </div>
            <button
              type="submit"
              disabled={finSubmitting}
              aria-label="Add finance entry"
              className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold inline-flex items-center gap-1 self-end h-[38px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
        </form>

        {finError && (
          <p role="alert" className="text-xs text-red-600 dark:text-red-400">
            {finError}
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400">
                <th className="py-2 pr-4 font-semibold">Date</th>
                <th className="py-2 pr-4 font-semibold">Category</th>
                <th className="py-2 pr-4 font-semibold">Crop</th>
                <th className="py-2 pr-4 font-semibold">Description</th>
                <th className="py-2 pr-4 font-semibold text-right">Amount</th>
                <th className="py-2 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {financeEntries.map((entry) => (
                <tr key={entry.id}>
                  <td className="py-2.5 pr-4 font-mono-tabular text-neutral-500 dark:text-neutral-400">{entry.date}</td>
                  <td className="py-2.5 pr-4 font-medium text-neutral-800 dark:text-neutral-200">{entry.category}</td>
                  <td className="py-2.5 pr-4 text-neutral-600 dark:text-neutral-300">{entry.crop}</td>
                  <td className="py-2.5 pr-4 text-neutral-900 dark:text-neutral-100">{entry.description}</td>
                  <td
                    className={`py-2.5 pr-4 text-right font-mono-tabular font-semibold ${
                      entry.type === 'income' ? 'text-emerald-700 dark:text-emerald-400' : 'text-neutral-900 dark:text-neutral-100'
                    }`}
                  >
                    {entry.type === 'income' ? '+' : '-'}₹{entry.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteFinance(entry.id)}
                      aria-label={`Delete entry ${entry.description}`}
                      className="p-1 text-neutral-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Equipment Rental & Labour Connect */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 space-y-5">
          <div className="border-b border-neutral-200 dark:border-neutral-800 pb-4">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <Tractor className="w-5 h-5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
              <span>{t.rentalsTitle}</span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Rent verified tractors, paddy harvesters & boom sprayers by hour or day
            </p>
          </div>

          <div className="space-y-3">
            {equipment.map((eq) => (
              <div
                key={eq.id}
                className="flex flex-col sm:flex-row gap-3 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800"
              >
                {eq.imageUrl && (
                  <div className="sm:w-32 h-24 rounded-lg overflow-hidden shrink-0">
                    <ResilientImage src={eq.imageUrl} alt={eq.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-bold text-neutral-900 dark:text-neutral-50">{eq.name}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {eq.type} · Owner: {eq.ownerName} · {eq.district}
                  </p>
                  <p className="text-xs font-mono-tabular font-semibold text-emerald-700 dark:text-emerald-400">
                    ₹{eq.hourlyRate}/hr · ₹{eq.dailyRate.toLocaleString('en-IN')}/day · {eq.phone}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleBookRental} className="space-y-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Request Equipment Slot</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <select
                aria-label="Select equipment"
                value={selectedEqId}
                onChange={(e) => setSelectedEqId(e.target.value)}
                className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs"
              >
                {equipment.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name}
                  </option>
                ))}
              </select>
              <input
                aria-label="Rental date"
                type="date"
                value={rentalDate}
                onChange={(e) => setRentalDate(e.target.value)}
                className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs"
              />
              <input
                aria-label="Rental hours"
                type="number"
                min="1"
                max="24"
                value={rentalHours}
                onChange={(e) => setRentalHours(Math.max(1, Number(e.target.value) || 1))}
                className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs font-mono-tabular"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              Book Machinery
            </button>
            {rentalStatus && <p className="text-xs text-emerald-700 dark:text-emerald-400">{rentalStatus}</p>}
          </form>

          {rentalBookings.length > 0 && (
            <div className="text-xs space-y-1.5 pt-2">
              <p className="font-semibold text-neutral-600 dark:text-neutral-400">Your Equipment Bookings</p>
              {rentalBookings.map((b) => (
                <div key={b.id} className="flex justify-between text-neutral-700 dark:text-neutral-300">
                  <span className="truncate pr-2">
                    {b.equipmentName} ({b.date} · {b.hours}h)
                  </span>
                  <span className="font-mono-tabular font-semibold shrink-0">
                    ₹{b.estimatedCost.toLocaleString('en-IN')} · {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Labour Connect */}
        <div className="lg:col-span-6 bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 space-y-5">
          <div className="border-b border-neutral-200 dark:border-neutral-800 pb-4">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
              <span>{t.labourTitle}</span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Connect with verified transplanting, weeding, coconut climbing & harvesting crews
            </p>
          </div>

          <div className="space-y-3">
            {labourCrews.map((crew) => (
              <div
                key={crew.id}
                className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-neutral-900 dark:text-neutral-50">{crew.leaderName}</p>
                  <span className="text-xs font-mono-tabular font-semibold text-emerald-700 dark:text-emerald-400">
                    ₹{crew.dailyWagePerWorker}/worker/day
                  </span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-300">{crew.skill}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {crew.district} · {crew.workersCount} workers available from {crew.availableFrom} · {crew.phone}
                </p>
              </div>
            ))}
          </div>

          <form onSubmit={handleBookLabour} className="space-y-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Book Field Work Crew</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <select
                aria-label="Select labour crew"
                value={selectedCrewId}
                onChange={(e) => setSelectedCrewId(e.target.value)}
                className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs"
              >
                {labourCrews.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.leaderName}
                  </option>
                ))}
              </select>
              <input
                aria-label="Work date"
                type="date"
                value={labourDate}
                onChange={(e) => setLabourDate(e.target.value)}
                className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs"
              />
              <input
                aria-label="Workers needed"
                type="number"
                min="1"
                max="15"
                value={workersCount}
                onChange={(e) => setWorkersCount(Math.max(1, Number(e.target.value) || 1))}
                className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs font-mono-tabular"
              />
            </div>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-4 text-xs font-semibold rounded-lg border border-emerald-700 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Request Worker Crew</span>
            </button>
            {labourStatus && <p className="text-xs text-emerald-700 dark:text-emerald-400">{labourStatus}</p>}
          </form>

          {labourBookings.length > 0 && (
            <div className="text-xs space-y-1.5 pt-2">
              <p className="font-semibold text-neutral-600 dark:text-neutral-400">Your Labour Requests</p>
              {labourBookings.map((b) => (
                <div key={b.id} className="flex justify-between text-neutral-700 dark:text-neutral-300">
                  <span className="truncate pr-2">
                    {b.leaderName} ({b.workersRequested} workers · {b.date})
                  </span>
                  <span className="font-mono-tabular font-semibold shrink-0">
                    ₹{b.totalWage.toLocaleString('en-IN')} · {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
