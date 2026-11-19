export type UserRole = 'farmer' | 'seller' | 'expert' | 'admin';
export type LanguageCode = 'en' | 'ta' | 'hi';

export type FarmerView =
  | 'overview'
  | 'ai-helpline'
  | 'marketplace'
  | 'mandi-schemes'
  | 'finance-services'
  | 'community-support';

export interface Product {
  id: string;
  name: string;
  tamilName: string;
  category: 'Seeds' | 'Fertilizers' | 'Organic' | 'Irrigation' | 'Equipment' | 'Protection';
  brand: string;
  unit: string;
  price: number;
  mrp: number;
  stock: number;
  district: string;
  shopId: string;
  shopName: string;
  deliveryMinutes: number;
  rating: number;
  reviewsCount: number;
  bulkMinQty: number;
  bulkDiscountPct: number;
  imageUrl?: string;
  description: string;
}

export interface Shop {
  id: string;
  name: string;
  ownerName: string;
  district: string;
  village: string;
  address: string;
  phone: string;
  whatsapp: string;
  hours: string;
  licenseNumber: string;
  verified: boolean;
  rating: number;
  distanceKm: number;
  categories: string[];
  mapX: number;
  mapY: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  farmerName: string;
  district: string;
  address: string;
  deliveryMode: 'delivery' | 'pickup';
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  status: 'Confirmed' | 'Packed' | 'Dispatched' | 'Delivered';
  createdAt: string;
  shopName: string;
}

export interface MandiPriceRecord {
  id: string;
  crop: string;
  tamilCrop: string;
  variety: string;
  mandi: string;
  district: string;
  modalPrice: number;
  minPrice: number;
  maxPrice: number;
  mspPrice: number;
  unit: string;
  updatedAt: string;
  history7d: number[];
  buyerContact: string;
}

export interface GovScheme {
  id: string;
  name: string;
  tamilName: string;
  authority: 'Central' | 'Tamil Nadu';
  category: string;
  subsidySummary: string;
  maxBenefitInr: number;
  minAcres: number;
  maxAcres: number;
  eligibleCrops: string[];
  eligibleDistricts: string[];
  farmerCategories: string[];
  deadline: string;
  documents: string[];
  steps: string[];
  officialUrl: string;
  description: string;
}

export interface FarmerEligibilityInput {
  acres: number;
  crop: string;
  district: string;
  category: 'Small / Marginal' | 'Medium' | 'Tenant' | 'Women Farmer' | 'All';
}

export interface WeatherDay {
  day: string;
  condition: string;
  tempMax: number;
  tempMin: number;
  rainMm: number;
  windKmh: number;
  humidityPct: number;
}

export interface WeatherAlert {
  id: string;
  district: string;
  severity: 'Advisory' | 'Warning' | 'Emergency';
  type: 'Rainfall' | 'Cyclone' | 'Heatwave' | 'Drought';
  title: string;
  message: string;
  irrigationAdvice: string;
  issuedAt: string;
}

export interface WeatherDistrictData {
  district: string;
  currentTemp: number;
  condition: string;
  humidityPct: number;
  windKmh: number;
  rainChancePct: number;
  forecast7d: WeatherDay[];
}

export interface CropTask {
  id: string;
  crop: string;
  stage: string;
  taskTitle: string;
  dueDate: string;
  category: 'Sowing' | 'Fertilizer' | 'Irrigation' | 'Pest Scouting' | 'Harvest';
  completed: boolean;
}

export interface FinanceEntry {
  id: string;
  type: 'income' | 'expense';
  category: 'Seeds' | 'Fertilizer' | 'Labour' | 'Irrigation' | 'Equipment' | 'Harvest Sale' | 'Subsidy';
  crop: string;
  description: string;
  amount: number;
  date: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  type: 'Tractor' | 'Harvester' | 'Sprayer' | 'Pump' | 'Tiller';
  ownerName: string;
  phone: string;
  district: string;
  hourlyRate: number;
  dailyRate: number;
  available: boolean;
  imageUrl?: string;
}

export interface RentalBooking {
  id: string;
  equipmentId: string;
  equipmentName: string;
  farmerName: string;
  district: string;
  date: string;
  hours: number;
  estimatedCost: number;
  status: 'Requested' | 'Confirmed' | 'Completed';
}

export interface LabourCrew {
  id: string;
  leaderName: string;
  skill: string;
  workersCount: number;
  district: string;
  dailyWagePerWorker: number;
  phone: string;
  availableFrom: string;
}

export interface LabourBooking {
  id: string;
  crewId: string;
  leaderName: string;
  farmerName: string;
  district: string;
  date: string;
  workersRequested: number;
  totalWage: number;
  status: 'Requested' | 'Confirmed';
}

export interface Consultation {
  id: string;
  farmerName: string;
  district: string;
  crop: string;
  specialistType: 'Crop Specialist' | 'Soil Expert' | 'Pest Control' | 'Veterinary';
  question: string;
  preferredTime: string;
  status: 'Pending' | 'Answered';
  expertName?: string;
  expertResponse?: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  authorName: string;
  district: string;
  cropTag: string;
  title: string;
  content: string;
  likes: number;
  repliesCount: number;
  createdAt: string;
  expertVerified?: boolean;
}

export interface HelplineCall {
  id: string;
  phone: string;
  district: string;
  language: LanguageCode;
  callType: 'Inbound AI Voice' | 'Missed-Call Callback' | 'Scheduled Callback';
  querySummary: string;
  aiResolution: string;
  status: 'Resolved' | 'Callback Scheduled' | 'Escalated to Expert';
  createdAt: string;
}

export interface CropDiagnosisRecord {
  id: string;
  crop: string;
  symptoms: string;
  diseaseName: string;
  severity: 'Low' | 'Moderate' | 'High';
  confidence: string;
  organicTreatment: string;
  chemicalTreatment: string;
  prevention: string;
  verifiedByExpert: boolean;
  createdAt: string;
}

export interface LearningLesson {
  id: string;
  title: string;
  tamilTitle: string;
  category: string;
  duration: string;
  level: 'Beginner' | 'Intermediate';
  summary: string;
  keyTakeaways: string[];
}

export interface VetService {
  id: string;
  hospitalName: string;
  doctorName: string;
  district: string;
  phone: string;
  hours: string;
  specialty: string;
}

export interface EmergencyContact {
  id: string;
  officeName: string;
  district: string;
  role: string;
  phone: string;
  availability: string;
}

export interface BootstrapPayload {
  farmerProfile: {
    name: string;
    district: string;
    village: string;
    acres: number;
    primaryCrop: string;
    soilType: string;
    phone: string;
  };
  products: Product[];
  shops: Shop[];
  orders: Order[];
  mandiPrices: MandiPriceRecord[];
  schemes: GovScheme[];
  weatherByDistrict: WeatherDistrictData[];
  alerts: WeatherAlert[];
  cropTasks: CropTask[];
  financeEntries: FinanceEntry[];
  equipment: EquipmentItem[];
  rentalBookings: RentalBooking[];
  labourCrews: LabourCrew[];
  labourBookings: LabourBooking[];
  consultations: Consultation[];
  communityPosts: CommunityPost[];
  helplineCalls: HelplineCall[];
  diagnoses: CropDiagnosisRecord[];
  lessons: LearningLesson[];
  vetServices: VetService[];
  emergencyContacts: EmergencyContact[];
}
