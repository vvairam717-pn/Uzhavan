import type {
  CartItem,
  FarmerEligibilityInput,
  FinanceEntry,
  GovScheme,
  MandiPriceRecord,
  Product,
} from '../types';

export interface ProfitLossSummary {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  roiPercent: number;
  expenseByCategory: Record<string, number>;
}

export function calculateProfitLoss(entries: FinanceEntry[]): ProfitLossSummary {
  let totalIncome = 0;
  let totalExpense = 0;
  const expenseByCategory: Record<string, number> = {};

  for (const entry of entries) {
    const amount = Number.isFinite(entry.amount) ? Math.max(0, entry.amount) : 0;
    if (entry.type === 'income') {
      totalIncome += amount;
    } else {
      totalExpense += amount;
      expenseByCategory[entry.category] = (expenseByCategory[entry.category] ?? 0) + amount;
    }
  }

  const netProfit = totalIncome - totalExpense;
  const roiPercent = totalExpense > 0 ? Math.round((netProfit / totalExpense) * 1000) / 10 : 0;

  return {
    totalIncome,
    totalExpense,
    netProfit,
    roiPercent,
    expenseByCategory,
  };
}

export interface MatchedScheme {
  scheme: GovScheme;
  matchReasons: string[];
}

export function matchEligibleSchemes(
  input: FarmerEligibilityInput,
  schemes: GovScheme[]
): MatchedScheme[] {
  const results: MatchedScheme[] = [];

  for (const scheme of schemes) {
    const reasons: string[] = [];

    if (input.acres < scheme.minAcres || input.acres > scheme.maxAcres) {
      continue;
    }
    reasons.push(`Land size ${input.acres} ac fits ${scheme.minAcres}-${scheme.maxAcres} ac criteria`);

    const cropMatches =
      scheme.eligibleCrops.includes('All') ||
      scheme.eligibleCrops.some((c) => c.toLowerCase() === input.crop.toLowerCase());
    if (!cropMatches) {
      continue;
    }
    reasons.push(
      scheme.eligibleCrops.includes('All')
        ? 'Covers all notified crops'
        : `Supports ${input.crop} cultivation`
    );

    const districtMatches =
      scheme.eligibleDistricts.includes('All') ||
      scheme.eligibleDistricts.some((d) => d.toLowerCase() === input.district.toLowerCase());
    if (!districtMatches) {
      continue;
    }
    reasons.push(
      scheme.eligibleDistricts.includes('All')
        ? 'Active statewide across Tamil Nadu'
        : `Priority allocation for ${input.district}`
    );

    const categoryMatches =
      input.category === 'All' ||
      scheme.farmerCategories.includes('All') ||
      scheme.farmerCategories.includes(input.category);
    if (!categoryMatches) {
      continue;
    }

    results.push({ scheme, matchReasons: reasons });
  }

  return results;
}

export interface SellingRecommendation {
  action: 'Sell Today' | 'Hold 5-7 Days' | 'Compare Nearby Mandi';
  deltaPct7d: number;
  aboveMspInr: number;
  rationale: string;
}

export function recommendSellingAction(record: MandiPriceRecord): SellingRecommendation {
  const history = record.history7d;
  const startPrice = history.length > 0 ? history[0] : record.modalPrice;
  const deltaPct7d =
    startPrice > 0 ? Math.round(((record.modalPrice - startPrice) / startPrice) * 1000) / 10 : 0;
  const aboveMspInr = record.mspPrice > 0 ? record.modalPrice - record.mspPrice : 0;

  if (deltaPct7d >= 4 && record.modalPrice >= record.mspPrice) {
    return {
      action: 'Sell Today',
      deltaPct7d,
      aboveMspInr,
      rationale: `7-day rally of +${deltaPct7d}% puts modal rate comfortably above MSP.`,
    };
  }

  if (record.mspPrice > 0 && record.modalPrice < record.mspPrice) {
    return {
      action: 'Compare Nearby Mandi',
      deltaPct7d,
      aboveMspInr,
      rationale: `Current rate is ₹${Math.abs(aboveMspInr)} below MSP; check Direct Procurement Centre or nearby mandi.`,
    };
  }

  if (deltaPct7d <= -2) {
    return {
      action: 'Hold 5-7 Days',
      deltaPct7d,
      aboveMspInr,
      rationale: `Short-term dip (${deltaPct7d}% over 7d); store in dry godown if moisture is under 12%.`,
    };
  }

  return {
    action: 'Sell Today',
    deltaPct7d,
    aboveMspInr,
    rationale: 'Prices are stable with steady mandi arrivals and strong trader demand.',
  };
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
}

export function computeCartTotals(
  items: CartItem[],
  deliveryMode: 'delivery' | 'pickup'
): CartTotals {
  let subtotal = 0;
  let itemCount = 0;
  let bulkEligibleSavings = 0;

  for (const item of items) {
    const qty = Math.max(0, Math.floor(item.quantity));
    if (qty === 0) continue;
    const lineTotal = item.product.price * qty;
    subtotal += lineTotal;
    itemCount += qty;
    if (qty >= item.product.bulkMinQty && item.product.bulkDiscountPct > 0) {
      bulkEligibleSavings += Math.round((lineTotal * item.product.bulkDiscountPct) / 100);
    }
  }

  const orderLevelDiscount = subtotal >= 2500 && bulkEligibleSavings === 0 ? Math.round(subtotal * 0.05) : 0;
  const discount = bulkEligibleSavings + orderLevelDiscount;
  const afterDiscount = Math.max(0, subtotal - discount);
  const deliveryFee =
    itemCount === 0 || deliveryMode === 'pickup' || afterDiscount >= 1500 ? 0 : 60;
  const total = afterDiscount + deliveryFee;

  return {
    subtotal,
    discount,
    deliveryFee,
    total,
    itemCount,
  };
}

export function filterMarketplaceProducts(
  products: Product[],
  query: string,
  category: string,
  district: string
): Product[] {
  const q = query.trim().toLowerCase();
  return products.filter((p) => {
    const matchesCategory = category === 'All' || p.category === category;
    const matchesDistrict = district === 'All' || p.district === district;
    const matchesQuery =
      q.length === 0 ||
      p.name.toLowerCase().includes(q) ||
      p.tamilName.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    return matchesCategory && matchesDistrict && matchesQuery;
  });
}

export function filterMandiPrices(
  prices: MandiPriceRecord[],
  district: string,
  cropQuery: string
): MandiPriceRecord[] {
  const q = cropQuery.trim().toLowerCase();
  return prices.filter((row) => {
    const matchesDistrict = district === 'All' || row.district === district;
    const matchesQuery =
      q.length === 0 ||
      row.crop.toLowerCase().includes(q) ||
      row.tamilCrop.toLowerCase().includes(q) ||
      row.mandi.toLowerCase().includes(q);
    return matchesDistrict && matchesQuery;
  });
}
