import { useState, type FormEvent } from 'react';
import { CheckCircle2, PackageCheck, Plus, ShieldCheck, Store, Truck } from 'lucide-react';
import type { BootstrapPayload, Consultation, CropDiagnosisRecord, Order, Product, Shop, WeatherAlert } from '../types';

interface SellerPortalProps {
  data: BootstrapPayload;
  onOrderStatusUpdated: (order: Order) => void;
  onProductAdded: (product: Product) => void;
  onProductUpdated: (product: Product) => void;
}

export function SellerPortal({
  data,
  onOrderStatusUpdated,
  onProductAdded,
  onProductUpdated,
}: SellerPortalProps) {
  const { orders, products, shops } = data;
  const [name, setName] = useState('');
  const [tamilName, setTamilName] = useState('');
  const [category, setCategory] = useState<Product['category']>('Seeds');
  const [unit, setUnit] = useState('10 kg bag');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('30');
  const [saving, setSaving] = useState(false);

  async function handleUpdateStatus(orderId: string, status: Order['status']) {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const payload = await res.json();
    if (res.ok) onOrderStatusUpdated(payload.order);
  }

  async function handleAddProduct(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !price) return;
    setSaving(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          tamilName: tamilName.trim() || name.trim(),
          category,
          unit,
          price: Number(price),
          stock: Number(stock) || 25,
          shopId: shops[0]?.id,
        }),
      });
      const payload = await res.json();
      if (res.ok) {
        onProductAdded(payload.product);
        setName('');
        setTamilName('');
        setPrice('');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleRestock(product: Product) {
    const res = await fetch(`/api/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: product.stock + 20 }),
    });
    const payload = await res.json();
    if (res.ok) onProductUpdated(payload.product);
  }

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
            <span>Seller Shop & Order Fulfillment Portal</span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {shops[0]?.name} · {shops[0]?.district} · License {shops[0]?.licenseNumber}
          </p>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-xs text-neutral-500 block">Total Orders</span>
            <span className="font-mono-tabular font-bold">{orders.length}</span>
          </div>
          <div>
            <span className="text-xs text-neutral-500 block">Gross Sales</span>
            <span className="font-mono-tabular font-bold text-emerald-700 dark:text-emerald-400">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Incoming Orders Queue */}
      <section className="bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
          <span>Incoming Farmer Orders</span>
        </h2>
        <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {orders.map((order) => (
            <div key={order.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  <span className="font-mono-tabular">{order.id}</span> · {order.farmerName} ({order.district})
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
                  {order.items.map((i) => `${i.productName} ×${i.quantity}`).join(', ')} — ₹
                  <span className="font-mono-tabular">{order.total.toLocaleString('en-IN')}</span> ({order.deliveryMode})
                </p>
              </div>
              <div className="flex items-center gap-2">
                {(['Packed', 'Dispatched', 'Delivered'] as const).map((nextStatus) => (
                  <button
                    key={nextStatus}
                    type="button"
                    onClick={() => handleUpdateStatus(order.id, nextStatus)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                      order.status === nextStatus
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:border-emerald-600'
                    }`}
                  >
                    {nextStatus}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Add New Product & Inventory */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleAddProduct}
          className="lg:col-span-4 bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 space-y-3 self-start"
        >
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-emerald-700" aria-hidden="true" />
            <span>List New Input Product</span>
          </h2>
          <div>
            <label htmlFor="sel-pname" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
              Product Name
            </label>
            <input
              id="sel-pname"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Bio Potash Granules"
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="sel-tname" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
              Tamil Name
            </label>
            <input
              id="sel-tname"
              type="text"
              value={tamilName}
              onChange={(e) => setTamilName(e.target.value)}
              placeholder="பொட்டாஷ் உரம்"
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="sel-cat" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                Category
              </label>
              <select
                id="sel-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as Product['category'])}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-2 text-sm"
              >
                <option value="Seeds">Seeds</option>
                <option value="Fertilizers">Fertilizers</option>
                <option value="Organic">Organic</option>
                <option value="Irrigation">Irrigation</option>
                <option value="Equipment">Equipment</option>
                <option value="Protection">Protection</option>
              </select>
            </div>
            <div>
              <label htmlFor="sel-unit" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                Pack Unit
              </label>
              <input
                id="sel-unit"
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="sel-price" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                Price (₹)
              </label>
              <input
                id="sel-price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm font-mono-tabular"
              />
            </div>
            <div>
              <label htmlFor="sel-stock" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                Initial Stock
              </label>
              <input
                id="sel-stock"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm font-mono-tabular"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 px-4 text-sm font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            {saving ? 'Adding...' : 'Publish Product'}
          </button>
        </form>

        <div className="lg:col-span-8 bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 space-y-3">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
            <span>Shop Stock & Price Inventory ({products.length})</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500">
                  <th className="py-2 pr-3 font-semibold">Product</th>
                  <th className="py-2 pr-3 font-semibold">Category</th>
                  <th className="py-2 pr-3 font-semibold text-right">Price</th>
                  <th className="py-2 pr-3 font-semibold text-right">Stock</th>
                  <th className="py-2 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 pr-3 font-medium text-neutral-900 dark:text-neutral-100">{p.name}</td>
                    <td className="py-2.5 pr-3 text-neutral-500">{p.category}</td>
                    <td className="py-2.5 pr-3 text-right font-mono-tabular">₹{p.price}</td>
                    <td className="py-2.5 pr-3 text-right font-mono-tabular">{p.stock}</td>
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleRestock(p)}
                        className="px-2.5 py-1 text-xs font-semibold rounded border border-neutral-300 dark:border-neutral-700 hover:border-emerald-600"
                      >
                        +20 Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

