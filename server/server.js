import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { db } from './db.js';

const app = express();
const PORT = process.env.PORT || 5001;

// Officer/Admin Portal PIN. Change this via an environment variable in production
// (e.g. `ADMIN_PIN=482913 npm run server`). Defaults to 1234 for the hackathon demo.
const ADMIN_PIN = process.env.ADMIN_PIN || '1234';

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Guards every centre-officer/admin mutation behind a PIN so a farmer can't spoof
// centre status, call tokens, or broadcast alerts just by knowing the API shape.
function requireAdminPin(req, res, next) {
  const pin = req.headers['x-admin-pin'];
  if (!pin || String(pin) !== String(ADMIN_PIN)) {
    return res.status(401).json({ success: false, message: 'Invalid or missing Officer Portal PIN.' });
  }
  next();
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), system: 'Kisan H Backend API' });
});

// --- CENTRES ENDPOINTS ---

// GET /api/centres - Search & filter procurement centres
app.get('/api/centres', (req, res) => {
  try {
    const { query, cropId, district, status, maxDistance, userLat, userLng } = req.query;
    const centres = db.getCentres({ query, cropId, district, status, maxDistance, userLat, userLng });
    res.json({ success: true, count: centres.length, data: centres });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/centres/:id/slots?date=YYYY-MM-DD - Slot-wise capacity & availability
// Powers the booking UI so farmers pick an open slot instead of piling into one.
app.get('/api/centres/:id/slots', (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const slots = db.getSlotAvailability(req.params.id, date);
    if (!slots) {
      return res.status(404).json({ success: false, message: 'Centre not found' });
    }
    res.json({ success: true, date, data: slots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/centres/:id - Get detailed centre info
app.get('/api/centres/:id', (req, res) => {
  try {
    const centre = db.getCentreById(req.params.id);
    if (!centre) {
      return res.status(404).json({ success: false, message: 'Procurement centre not found' });
    }
    res.json({ success: true, data: centre });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/centres/:id/status - Update centre open/closed/break status [OFFICER ONLY]
app.patch('/api/centres/:id/status', requireAdminPin, (req, res) => {
  try {
    const { status, statusReason, statusReason_te } = req.body;
    const updated = db.updateCentreStatus(req.params.id, { status, statusReason, statusReason_te });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Centre not found' });
    }
    res.json({ success: true, message: 'Centre status updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/centres/:id/crops - Update/Add accepted crop [OFFICER ONLY]
app.post('/api/centres/:id/crops', requireAdminPin, (req, res) => {
  try {
    const { cropId, status, dailyQuotaQuintals, msp, bonus } = req.body;
    const updated = db.updateCentreCrop(req.params.id, { cropId, status, dailyQuotaQuintals, msp, bonus });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Centre or Crop not found' });
    }
    res.json({ success: true, message: 'Crop configuration updated', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- DIGITAL TOKENS & QUEUE ENDPOINTS ---

// GET /api/tokens - List or filter tokens
app.get('/api/tokens', (req, res) => {
  try {
    const { centreId, phone, status } = req.query;
    const tokens = db.getTokens({ centreId, phone, status });
    res.json({ success: true, count: tokens.length, data: tokens });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/tokens/:tokenNumber - Get specific token
app.get('/api/tokens/:tokenNumber', (req, res) => {
  try {
    const token = db.getTokenByNumber(req.params.tokenNumber);
    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }
    res.json({ success: true, data: token });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/tokens - Generate / Book a new digital token
app.post('/api/tokens', (req, res) => {
  try {
    const { farmerName, farmerName_te, phone, centreId, cropId, quantityQuintals, vehicleType, vehicleNumber, slotDate, slotTime, aadhaarLast4, passbookNo } = req.body;

    if (!farmerName || !phone || !centreId || !cropId) {
      return res.status(400).json({ success: false, message: 'Missing required fields (farmerName, phone, centreId, cropId)' });
    }

    const token = db.createToken({
      farmerName,
      farmerName_te,
      phone,
      centreId,
      cropId,
      quantityQuintals,
      vehicleType,
      vehicleNumber,
      slotDate,
      slotTime,
      aadhaarLast4,
      passbookNo
    });

    res.status(201).json({
      success: true,
      message: 'Token booked successfully! Digital QR pass generated.',
      data: token
    });
  } catch (error) {
    // Slot-full / duplicate-booking errors carry their own status (409) and a
    // farmer-facing message set in db.createToken; anything else is a real
    // server error.
    res.status(error.status || 500).json({ success: false, message: error.message, code: error.code });
  }
});

// PATCH /api/tokens/:tokenNumber/status - Transition token status [OFFICER ONLY]
app.patch('/api/tokens/:tokenNumber/status', requireAdminPin, (req, res) => {
  try {
    const { status, moistureMeasured, gradeAssigned, totalWeightQuintals, netPayableAmount } = req.body;
    const token = db.updateTokenStatus(req.params.tokenNumber, {
      status,
      moistureMeasured,
      gradeAssigned,
      totalWeightQuintals,
      netPayableAmount,
      updatedAt: new Date().toISOString()
    });

    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    res.json({ success: true, message: `Token status moved to ${status}`, data: token });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/queue/:centreId/call-next - Admin calls next token in queue [OFFICER ONLY]
app.post('/api/queue/:centreId/call-next', requireAdminPin, (req, res) => {
  try {
    const result = db.callNextToken(req.params.centreId);
    if (!result.centre) {
      return res.status(404).json({ success: false, message: 'Centre not found' });
    }
    res.json({
      success: true,
      message: result.token ? `Now calling Token ${result.token.tokenNumber}` : 'No waiting tokens found',
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- MSP CATALOG & PRICES ---

// GET /api/prices - Get MSP rates & market prices
app.get('/api/prices', (req, res) => {
  try {
    const catalog = db.getMspCatalog();
    res.json({ success: true, data: catalog });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- ANNOUNCEMENTS & ALERTS ---

// GET /api/announcements - Get all active alerts
app.get('/api/announcements', (req, res) => {
  try {
    const alerts = db.getAnnouncements();
    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/announcements - Broadcast new alert [OFFICER ONLY]
app.post('/api/announcements', requireAdminPin, (req, res) => {
  try {
    const { centreId, centreName, title, title_te, title_hi, message, message_te, message_hi, severity } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }
    const newAlert = db.createAnnouncement({ centreId, centreName, title, title_te, title_hi, message, message_te, message_hi, severity });
    res.status(201).json({ success: true, message: 'Announcement broadcasted successfully', data: newAlert });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- ANALYTICS SUMMARY ---

// GET /api/analytics - Get procurement analytics
app.get('/api/analytics', (req, res) => {
  try {
    const analytics = db.getAnalytics();
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- FARMER REGISTRATION, LOGIN (OTP) & PROFILE ---

// POST /api/farmers/otp/request - Request a login/registration OTP for a phone number.
// DEMO NOTE: No real SMS gateway is configured, so the OTP is returned in the response
// (and logged server-side) instead of being delivered over SMS. See db.requestOtp().
app.post('/api/farmers/otp/request', (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'A valid 10-digit phone number is required' });
    }
    const otp = db.requestOtp(phone);
    const existingFarmer = db.getFarmerByPhone(phone);
    res.json({
      success: true,
      message: 'OTP generated (demo mode - no live SMS gateway connected).',
      demoOtp: otp,
      isNewFarmer: !existingFarmer
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/farmers/otp/verify - Verify OTP and log in / register the farmer.
app.post('/api/farmers/otp/verify', (req, res) => {
  try {
    const { phone, otp, name, village, district, preferredLanguage } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    }
    const result = db.verifyOtp(phone, otp);
    if (!result.ok) {
      return res.status(401).json({ success: false, message: result.reason });
    }
    const farmer = db.getOrCreateFarmer({ name, phone, village, district, preferredLanguage });
    db.persist();
    res.json({ success: true, message: 'Login successful', data: farmer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/farmers/:phone - Fetch a farmer profile
app.get('/api/farmers/:phone', (req, res) => {
  try {
    const farmer = db.getFarmerByPhone(req.params.phone);
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer not registered' });
    }
    res.json({ success: true, data: farmer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- NOTIFICATIONS (in-app SMS/Push notification log) ---

// GET /api/notifications?phone=... - Get notification history for a farmer
app.get('/api/notifications', (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'phone query param is required' });
    }
    const list = db.getNotifications(phone);
    res.json({ success: true, count: list.length, unread: list.filter(n => !n.read).length, data: list });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/notifications/:id/read - Mark a single notification as read
app.patch('/api/notifications/:id/read', (req, res) => {
  try {
    const n = db.markNotificationRead(req.params.id);
    if (!n) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, data: n });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/notifications/read-all - Mark all notifications for a phone as read
app.post('/api/notifications/read-all', (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'phone is required' });
    const list = db.markAllNotificationsRead(phone);
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/reset - Reset demo data to initial state [OFFICER ONLY]
app.post('/api/reset', requireAdminPin, (req, res) => {
  try {
    db.reset();
    res.json({ success: true, message: 'System data reset to default seed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- VOICE CHAT HISTORY PERSISTENCE ENDPOINTS ---

// GET /api/voice/history?phone=... - Fetch saved voice chat history for a farmer/guest
app.get('/api/voice/history', (req, res) => {
  try {
    const phone = req.query.phone || 'default';
    const history = db.getVoiceHistory(phone);
    res.json({ success: true, count: history.length, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/voice/history - Save or append voice chat history
app.post('/api/voice/history', (req, res) => {
  try {
    const { phone = 'default', message, messages } = req.body;
    let history;
    if (messages && Array.isArray(messages)) {
      history = db.saveVoiceHistory(phone, messages);
    } else if (message) {
      history = db.appendVoiceMessage(phone, message);
    } else {
      return res.status(400).json({ success: false, message: 'message or messages required' });
    }
    res.json({ success: true, count: history.length, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/voice/history?phone=... - Clear voice chat history
app.delete('/api/voice/history', (req, res) => {
  try {
    const phone = req.query.phone || req.body?.phone || 'default';
    db.clearVoiceHistory(phone);
    res.json({ success: true, message: 'Voice chat history cleared' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- SARVAM AI HINDI & INDIC VOICE ASSISTANT ENDPOINTS ---

// POST /api/sarvam/tts - Convert Hindi/Indic text to natural speech using Sarvam AI (Bulbul)
app.post('/api/sarvam/tts', async (req, res) => {
  try {
    const { text, target_language_code = 'hi-IN', speaker = 'priya', pace = 1.0, pitch = 0, model = 'bulbul:v1' } = req.body;
    const apiKey = req.headers['x-sarvam-api-key'] || process.env.SARVAM_API_KEY || 'sk_pp61jsrl_xeCHA8qZTlH96EKPQ1i4wJ5q';

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'No Sarvam AI API Key provided. Provide X-Sarvam-Api-Key header or SARVAM_API_KEY env var.'
      });
    }

    const payload = {
      inputs: [text],
      target_language_code,
      speaker: speaker || 'priya',
      pace: typeof pace === 'number' ? pace : parseFloat(pace) || 1.0,
      speech_sample_rate: 16000,
      enable_preprocessing: true,
      model: model || 'bulbul:v1'
    };

    if (pitch !== undefined && pitch !== 0) {
      payload.pitch = typeof pitch === 'number' ? pitch : parseFloat(pitch);
    }

    const sarvamRes = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey
      },
      body: JSON.stringify(payload)
    });

    const json = await sarvamRes.json();
    if (!sarvamRes.ok) {
      return res.status(sarvamRes.status).json({ success: false, message: json.message || 'Sarvam AI TTS Error', error: json });
    }

    res.json({ success: true, audioBase64: json.audios ? json.audios[0] : null, model: payload.model, speaker: payload.speaker });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/sarvam/stt - Transcribe Hindi audio using Sarvam AI (Saarika)
app.post('/api/sarvam/stt', async (req, res) => {
  try {
    const { audioBase64, language_code = 'hi-IN' } = req.body;
    const apiKey = req.headers['x-sarvam-api-key'] || process.env.SARVAM_API_KEY || 'sk_pp61jsrl_xeCHA8qZTlH96EKPQ1i4wJ5q';

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'No Sarvam AI API Key provided. Provide X-Sarvam-Api-Key header or SARVAM_API_KEY env var.'
      });
    }

    // Convert base64 audio to form-data for Sarvam AI Saarika endpoint
    const buffer = Buffer.from(audioBase64.replace(/^data:audio\/\w+;base64,/, ''), 'base64');
    const BlobClass = globalThis.Blob;
    const FormDataClass = globalThis.FormData;

    if (!FormDataClass) {
      return res.status(500).json({ success: false, message: 'FormData not available on server' });
    }

    const form = new FormDataClass();
    const audioBlob = new BlobClass([buffer], { type: 'audio/wav' });
    form.append('file', audioBlob, 'speech.wav');
    form.append('model', 'saarika:v2');
    form.append('language_code', language_code);

    const sarvamRes = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: {
        'api-subscription-key': apiKey
      },
      body: form
    });

    const json = await sarvamRes.json();
    if (!sarvamRes.ok) {
      return res.status(sarvamRes.status).json({ success: false, message: json.message || 'Sarvam AI STT Error', error: json });
    }

    res.json({ success: true, transcript: json.transcript, model: 'saarika:v2' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve static files from the React dist directory if it exists
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '..', 'dist');

app.use(express.static(distPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      next();
    }
  });
});

// Start Express Server only when run directly (not serverless)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌾 Kisan H API Server running on port ${PORT}`);
    console.log(`📍 Endpoint: http://localhost:${PORT}/api/centres`);
    console.log(`🔐 Officer Portal PIN: ${ADMIN_PIN} (set ADMIN_PIN env var to change)`);
  });
}

export default app;
