import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MSP_CATALOG, INITIAL_CENTRES, INITIAL_TOKENS, INITIAL_ANNOUNCEMENTS } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Persisted on disk so farmer accounts, bookings & notifications survive server restarts.
const DATA_FILE = path.join(__dirname, 'data.json');

// In-Memory Database Store (snapshotted to a JSON file on every write)
class Database {
  constructor() {
    this.otps = {}; // { phone: { otp, expiresAt } } - transient, never persisted to disk
    this.load();
  }

  // Load persisted state from disk, or fall back to the seed data on first run.
  load() {
    if (fs.existsSync(DATA_FILE)) {
      try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const saved = JSON.parse(raw);
        this.centres = saved.centres || JSON.parse(JSON.stringify(INITIAL_CENTRES));
        this.tokens = saved.tokens || JSON.parse(JSON.stringify(INITIAL_TOKENS));
        this.mspCatalog = saved.mspCatalog || JSON.parse(JSON.stringify(MSP_CATALOG));
        this.announcements = saved.announcements || JSON.parse(JSON.stringify(INITIAL_ANNOUNCEMENTS));
        this.farmers = saved.farmers || [];
        this.notifications = saved.notifications || [];
        this.nextSeq = saved.nextSeq || 46;
        this.nextFarmerSeq = saved.nextFarmerSeq || 1;
        this.nextNotifSeq = saved.nextNotifSeq || 1;
        return;
      } catch (e) {
        console.warn('⚠️  Could not parse persisted data.json, reseeding fresh data.', e.message);
      }
    }
    this.resetDemoOnly();
    this.farmers = [];
    this.notifications = [];
    this.nextFarmerSeq = 1;
    this.nextNotifSeq = 1;
    this.persist();
  }

  // Reset only the demo procurement data (centres/tokens/prices/announcements).
  // Farmer accounts and their notification history are real user data and are NOT wiped by this.
  resetDemoOnly() {
    this.centres = JSON.parse(JSON.stringify(INITIAL_CENTRES));
    this.tokens = JSON.parse(JSON.stringify(INITIAL_TOKENS));
    this.mspCatalog = JSON.parse(JSON.stringify(MSP_CATALOG));
    this.announcements = JSON.parse(JSON.stringify(INITIAL_ANNOUNCEMENTS));
    this.nextSeq = 46;
  }

  reset() {
    this.resetDemoOnly();
    this.persist();
  }

  // Write the full store to disk. Called after every mutation so a server restart never loses data.
  persist() {
    try {
      const snapshot = {
        centres: this.centres,
        tokens: this.tokens,
        mspCatalog: this.mspCatalog,
        announcements: this.announcements,
        farmers: this.farmers,
        notifications: this.notifications,
        nextSeq: this.nextSeq,
        nextFarmerSeq: this.nextFarmerSeq,
        nextNotifSeq: this.nextNotifSeq
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(snapshot, null, 2));
    } catch (e) {
      console.error('⚠️  Failed to persist data.json:', e.message);
    }
  }

  // Centre queries
  getCentres({ query, cropId, district, status, maxDistance, userLat, userLng }) {
    let results = [...this.centres];

    if (query) {
      const q = query.toLowerCase().trim();
      results = results.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.name_te && c.name_te.toLowerCase().includes(q)) ||
        c.district.toLowerCase().includes(q) ||
        c.mandal.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q)
      );
    }

    if (cropId && cropId !== 'all') {
      results = results.filter(c =>
        c.acceptedCrops.some(ac => ac.cropId === cropId && ac.status !== 'closed')
      );
    }

    if (district && district !== 'all') {
      results = results.filter(c =>
        c.district.toLowerCase() === district.toLowerCase()
      );
    }

    if (status && status !== 'all') {
      results = results.filter(c => c.status === status);
    }

    // Distance calculation if userLat and userLng provided
    if (userLat && userLng) {
      const lat1 = parseFloat(userLat);
      const lon1 = parseFloat(userLng);
      results = results.map(c => {
        const dist = this.calculateDistance(lat1, lon1, c.lat, c.lng);
        return { ...c, distanceKm: Math.round(dist * 10) / 10 };
      });

      if (maxDistance && !isNaN(parseFloat(maxDistance))) {
        const maxD = parseFloat(maxDistance);
        results = results.filter(c => c.distanceKm <= maxD);
      }

      // Sort by closest distance
      results.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    }

    return results;
  }

  getCentreById(id) {
    return this.centres.find(c => c.id === id);
  }

  // --- SLOT CAPACITY MANAGEMENT ---
  // Standard delivery slots offered at every centre. Each slot has a maximum
  // number of tokens it can hold, sized off the centre's own processing speed
  // (queue.avgMinutesPerToken) so busier/slower centres naturally get smaller
  // per-slot quotas. This is what actually prevents over-booking and the
  // resulting congestion at the gate, rather than just recording a queue after
  // the fact.
  static STANDARD_SLOTS = [
    '08:30 AM - 09:30 AM',
    '09:30 AM - 10:30 AM',
    '10:30 AM - 11:30 AM',
    '11:30 AM - 12:30 PM',
    '02:00 PM - 03:00 PM',
    '03:00 PM - 04:00 PM'
  ];

  getSlotCapacity(centre) {
    // Explicit override wins if a centre officer has configured one.
    if (centre.maxTokensPerSlot) return centre.maxTokensPerSlot;
    const avgMins = (centre.queue && centre.queue.avgMinutesPerToken) || 8;
    // 60-minute slot / time-per-token, clamped to a sane demo range.
    const capacity = Math.round(60 / avgMins);
    return Math.max(4, Math.min(30, capacity));
  }

  // Returns booked (non-cancelled) count per slot for a centre/date.
  getSlotBookedCounts(centreId, slotDate) {
    const counts = {};
    this.tokens.forEach(t => {
      if (t.centreId === centreId && t.slotDate === slotDate && t.status !== 'CANCELLED') {
        counts[t.slotTime] = (counts[t.slotTime] || 0) + 1;
      }
    });
    return counts;
  }

  // Full availability breakdown for the booking UI: every standard slot with
  // its capacity, current booked count, remaining seats, and whether it's full.
  getSlotAvailability(centreId, slotDate) {
    const centre = this.getCentreById(centreId);
    if (!centre) return null;
    const capacity = this.getSlotCapacity(centre);
    const booked = this.getSlotBookedCounts(centreId, slotDate);
    return Database.STANDARD_SLOTS.map(slotTime => {
      const bookedCount = booked[slotTime] || 0;
      return {
        slotTime,
        capacity,
        booked: bookedCount,
        remaining: Math.max(0, capacity - bookedCount),
        isFull: bookedCount >= capacity
      };
    });
  }

  updateCentreStatus(id, { status, statusReason, statusReason_te }) {
    const centre = this.getCentreById(id);
    if (!centre) return null;
    if (status) centre.status = status;
    if (statusReason) centre.statusReason = statusReason;
    if (statusReason_te) centre.statusReason_te = statusReason_te;

    // Notify farmers who currently hold an active token at this centre
    if (status) {
      const affected = this.tokens.filter(t => t.centreId === id && ['BOOKED', 'CHECKED_IN', 'TESTING', 'WEIGHING'].includes(t.status));
      const uniquePhones = [...new Set(affected.map(t => t.phone))];
      uniquePhones.forEach(phone => {
        this.addNotification({
          phone,
          type: 'status',
          severity: status === 'open' ? 'success' : status === 'closed' ? 'alert' : 'warning',
          title: `${centre.name} status updated`,
          title_te: `${centre.name_te || centre.name} స్థితి మారింది`,
          title_hi: `${centre.name_hi || centre.name} की स्थिति अपडेट हुई`,
          message: statusReason || `Centre is now marked as ${status.replace('_', ' ')}.`,
          message_te: statusReason_te || `కేంద్రం ఇప్పుడు ${status} గా గుర్తించబడింది.`,
          message_hi: statusReason || `केंद्र अब ${status.replace('_', ' ')} के रूप में चिह्नित है।`,
          centreId: id
        });
      });
    }

    this.persist();
    return centre;
  }

  updateCentreCrop(id, { cropId, status, dailyQuotaQuintals, msp, bonus }) {
    const centre = this.getCentreById(id);
    if (!centre) return null;
    const crop = centre.acceptedCrops.find(c => c.cropId === cropId);
    if (crop) {
      if (status) crop.status = status;
      if (dailyQuotaQuintals !== undefined) crop.dailyQuotaQuintals = Number(dailyQuotaQuintals);
      if (msp !== undefined) crop.msp = Number(msp);
      if (bonus !== undefined) crop.bonus = Number(bonus);
    } else {
      // Add new crop
      const mspInfo = this.mspCatalog.find(m => m.id === cropId);
      if (mspInfo) {
        centre.acceptedCrops.push({
          cropId,
          name: mspInfo.name,
          name_te: mspInfo.name_te,
          msp: msp || mspInfo.msp,
          bonus: bonus || 0,
          dailyQuotaQuintals: dailyQuotaQuintals || 2000,
          procuredTodayQuintals: 0,
          maxMoisture: mspInfo.maxMoisture,
          status: status || 'accepting'
        });
      }
    }
    this.persist();
    return centre;
  }

  // Token & Queue operations
  getTokens(filter = {}) {
    let list = [...this.tokens];
    if (filter.centreId) {
      list = list.filter(t => t.centreId === filter.centreId);
    }
    if (filter.phone) {
      list = list.filter(t => t.phone.includes(filter.phone));
    }
    if (filter.status) {
      list = list.filter(t => t.status === filter.status);
    }
    return list;
  }

  getTokenByNumber(tokenNumber) {
    return this.tokens.find(t => t.tokenNumber.toUpperCase() === tokenNumber.toUpperCase());
  }

  createToken(data) {
    const centre = this.getCentreById(data.centreId);
    const crop = this.mspCatalog.find(c => c.id === data.cropId);

    // Enforce per-slot capacity so a slot can't be over-booked past what the
    // centre can actually process in that hour — this is the core congestion
    // control the problem statement asks for, not just a queue display.
    if (centre) {
      const slotDate = data.slotDate || new Date().toISOString().split('T')[0];
      const slotTime = data.slotTime || '11:00 AM - 12:00 PM';
      const capacity = this.getSlotCapacity(centre);
      const bookedCounts = this.getSlotBookedCounts(data.centreId, slotDate);
      const bookedInSlot = bookedCounts[slotTime] || 0;
      if (bookedInSlot >= capacity) {
        const err = new Error(`This slot (${slotTime}) is fully booked for ${slotDate}. Please choose another slot.`);
        err.status = 409;
        err.code = 'SLOT_FULL';
        throw err;
      }

      // Also guard against a farmer double-booking an active token at the
      // same centre for the same day, which is a common source of no-shows
      // and phantom congestion counts.
      const dup = this.tokens.find(t =>
        t.phone === data.phone &&
        t.centreId === data.centreId &&
        t.slotDate === slotDate &&
        !['CANCELLED', 'COMPLETED', 'PAID'].includes(t.status)
      );
      if (dup) {
        const err = new Error(`You already have an active token (${dup.tokenNumber}) at this centre for ${slotDate}.`);
        err.status = 409;
        err.code = 'DUPLICATE_BOOKING';
        throw err;
      }
    }

    const tokenSeq = this.nextSeq++;
    const tokenNumber = `KST-${String(tokenSeq).padStart(3, '0')}`;

    const newToken = {
      tokenNumber,
      centreId: data.centreId,
      centreName: centre ? centre.name : "Procurement Centre",
      farmerName: data.farmerName,
      farmerName_te: data.farmerName_te || data.farmerName,
      phone: data.phone,
      aadhaarLast4: data.aadhaarLast4 || data.phone.slice(-4),
      passbookNo: data.passbookNo || `TS-PPB-${Math.floor(1000 + Math.random() * 9000)}`,
      cropId: data.cropId,
      cropName: crop ? crop.name : data.cropId,
      quantityQuintals: parseFloat(data.quantityQuintals) || 20,
      vehicleType: data.vehicleType || "Tractor-Trolley",
      vehicleNumber: data.vehicleNumber || "TS 03 AA " + Math.floor(1000 + Math.random() * 9000),
      slotDate: data.slotDate || new Date().toISOString().split('T')[0],
      slotTime: data.slotTime || "11:00 AM - 12:00 PM",
      status: "BOOKED",
      moistureMeasured: null,
      gradeAssigned: null,
      totalWeightQuintals: null,
      netPayableAmount: null,
      issuedAt: new Date().toISOString()
    };

    this.tokens.push(newToken);

    // Update centre queue metrics
    if (centre) {
      centre.queue.totalTokensIssuedToday += 1;
      centre.queue.activeQueueCount += 1;
      centre.queue.estimatedWaitTimeMinutes = centre.queue.activeQueueCount * (centre.queue.avgMinutesPerToken || 8);
    }

    // Auto-register/update a lightweight farmer profile from booking details
    this.getOrCreateFarmer({
      name: data.farmerName,
      phone: data.phone,
      aadhaarLast4: newToken.aadhaarLast4,
      passbookNo: newToken.passbookNo
    });

    this.addNotification({
      phone: data.phone,
      type: 'booking',
      severity: 'success',
      title: `Digital Token ${tokenNumber} Confirmed`,
      title_te: `డిజిటల్ టోకెన్ ${tokenNumber} నిర్ధారించబడింది`,
      title_hi: `डिजिटल टोकन ${tokenNumber} की पुष्टि हो गई`,
      message: `Your slot at ${newToken.centreName} on ${newToken.slotDate} (${newToken.slotTime}) is booked. Show your QR pass at the gate.`,
      message_te: `${newToken.centreName} వద్ద ${newToken.slotDate} (${newToken.slotTime}) కు మీ స్లాట్ బుక్ చేయబడింది. గేటు వద్ద మీ QR పాస్ చూపించండి.`,
      message_hi: `${newToken.centreName} पर ${newToken.slotDate} (${newToken.slotTime}) का आपका स्लॉट बुक हो गया है। कृपया गेट पर अपना QR पास दिखाएं।`,
      tokenNumber,
      centreId: data.centreId
    });

    this.persist();
    return newToken;
  }

  updateTokenStatus(tokenNumber, updateData) {
    const token = this.getTokenByNumber(tokenNumber);
    if (!token) return null;

    Object.assign(token, updateData);

    const centre = this.getCentreById(token.centreId);
    if (centre && (updateData.status === 'COMPLETED' || updateData.status === 'PAID')) {
      centre.queue.activeQueueCount = Math.max(0, centre.queue.activeQueueCount - 1);
      centre.queue.estimatedWaitTimeMinutes = centre.queue.activeQueueCount * (centre.queue.avgMinutesPerToken || 8);

      // Add to procured today
      const crop = centre.acceptedCrops.find(c => c.cropId === token.cropId);
      if (crop) {
        crop.procuredTodayQuintals += (token.totalWeightQuintals || token.quantityQuintals);
      }
    }

    if (updateData.status) {
      const statusCopy = {
        CHECKED_IN: { en: 'You have been checked in at the gate.', te: 'మీరు గేటు వద్ద చెక్-ఇన్ చేయబడ్డారు.', hi: 'आपको गेट पर चेक-इन कर लिया गया है।' },
        TESTING: { en: 'Your token has been called! Proceed for moisture & quality testing.', te: 'మీ టోకెన్ పిలవబడింది! తేమ మరియు నాణ్యత పరీక్ష కోసం వెళ్లండి.', hi: 'आपका टोकन बुलाया गया है! नमी एवं गुणवत्ता जांच हेतु आगे बढ़ें।' },
        WEIGHING: { en: 'Quality approved. Proceed to the electronic weighbridge.', te: 'నాణ్యత ఆమోదించబడింది. ఎలక్ట్రానిక్ వేబ్రిడ్జికి వెళ్లండి.', hi: 'गुणवत्ता स्वीकृत। इलेक्ट्रॉनिक धर्मकांटे की ओर बढ़ें।' },
        PAID: { en: 'Payment disbursed to your linked bank account. Thank you!', te: 'మీ బ్యాంకు ఖాతాకు చెల్లింపు జమ చేయబడింది. ధన్యవాదాలు!', hi: 'आपके बैंक खाते में भुगतान जमा कर दिया गया है। धन्यवाद!' },
        COMPLETED: { en: 'Procurement completed successfully. Drive safe!', te: 'సేకరణ విజయవంతంగా పూర్తయింది. జాగ్రత్తగా వెళ్ళండి!', hi: 'खरीद सफलतापूर्वक पूर्ण हुई। सुरक्षित यात्रा करें!' },
        CANCELLED: { en: 'Your token has been cancelled.', te: 'మీ టోకెన్ రద్దు చేయబడింది.', hi: 'आपका टोकन रद्द कर दिया गया है।' }
      };
      const copy = statusCopy[updateData.status];
      if (copy) {
        this.addNotification({
          phone: token.phone,
          type: 'status',
          severity: updateData.status === 'CANCELLED' ? 'alert' : 'info',
          title: `Token ${tokenNumber}: ${updateData.status.replace('_', ' ')}`,
          title_te: `టోకెన్ ${tokenNumber}: ${updateData.status.replace('_', ' ')}`,
          title_hi: `टोकन ${tokenNumber}: ${updateData.status.replace('_', ' ')}`,
          message: copy.en,
          message_te: copy.te,
          message_hi: copy.hi,
          tokenNumber,
          centreId: token.centreId
        });
      }
    }

    this.persist();
    return token;
  }

  callNextToken(centreId) {
    const centre = this.getCentreById(centreId);
    if (!centre) return null;

    // Find first token in CHECKED_IN or BOOKED state for this centre
    const activeTokens = this.tokens.filter(t =>
      t.centreId === centreId &&
      ['BOOKED', 'CHECKED_IN'].includes(t.status)
    );

    if (activeTokens.length > 0) {
      const nextToken = activeTokens[0];
      nextToken.status = 'TESTING';
      centre.queue.currentlyServingToken = nextToken.tokenNumber;
      centre.queue.activeQueueCount = Math.max(1, centre.queue.activeQueueCount);

      this.addNotification({
        phone: nextToken.phone,
        type: 'status',
        severity: 'info',
        title: `It's your turn! Token ${nextToken.tokenNumber} called`,
        title_te: `మీ వంతు వచ్చింది! టోకెన్ ${nextToken.tokenNumber} పిలవబడింది`,
        title_hi: `आपकी बारी आ गई! टोकन ${nextToken.tokenNumber} बुलाया गया`,
        message: `Please proceed to ${centre.name} counter now for moisture & quality testing.`,
        message_te: `దయచేసి ఇప్పుడు ${centre.name_te || centre.name} కౌంటర్ వద్దకు వెళ్లండి.`,
        message_hi: `कृपया अभी ${centre.name_hi || centre.name} काउंटर पर नमी एवं गुणवत्ता जांच हेतु पहुंचें।`,
        tokenNumber: nextToken.tokenNumber,
        centreId
      });

      this.persist();
      return { centre, token: nextToken };
    }

    return { centre, token: null };
  }

  // Announcements
  getAnnouncements() {
    return this.announcements;
  }

  createAnnouncement(data) {
    const newAnn = {
      id: `ANN-${Date.now().toString().slice(-4)}`,
      centreId: data.centreId || "ALL",
      centreName: data.centreName || "All Procurement Centres",
      title: data.title,
      title_te: data.title_te || data.title,
      title_hi: data.title_hi || data.title,
      message: data.message,
      message_te: data.message_te || data.message,
      message_hi: data.message_hi || data.message,
      severity: data.severity || "info",
      timestamp: new Date().toISOString(),
      isActive: true
    };
    this.announcements.unshift(newAnn);

    // Push a simulated SMS/App notification to every farmer with an active token
    // at the target centre (or all farmers, if the alert targets "ALL" centres).
    const targetTokens = data.centreId && data.centreId !== 'ALL'
      ? this.tokens.filter(t => t.centreId === data.centreId)
      : this.tokens;
    const uniquePhones = [...new Set(targetTokens.map(t => t.phone))];
    uniquePhones.forEach(phone => {
      this.addNotification({
        phone,
        type: 'announcement',
        severity: newAnn.severity,
        title: newAnn.title,
        title_te: newAnn.title_te,
        title_hi: newAnn.title_hi,
        message: newAnn.message,
        message_te: newAnn.message_te,
        message_hi: newAnn.message_hi,
        centreId: data.centreId
      });
    });

    this.persist();
    return newAnn;
  }

  // --- Farmer accounts ---
  getFarmerByPhone(phone) {
    return this.farmers.find(f => f.phone === phone);
  }

  getOrCreateFarmer({ name, phone, village, district, preferredLanguage, aadhaarLast4, passbookNo }) {
    let farmer = this.getFarmerByPhone(phone);
    if (farmer) {
      if (name) farmer.name = name;
      if (village) farmer.village = village;
      if (district) farmer.district = district;
      if (preferredLanguage) farmer.preferredLanguage = preferredLanguage;
      if (aadhaarLast4) farmer.aadhaarLast4 = aadhaarLast4;
      if (passbookNo) farmer.passbookNo = passbookNo;
      return farmer;
    }
    farmer = {
      id: `FARMER-${String(this.nextFarmerSeq++).padStart(4, '0')}`,
      name: name || 'Farmer',
      phone,
      village: village || '',
      district: district || '',
      preferredLanguage: preferredLanguage || 'en',
      aadhaarLast4: aadhaarLast4 || '',
      passbookNo: passbookNo || '',
      createdAt: new Date().toISOString()
    };
    this.farmers.push(farmer);
    return farmer;
  }

  // --- OTP-based login (dev/demo mode: no real SMS gateway is configured, so the
  // OTP is returned directly in the API response and logged server-side instead of
  // being sent over an SMS carrier. Swap requestOtp()'s console.log for a real
  // provider call - e.g. Twilio, MSG91, or the Govt. SMS Gateway - in production). ---
  requestOtp(phone) {
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    this.otps[phone] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };
    console.log(`📲 [SMS SIMULATION] OTP for ${phone} is ${otp} (valid 5 minutes)`);
    return otp;
  }

  verifyOtp(phone, otp) {
    const record = this.otps[phone];
    if (!record) return { ok: false, reason: 'No OTP was requested for this number.' };
    if (Date.now() > record.expiresAt) {
      delete this.otps[phone];
      return { ok: false, reason: 'OTP expired. Please request a new one.' };
    }
    if (record.otp !== String(otp)) {
      return { ok: false, reason: 'Incorrect OTP.' };
    }
    delete this.otps[phone];
    return { ok: true };
  }

  // --- Notifications (in-app "SMS/App notification" log) ---
  addNotification({ phone, type, severity, title, title_te, title_hi, message, message_te, message_hi, tokenNumber, centreId }) {
    const notif = {
      id: `NOTIF-${String(this.nextNotifSeq++).padStart(5, '0')}`,
      phone,
      type: type || 'system',
      severity: severity || 'info',
      title,
      title_te: title_te || title,
      title_hi: title_hi || title,
      message,
      message_te: message_te || message,
      message_hi: message_hi || message,
      tokenNumber: tokenNumber || null,
      centreId: centreId || null,
      read: false,
      createdAt: new Date().toISOString()
    };
    this.notifications.unshift(notif);
    // Cap history per install to keep the JSON file small
    if (this.notifications.length > 2000) {
      this.notifications = this.notifications.slice(0, 2000);
    }
    return notif;
  }

  getNotifications(phone) {
    return this.notifications.filter(n => n.phone === phone);
  }

  markNotificationRead(id) {
    const n = this.notifications.find(n => n.id === id);
    if (!n) return null;
    n.read = true;
    this.persist();
    return n;
  }

  markAllNotificationsRead(phone) {
    this.notifications.filter(n => n.phone === phone).forEach(n => { n.read = true; });
    this.persist();
    return this.getNotifications(phone);
  }

  // MSP & Prices
  getMspCatalog() {
    return this.mspCatalog;
  }

  // Analytics summary
  getAnalytics() {
    let totalProcuredQuintals = 0;
    let totalDailyQuota = 0;
    let openCentresCount = 0;
    let totalActiveTokens = 0;

    this.centres.forEach(c => {
      if (c.status === 'open') openCentresCount++;
      c.acceptedCrops.forEach(ac => {
        totalProcuredQuintals += (ac.procuredTodayQuintals || 0);
        totalDailyQuota += (ac.dailyQuotaQuintals || 0);
      });
      totalActiveTokens += (c.queue.activeQueueCount || 0);
    });

    const cropStats = {};
    this.mspCatalog.forEach(m => {
      cropStats[m.id] = {
        name: m.name,
        name_hi: m.name_hi,
        totalProcured: 0
      };
    });

    this.centres.forEach(c => {
      c.acceptedCrops.forEach(ac => {
        if (cropStats[ac.cropId]) {
          cropStats[ac.cropId].totalProcured += (ac.procuredTodayQuintals || 0);
        }
      });
    });

    return {
      totalCentres: this.centres.length,
      openCentresCount,
      totalProcuredQuintals,
      totalDailyQuota,
      procurementPercentage: Math.round((totalProcuredQuintals / (totalDailyQuota || 1)) * 100),
      totalActiveTokens,
      cropStats: Object.values(cropStats)
    };
  }

  // Haversine formula
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }
}

export const db = new Database();
