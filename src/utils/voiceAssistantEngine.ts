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

  // 5. LANGUAGE CHANGE INTENT
  if (clean.includes('अंग्रेजी में') || clean.includes('अंग्रेजी बोलो') || clean.includes('english language') || clean.includes('switch to english')) {
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
  if (clean.includes('हिंदी में') || clean.includes('हिन्दी बोलो') || clean.includes('hindi language') || clean.includes('switch to hindi')) {
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
  if (clean.includes('तेलुगु') || clean.includes('తెలుగు') || clean.includes('telugu')) {
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
  setActiveTab('centres');

  if (targetCentre) {
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
  const searchKeyword = clean
    .replace(/किसान मदद|मंडी|उत्पादन|समिति|क्रय|केंद्र|सेंटर|दिखाओ|दिखाइए|खोलें|बताओ|का|की|के|में|स्थित|वाली|वाला|लिस्ट|सूची/gi, '')
    .trim();

  const finalQuery = searchKeyword || command;
  setSearchQuery(finalQuery);
  const hi = `किसान मदद: ${finalQuery} क्रय केंद्र प्रदर्शित किया जा रहा है।`;
  const en = `Kisan Madad: Searching procurement centres for "${finalQuery}".`;
  const te = `కిసాన్ మదద్: "${finalQuery}" కేంద్రాలు వెతకబడుతున్నాయి.`;

  return {
    speechTextHi: hi,
    speechTextEn: en,
    speechTextTe: te,
    spokenMessage: lang === 'te' ? te : lang === 'hi' ? hi : en,
    actionTaken: 'GENERIC_SEARCH'
  };
}
