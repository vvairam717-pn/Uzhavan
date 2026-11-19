import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateProfitLoss,
  computeCartTotals,
  filterMandiPrices,
  filterMarketplaceProducts,
  matchEligibleSchemes,
  recommendSellingAction,
} from './agriRules';
import type { FinanceEntry, GovScheme, MandiPriceRecord, Product } from '../types';

test('calculateProfitLoss computes income, expenses, net profit, and ROI', () => {
  const entries: FinanceEntry[] = [
    {
      id: '1',
      type: 'expense',
      category: 'Seeds',
      crop: 'Paddy',
      description: 'Ponni seed bags',
      amount: 4000,
      date: '2026-08-01',
    },
    {
      id: '2',
      type: 'expense',
      category: 'Fertilizer',
      crop: 'Paddy',
      description: 'Urea + DAP',
      amount: 6000,
      date: '2026-08-15',
    },
    {
      id: '3',
      type: 'income',
      category: 'Harvest Sale',
      crop: 'Paddy',
      description: 'Mandi sale',
      amount: 15000,
      date: '2026-11-10',
    },
  ];

  const summary = calculateProfitLoss(entries);
  assert.equal(summary.totalIncome, 15000);
  assert.equal(summary.totalExpense, 10000);
  assert.equal(summary.netProfit, 5000);
  assert.equal(summary.roiPercent, 50);
  assert.equal(summary.expenseByCategory.Seeds, 4000);
  assert.equal(summary.expenseByCategory.Fertilizer, 6000);
});

test('matchEligibleSchemes filters by acreage, crop, district, and category', () => {
  const schemes: GovScheme[] = [
    {
      id: 's1',
      name: 'Kuruvai Special Package',
      tamilName: 'குறுவை சிறப்புத் தொகுப்பு',
      authority: 'Tamil Nadu',
      category: 'Seeds & Subsidy',
      subsidySummary: '100% seed subsidy',
      maxBenefitInr: 12000,
      minAcres: 0.5,
      maxAcres: 5,
      eligibleCrops: ['Paddy'],
      eligibleDistricts: ['Thanjavur', 'Tiruvarur'],
      farmerCategories: ['All'],
      deadline: '2026-12-31',
      documents: ['Aadhaar'],
      steps: ['Apply'],
      officialUrl: 'https://tnagrisnet.tn.gov.in',
      description: 'Delta paddy support',
    },
    {
      id: 's2',
      name: 'Large Orchard Grant',
      tamilName: 'பழத்தோட்ட மானியம்',
      authority: 'Central',
      category: 'Horticulture',
      subsidySummary: '40% grant',
      maxBenefitInr: 50000,
      minAcres: 10,
      maxAcres: 50,
      eligibleCrops: ['Mango'],
      eligibleDistricts: ['All'],
      farmerCategories: ['All'],
      deadline: '2026-12-31',
      documents: ['Patta'],
      steps: ['Apply'],
      officialUrl: 'https://agricoop.nic.in',
      description: 'Orchard scheme',
    },
  ];

  const matched = matchEligibleSchemes(
    { acres: 2.5, crop: 'Paddy', district: 'Thanjavur', category: 'Small / Marginal' },
    schemes
  );

  assert.equal(matched.length, 1);
  assert.equal(matched[0].scheme.id, 's1');
});

test('recommendSellingAction recommends Sell Today on >4% rally above MSP and Compare Nearby Mandi below MSP', () => {
  const rallyRecord: MandiPriceRecord = {
    id: 'm1',
    crop: 'Paddy',
    tamilCrop: 'நெல்',
    variety: 'ADT-43',
    mandi: 'Thanjavur',
    district: 'Thanjavur',
    modalPrice: 2420,
    minPrice: 2300,
    maxPrice: 2480,
    mspPrice: 2300,
    unit: 'Quintal',
    updatedAt: '2026-11-19',
    history7d: [2250, 2290, 2320, 2360, 2390, 2410, 2420],
    buyerContact: '+91 98420 11111',
  };

  const rallyAdvice = recommendSellingAction(rallyRecord);
  assert.equal(rallyAdvice.action, 'Sell Today');
  assert.equal(rallyAdvice.aboveMspInr, 120);

  const belowMspRecord: MandiPriceRecord = {
    ...rallyRecord,
    modalPrice: 2150,
    history7d: [2200, 2190, 2180, 2170, 2160, 2155, 2150],
  };

  const belowAdvice = recommendSellingAction(belowMspRecord);
  assert.equal(belowAdvice.action, 'Compare Nearby Mandi');
});

