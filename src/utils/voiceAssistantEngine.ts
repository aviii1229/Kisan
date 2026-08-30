import { DigitalToken, Announcement, ProcurementCentre, Farmer } from '../types';

export interface ProcessVoiceCommandParams {
  command: string;
  lang: 'en' | 'te' | 'hi';
  activeToken: DigitalToken | null;
  announcements: Announcement[];
  centres: ProcurementCentre[];
  farmer?: Farmer | null;
  setActiveTab: (tab: 'centres' | 'map' | 'prices' | 'queue' | 'analytics' | 'admin' | 'voice') => void;
  setSearchQuery: (query: string) => void;
  setSelectedCrop: (crop: string) => void;
  setSelectedDistrict: (district: string) => void;
  setLanguage: (lang: 'en' | 'te' | 'hi') => void;
  detectUserLocation: () => void;
  openBookingModal?: (centre?: ProcurementCentre) => void;
  directBookToken?: (data: Partial<DigitalToken>) => Promise<DigitalToken>;
}

export interface InteractiveBookingData {
  centreId: string;
  centreName: string;
  farmerName: string;
  phone: string;
  cropId: string;
  cropName: string;
  quantityQuintals: number;
  slotTime: string;
  isBooked?: boolean;
  bookedTokenNumber?: string;
}

export interface ProcessVoiceCommandResult {
  speechTextHi: string;
  speechTextEn: string;
  speechTextTe: string;
  spokenMessage: string;
  actionTaken: string;
  createdToken?: DigitalToken;
  bookingFormPreset?: InteractiveBookingData;
}

