import type { FarmerView, LanguageCode, UserRole } from '../types';

export interface Translations {
  brandName: string;
  roleLabel: string;
  roles: Record<UserRole, string>;
  nav: Record<FarmerView, string>;
  languageLabel: string;
  darkMode: string;
  lightMode: string;
  largeControls: string;
  askHelplineCta: string;
  cartLabel: string;
  overviewHeroTitle: string;
  overviewHeroSubtitle: string;
  weatherAlertHeading: string;
  cropCalendarHeading: string;
  recentOrdersHeading: string;
  kpiActiveCrop: string;
  kpiRainfall: string;
  kpiNetProfit: string;
  kpiPendingTasks: string;
  aiAssistantTitle: string;
  cropDoctorTitle: string;
  marketplaceTitle: string;
  mandiTitle: string;
  schemesTitle: string;
  financeTitle: string;
  rentalsTitle: string;
  labourTitle: string;
  communityTitle: string;
}

const EN: Translations = {
  brandName: 'Uzhavan AI',
  roleLabel: 'Workspace Role',
  roles: {
    farmer: 'Farmer',
    seller: 'Agro Seller',
    expert: 'Agri Expert',
    admin: 'Admin',
  },
  nav: {
    overview: 'Farm Dashboard',
    'ai-helpline': 'AI Voice & Crop Doctor',
    marketplace: 'Agri Marketplace',
    'mandi-schemes': 'Mandi & Gov Schemes',
    'finance-services': 'Finance, Rentals & Labour',
    'community-support': 'Experts, Vet & Learning',
  },
  languageLabel: 'Language',
  darkMode: 'Dark Mode',
  lightMode: 'Light Mode',
  largeControls: 'Large Touch Buttons',
  askHelplineCta: 'Voice Helpline',
  cartLabel: 'Cart',
  overviewHeroTitle: 'Smart Farming Command for Cauvery Delta & Tamil Nadu',
  overviewHeroSubtitle:
    'Tamil-first AI voice advisory, instant crop disease scanning, 30-minute farm input delivery, live e-NAM mandi prices, and verified government subsidies.',
  weatherAlertHeading: 'Active Weather Advisory',
  cropCalendarHeading: 'Personalized Crop Calendar',
  recentOrdersHeading: 'Recent Input Orders & Helpline Calls',
  kpiActiveCrop: 'Active Cultivation',
  kpiRainfall: '7-Day Rain Forecast',
  kpiNetProfit: 'Season Net P&L',
  kpiPendingTasks: 'Calendar Tasks',
  aiAssistantTitle: 'AI Mobile Call & Multilingual Voice Helpline',
  cropDoctorTitle: 'Crop Disease, Pest & Soil AI Analyzer',
  marketplaceTitle: 'Agri Input Marketplace & Nearby Shops',
  mandiTitle: 'Live Mandi Prices & Weather Intelligence',
  schemesTitle: 'Government Schemes Eligibility Checker',
  financeTitle: 'Farm Income, Expenses & Profit Tracker',
  rentalsTitle: 'Machinery & Tractor Rentals',
  labourTitle: 'Agricultural Labour Connect',
  communityTitle: 'Expert Consultation, Veterinary & Rural Learning',
};

