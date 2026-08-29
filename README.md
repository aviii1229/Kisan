# 🌾 Kisan H (किसान सेतु)
### Smart Farmer Procurement Schedule & Status Information System

An end-to-end, multilingual (English, Telugu, Hindi), real-time web application built to eliminate farmer distress at government procurement centres (Mandis, PACS, PPCs, FCI Godowns, CCI, and Markfed).

---

## 🎯 Problem Statement Addressed
Farmers frequently face huge uncertainties regarding nearby procurement centres:
- **Long waiting times & no visibility** into token progress or procurement status.
- **Lack of information** on procurement schedules, quotas, and MSP rates.
- **No easy way to register, book a slot, or get notified** when it's their turn.

## 💡 Solution Overview
**Kisan H** connects farmers directly to procurement centres with:

1. **Farmer Registration & OTP Login** — Farmers register with name/village/district and log in with a mobile OTP. Bookings and notifications are tied to their account and persist across visits.
2. **Real-time Centre Finder & Map View** — Instant GPS radius filter, live Open/Closed/Break status badges, operating hours, accepted crops with MSP rates, gunny bag availability, and storage capacity meters.
3. **Digital Token & Queue Management System** — 3-step slot booking generating an official **Digital Delivery E-Pass with QR Code**, accompanied by a live 5-stage queue tracker (Booked ➔ Gate Entry ➔ Moisture Testing ➔ Weighment ➔ Payment Disbursed) and audio bell alerts.
4. **In-App Notification Centre (SMS/App alerts)** — Every booking, queue call, status change, and officer broadcast pushes a notification to the farmer's account, visible via the bell icon in the navbar. *(Demo mode: no live SMS gateway is wired up, so OTPs and alerts are shown in-app/console instead of over a carrier — see "Going to production" below for how to plug one in.)*
5. **Multilingual & Voice Assistance** — Native support for **Telugu (తెలుగు)**, **Hindi (हिंदी)**, and **English**, complete with speech synthesis and voice search.
6. **PIN-Protected Officer Portal** — Centre officers unlock the admin dashboard with a PIN before they can toggle centre status, call the next token, or broadcast alerts — a farmer can no longer spoof these actions.
7. **Persistent Backend Storage** — All centres, tokens, farmer accounts, and notifications are saved to `server/data.json` on every change, so a server restart no longer wipes demo data.
8. **MSP Price Board & Incentive Calculator** — Live MSP vs open market price comparison, YoY trends, moisture standards, and instant payout estimator including state government bonuses.
9. **Downloadable & Printable QR Passes** — Export official delivery passes with QR codes via jsPDF and share directly on WhatsApp.

---

## 🏗️ Architecture & Tech Stack

```
kisan-h/
├── server/
│   ├── server.js               # Express REST API & SPA Static Server
│   ├── db.js                   # Persisted store: centres, tokens, farmers, OTP & notifications
│   ├── data.json                # Auto-generated on first run — the persisted database
│   └── seedData.js             # Pre-seeded Mandis, MSP catalog, tokens & alerts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── types.ts                # Complete TypeScript interfaces
│   ├── translations.ts         # Comprehensive Telugu, English, Hindi dictionaries
│   ├── context/
│   │   ├── LanguageContext.tsx # Multilingual state & switchers
│   │   └── AppContext.tsx      # Global store, farmer auth, notifications, admin PIN
│   ├── components/
│   │   ├── Navbar.tsx              # Navigation, account menu, notification bell
│   │   ├── FarmerAuthModal.tsx     # Farmer registration & OTP login
│   │   ├── NotificationBell.tsx    # In-app notification centre
│   │   ├── AdminPinGate.tsx        # PIN screen guarding the Officer Portal
│   │   ├── AlertBanner.tsx         # Weather & urgent procurement alerts + audio
│   │   ├── CentreCard.tsx          # Rich procurement centre cards
│   │   ├── CentreDetailModal.tsx   # Storage capacity, quotas & moisture tester
│   │   ├── MandiMapView.tsx        # Interactive Leaflet map with radius circle
│   │   ├── TokenBookingModal.tsx   # 3-step slot & token booking flow (auto-fills from your profile)
│   │   ├── LiveQueueTracker.tsx    # Real-time queue tracker & 5-stage progress
│   │   ├── TokenPassModal.tsx      # Official QR pass with PDF export & WhatsApp share
│   │   ├── PriceBoard.tsx          # Live MSP vs Market Price & Bonus Calculator
│   │   ├── VoiceAssistant.tsx      # Speech Recognition & Text-To-Speech engine
│   │   ├── AdminDashboard.tsx      # Officer terminal (toggle status, call next, test quality)
│   │   └── AnalyticsModal.tsx      # Statewide procurement transparency metrics
│   └── utils/
│       ├── distance.ts         # Haversine distance calculator
│       ├── sound.ts            # Web Audio chime synthesizer & TTS
│       └── pdfExport.ts        # Official PDF Delivery Pass generator
```

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Leaflet / React-Leaflet, jsPDF, QRCode, Canvas-Confetti.
- **Backend**: Node.js, Express.js REST API with full CRUD, OTP auth, and a JSON-file-backed persistence layer.