interface ExpertPortalProps {
  data: BootstrapPayload;
  onConsultationAnswered: (cons: Consultation) => void;
  onDiagnosisVerified: (record: CropDiagnosisRecord) => void;
}

export function ExpertPortal({ data, onConsultationAnswered, onDiagnosisVerified }: ExpertPortalProps) {
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  async function handleAnswer(id: string) {
    const text = (replyDrafts[id] || '').trim();
    if (!text) return;
    const res = await fetch(`/api/consultations/${id}/answer`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expertName: 'Dr. Kavitha Subramanian (TNAU Agronomist)',
        expertResponse: text,
      }),
    });
    const payload = await res.json();
    if (res.ok) {
      onConsultationAnswered(payload.consultation);
    }
  }

  async function handleVerifyDiagnosis(id: string) {
    const res = await fetch(`/api/diagnoses/${id}/verify`, { method: 'PATCH' });
    const payload = await res.json();
    if (res.ok) onDiagnosisVerified(payload.record);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
          Agriculture Expert Verification & Consultation Desk
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          Respond to farmer questions and peer-verify AI crop disease scans
        </p>
      </div>

      <section className="bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50">Farmer Consultation Queue</h2>
        <div className="space-y-4">
          {data.consultations.map((cons) => (
            <div key={cons.id} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>
                  {cons.farmerName} · {cons.district} · {cons.crop} · {cons.specialistType}
                </span>
                <span className={cons.status === 'Answered' ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                  {cons.status}
                </span>
              </div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{cons.question}</p>
              {cons.status === 'Pending' ? (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    aria-label={`Expert reply for ${cons.farmerName}`}
                    value={replyDrafts[cons.id] || ''}
                    onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [cons.id]: e.target.value }))}
                    placeholder="Write field prescription and dosage guidance..."
                    className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleAnswer(cons.id)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white whitespace-nowrap"
                  >
                    Send Expert Advice
                  </button>
                </div>
              ) : (
                <p className="text-xs text-emerald-800 dark:text-emerald-300">{cons.expertResponse}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50">AI Crop Disease Scan Verification</h2>
        <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {data.diagnoses.map((diag) => (
            <div key={diag.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {diag.diseaseName} ({diag.crop})
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {diag.organicTreatment} · Confidence {diag.confidence}
                </p>
              </div>
              {diag.verifiedByExpert ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Verified
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleVerifyDiagnosis(diag.id)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white whitespace-nowrap"
                >
                  Approve AI Diagnosis
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

interface AdminPortalProps {
  data: BootstrapPayload;
  onShopUpdated: (shop: Shop) => void;
  onAlertAdded: (alert: WeatherAlert) => void;
}

export function AdminPortal({ data, onShopUpdated, onAlertAdded }: AdminPortalProps) {
  const [district, setDistrict] = useState('Thanjavur');
  const [severity, setSeverity] = useState<WeatherAlert['severity']>('Warning');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  async function handleToggleVerify(shopId: string) {
    const res = await fetch(`/api/shops/${shopId}/verify`, { method: 'PATCH' });
    const payload = await res.json();
    if (res.ok) onShopUpdated(payload.shop);
  }

  async function handleBroadcastAlert(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        district,
        severity,
        type: 'Rainfall',
        title: title.trim(),
        message: message.trim(),
      }),
    });
    const payload = await res.json();
    if (res.ok) {
      onAlertAdded(payload.alert);
      setTitle('');
      setMessage('');
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
          <span>Platform Administration & Compliance Console</span>
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          Seller license verification, emergency weather broadcasts, order & helpline monitoring
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <span className="text-xs text-neutral-500">Verified Shops</span>
          <p className="text-xl font-bold font-mono-tabular mt-1">
            {data.shops.filter((s) => s.verified).length} / {data.shops.length}
          </p>
        </div>
        <div className="bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <span className="text-xs text-neutral-500">Active Orders</span>
          <p className="text-xl font-bold font-mono-tabular mt-1">{data.orders.length}</p>
        </div>
        <div className="bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <span className="text-xs text-neutral-500">Helpline Voice Calls</span>
          <p className="text-xl font-bold font-mono-tabular mt-1">{data.helplineCalls.length}</p>
        </div>
        <div className="bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <span className="text-xs text-neutral-500">Listed Products</span>
          <p className="text-xl font-bold font-mono-tabular mt-1">{data.products.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50">
            Seller License Verification Queue
          </h2>
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {data.shops.map((shop) => (
              <div key={shop.id} className="py-3.5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{shop.name}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {shop.ownerName} · {shop.district} · License{' '}
                    <span className="font-mono-tabular">{shop.licenseNumber}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleVerify(shop.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border whitespace-nowrap ${
                    shop.verified
                      ? 'border-emerald-700 text-emerald-700 dark:text-emerald-400'
                      : 'bg-emerald-700 text-white border-emerald-700'
                  }`}
                >
                  {shop.verified ? 'Verified (Revoke)' : 'Approve License'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={handleBroadcastAlert}
          className="lg:col-span-5 bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 space-y-3 self-start"
        >
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50">
            Broadcast District Weather Alert
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="adm-dist" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                District
              </label>
              <select
                id="adm-dist"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
              >
                <option value="Thanjavur">Thanjavur</option>
                <option value="Coimbatore">Coimbatore</option>
                <option value="Madurai">Madurai</option>
                <option value="Erode">Erode</option>
              </select>
            </div>
            <div>
              <label htmlFor="adm-sev" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                Severity
              </label>
              <select
                id="adm-sev"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as WeatherAlert['severity'])}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
              >
                <option value="Advisory">Advisory</option>
                <option value="Warning">Warning</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="adm-title" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
              Alert Headline
            </label>
            <input
              id="adm-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Delta Drainage Canal Overflow Warning"
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="adm-msg" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
              Farmer Action Guidance
            </label>
            <textarea
              id="adm-msg"
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 px-4 text-sm font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            Publish Alert to Farmer Dashboards
          </button>
        </form>
      </div>
    </div>
  );
}