const TA: Translations = {
  brandName: 'உழவன் AI',
  roleLabel: 'பயனர் பங்கு',
  roles: {
    farmer: 'விவசாயி',
    seller: 'விற்பனையாளர்',
    expert: 'வேளாண் நிபுணர்',
    admin: 'நிர்வாகி',
  },
  nav: {
    overview: 'விவசாய முகப்பு',
    'ai-helpline': 'குரல் உதவி & பயிர் மருத்துவர்',
    marketplace: 'விவசாய அங்காடி',
    'mandi-schemes': 'சந்தை விலை & அரசு திட்டங்கள்',
    'finance-services': 'வரவு-செலவு, வாடகை & கூலி',
    'community-support': 'நிபுணர்கள், கால்நடை & பயிற்சி',
  },
  languageLabel: 'மொழி',
  darkMode: 'இருண்ட திரை',
  lightMode: 'வெளிச்சத் திரை',
  largeControls: 'பெரிய பொத்தான்கள்',
  askHelplineCta: 'குரல் உதவி',
  cartLabel: 'கூடை',
  overviewHeroTitle: 'தமிழ்நாடு விவசாயிகளுக்கான முழுமையான AI வேளாண் தளம்',
  overviewHeroSubtitle:
    'தமிழ் குரல் ஆலோசனை, இலைப் புகைப்படம் மூலம் நோய் கண்டறிதல், 30 நிமிட இடுபொருள் விநியோகம், தினசரி சந்தை விலை மற்றும் அரசு மானியத் தகவல்கள்.',
  weatherAlertHeading: 'வானிலை எச்சரிக்கை',
  cropCalendarHeading: 'பயிர் பராமரிப்பு அட்டவணை',
  recentOrdersHeading: 'சமீபத்திய ஆர்டர்கள் & அழைப்புகள்',
  kpiActiveCrop: 'தற்போதைய பயிர்',
  kpiRainfall: '7-நாள் மழை வாய்ப்பு',
  kpiNetProfit: 'பருவ நிகர லாபம்',
  kpiPendingTasks: 'நிலுவை பணிகள்',
  aiAssistantTitle: 'AI தொலைபேசி அழைப்பு & தமிழ் குரல் உதவி மையம்',
  cropDoctorTitle: 'பயிர் நோய், பூச்சி & மண் பரிசோதனை AI',
  marketplaceTitle: 'விவசாய இடுபொருள் அங்காடி & அருகிலுள்ள கடைகள்',
  mandiTitle: 'தினசரி சந்தை விலை & வானிலை முன்னறிவிப்பு',
  schemesTitle: 'அரசு மானியத் திட்ட தகுதி சரிபார்ப்பு',
  financeTitle: 'விவசாய வரவு செலவு & லாப கணக்கு',
  rentalsTitle: 'டிராக்டர் & வேளாண் இயந்திர வாடகை',
  labourTitle: 'விவசாயத் தொழிலாளர் இணைப்பு',
  communityTitle: 'வேளாண் நிபுணர், கால்நடை & பயிற்சி மையம்',
};

const HI: Translations = {
  brandName: 'उझवन AI',
  roleLabel: 'कार्यक्षेत्र भूमिका',
  roles: {
    farmer: 'किसान',
    seller: 'कृषि विक्रेता',
    expert: 'कृषि विशेषज्ञ',
    admin: 'प्रशासक',
  },
  nav: {
    overview: 'किसान डैशबोर्ड',
    'ai-helpline': 'AI वॉइस और फसल डॉक्टर',
    marketplace: 'कृषि बाज़ार',
    'mandi-schemes': 'मंडी भाव और योजनाएं',
    'finance-services': 'वित्त, किराया और श्रम',
    'community-support': 'विशेषज्ञ, पशु चिकित्सा और शिक्षा',
  },
  languageLabel: 'भाषा',
  darkMode: 'डार्क मोड',
  lightMode: 'लाइट मोड',
  largeControls: 'बड़े बटन',
  askHelplineCta: 'वॉइस हेल्पलाइन',
  cartLabel: 'कार्ट',
  overviewHeroTitle: 'तमिलनाडु और भारतीय किसानों के लिए स्मार्ट AI कृषि मंच',
  overviewHeroSubtitle:
    'बहुभाषी वॉइस सहायता, फोटो से फसल रोग पहचान, त्वरित खाद-बीज डिलीवरी, लाइव मंडी भाव और सरकारी योजना पात्रता जांच।',
  weatherAlertHeading: 'सक्रिय मौसम चेतावनी',
  cropCalendarHeading: 'व्यक्तिगत फसल कैलेंडर',
  recentOrdersHeading: 'हाल के ऑर्डर और कॉल लॉग',
  kpiActiveCrop: 'सक्रिय फसल',
  kpiRainfall: '7-दिन वर्षा अनुमान',
  kpiNetProfit: 'मौसमी शुद्ध लाभ',
  kpiPendingTasks: 'लंबित कार्य',
  aiAssistantTitle: 'AI मोबाइल कॉल और बहुभाषी वॉइस हेल्पलाइन',
  cropDoctorTitle: 'फसल रोग, कीट और मिट्टी AI जांच',
  marketplaceTitle: 'कृषि इनपुट बाज़ार और नजदीकी दुकानें',
  mandiTitle: 'लाइव मंडी भाव और मौसम सूचना',
  schemesTitle: 'सरकारी योजना पात्रता जांचकर्ता',
  financeTitle: 'कृषि आय, व्यय और लाभ ट्रैकर',
  rentalsTitle: 'ट्रैक्टर और कृषि मशीनरी किराया',
  labourTitle: 'कृषि श्रमिक संपर्क',
  communityTitle: 'विशेषज्ञ परामर्श, पशु चिकित्सा और प्रशिक्षण',
};

export function getTranslations(lang: LanguageCode): Translations {
  if (lang === 'ta') return TA;
  if (lang === 'hi') return HI;
  return EN;
}
