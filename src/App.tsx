import { useEffect, useState } from 'react';
import type {
  BootstrapPayload,
  CartItem,
  CommunityPost,
  Consultation,
  CropDiagnosisRecord,
  FarmerView,
  FinanceEntry,
  HelplineCall,
  LabourBooking,
  LanguageCode,
  Order,
  Product,
  RentalBooking,
  Shop,
  UserRole,
  WeatherAlert,
} from './types';
import { getTranslations } from './i18n/translations';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { OverviewDashboard } from './components/OverviewDashboard';
import { AiVoiceAndCropDoctor } from './components/AiVoiceAndCropDoctor';
import { MarketplaceView } from './components/MarketplaceView';
import { MandiAndSchemesView } from './components/MandiAndSchemesView';
import { FinanceAndServicesView } from './components/FinanceAndServicesView';
import { CommunityAndSupportView } from './components/CommunityAndSupportView';
import { AdminPortal, ExpertPortal, SellerPortal } from './components/RolePortals';

export default function App() {
  const [data, setData] = useState<BootstrapPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [role, setRole] = useState<UserRole>('farmer');
  const [farmerView, setFarmerView] = useState<FarmerView>('overview');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [darkMode, setDarkMode] = useState(false);
  const [largeButtons, setLargeButtons] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const t = getTranslations(language);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    let active = true;
    async function loadBootstrap() {
      setLoading(true);
      setLoadError('');
      try {
        const res = await fetch('/api/bootstrap');
        if (!res.ok) throw new Error('Failed to load platform data');
        const json = (await res.json()) as BootstrapPayload;
        if (active) setData(json);
      } catch (err) {
        if (active) {
          setLoadError(err instanceof Error ? err.message : 'Unable to connect to Uzhavan AI server');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadBootstrap();
    return () => {
      active = false;
    };
  }, []);

  function handleAddToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        return prev.map((c) =>
          c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function handleUpdateCartQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => (c.product.id === productId ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  }

  async function handleToggleTask(taskId: string) {
    const res = await fetch(`/api/calendar/${taskId}/toggle`, { method: 'PATCH' });
    if (!res.ok) return;
    const payload = await res.json();
    setData((prev) =>
      prev
        ? {
            ...prev,
            cropTasks: prev.cropTasks.map((tItem) => (tItem.id === taskId ? payload.task : tItem)),
          }
        : prev
    );
  }

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex bg-[#F7F9F6] dark:bg-[#0D1310] text-neutral-900 dark:text-neutral-100">
      <Sidebar
        role={role}
        onRoleChange={setRole}
        farmerView={farmerView}
        onFarmerViewChange={setFarmerView}
        language={language}
        onLanguageChange={setLanguage}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        largeButtons={largeButtons}
        onToggleLargeButtons={() => setLargeButtons((b) => !b)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        t={t}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader
          role={role}
          farmerView={farmerView}
          district={data?.farmerProfile.district || 'Thanjavur'}
          cartCount={totalCartCount}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenHelpline={() => {
            setRole('farmer');
            setFarmerView('ai-helpline');
          }}
          onOpenCart={() => {
            setRole('farmer');
            setFarmerView('marketplace');
            setCartDrawerOpen(true);
          }}
          t={t}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {loading && (
            <div className="space-y-4" aria-busy="true" aria-label="Loading workspace">
              <div className="h-48 rounded-xl bg-neutral-200/70 dark:bg-neutral-800/70 animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 rounded-xl bg-neutral-200/70 dark:bg-neutral-800/70 animate-pulse" />
                ))}
              </div>
            </div>
          )}

          {!loading && loadError && (
            <div
              role="alert"
              className="p-6 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-sm text-red-700 dark:text-red-300"
            >
              {loadError}
            </div>
          )}

          {!loading && data && (
            <>
              {role === 'farmer' && farmerView === 'overview' && (
                <OverviewDashboard
                  data={data}
                  onNavigate={setFarmerView}
                  onToggleTask={handleToggleTask}
                  largeButtons={largeButtons}
                  t={t}
                />
              )}

              {role === 'farmer' && farmerView === 'ai-helpline' && (
                <AiVoiceAndCropDoctor
                  data={data}
                  language={language}
                  onCallLogged={(call: HelplineCall) =>
                    setData((prev) =>
                      prev ? { ...prev, helplineCalls: [call, ...prev.helplineCalls] } : prev
                    )
                  }
                  onDiagnosisAdded={(record: CropDiagnosisRecord) =>
                    setData((prev) =>
                      prev ? { ...prev, diagnoses: [record, ...prev.diagnoses] } : prev
                    )
                  }
                  t={t}
                />
              )}

              {role === 'farmer' && farmerView === 'marketplace' && (
                <MarketplaceView
                  data={data}
                  cart={cart}
                  onAddToCart={handleAddToCart}
                  onUpdateCartQty={handleUpdateCartQty}
                  onClearCart={() => setCart([])}
                  onOrderCreated={(order: Order, updatedProducts: Product[]) =>
                    setData((prev) =>
                      prev
                        ? { ...prev, orders: [order, ...prev.orders], products: updatedProducts }
                        : prev
                    )
                  }
                  cartDrawerOpen={cartDrawerOpen}
                  onCloseCartDrawer={() => setCartDrawerOpen(false)}
                  onOpenCartDrawer={() => setCartDrawerOpen(true)}
                  t={t}
                />
              )}

              {role === 'farmer' && farmerView === 'mandi-schemes' && (
                <MandiAndSchemesView data={data} t={t} />
              )}

              {role === 'farmer' && farmerView === 'finance-services' && (
                <FinanceAndServicesView
                  data={data}
                  onFinanceAdded={(entry: FinanceEntry) =>
                    setData((prev) =>
                      prev ? { ...prev, financeEntries: [entry, ...prev.financeEntries] } : prev
                    )
                  }
                  onFinanceDeleted={(id: string) =>
                    setData((prev) =>
                      prev
                        ? { ...prev, financeEntries: prev.financeEntries.filter((f) => f.id !== id) }
                        : prev
                    )
                  }
                  onRentalBooked={(booking: RentalBooking) =>
                    setData((prev) =>
                      prev ? { ...prev, rentalBookings: [booking, ...prev.rentalBookings] } : prev
                    )
                  }
                  onLabourBooked={(booking: LabourBooking) =>
                    setData((prev) =>
                      prev ? { ...prev, labourBookings: [booking, ...prev.labourBookings] } : prev
                    )
                  }
                  t={t}
                />
              )}

              {role === 'farmer' && farmerView === 'community-support' && (
                <CommunityAndSupportView
                  data={data}
                  onConsultationAdded={(cons: Consultation) =>
                    setData((prev) =>
                      prev ? { ...prev, consultations: [cons, ...prev.consultations] } : prev
                    )
                  }
                  onCommunityPostAdded={(post: CommunityPost) =>
                    setData((prev) =>
                      prev ? { ...prev, communityPosts: [post, ...prev.communityPosts] } : prev
                    )
                  }
                  t={t}
                />
              )}

              {role === 'seller' && (
                <SellerPortal
                  data={data}
                  onOrderStatusUpdated={(order: Order) =>
                    setData((prev) =>
                      prev
                        ? { ...prev, orders: prev.orders.map((o) => (o.id === order.id ? order : o)) }
                        : prev
                    )
                  }
                  onProductAdded={(product: Product) =>
                    setData((prev) =>
                      prev ? { ...prev, products: [product, ...prev.products] } : prev
                    )
                  }
                  onProductUpdated={(product: Product) =>
                    setData((prev) =>
                      prev
                        ? { ...prev, products: prev.products.map((p) => (p.id === product.id ? product : p)) }
                        : prev
                    )
                  }
                />
              )}

              {role === 'expert' && (
                <ExpertPortal
                  data={data}
                  onConsultationAnswered={(cons: Consultation) =>
                    setData((prev) =>
                      prev
                        ? {
                            ...prev,
                            consultations: prev.consultations.map((c) => (c.id === cons.id ? cons : c)),
                          }
                        : prev
                    )
                  }
                  onDiagnosisVerified={(rec: CropDiagnosisRecord) =>
                    setData((prev) =>
                      prev
                        ? {
                            ...prev,
                            diagnoses: prev.diagnoses.map((d) => (d.id === rec.id ? rec : d)),
                          }
                        : prev
                    )
                  }
                />
              )}

              {role === 'admin' && (
                <AdminPortal
                  data={data}
                  onShopUpdated={(shop: Shop) =>
                    setData((prev) =>
                      prev
                        ? { ...prev, shops: prev.shops.map((s) => (s.id === shop.id ? shop : s)) }
                        : prev
                    )
                  }
                  onAlertAdded={(alert: WeatherAlert) =>
                    setData((prev) => (prev ? { ...prev, alerts: [alert, ...prev.alerts] } : prev))
                  }
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