---

## 🚀 How to Run the Project

### 1. Installation
```bash
npm install
```

### 2. Build the Application
```bash
npm run build
```

### 3. Run the Server
```bash
npm run server
```
Access the application at: **`http://localhost:5001`** (or `http://localhost:5173` if running `npm run dev`).

### Officer Portal PIN
The Officer Portal is protected by a PIN. It defaults to **`1234`**. To change it, set the `ADMIN_PIN` environment variable before starting the server, e.g.:
```bash
# macOS/Linux
ADMIN_PIN=482913 npm run server

# Windows PowerShell
$env:ADMIN_PIN="482913"; npm run server
```

### Farmer Login (OTP)
Since no live SMS gateway is connected in this demo, requesting an OTP returns it directly in the UI (and logs it to the server console) instead of texting it. Enter that OTP in the login modal to continue. Swap `db.requestOtp()` in `server/db.js` for a real provider (Twilio, MSG91, the Govt. SMS Gateway, etc.) to go live.

---

## 🌟 Demo Walkthrough

1. **Farmer Experience**:
   - Open `http://localhost:5001`.
   - Click **"Login / Register"** in the top-right, enter your phone number, and complete the demo OTP flow. New numbers are asked for a name/village/district; returning numbers log straight in.
   - Toggle language to **తెలుగు (Telugu)** or **हिंदी (Hindi)** to see instant full-UI translation.
   - Filter by District, Crop, Status, or use **"Use My Location"**.
   - Click **"Book Digital Token"** — your name/phone auto-fill from your profile if logged in.
   - Watch the confetti, get your token, and download the **Official QR Delivery Pass (PDF)**.
   - Click the **bell icon** to see notifications about your booking as it moves through the queue.

2. **Officer Experience (Admin Portal)**:
   - Click **"Officer Portal"**, enter the PIN (default `1234`).
   - Click **"Call Next Token"**, mark tokens through Gate-In → Moisture Test → Payment.
   - Switch centre status between Open / Break / Quota Full — affected farmers get a notification automatically.
   - Broadcast an emergency alert — it's pushed to every farmer with an active token at that centre.

3. **Interactive Map & Voice Assistant**:
   - Click **"Map View"** for an OpenStreetMap view with color-coded status markers.
   - Click **"Voice"** to search or ask questions by speaking in Telugu, Hindi, or English.

---

## 🛠️ Going to Production
This project ships in a hackathon-ready "demo mode." Before a real deployment, consider:
- **Real SMS gateway**: replace the console-logged OTP/notification stubs in `server/db.js` with a provider (Twilio, MSG91, Govt. SMS Gateway).
- **Real database**: swap the JSON-file store in `server/db.js` for Postgres/MySQL/MongoDB for multi-instance deployments.
- **Stronger auth**: the Officer PIN and farmer OTP flows are intentionally lightweight for a demo — add proper session tokens/JWTs and rate limiting for production traffic.
- **Payments**: wire the "Payment Disbursed" step to a real DBT/bank transfer API instead of the simulated status update.

## 🏛️ Government & Social Impact
- Eliminates multi-day physical wait times for small and marginal farmers.
- Gives farmers a persistent account and a real-time notification trail instead of guesswork.
- Ensures 100% transparency in MSP payout calculations and Direct Benefit Transfer (DBT).
- Reduces traffic congestion and vehicle idling near major Mandi market yards.
