import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { runAgriAssistant, runCropAndSoilDiagnosis } from './server/gemini';
import { buildPitchDeckBuffer } from './server/pitchDeck';
import { getStore, persistData } from './server/store';
import { computeCartTotals } from './src/utils/agriRules';
import type {
  CommunityPost,
  Consultation,
  CropDiagnosisRecord,
  FinanceEntry,
  HelplineCall,
  LabourBooking,
  Order,
  Product,
  RentalBooking,
  WeatherAlert,
} from './src/types';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  // Bootstrap full workspace dataset
  app.get('/api/bootstrap', (_req, res) => {
    res.json(getStore());
  });

  // Marketplace: Create persistent order
  app.post('/api/orders', (req, res) => {
    const store = getStore();
    const { farmerName, district, address, deliveryMode, items } = req.body as {
      farmerName?: string;
      district?: string;
      address?: string;
      deliveryMode?: 'delivery' | 'pickup';
      items?: Array<{ productId: string; quantity: number }>;
    };

    if (!farmerName || !address || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Farmer name, address, and at least one cart item are required.' });
      return;
    }

    const resolvedCartItems = items
      .map((entry) => {
        const product = store.products.find((p) => p.id === entry.productId);
        if (!product) return null;
        return { product, quantity: Math.max(1, Math.floor(Number(entry.quantity) || 1)) };
      })
      .filter((x): x is { product: Product; quantity: number } => x !== null);

    if (resolvedCartItems.length === 0) {
      res.status(400).json({ error: 'No valid products found in order.' });
      return;
    }

    const mode = deliveryMode === 'pickup' ? 'pickup' : 'delivery';
    const totals = computeCartTotals(resolvedCartItems, mode);

    // Decrement product stock
    for (const item of resolvedCartItems) {
      item.product.stock = Math.max(0, item.product.stock - item.quantity);
    }

    const newOrder: Order = {
      id: `ORD-2026-${Math.floor(100 + Math.random() * 900)}`,
      farmerName: farmerName.trim(),
      district: (district || store.farmerProfile.district).trim(),
      address: address.trim(),
      deliveryMode: mode,
      items: resolvedCartItems.map((c) => ({
        productId: c.product.id,
        productName: c.product.name,
        quantity: c.quantity,
        unitPrice: c.product.price,
      })),
      subtotal: totals.subtotal,
      discount: totals.discount,
      deliveryFee: totals.deliveryFee,
      total: totals.total,
      status: 'Confirmed',
      createdAt: new Date().toISOString(),
      shopName: resolvedCartItems[0].product.shopName,
    };

    store.orders.unshift(newOrder);
    persistData(store);
    res.status(201).json({ order: newOrder, products: store.products });
  });

  // Seller: Update order fulfillment status
  app.patch('/api/orders/:id/status', (req, res) => {
    const store = getStore();
    const order = store.orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    const { status } = req.body as { status?: Order['status'] };
    if (!status || !['Confirmed', 'Packed', 'Dispatched', 'Delivered'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }
    order.status = status;
    persistData(store);
    res.json({ order });
  });

  // Seller: Add or update product
  app.post('/api/products', (req, res) => {
    const store = getStore();
    const body = req.body as Partial<Product>;
    if (!body.name || !body.category || !body.price || !body.unit) {
      res.status(400).json({ error: 'Product name, category, unit, and price are required.' });
      return;
    }

    const shop = store.shops.find((s) => s.id === body.shopId) ?? store.shops[0];
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: body.name.trim(),
      tamilName: body.tamilName?.trim() || body.name.trim(),
      category: body.category,
      brand: body.brand?.trim() || 'Local Certified',
      unit: body.unit.trim(),
      price: Number(body.price),
      mrp: Number(body.mrp || body.price),
      stock: Number(body.stock ?? 25),
      district: body.district || shop.district,
      shopId: shop.id,
      shopName: shop.name,
      deliveryMinutes: Number(body.deliveryMinutes ?? 30),
      rating: 4.8,
      reviewsCount: 1,
      bulkMinQty: Number(body.bulkMinQty ?? 5),
      bulkDiscountPct: Number(body.bulkDiscountPct ?? 5),
      description: body.description?.trim() || 'Quality agricultural input supplied by verified dealer.',
    };
    store.products.unshift(newProduct);
    persistData(store);
    res.status(201).json({ product: newProduct });
  });

  app.patch('/api/products/:id', (req, res) => {
    const store = getStore();
    const product = store.products.find((p) => p.id === req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    const { price, stock } = req.body as { price?: number; stock?: number };
    if (price !== undefined && Number(price) > 0) product.price = Number(price);
    if (stock !== undefined && Number(stock) >= 0) product.stock = Number(stock);
    persistData(store);
    res.json({ product });
  });

  // Finance Ledger
  app.post('/api/finance', (req, res) => {
    const store = getStore();
    const body = req.body as Partial<FinanceEntry>;
    if (!body.type || !body.category || !body.description || !body.amount || Number(body.amount) <= 0) {
      res.status(400).json({ error: 'Valid type, category, description, and positive amount are required.' });
      return;
    }
    const entry: FinanceEntry = {
      id: `fin-${Date.now()}`,
      type: body.type,
      category: body.category,
      crop: body.crop?.trim() || store.farmerProfile.primaryCrop,
      description: body.description.trim(),
      amount: Number(body.amount),
      date: body.date || new Date().toISOString().slice(0, 10),
    };
    store.financeEntries.unshift(entry);
    persistData(store);
    res.status(201).json({ entry });
  });

  app.delete('/api/finance/:id', (req, res) => {
    const store = getStore();
    const idx = store.financeEntries.findIndex((f) => f.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Entry not found' });
      return;
    }
    store.financeEntries.splice(idx, 1);
    persistData(store);
    res.json({ ok: true });
  });

  // Crop Calendar Toggle
  app.patch('/api/calendar/:id/toggle', (req, res) => {
    const store = getStore();
    const task = store.cropTasks.find((t) => t.id === req.params.id);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    task.completed = !task.completed;
    persistData(store);
    res.json({ task });
  });

  // Equipment Rental Booking
  app.post('/api/rentals/book', (req, res) => {
    const store = getStore();
    const { equipmentId, farmerName, district, date, hours } = req.body as {
      equipmentId?: string;
      farmerName?: string;
      district?: string;
      date?: string;
      hours?: number;
    };
    const eq = store.equipment.find((e) => e.id === equipmentId);
    if (!eq || !farmerName || !date || !hours || Number(hours) <= 0) {
      res.status(400).json({ error: 'Equipment, farmer name, date, and hours are required.' });
      return;
    }
    const booking: RentalBooking = {
      id: `rent-${Date.now()}`,
      equipmentId: eq.id,
      equipmentName: eq.name,
      farmerName: farmerName.trim(),
      district: (district || eq.district).trim(),
      date,
      hours: Number(hours),
      estimatedCost: Number(hours) * eq.hourlyRate,
      status: 'Requested',
    };
    store.rentalBookings.unshift(booking);
    persistData(store);
    res.status(201).json({ booking });
  });

  // Labour Connect Booking
  app.post('/api/labour/book', (req, res) => {
    const store = getStore();
    const { crewId, farmerName, district, date, workersRequested } = req.body as {
      crewId?: string;
      farmerName?: string;
      district?: string;
      date?: string;
      workersRequested?: number;
    };
    const crew = store.labourCrews.find((c) => c.id === crewId);
    if (!crew || !farmerName || !date || !workersRequested || Number(workersRequested) <= 0) {
      res.status(400).json({ error: 'Crew, farmer name, date, and worker count are required.' });
      return;
    }
    const count = Math.min(crew.workersCount, Math.max(1, Number(workersRequested)));
    const booking: LabourBooking = {
      id: `lab-bk-${Date.now()}`,
      crewId: crew.id,
      leaderName: crew.leaderName,
      farmerName: farmerName.trim(),
      district: (district || crew.district).trim(),
      date,
      workersRequested: count,
      totalWage: count * crew.dailyWagePerWorker,
      status: 'Requested',
    };
    store.labourBookings.unshift(booking);
    persistData(store);
    res.status(201).json({ booking });
  });

  // Expert Consultations
  app.post('/api/consultations', (req, res) => {
    const store = getStore();
    const { farmerName, district, crop, specialistType, question, preferredTime } = req.body as Partial<Consultation>;
    if (!farmerName || !crop || !question) {
      res.status(400).json({ error: 'Farmer name, crop, and question are required.' });
      return;
    }
    const consultation: Consultation = {
      id: `cons-${Date.now()}`,
      farmerName: farmerName.trim(),
      district: district || store.farmerProfile.district,
      crop: crop.trim(),
      specialistType: specialistType || 'Crop Specialist',
      question: question.trim(),
      preferredTime: preferredTime || 'Morning 09:00 AM',
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    store.consultations.unshift(consultation);
    persistData(store);
    res.status(201).json({ consultation });
  });

  app.patch('/api/consultations/:id/answer', (req, res) => {
    const store = getStore();
    const cons = store.consultations.find((c) => c.id === req.params.id);
    if (!cons) {
      res.status(404).json({ error: 'Consultation not found' });
      return;
    }
    const { expertName, expertResponse } = req.body as { expertName?: string; expertResponse?: string };
    if (!expertResponse?.trim()) {
      res.status(400).json({ error: 'Expert response text is required.' });
      return;
    }
    cons.status = 'Answered';
    cons.expertName = expertName?.trim() || 'Dr. Kavitha Subramanian';
    cons.expertResponse = expertResponse.trim();
    persistData(store);
    res.json({ consultation: cons });
  });

  // Community Forum
  app.post('/api/community', (req, res) => {
    const store = getStore();
    const { authorName, district, cropTag, title, content } = req.body as Partial<CommunityPost>;
    if (!authorName || !title || !content) {
      res.status(400).json({ error: 'Author, title, and message are required.' });
      return;
    }
    const post: CommunityPost = {
      id: `post-${Date.now()}`,
      authorName: authorName.trim(),
      district: district || store.farmerProfile.district,
      cropTag: cropTag?.trim() || 'General Farming',
      title: title.trim(),
      content: content.trim(),
      likes: 1,
      repliesCount: 0,
      createdAt: new Date().toISOString().slice(0, 10),
      expertVerified: false,
    };
    store.communityPosts.unshift(post);
    persistData(store);
    res.status(201).json({ post });
  });

  // Helpline Missed-Call & Voice Callback Log
  app.post('/api/helpline/callback', (req, res) => {
    const store = getStore();
    const body = req.body as Partial<HelplineCall>;
    if (!body.phone || !body.querySummary) {
      res.status(400).json({ error: 'Phone number and query summary are required.' });
      return;
    }
    const call: HelplineCall = {
      id: `call-${Date.now()}`,
      phone: body.phone.trim(),
      district: body.district || store.farmerProfile.district,
      language: body.language || 'ta',
      callType: body.callType || 'Missed-Call Callback',
      querySummary: body.querySummary.trim(),
      aiResolution: body.aiResolution?.trim() || 'Callback queued for Tamil AI Voice & Agronomist desk.',
      status: body.status || 'Callback Scheduled',
      createdAt: new Date().toISOString(),
    };
    store.helplineCalls.unshift(call);
    persistData(store);
    res.status(201).json({ call });
  });

  // Admin: Verify Shop & Broadcast Weather Alert
  app.patch('/api/shops/:id/verify', (req, res) => {
    const store = getStore();
    const shop = store.shops.find((s) => s.id === req.params.id);
    if (!shop) {
      res.status(404).json({ error: 'Shop not found' });
      return;
    }
    shop.verified = !shop.verified;
    persistData(store);
    res.json({ shop });
  });

  app.post('/api/alerts', (req, res) => {
    const store = getStore();
    const body = req.body as Partial<WeatherAlert>;
    if (!body.district || !body.title || !body.message) {
      res.status(400).json({ error: 'District, title, and message are required.' });
      return;
    }
    const alert: WeatherAlert = {
      id: `alert-${Date.now()}`,
      district: body.district,
      severity: body.severity || 'Warning',
      type: body.type || 'Rainfall',
      title: body.title.trim(),
      message: body.message.trim(),
      irrigationAdvice: body.irrigationAdvice?.trim() || 'Adjust irrigation schedule according to local rainfall.',
      issuedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };
    store.alerts.unshift(alert);
    persistData(store);
    res.status(201).json({ alert });
  });

  // AI Endpoints (Server-Side @google/genai)
  app.post('/api/ai/assistant', async (req, res) => {
    const { query, language, district, crop, soilType } = req.body as {
      query?: string;
      language?: 'en' | 'ta' | 'hi';
      district?: string;
      crop?: string;
      soilType?: string;
    };
    if (!query?.trim()) {
      res.status(400).json({ error: 'Please provide a farming question.' });
      return;
    }
    try {
      const store = getStore();
      const result = await runAgriAssistant({
        query: query.trim(),
        language: language || 'ta',
        district: district || store.farmerProfile.district,
        crop: crop || store.farmerProfile.primaryCrop,
        soilType: soilType || store.farmerProfile.soilType,
      });

      const callLog: HelplineCall = {
        id: `call-${Date.now()}`,
        phone: store.farmerProfile.phone,
        district: district || store.farmerProfile.district,
        language: language || 'ta',
        callType: 'Inbound AI Voice',
        querySummary: query.trim().slice(0, 140),
        aiResolution: result.answer,
        status: 'Resolved',
        createdAt: new Date().toISOString(),
      };
      store.helplineCalls.unshift(callLog);
      persistData(store);

      res.json({ ...result, callLog });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI assistant service error';
      res.status(502).json({ error: message });
    }
  });

  app.post('/api/ai/diagnose', async (req, res) => {
    const { crop, symptoms, soilNotes, language, imageBase64, imageMimeType, useSampleLeaf } = req.body as {
      crop?: string;
      symptoms?: string;
      soilNotes?: string;
      language?: 'en' | 'ta' | 'hi';
      imageBase64?: string;
      imageMimeType?: string;
      useSampleLeaf?: boolean;
    };

    if (!crop?.trim() && !symptoms?.trim() && !imageBase64 && !useSampleLeaf) {
      res.status(400).json({ error: 'Provide crop symptoms or upload a crop/soil photo.' });
      return;
    }

    try {
      let resolvedBase64 = imageBase64;
      let resolvedMime = imageMimeType;

      if (useSampleLeaf && !resolvedBase64) {
        const samplePath = path.resolve(process.cwd(), 'src/assets/images/crop_leaf_sample_1795098382079.jpg');
        if (fs.existsSync(samplePath)) {
          resolvedBase64 = fs.readFileSync(samplePath).toString('base64');
          resolvedMime = 'image/jpeg';
        }
      }

      const diagnosis = await runCropAndSoilDiagnosis({
        crop: crop?.trim() || 'Paddy',
        symptoms: symptoms?.trim() || 'Brown lesions on leaf',
        soilNotes: soilNotes?.trim(),
        language: language || 'en',
        imageBase64: resolvedBase64,
        imageMimeType: resolvedMime,
      });

      const store = getStore();
      const record: CropDiagnosisRecord = {
        id: `diag-${Date.now()}`,
        crop: crop?.trim() || 'Paddy',
        symptoms: symptoms?.trim() || 'Leaf photo uploaded',
        diseaseName: diagnosis.diseaseName,
        severity: diagnosis.severity,
        confidence: diagnosis.confidence,
        organicTreatment: diagnosis.organicTreatment,
        chemicalTreatment: diagnosis.chemicalTreatment,
        prevention: diagnosis.prevention,
        verifiedByExpert: false,
        createdAt: new Date().toISOString(),
      };
      store.diagnoses.unshift(record);
      persistData(store);

      res.json({ diagnosis, record });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Crop diagnosis AI failed';
      res.status(502).json({ error: message });
    }
  });

  // Expert verifies a diagnosis
  app.patch('/api/diagnoses/:id/verify', (req, res) => {
    const store = getStore();
    const record = store.diagnoses.find((d) => d.id === req.params.id);
    if (!record) {
      res.status(404).json({ error: 'Diagnosis record not found' });
      return;
    }
    record.verifiedByExpert = true;
    persistData(store);
    res.json({ record });
  });

  // Download generated Hackathon Pitch Deck (.pptx)
  app.get('/api/pitch-deck.pptx', async (_req, res) => {
    try {
      const buffer = await buildPitchDeckBuffer();
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      );
      res.setHeader('Content-Disposition', 'attachment; filename="Uzhavan_AI_Pitch_Deck.pptx"');
      res.send(buffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate PPTX';
      res.status(500).json({ error: message });
    }
  });

  // Mount Vite dev middleware or static dist
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Uzhavan AI server running at http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
