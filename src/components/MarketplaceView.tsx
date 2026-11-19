import { useMemo, useState, type FormEvent } from 'react';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Minus,
  Package,
  Phone,
  Plus,
  Search,
  ShoppingCart,
  Star,
  Store,
  Trash2,
  X,
} from 'lucide-react';
import type { BootstrapPayload, CartItem, Order, Product } from '../types';
import type { Translations } from '../i18n/translations';
import { computeCartTotals, filterMarketplaceProducts } from '../utils/agriRules';
import { ResilientImage } from './ResilientImage';

interface MarketplaceViewProps {
  data: BootstrapPayload;
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onUpdateCartQty: (productId: string, delta: number) => void;
  onClearCart: () => void;
  onOrderCreated: (order: Order, updatedProducts: Product[]) => void;
  cartDrawerOpen: boolean;
  onCloseCartDrawer: () => void;
  onOpenCartDrawer: () => void;
  t: Translations;
}

const CATEGORIES = ['All', 'Seeds', 'Fertilizers', 'Organic', 'Irrigation', 'Equipment', 'Protection'];

export function MarketplaceView({
  data,
  cart,
  onAddToCart,
  onUpdateCartQty,
  onClearCart,
  onOrderCreated,
  cartDrawerOpen,
  onCloseCartDrawer,
  onOpenCartDrawer,
  t,
}: MarketplaceViewProps) {
  const { products, shops, orders, farmerProfile } = data;

  const [activeSubTab, setActiveSubTab] = useState<'store' | 'shops' | 'orders'>('store');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDistrict, setSelectedDistrict] = useState('All');

  // Checkout Drawer State
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
  const [checkoutName, setCheckoutName] = useState(farmerProfile.name);
  const [checkoutDistrict, setCheckoutDistrict] = useState(farmerProfile.district);
  const [checkoutAddress, setCheckoutAddress] = useState(`${farmerProfile.village}, ${farmerProfile.district}`);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [orderConfirmation, setOrderConfirmation] = useState<string>('');

  const districts = useMemo(
    () => ['All', ...Array.from(new Set(products.map((p) => p.district)))],
    [products]
  );

  const filteredProducts = useMemo(
    () => filterMarketplaceProducts(products, searchQuery, selectedCategory, selectedDistrict),
    [products, searchQuery, selectedCategory, selectedDistrict]
  );

  const filteredShops = useMemo(
    () =>
      shops.filter((s) => {
        const matchesDistrict = selectedDistrict === 'All' || s.district === selectedDistrict;
        const q = searchQuery.trim().toLowerCase();
        const matchesQuery =
          !q ||
          s.name.toLowerCase().includes(q) ||
          s.village.toLowerCase().includes(q) ||
          s.categories.some((c) => c.toLowerCase().includes(q));
        return matchesDistrict && matchesQuery;
      }),
    [shops, selectedDistrict, searchQuery]
  );

  const totals = useMemo(() => computeCartTotals(cart, deliveryMode), [cart, deliveryMode]);

  async function handlePlaceOrder(e: FormEvent) {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!checkoutName.trim() || !checkoutAddress.trim()) {
      setCheckoutError('Enter recipient name and farm delivery/pickup address.');
      return;
    }
    setCheckoutError('');
    setPlacingOrder(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerName: checkoutName.trim(),
          district: checkoutDistrict,
          address: checkoutAddress.trim(),
          deliveryMode,
          items: cart.map((c) => ({ productId: c.product.id, quantity: c.quantity })),
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Could not place order');
      onOrderCreated(payload.order, payload.products);
      onClearCart();
      setOrderConfirmation(`Order ${payload.order.id} placed for ₹${payload.order.total.toLocaleString('en-IN')}.`);
      setActiveSubTab('orders');
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Order failed');
    } finally {
      setPlacingOrder(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">{t.marketplaceTitle}</h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Hyperlocal 20–45 min farm input delivery or direct shop pickup across Tamil Nadu
          </p>
        </div>

        <div className="flex items-center gap-2 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg self-start">
          {(
            [
              { id: 'store', label: 'Agri Inputs' },
              { id: 'shops', label: `Nearby Shops (${shops.length})` },
              { id: 'orders', label: `Orders (${orders.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeSubTab === tab.id
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {orderConfirmation && (
        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-900 dark:text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span>{orderConfirmation}</span>
          </div>
          <button
            type="button"
            onClick={() => setOrderConfirmation('')}
            aria-label="Dismiss order confirmation"
            className="text-xs text-emerald-800 dark:text-emerald-300 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <label htmlFor="market-search" className="sr-only">
              Search seeds, fertilizers, drip kits, or shops
            </label>
            <input
              id="market-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search seeds, NPK, vermicompost, drip kit, sprayer..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="market-district" className="text-xs font-medium text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
              District:
            </label>
            <select
              id="market-district"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
            >
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeSubTab === 'store' && (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Product Categories">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-emerald-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Store Grid */}
      {activeSubTab === 'store' && (
        <>
          {filteredProducts.length === 0 ? (
            <div className="bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-10 text-center space-y-2">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                No agricultural products match your filter
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Try clearing the search text or switching district to All.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedDistrict('All');
                }}
                className="mt-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-700 text-white"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredProducts.map((product) => {
                const inCart = cart.find((c) => c.product.id === product.id);
                return (
                  <article
                    key={product.id}
                    className="bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-44 border-b border-neutral-200 dark:border-neutral-800 overflow-hidden">
                        <ResilientImage
                          src={product.imageUrl}
                          alt={product.name}
                          fallbackLabel={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="p-4 space-y-2">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {product.category} · {product.brand} · {product.district}
                        </p>
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-50 leading-snug line-clamp-2 min-h-[2.4rem]">
                          {product.name}
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{product.tamilName}</p>
                        <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 pt-1">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                            <span className="font-mono-tabular">{product.deliveryMinutes}m</span>
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                            <span className="font-mono-tabular">{product.rating}</span>
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-tabular">Stock: {product.stock}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <div>
                          <span className="text-base font-bold font-mono-tabular text-neutral-900 dark:text-neutral-50">
                            ₹{product.price.toLocaleString('en-IN')}
                          </span>
                          {product.mrp > product.price && (
                            <span className="ml-1.5 text-xs line-through text-neutral-400 font-mono-tabular">
                              ₹{product.mrp}
                            </span>
                          )}
                          <span className="block text-[11px] text-neutral-500 dark:text-neutral-400">
                            {product.unit} · Bulk {product.bulkMinQty}+ saves {product.bulkDiscountPct}%
                          </span>
                        </div>
                      </div>

                      {inCart ? (
                        <div className="flex items-center justify-between border border-emerald-700 rounded-lg px-2 py-1">
                          <button
                            type="button"
                            onClick={() => onUpdateCartQty(product.id, -1)}
                            aria-label={`Decrease quantity of ${product.name}`}
                            className="p-1.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-bold font-mono-tabular text-neutral-900 dark:text-neutral-100">
                            {inCart.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateCartQty(product.id, 1)}
                            aria-label={`Increase quantity of ${product.name}`}
                            className="p-1.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={product.stock <= 0}
                          onClick={() => onAddToCart(product)}
                          className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white transition-colors"
                        >
                          {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Nearby Shops Directory + Interactive District Locator */}
      {activeSubTab === 'shops' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 space-y-3">
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50">
              Tamil Nadu Verified Agro Shop Map
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Interactive district pin overview — click any pin or shop card to call or WhatsApp
            </p>
            <div className="relative w-full h-72 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-emerald-50/40 dark:bg-emerald-950/20 overflow-hidden">
              <svg viewBox="0 0 100 100" className="w-full h-full" aria-label="Regional Agro Shops Locator Map">
                <path
                  d="M25,15 L72,18 L78,42 L68,68 L45,88 L22,72 L18,42 Z"
                  fill="none"
                  stroke="currentColor"
                  className="text-emerald-700/30 dark:text-emerald-500/30"
                  strokeWidth="1.2"
                />
                {filteredShops.map((shop) => (
                  <g key={shop.id}>
                    <circle
                      cx={shop.mapX}
                      cy={shop.mapY}
                      r="3.2"
                      className={shop.verified ? 'fill-emerald-700 dark:fill-emerald-400' : 'fill-amber-600'}
                    />
                    <text
                      x={shop.mapX + 4.5}
                      y={shop.mapY + 1.2}
                      fontSize="3.8"
                      className="fill-neutral-800 dark:fill-neutral-200 font-semibold"
                    >
                      {shop.district}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredShops.map((shop) => (
              <div
                key={shop.id}
                className="bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-50">{shop.name}</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {shop.ownerName} · {shop.village}, {shop.district}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                    {shop.verified ? 'Verified' : 'Pending'}
                  </span>
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-300 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-neutral-400" aria-hidden="true" />
                  <span>{shop.address}</span>
                </p>

                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Hours: {shop.hours} · <span className="font-mono-tabular">{shop.distanceKm} km</span> away · License{' '}
                  <span className="font-mono-tabular">{shop.licenseNumber}</span>
                </p>

                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
                  <a
                    href={`tel:${shop.phone}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Call Shop</span>
                  </a>
                  <a
                    href={`https://wa.me/${shop.whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white"
                  >
                    <Store className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Tracking */}
      {activeSubTab === 'orders' && (
        <div className="bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50">
              Marketplace Orders & Tracking ({orders.length})
            </h2>
          </div>
          {orders.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
              No orders placed yet. Add inputs from the store tab to place your first order.
            </div>
          ) : (
            <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {orders.map((order) => (
                <div key={order.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                      <Package className="w-4 h-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                      <span className="font-mono-tabular font-semibold text-neutral-900 dark:text-neutral-100">
                        {order.id}
                      </span>
                      <span>·</span>
                      <span>{order.shopName}</span>
                      <span>·</span>
                      <span>{order.deliveryMode === 'pickup' ? 'Shop Pickup' : 'Home/Farm Delivery'}</span>
                    </div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {order.items.map((i) => `${i.productName} ×${i.quantity}`).join(', ')}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Deliver to: {order.address} ({order.district})
                    </p>
                  </div>

                  <div className="text-left md:text-right shrink-0 space-y-1">
                    <p className="text-base font-bold font-mono-tabular text-neutral-900 dark:text-neutral-50">
                      ₹{order.total.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      Status: {order.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Slide-over Cart & Checkout Drawer */}
      {cartDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Shopping Cart">
          <div className="fixed inset-0 bg-black/50" onClick={onCloseCartDrawer} aria-hidden="true" />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-[#141D18] h-full flex flex-col border-l border-neutral-200 dark:border-neutral-800">
            <div className="h-16 px-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50">
                Your Farm Input Cart ({totals.itemCount})
              </h2>
              <button
                type="button"
                onClick={onCloseCartDrawer}
                aria-label="Close cart drawer"
                className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {cart.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <ShoppingCart className="w-8 h-8 mx-auto text-neutral-400" aria-hidden="true" />
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Your cart is empty</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Add certified seeds, fertilizers, or drip kits to checkout.
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {cart.map((item) => (
                      <div key={item.product.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono-tabular">
                            ₹{item.product.price} × {item.quantity} = ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => onUpdateCartQty(item.product.id, -1)}
                            aria-label={`Remove one ${item.product.name}`}
                            className="p-1.5 rounded border border-neutral-200 dark:border-neutral-700"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center text-xs font-mono-tabular font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateCartQty(item.product.id, 1)}
                            aria-label={`Add one more ${item.product.name}`}
                            className="p-1.5 rounded border border-neutral-200 dark:border-neutral-700"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateCartQty(item.product.id, -item.quantity)}
                            aria-label={`Delete ${item.product.name} from cart`}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handlePlaceOrder} className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                    <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setDeliveryMode('delivery')}
                        className={`py-1.5 text-xs font-semibold rounded-md ${
                          deliveryMode === 'delivery'
                            ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                            : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        30-Min Delivery
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryMode('pickup')}
                        className={`py-1.5 text-xs font-semibold rounded-md ${
                          deliveryMode === 'pickup'
                            ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                            : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        Shop Pickup (Free)
                      </button>
                    </div>

                    <div>
                      <label htmlFor="co-name" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                        Farmer Name
                      </label>
                      <input
                        id="co-name"
                        type="text"
                        value={checkoutName}
                        onChange={(e) => setCheckoutName(e.target.value)}
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="co-district" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                        District
                      </label>
                      <input
                        id="co-district"
                        type="text"
                        value={checkoutDistrict}
                        onChange={(e) => setCheckoutDistrict(e.target.value)}
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="co-addr" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                        Village / Delivery Address
                      </label>
                      <input
                        id="co-addr"
                        type="text"
                        value={checkoutAddress}
                        onChange={(e) => setCheckoutAddress(e.target.value)}
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">Subtotal</span>
                        <span className="font-mono-tabular">₹{totals.subtotal.toLocaleString('en-IN')}</span>
                      </div>
                      {totals.discount > 0 && (
                        <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                          <span>Bulk / Order Discount</span>
                          <span className="font-mono-tabular">-₹{totals.discount.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">Delivery Fee</span>
                        <span className="font-mono-tabular">
                          {totals.deliveryFee === 0 ? 'FREE' : `₹${totals.deliveryFee}`}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-neutral-200 dark:border-neutral-800 text-sm font-bold text-neutral-900 dark:text-neutral-50">
                        <span>Total Payable</span>
                        <span className="font-mono-tabular">₹{totals.total.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {checkoutError && (
                      <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                        {checkoutError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={placingOrder}
                      className="w-full py-2.5 px-4 text-sm font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white"
                    >
                      {placingOrder ? 'Placing Order...' : `Place Order · ₹${totals.total.toLocaleString('en-IN')}`}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