test('computeCartTotals applies bulk discount and free delivery over threshold or pickup', () => {
  const sampleProduct: Product = {
    id: 'p1',
    name: 'Organic Vermicompost',
    tamilName: 'மண்புழு உரம்',
    category: 'Organic',
    brand: 'Cauvery Bio',
    unit: '25 kg bag',
    price: 400,
    mrp: 480,
    stock: 40,
    district: 'Thanjavur',
    shopId: 'sh1',
    shopName: 'Kaveri Agro',
    deliveryMinutes: 25,
    rating: 4.8,
    reviewsCount: 32,
    bulkMinQty: 5,
    bulkDiscountPct: 10,
    description: 'Rich compost',
  };

  const bulkDelivery = computeCartTotals([{ product: sampleProduct, quantity: 5 }], 'delivery');
  assert.equal(bulkDelivery.subtotal, 2000);
  assert.equal(bulkDelivery.discount, 200);
  assert.equal(bulkDelivery.deliveryFee, 0);
  assert.equal(bulkDelivery.total, 1800);

  const smallDelivery = computeCartTotals([{ product: sampleProduct, quantity: 2 }], 'delivery');
  assert.equal(smallDelivery.subtotal, 800);
  assert.equal(smallDelivery.deliveryFee, 60);
  assert.equal(smallDelivery.total, 860);

  const smallPickup = computeCartTotals([{ product: sampleProduct, quantity: 2 }], 'pickup');
  assert.equal(smallPickup.deliveryFee, 0);
  assert.equal(smallPickup.total, 800);
});

test('filterMarketplaceProducts and filterMandiPrices filter accurately', () => {
  const products: Product[] = [
    {
      id: 'p1',
      name: 'IFFCO Nano Urea',
      tamilName: 'நானோ யூரியா',
      category: 'Fertilizers',
      brand: 'IFFCO',
      unit: '500 ml',
      price: 240,
      mrp: 260,
      stock: 100,
      district: 'Coimbatore',
      shopId: 'sh1',
      shopName: 'Kongu Agro',
      deliveryMinutes: 20,
      rating: 4.9,
      reviewsCount: 55,
      bulkMinQty: 6,
      bulkDiscountPct: 5,
      description: 'Liquid nitrogen',
    },
    {
      id: 'p2',
      name: 'Ponni Paddy Seed',
      tamilName: 'பொன்னி நெல் விதை',
      category: 'Seeds',
      brand: 'TNAU',
      unit: '10 kg',
      price: 550,
      mrp: 600,
      stock: 50,
      district: 'Thanjavur',
      shopId: 'sh2',
      shopName: 'Delta Seeds',
      deliveryMinutes: 30,
      rating: 4.7,
      reviewsCount: 19,
      bulkMinQty: 4,
      bulkDiscountPct: 8,
      description: 'Certified seed',
    },
  ];

  assert.equal(filterMarketplaceProducts(products, 'urea', 'All', 'All').length, 1);
  assert.equal(filterMarketplaceProducts(products, '', 'Seeds', 'Thanjavur').length, 1);
  assert.equal(filterMarketplaceProducts(products, '', 'Seeds', 'Coimbatore').length, 0);

  const prices: MandiPriceRecord[] = [
    {
      id: 'm1',
      crop: 'Turmeric',
      tamilCrop: 'மஞ்சள்',
      variety: 'Erode Finger',
      mandi: 'Erode Regulated Market',
      district: 'Erode',
      modalPrice: 13800,
      minPrice: 12900,
      maxPrice: 14500,
      mspPrice: 0,
      unit: 'Quintal',
      updatedAt: '2026-11-19',
      history7d: [13200, 13400, 13500, 13600, 13650, 13700, 13800],
      buyerContact: '+91 98422 22222',
    },
  ];

  assert.equal(filterMandiPrices(prices, 'Erode', 'மஞ்சள்').length, 1);
  assert.equal(filterMandiPrices(prices, 'Madurai', '').length, 0);
});