export async function processVoiceIntent(params: ProcessVoiceCommandParams): Promise<ProcessVoiceCommandResult> {
  const {
    command,
    lang,
    activeToken,
    announcements,
    centres,
    farmer,
    setActiveTab,
    setSearchQuery,
    setSelectedCrop,
    setSelectedDistrict,
    setLanguage,
    detectUserLocation,
    openBookingModal,
    directBookToken
  } = params;

  const clean = command.toLowerCase().trim();

  // Known location dictionary for fast matching
  const knownLocations: Record<string, { hi: string; en: string; query: string }> = {
    'गोरखपुर': { hi: 'गोरखपुर मंडी', en: 'Gorakhpur Mandi', query: 'Gorakhpur' },
    'gorakhpur': { hi: 'गोरखपुर मंडी', en: 'Gorakhpur Mandi', query: 'Gorakhpur' },
    'कप्तानगंज': { hi: 'कप्तानगंज पीसीएफ केंद्र', en: 'Kaptanganj PCF Centre', query: 'Kaptanganj' },
    'kaptanganj': { hi: 'कप्तानगंज पीसीएफ केंद्र', en: 'Kaptanganj PCF Centre', query: 'Kaptanganj' },
    'कुशीनगर': { hi: 'कुशीनगर केंद्र', en: 'Kushinagar Centre', query: 'Kushinagar' },
    'देवरिया': { hi: 'देवरिया मंडी समिति', en: 'Deoria Mandi Samiti', query: 'Deoria' },
    'deoria': { hi: 'देवरिया मंडी समिति', en: 'Deoria Mandi Samiti', query: 'Deoria' },
    'महराजगंज': { hi: 'महराजगंज केंद्र', en: 'Maharajganj Centre', query: 'Maharajganj' },
    'सहजनवा': { hi: 'सहजनवा ब्लॉक केंद्र', en: 'Sahjanwa Block Centre', query: 'Sahjanwa' },
    'सहजनवां': { hi: 'सहजनवा ब्लॉक केंद्र', en: 'Sahjanwa Block Centre', query: 'Sahjanwa' },
    'बस्ती': { hi: 'बस्ती मंडी समिति', en: 'Basti Mandi Samiti', query: 'Basti' },
    'खलीलाबाद': { hi: 'संत कबीर नगर (खलीलाबाद) केंद्र', en: 'Khalilabad Centre', query: 'Khalilabad' }
  };

  const cropsMap: Record<string, { hi: string; en: string; id: string }> = {
    'गेहूं': { hi: 'गेहूं', en: 'Wheat (Sharbati)', id: 'wheat' },
    'धान': { hi: 'धान', en: 'Paddy (Grade A)', id: 'paddy-grade-a' },
    'चावल': { hi: 'धान', en: 'Paddy (Grade A)', id: 'paddy-grade-a' },
    'मक्का': { hi: 'मक्का', en: 'Maize (Corn)', id: 'maize' },
    'कपास': { hi: 'कपास', en: 'Cotton', id: 'cotton-long' },
    'चना': { hi: 'चना', en: 'Bengal Gram (Chana)', id: 'chana' },
    'सोयाबीन': { hi: 'सोयाबीन', en: 'Soyabean', id: 'soyabean' },
    'मिर्च': { hi: 'लाल मिर्च', en: 'Red Chilli', id: 'chilli' },
    'हल्दी': { hi: 'हल्दी', en: 'Turmeric', id: 'turmeric' }
  };

  // Find target procurement centre mentioned in command
  let targetCentre: ProcurementCentre | null = null;
  for (const [key, val] of Object.entries(knownLocations)) {
    if (clean.includes(key)) {
      targetCentre = centres.find(c =>
        c.name.toLowerCase().includes(val.query.toLowerCase()) ||
        c.district.toLowerCase().includes(val.query.toLowerCase()) ||
        c.id.toLowerCase().includes(val.query.toLowerCase())
      ) || null;
      break;
    }
  }

  // Fallback: check centres array directly by name or district keyword
  if (!targetCentre) {
    targetCentre = centres.find(c =>
      clean.includes(c.name.toLowerCase()) ||
      clean.includes(c.district.toLowerCase()) ||
      (c.name_hi && clean.includes(c.name_hi))
    ) || null;
  }

  // Find crop mentioned in command
  let matchedCrop: { hi: string; en: string; id: string } | null = null;
  for (const [cropKey, cropVal] of Object.entries(cropsMap)) {
    if (clean.includes(cropKey)) {
      matchedCrop = cropVal;
      break;
    }
  }

  // Extract quantity in quintals if mentioned (e.g. "50 क्विंटल", "100 qtl", "30 quintal")
  let extractedQty: number | null = null;
  const qtyMatch = clean.match(/(\d+)\s*(क्विंटल|बोरी|qtl|quintal|quintals|कविंटल)/i) || clean.match(/(\d+)\s*(के लिए|का)/);
  if (qtyMatch && qtyMatch[1]) {
    extractedQty = parseInt(qtyMatch[1], 10);
  }

  // Extract phone number if 10-digit number spoken
  const phoneMatch = clean.match(/\b\d{10}\b/);
  const extractedPhone = phoneMatch ? phoneMatch[0] : (farmer?.phone || '9876543210');

  // Extract farmer name if given
  let extractedName = farmer?.name || 'रामपाल यादव';
  const nameMatch = clean.match(/किसान\s+([a-zA-Z\u0900-\u097F\s]+?)(?:का|की|को|में|\d)/i) || clean.match(/नाम\s+([a-zA-Z\u0900-\u097F\s]+?)(?:फोन|\d|मंडी)/i);
  if (nameMatch && nameMatch[1] && nameMatch[1].trim().length > 2) {
    extractedName = nameMatch[1].trim();
  }

  // 1. TOKEN BOOKING INTENT
  const isBookingReq = clean.includes('टोकन बुक') || clean.includes('पास बुक') || clean.includes('बुक करो') || clean.includes('अपॉइंटमेंट') || clean.includes('book token') || clean.includes('book pass') || clean.includes('टोकन विंडो') || clean.includes('टिकट बुक') || clean.includes('टोकन बनाना');

  if (isBookingReq) {
    const chosenCentre = targetCentre || centres[0];

    // Check if user provided FULL information to perform DIRECT AUTOMATIC BOOKING!
    const hasFullInfo = directBookToken && (
      (extractedQty !== null && matchedCrop !== null) ||
      clean.includes('डायरेक्ट बुक') ||
      clean.includes('कंफर्म बुक') ||
      clean.includes('पूरा टोकन')
    );

    if (hasFullInfo && directBookToken && chosenCentre) {
      const cropToBook = matchedCrop || { hi: 'गेहूं', en: 'Wheat (Sharbati)', id: 'wheat' };
      const quantityToBook = extractedQty || 50;

      try {
        const newToken = await directBookToken({
          farmerName: extractedName,
          farmerName_te: extractedName,
          phone: extractedPhone,
          centreId: chosenCentre.id,
          centreName: chosenCentre.name,
          cropId: cropToBook.id,
          cropName: cropToBook.en,
          quantityQuintals: quantityToBook,
          vehicleType: 'Tractor-Trolley (टैक्टर)',
          vehicleNumber: 'UP 53 AA 5555',
          slotDate: new Date().toISOString().split('T')[0],
          slotTime: '11:00 AM - 12:00 PM'
        });

        setActiveTab('queue');

        const hi = `किसान मदद: ${extractedName} जी, ${chosenCentre.name.split(' ')[0]} के लिए ${quantityToBook} क्विंटल ${cropToBook.hi} का टोकन सफलतापूर्वक बुक कर दिया गया है! आपका टोकन नंबर है ${newToken.tokenNumber}।`;
        const en = `Kisan Madad: Success! Token ${newToken.tokenNumber} booked for ${extractedName} at ${chosenCentre.name.split(' ')[0]} for ${quantityToBook} Qtl ${cropToBook.en}.`;
        const te = `కిసాన్ మదద్: ${chosenCentre.name} కోసం టోకెన్ ${newToken.tokenNumber} విజయవంతంగా బుక్ చేయబడింది.`;

        return {
          speechTextHi: hi,
          speechTextEn: en,
          speechTextTe: te,
          spokenMessage: lang === 'te' ? te : lang === 'hi' ? hi : en,
          actionTaken: 'DIRECT_BOOKING_SUCCESS',
          createdToken: newToken
        };
      } catch (err: any) {
        if (openBookingModal) openBookingModal(chosenCentre);
      }
    }

    // INTERACTIVE CHAT BOOKING FORM CARD
    const bookingFormPreset: InteractiveBookingData = {
      centreId: chosenCentre ? chosenCentre.id : (centres[0]?.id || 'PPC-01'),
      centreName: chosenCentre ? chosenCentre.name : (centres[0]?.name || 'Gorakhpur Mandi'),
      farmerName: extractedName,
      phone: extractedPhone,
      cropId: matchedCrop ? matchedCrop.id : 'wheat',
      cropName: matchedCrop ? matchedCrop.en : 'Wheat (Sharbati)',
      quantityQuintals: extractedQty || 50,
      slotTime: '10:30 AM - 11:30 AM',
      isBooked: false
    };

    if (openBookingModal) {
      openBookingModal(chosenCentre);
    }

    const hi = `किसान मदद: नीचे चैट कार्ड में ${chosenCentre ? chosenCentre.name.split(' ')[0] : 'क्रय केंद्र'} की जानकारी पुष्टि करके 'कन्फर्म टोकन बुक करें' बटन दबाएं।`;
    const en = `Kisan Madad: Please confirm details in the interactive chat card below to book your token for ${chosenCentre ? chosenCentre.name.split(' ')[0] : 'Mandi'}.`;
    const te = `కిసాన్ మదద్: టోకెన్ బుకింగ్ కార్డు కింద ఇవ్వబడింది.`;

    return {
      speechTextHi: hi,
      speechTextEn: en,
      speechTextTe: te,
      spokenMessage: lang === 'te' ? te : lang === 'hi' ? hi : en,
      actionTaken: 'INTERACTIVE_CHAT_BOOKING',
      bookingFormPreset
    };
  }

  // 2. CHECK ACTIVE TOKEN STATUS INTENT
  const isTokenStatusReq = clean.includes('मेरा टोकन') || clean.includes('टोकन स्थिति') || clean.includes('मेरी कतार') || clean.includes('लाइन में नंबर') || clean.includes('कतार बताओ') || clean.includes('my token') || clean.includes('token status') || clean.includes('my queue');
  if (isTokenStatusReq) {
    setActiveTab('queue');
    if (activeToken) {
      const statusText = activeToken.status === 'BOOKED' ? 'कतार में प्रतीक्षारत' : activeToken.status === 'COMPLETED' ? 'खरीद पूर्ण' : activeToken.status;
      const hi = `किसान मदद: आपका टोकन ${activeToken.tokenNumber} ${activeToken.centreName.split(' ')[0]} के लिए स्लॉट ${activeToken.slotTime} में दर्ज है। स्थिति: ${statusText}।`;
      const en = `Kisan Madad: Your active token ${activeToken.tokenNumber} is confirmed for ${activeToken.centreName.split(' ')[0]} (${activeToken.slotTime}). Status: ${activeToken.status}.`;
      const te = `కిసాన్ మదద్: మీ టోకెన్ ${activeToken.tokenNumber} నమోదైంది. స్థితి: ${activeToken.status}.`;
      return {
        speechTextHi: hi,
        speechTextEn: en,
        speechTextTe: te,
        spokenMessage: lang === 'te' ? te : lang === 'hi' ? hi : en,
        actionTaken: 'CHECK_TOKEN'
      };
    } else {
      const hi = 'किसान मदद: आपका कोई सक्रिय टोकन नहीं मिला। नया टोकन बुक करने के लिए कहें "गोरखपुर मंडी में टोकन बुक करो"।';
      const en = 'Kisan Madad: No active token found. Say "Book token for Gorakhpur Mandi" to generate a pass.';
      const te = 'కిసాన్ మదద్: యాక్టివ్ టోకెన్ ఏదీ లేదు.';
      return {
        speechTextHi: hi,
        speechTextEn: en,
        speechTextTe: te,
        spokenMessage: lang === 'te' ? te : lang === 'hi' ? hi : en,
        actionTaken: 'CHECK_TOKEN_EMPTY'
      };
    }
  }

  // 3. READ ANNOUNCEMENTS & ALERTS INTENT
  const isAlertReq = clean.includes('नोटिस') || clean.includes('सूचना') || clean.includes('अलर्ट') || clean.includes('अनाउंसमेंट') || clean.includes('खबर') || clean.includes('announcement') || clean.includes('alerts');
  if (isAlertReq) {
    const topAlert = announcements[0];
    if (topAlert) {
      const hi = `किसान मदद ताज़ा नोटिस: ${topAlert.title_hi || topAlert.title} - ${topAlert.message_hi || topAlert.message}`;
      const en = `Kisan Madad Latest Announcement: ${topAlert.title} - ${topAlert.message}`;
      const te = `కిసాన్ మదద్ తాజా సమాచారం: ${topAlert.title_te || topAlert.title}`;
      return {
        speechTextHi: hi,
        speechTextEn: en,
        speechTextTe: te,
        spokenMessage: lang === 'te' ? te : lang === 'hi' ? hi : en,
        actionTaken: 'READ_ANNOUNCEMENTS'
      };
    }
  }

  // 4. WEATHER & FARMER ADVISORY INTENT
  const isWeatherReq = clean.includes('मौसम') || clean.includes('बारिश') || clean.includes('धूप') || clean.includes('मौसम कैसा') || clean.includes('weather') || clean.includes('rain');
  if (isWeatherReq) {
    const hi = 'किसान मदद मौसम सलाह: आगामी 48 घंटों में मौसम साफ रहने का अनुमान है। कटी हुई फसल को सुखाने और मंडी क्रय केंद्र लाने के लिए अनुकूल समय है।';
    const en = 'Kisan Madad Weather Advisory: Clear weather expected over the next 48 hours. Favorable conditions for grain drying & transport.';
    const te = 'కిసాన్ మదద్ వాతావరణ సమాచారం: రాబోయే 48 గంటల్లో వాతావరణం అనుకూలంగా ఉంటుంది.';
    return {
      speechTextHi: hi,
      speechTextEn: en,
      speechTextTe: te,
      spokenMessage: lang === 'te' ? te : lang === 'hi' ? hi : en,
      actionTaken: 'WEATHER_ADVISORY'
    };
  }

  // 5. LANGUAGE CHANGE INTENT (Requires explicit command)
  const isEngSwitch = clean.includes('switch to english') || clean.includes('speak in english') || clean.includes('change language to english') || clean.includes('अंग्रेजी में बोलो') || clean.includes('अंग्रेजी में बदलो');
  if (isEngSwitch) {
    setLanguage('en');
    const hi = 'किसान मदद: भाषा बदलकर अंग्रेजी कर दी गई है।';
    const en = 'Kisan Madad: Switched language preference to English.';
    const te = 'Kisan Madad: Switched language to English.';
    return {
      speechTextHi: hi, speechTextEn: en, speechTextTe: te,
      spokenMessage: en,
      actionTaken: 'SET_LANG_EN'
    };
  }

  const isHindiSwitch = clean.includes('switch to hindi') || clean.includes('speak in hindi') || clean.includes('change language to hindi') || clean.includes('हिंदी में बोलो') || clean.includes('हिन्दी में बदलो');
  if (isHindiSwitch) {
    setLanguage('hi');
    const hi = 'किसान मदद: भाषा बदलकर हिंदी कर दी गई है।';
    const en = 'Kisan Madad: Switched language preference to Hindi.';
    const te = 'Kisan Madad: Switched language preference to Hindi.';
    return {
      speechTextHi: hi, speechTextEn: en, speechTextTe: te,
      spokenMessage: hi,
      actionTaken: 'SET_LANG_HI'
    };
  }

  const isTeluguSwitch = clean.includes('switch to telugu') || clean.includes('speak in telugu') || clean.includes('change language to telugu') || clean.includes('तेलुगु में बोलो') || clean.includes('తెలుగులో మాట్లాడు');
  if (isTeluguSwitch) {
    setLanguage('te');
    const hi = 'किसान मदद: भाषा बदलकर तेलुगु कर दी गई है।';
    const en = 'Kisan Madad: Switched language preference to Telugu.';
    const te = 'కిసాన్ మదద్: భాష తెలుగులోకి మార్చబడింది.';
    return {
      speechTextHi: hi, speechTextEn: en, speechTextTe: te,
      spokenMessage: te,
      actionTaken: 'SET_LANG_TE'
    };
  }

  // 10. GREETINGS & IDENTITY INTENT
  const isGreeting = clean.includes('नमस्ते') || clean.includes('नमस्कार') || clean.includes('हेलो') || clean.includes('हेय') || clean === 'hi' || clean === 'hello' || clean === 'hey' || clean.includes('आप कौन') || clean.includes('who are you') || clean.includes('नाम क्या है');
  if (isGreeting) {
    const hi = 'किसान मदद: नमस्ते किसान भाई! मैं आपका किसान मदद AI सहायक हूँ। मैं मंडी टोकन बुक करने, फसल MSP भाव बताने, कतार स्थिति देखने और सरकारी मंडी में फसल बेचने में आपकी सहायता कर सकता हूँ। बताएं, मैं आपकी क्या मदद करूँ?';
    const en = 'Kisan Madad: Hello farmer! I am your Kisan Madad AI Assistant. I can help you book mandi tokens, check MSP rates, track your active queue position, and locate nearest procurement centres. How can I help you today?';
    const te = 'కిసాన్ మదద్: నమస్కారం! నేను మీ కిసాన్ మదద్ AI సహాయకుడిని. టోకెన్ బుకింగ్, మద్దతు ధరలు మరియు కొనుగోలు కేంద్రాల వివరాల కోసం సహాయం చేయగలను.';
    return {
      speechTextHi: hi, speechTextEn: en, speechTextTe: te,
      spokenMessage: lang === 'te' ? te : lang === 'hi' ? hi : en,
      actionTaken: 'GREETING'
    };
  }

  // 11. GENERAL HELP & ASSISTANCE INTENT
  const isGeneralHelpReq = clean.includes('मदद') || clean.includes('सहायता') || clean.includes('help') || clean.includes('guide') || clean.includes('सहायक') || clean.includes('कैसे इस्तेमाल') || clean.includes('क्या कर सकते') || clean.includes('what can you do');
  if (isGeneralHelpReq) {
    const hi = 'किसान मदद: मैं आपकी पूरी सहायता के लिए तैयार हूँ! आप मुझसे ये कार्य करवा सकते हैं:\n1. 🎟️ "गोरखपुर मंडी में 50 क्विंटल गेहूं का टोकन बुक करो"\n2. 📊 "धान का एमएसपी भाव बताओ"\n3. ⏳ "मेरे टोकन की स्थिति क्या है"\n4. 📍 "पास की मंडी दिखाओ"\n5. 🌦️ "आज का मौसम बताओ"\nबताएं, मैं आपकी क्या मदद करूँ?';
    const en = 'Kisan Madad: I am here to assist you with all farming tasks:\n1. 🎟️ Book Mandi Procurement Tokens\n2. 📊 Check Crop MSP Rates & Prices\n3. ⏳ Track Active Token & Queue Position\n4. 📍 Locate Nearest Procurement Yards\n5. 🌦️ Weather & Official Farmer Advisories.\nHow can I help you right now?';
    const te = 'కిసాన్ మదద్: నేను టోకెన్ బుకింగ్, MSP ధరలు, లైవ్ క్యూ మరియు సమీప కొనుగోలు కేంద్రాల వివరాలలో మీకు సహాయం చేయగలను.';
    return {
      speechTextHi: hi, speechTextEn: en, speechTextTe: te,
      spokenMessage: lang === 'te' ? te : lang === 'hi' ? hi : en,
      actionTaken: 'GENERAL_HELP'
    };
  }

  // 12. CROP PROCUREMENT PROCESS / HOW TO SELL CROPS INTENT
  const isProcessReq = clean.includes('फसल कैसे बेचें') || clean.includes('प्रक्रिया क्या है') || clean.includes('फसल बेचना') || clean.includes('मंडी प्रक्रिया') || clean.includes('how to sell') || clean.includes('procurement process') || clean.includes('खरीद कैसे होगी') || clean.includes('कैसे बेचें');
  if (isProcessReq) {
    const hi = 'किसान मदद: सरकारी क्रय केंद्र (मंडी) में MSP पर फसल बेचने की आसान 4-चरण प्रक्रिया:\n1. ऑनलाइन समय स्लॉट चुनकर टोकन बुक करें।\n2. तय समय पर अपनी फसल ट्रॉली लेकर केंद्र पहुंचे।\n3. गेट पर डिजिटल टोकन/QR कोड दिखाकर तौल कराएं।\n4. फसल पास होने के 24-48 घंटे में भुगतान सीधे आपके बैंक खाते (DBT) में आ जाएगा।';
    const en = 'Kisan Madad: Simple 4-step mandi procurement process:\n1. Book a Digital Token online for your preferred slot.\n2. Bring your crop trolley to the centre on time.\n3. Show token QR code for quality test & weighing.\n4. Payment is directly transferred to your bank account via Direct Benefit Transfer (DBT) within 24-48 hours.';
    const te = 'కిసాన్ మదద్: పంట అమ్మకపు విధానం: టోకెన్ బుక్ చేసుకోండి, సమయానికి కేంద్రానికి రండి, తూకం ముగిసాక డబ్బు నేరుగా బ్యాంక్ ఖాతాలోకి వస్తుంది.';
    return {
      speechTextHi: hi, speechTextEn: en, speechTextTe: te,
      spokenMessage: lang === 'te' ? te : lang === 'hi' ? hi : en,
      actionTaken: 'PROCUREMENT_GUIDE'
    };
  }

  // 13. REQUIRED DOCUMENTS INTENT
  const isDocReq = clean.includes('कागजात') || clean.includes('दस्तावेज') || clean.includes('डॉक्यूमेंट') || clean.includes('कागज') || clean.includes('document') || clean.includes('documents') || clean.includes('aadhaar') || clean.includes('passbook') || clean.includes('खतौनी');
  if (isDocReq) {
    const hi = 'किसान मदद: मंडी में फसल बेचने के लिए आवश्यक दस्तावेज़:\n1. आधार कार्ड (Aadhaar Card)\n2. भूमि खसरा / खतौनी नकल\n3. बैंक पासबुक प्रति (DBT भुगतान हेतु)\n4. किसान पंजीकरण आईडी (Farmer ID)';
    const en = 'Kisan Madad: Required Documents for Mandi Procurement:\n1. Aadhaar Card\n2. Land Record (Khasra/Khatauni)\n3. Bank Passbook copy (for DBT payment)\n4. Farmer Registration ID.';
    const te = 'కిసాన్ మదద్: అవసరమైన పత్రాలు: ఆధార్ కార్డ్, పట్టాదార్ పాస్ పుస్తకం, బ్యాంక్ పాస్ బుక్ మరియు రైతు నమోదు ఐడి.';
    return {
      speechTextHi: hi, speechTextEn: en, speechTextTe: te,
      spokenMessage: lang === 'te' ? te : lang === 'hi' ? hi : en,
      actionTaken: 'DOCUMENTS_GUIDE'
    };
  }

  // 14. CANCEL / MODIFY TOKEN INTENT
  const isCancelReq = clean.includes('टोकन रद्द') || clean.includes('टोकन कैंसिल') || clean.includes('टोकन बदलना') || clean.includes('cancel token') || clean.includes('change token') || clean.includes('स्लॉट बदलना');
  if (isCancelReq) {
    setActiveTab('queue');
    const hi = 'किसान मदद: टोकन रद्द या बदलने के लिए "लाइव कतार" (Queue Tracker) टैब खोल दिया गया है। आपके सक्रिय टोकन कार्ड पर "रद्द करें" बटन दिया गया है। रद्द करने के बाद नया टोकन बुक कर सकते हैं।';
    const en = 'Kisan Madad: Opened Queue Tracker. To cancel or change your token slot, click "Cancel Token" on your active token card, then book a fresh token for your preferred time.';
    const te = 'కిసాన్ మదద్: టోకెన్ రద్దు చేయడానికి "లైవ్ క్యూ" విభాగాన్ని ఉపయోగించండి.';
    return {
      speechTextHi: hi, speechTextEn: en, speechTextTe: te,
      spokenMessage: lang === 'te' ? te : lang === 'hi' ? hi : en,
      actionTaken: 'CANCEL_TOKEN_GUIDE'
    };
  }

  // 15. PAYMENT & DBT INTENT
  const isPaymentReq = clean.includes('पैसा कब मिलेगा') || clean.includes('पेमेंट') || clean.includes('भुगतान') || clean.includes('payment') || clean.includes('dbt') || clean.includes('बैंक खाता') || clean.includes('money');
  if (isPaymentReq) {
    const hi = 'किसान मदद: क्रय केंद्र पर फसल तौल पूरा होने के 24 से 48 घंटों में भुगतान सीधे आपके आधार-लिंक्ड बैंक खाते में (DBT माध्यम से) जमा कर दिया जाता है।';
    const en = 'Kisan Madad: Payment is transferred directly to your Aadhaar-seeded bank account via Direct Benefit Transfer (DBT) within 24-48 hours after crop weighing.';
    const te = 'కిసాన్ మదద్: తూకం పూర్తయిన 24-48 గంటల్లో డబ్బు నేరుగా మీ బ్యాంక్ ఖాతాలో జమ అవుతుంది.';
    return {
      speechTextHi: hi, speechTextEn: en, speechTextTe: te,
      spokenMessage: lang === 'te' ? te : lang === 'hi' ? hi : en,
      actionTaken: 'PAYMENT_GUIDE'
    };
  }

  // 6. NEAREST MANDI INTENT
  const isNearestReq = clean.includes('पास की मंडी') || clean.includes('निकटतम') || clean.includes('नज़दीकी') || clean.includes('near me') || clean.includes('nearest mandi');
  if (isNearestReq) {
    detectUserLocation();
    setActiveTab('centres');
    const hi = 'किसान मदद: आपकी निकटतम मंडियों और क्रय केंद्रों की खोज की जा रही है।';
    const en = 'Kisan Madad: Locating nearest procurement yards & mandis based on your GPS.';
    const te = 'కిసాన్ మదద్: మీ సమీప కొనుగోలు కేంద్రాలను శోధిస్తోంది.';
    return {
      speechTextHi: hi, speechTextEn: en, speechTextTe: te,
      spokenMessage: lang === 'te' ? te : lang === 'hi' ? hi : en,
      actionTaken: 'LOCATE_NEAREST'
    };
  }

  // 7. MAP VIEW INTENT
  const isMapReq = clean.includes('नक्शा') || clean.includes('मानचित्र') || clean.includes('मैप') || clean.includes('map');
  if (isMapReq) {
    setActiveTab('map');
    const hi = 'किसान मदद: मंडियों की नक्शा स्थिति खोल दी गई है।';
    const en = 'Kisan Madad: Procurement yards interactive map view opened.';
    const te = 'కిసాన్ మదద్: కొనుగోలు కేంద్రాల మ్యాప్ తెరవబడింది.';
    return {
      speechTextHi: hi, speechTextEn: en, speechTextTe: te,
      spokenMessage: lang === 'te' ? te : lang === 'hi' ? hi : en,
      actionTaken: 'OPEN_MAP'
    };
  }

  // 8. PRICE & MSP INTENT
  const isPriceReq = clean.includes('मूल्य') || clean.includes('दाम') || clean.includes('रेट') || clean.includes('एमएसपी') || clean.includes('भाव') || clean.includes('price') || clean.includes('msp');
  if (isPriceReq) {
    setActiveTab('prices');
    const hi = 'किसान मदद: न्यूनतम समर्थन मूल्य (MSP) और बाजार भाव: धान ग्रेड-ए ₹2,300/क्विंटल, गेहूं ₹2,425/क्विंटल।';
    const en = 'Kisan Madad: Minimum Support Price (MSP) board opened. Paddy Grade-A: ₹2,300/Qtl, Wheat: ₹2,425/Qtl.';
    const te = 'కిసాన్ మదద్: మద్దతు ధరల జాబితా తెరవబడింది.';
    return {
      speechTextHi: hi, speechTextEn: en, speechTextTe: te,
      spokenMessage: lang === 'te' ? te : lang === 'hi' ? hi : en,
      actionTaken: 'OPEN_PRICES'
    };
  }

  // 9. QUEUE TRACKER INTENT
  const isQueueReq = (clean.includes('लाइन') || clean.includes('कतार') || clean.includes('queue') || clean.includes('tracker')) && !clean.includes('मंडी');
  if (isQueueReq) {
    setActiveTab('queue');
    const hi = 'किसान मदद: लाइव कतार और टोकन ट्रैकर स्थिति खोल दी गई है।';
    const en = 'Kisan Madad: Live queue status and token tracker opened.';
    const te = 'కిసాన్ మదద్: లైవ్ క్యూ స్టేటస్ తెరవబడింది.';
    return {
      speechTextHi: hi, speechTextEn: en, speechTextTe: te,
      spokenMessage: lang === 'te' ? te : lang === 'hi' ? hi : en,
      actionTaken: 'OPEN_QUEUE'
    };
  }

  // 10. SPECIFIC LOCATION OR CROP FILTERING
  if (targetCentre) {
    setActiveTab('centres');
    setSearchQuery(targetCentre.name.split(' ')[0]);
    const hi = `किसान मदद: केवल ${targetCentre.name} प्रदर्शित की जा रही है।`;
    const en = `Kisan Madad: Displaying only ${targetCentre.name}.`;
    const te = `కిసాన్ మదద్: ${targetCentre.name} చూపించబడుతోంది.`;
    return {
      speechTextHi: hi, speechTextEn: en, speechTextTe: te,
      spokenMessage: lang === 'te' ? te : lang === 'hi' ? hi : en,
      actionTaken: 'FILTER_LOCATION'
    };
  }

  if (matchedCrop) {
    setActiveTab('centres');
    setSelectedCrop(matchedCrop.id);
    setSearchQuery('');
    const hi = `किसान मदद: केवल ${matchedCrop.hi} स्वीकार करने वाले क्रय केंद्र प्रदर्शित किए जा रहे हैं।`;
    const en = `Kisan Madad: Displaying only centres accepting ${matchedCrop.en}.`;
    const te = `కిసాన్ మదద్: ${matchedCrop.en} కొనుగోలు కేంద్రాలు చూపించబడుతున్నాయి.`;
    return {
      speechTextHi: hi, speechTextEn: en, speechTextTe: te,
      spokenMessage: lang === 'te' ? te : lang === 'hi' ? hi : en,
      actionTaken: 'FILTER_CROP'
    };
  }

  // Clean generic filler words
  // 16. EXPLICIT MANDI / CENTRE SEARCH INTENT
  const isExplicitSearch = clean.includes('खोजो') || clean.includes('सर्च') || clean.includes('ढूंढो') || clean.includes('search') || clean.includes('mandi list') || clean.includes('केंद्र सूची') || clean.includes('सेंटर दिखाओ') || clean.includes('मंडी दिखाओ') || clean.includes('सेंटर लिस्ट');

  if (isExplicitSearch) {
    setActiveTab('centres');
    const searchKeyword = clean
      .replace(/किसान मदद|मंडी|उत्पादन|समिति|क्रय|केंद्र|सेंटर|दिखाओ|दिखाइए|खोलें|बताओ|का|की|के|में|स्थित|वाली|वाला|लिस्ट|सूची|खोजो|सर्च|ढूंढो|search/gi, '')
      .trim();

    const finalQuery = searchKeyword || command;
    setSearchQuery(finalQuery);
    const hi = `किसान मदद: "${finalQuery}" क्रय केंद्र खोजे जा रहे हैं।`;
    const en = `Kisan Madad: Searching procurement centres for "${finalQuery}".`;
    const te = `Kisan Madad: Searching centres for "${finalQuery}".`;

    return {
      speechTextHi: hi, speechTextEn: en, speechTextTe: te,
      spokenMessage: lang === 'te' ? te : lang === 'hi' ? hi : en,
      actionTaken: 'GENERIC_SEARCH'
    };
  }

  // 17. CONVERSATIONAL KNOWLEDGE BASE & HELPFUL ASSISTANT FALLBACK
  // (Do NOT redirect to centres search tab! Answer the user directly and offer task assistance)
  const hi = `किसान मदद: मैं आपकी बात समझ गया। "${command}" के संबंध में मैं आपकी पूरी सहायता कर सकता हूँ। आप चाहें तो मंडी टोकन बुक कर सकते हैं, फसल का MSP भाव जान सकते हैं या पास की मंडी ढूँढ सकते हैं। बताएं, मैं आपकी क्या सहायता करूँ?`;
  const en = `Kisan Madad: I understand your query regarding "${command}". I am here to help! You can book a mandi token, check MSP rates, or locate nearest procurement yards. What would you like me to do?`;
  const te = `Kisan Madad: I can help you regarding "${command}". Would you like to book a token or check MSP rates?`;

  return {
    speechTextHi: hi,
    speechTextEn: en,
    speechTextTe: te,
    spokenMessage: lang === 'te' ? te : lang === 'hi' ? hi : en,
    actionTaken: 'CONVERSATIONAL_HELP'
  };
}

