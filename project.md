# 🌾 Kisan H (किसान सेतु) — Project Documentation
### Smart Farmer Procurement Schedule & Status Information System

Kisan H (किसान सेतु) is an end-to-end, multilingual (English, Telugu, Hindi), real-time web application designed to streamline crop procurement, manage queues, and eliminate farmer distress at government procurement centres (Mandis, PACS, PPCs, FCI Godowns, CCI, and Markfed). It connects farmers directly with local Mandis, provides transparent slot booking, and gives real-time visibility into queue states.

---

## 🎯 Target Audience & Core Problem Solved
Government Mandis and Procurement Centres frequently suffer from congestion, long queues, lack of stock planning (e.g., gunny bag shortages), and general information asymmetry. Farmers often travel long distances only to find a Mandi closed or wait for days in physical queues.
**Kisan H** solves this by offering:
- **Direct OTP Login & Registration**: Persistent accounts for farmers linked to their phone number.
- **Searchable Directory & Live Map**: Proximity filtering (using GPS radius) and live status alerts.
- **Digital Slot Booking & Delivery Passes**: Farmers reserve a slot, preventing overcrowding.
- **Transparency**: Clear 5-stage queue updates and live MSP-vs-market rate estimator.
- **Officer Portal**: A secure interface where Mandi officers manage traffic, call tokens, and handle crop testing/weighment on-site.

---

## 🛠️ Technology Stack
The application is structured as a full-stack web application containing:
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Leaflet / React-Leaflet (for maps), jsPDF (for E-Pass download), QRCode (for delivery pass validation), and Canvas-Confetti.
- **Backend**: Node.js, Express.js REST API with full CRUD endpoints.
- **Database / Storage**: A JSON file-backed database (`server/data.json`) managed by an in-memory database controller (`server/db.js`), ensuring seed data and user accounts persist across system restarts.

---

## 🗂️ Project Directory Structure

```
kisan-h/
├── server/
│   ├── server.js               # Express REST API & SPA Static Server
│   ├── db.js                   # JSON database manager: CRUD for centres, tokens, farmers & alerts
│   ├── data.json                # Auto-generated JSON database (persists on write)
│   └── seedData.js             # Seed database containing pre-configured Mandis, crops, tokens, and alerts
├── src/
│   ├── main.tsx                # Frontend Entry Point (bootstraps React app inside Context Providers)
│   ├── App.tsx                 # Core UI Shell (manages top navigation, active tabs, modals, and layouts)
│   ├── types.ts                # TypeScript interfaces representing Centres, Tokens, Farmers, etc.
│   ├── translations.ts         # Multilingual translation dictionary (English, Telugu, Hindi)
│   ├── context/
│   │   ├── LanguageContext.tsx # Context managing active language (en, te, hi) and translation functions
│   │   └── AppContext.tsx      # Global state context (auth, centres list, filters, notifications, actions)
│   ├── components/
│   │   ├── Navbar.tsx              # Main header with language picker, notification bell, and login state
│   │   ├── FarmerAuthModal.tsx     # Handles mobile OTP verification (and registration details for new profiles)
│   │   ├── NotificationBell.tsx    # Slide-out/Dropdown showing farmer's SMS/App notification history
│   │   ├── AdminPinGate.tsx        # Screen guarding access to the Officer Portal via a secure PIN
│   │   ├── AlertBanner.tsx         # Top banner displaying critical weather or Mandi alerts with audio chimes
│   │   ├── CentreCard.tsx          # Card displaying operating hours, accepted crops, capacities, and active queue length
│   │   ├── CentreDetailModal.tsx   # Detailed modal showing storage capacity, gunny bags, contact info, and MSP
│   │   ├── MandiMapView.tsx        # OpenStreetMap view showing color-coded Mandis based on live status
│   │   ├── TokenBookingModal.tsx   # Multi-step booking form (details -> slot picker -> verification)
│   │   ├── LiveQueueTracker.tsx    # Progress tracker visualising the 5-stage pipeline for active tokens
│   │   ├── TokenPassModal.tsx      # E-Pass display with dynamic QR code, WhatsApp share link, and PDF export
│   │   ├── PriceBoard.tsx          # MSP rate catalog, market rate comparisons, YoY trends, and payout calculator
│   │   ├── VoiceAssistant.tsx      # Mic control for voice searches and speech synthesis updates
│   │   ├── AdminDashboard.tsx      # Officer console (update status, call tokens, verify moisture, trigger alerts)
│   │   └── AnalyticsModal.tsx      # Statewide metrics dashboard showing totals, averages, and targets
│   └── utils/
│       ├── distance.ts         # Haversine formula to compute distance (in km) between farmer and Mandi
│       ├── sound.ts            # Web Audio API synthesiser for alert chimes and TTS speech alerts
│       └── pdfExport.ts        # jsPDF-based generator producing printable E-passes with QR codes
├── public/
│   └── _redirects              # Static routing overrides for SPA hosting
├── tailwind.config.js          # Custom theme extensions (paper/ink theme, colors, fonts)
├── tsconfig.json               # TypeScript configurations
└── package.json                # Project dependencies and script runner configurations
```

---

## 🎨 Visual Design & Theme
- **Theme Style**: Clean, modern agricultural aesthetic.
- **Colors**:
  - Primary Green (`#16a34a` / `#14532d`): Represents farming, growth, and trust.
  - Accent Amber (`#d97706` / `#f59e0b`): Represents grain, harvest, and warmth.
  - Background Neutral (`#f8fafc` / `#ffffff`): A paper-like, clean workspace.
  - Typography Ink (`#0f172a`): High-contrast slate color for maximum readability under sunlight.
- **Responsive Layout**: Fluid flex/grid structures, optimized for mobile smartphones (used by farmers in fields) and desktop computers (used by Mandi officers).
- **Audio Chimes**: Uses Web Audio API synthetics to play clear notifications for queue callouts, status updates, and booking confirmations.

---

## 📑 Application Navigation & Tabs
The app employs a layout where a farmer or officer changes views via the navbar or sidebar tabs. The tabs are:

### 1. 🌾 Procurement Centres (`'centres'`)
- **Purpose**: Home directory of procurement centres.
- **Features**:
  - **Search & Filters**: Query input searching name/address/mandal, dropdown filters for crop types, district names, status (Open, Closed, Break), and GPS proximity radius (e.g., 5km, 10km, 25km).
  - **Mandi Card List**: Renders list of `CentreCard` components showing operating status, current wait time, accepted crops list with MSP, storage levels, and a "Book Token" action button.

### 2. 🗺️ Map View (`'map'`)
- **Purpose**: Geospatial representation of nearby centres.
- **Features**:
  - Uses **Leaflet Map** to render markers representing Mandis.
  - Markers are color-coded based on the centre's status (Green for Open, Yellow for Break, Blue for Quota Full, Red for Closed).
  - Shows farmer's GPS location with a radius boundary circle. Clicking markers opens details and allows slot bookings.

### 3. 🪙 MSP Prices (`'prices'`)
- **Purpose**: Market rates board and calculator.
- **Features**:
  - Displays list of commodities (Paddy, Wheat, Cotton, Maize, Soyabean, Chilli, Turmeric, Groundnut).
  - Details for each crop include MSP rate, current open market average, YoY trends, and acceptable moisture standards.
  - **Interactive Estimator**: Input crop type and weight (in quintals) to instantly compute the total payout, showing standard government bonus/incentive breakdowns.

### 4. 🎟️ Live Queue (`'queue'`)
- **Purpose**: Real-time progress tracker.
- **Features**:
  - Displays the active E-Pass token details and QR code if booked.
  - **5-Stage Pipeline Status**: Renders a stepper detailing the token's stage:
    1. **Booked** (Confirmed booking)
    2. **Gate Entry** (Checked-in at Mandi entrance)
    3. **Moisture Testing** (Grain quality approved)
    4. **Weighment** (Actual weight recorded)
    5. **Payment Disbursed** (DBT transaction completed)
  - Displays Mandi-wide queue states showing the token currently being served and list of waiting vehicles.

### 5. 📊 Analytics (`'analytics'`)
- **Purpose**: Transparent dashboard showing state-wide procurement.
- **Features**:
  - Displays key performance indicators: Total grain procured, total payout disbursed, average wait times, active gunny bags stock, and crop-wise share diagrams.
  - Helps farmers see which districts have lower wait times.

### 6. 🔒 Officer Portal (`'admin'`)
- **Purpose**: Admin dashboard for Mandi management.
- **Features**:
  - Guarded by an `AdminPinGate` modal requiring a 4-digit PIN (Default: `1234`).
  - **Operating Panel**: Toggles Mandi state (Open, Closed, Lunch Break, Quota Full) with custom explanations that push instantly as notices to waiting farmers.
  - **Active Queue Control**: Click "Call Next Token" to advance queue (synthesizes audio chime and voice callout).
  - **Step-by-Step Validation Form**: Input moisture levels during quality inspection, assign grades, log scale weight, compute final payout, and transition tokens.
  - **Alert Broadcast Form**: Dispatch emergency warnings (e.g. rain/weather warnings, storage delays) directly to the notification logs of farmers booked at the centre.

---

## 🔄 Core Workflows & User Journeys

### A. Farmer Registration & Login
1. **Enter Phone Number**: Farmer provides a 10-digit number.
2. **Demo OTP Generation**: Backend generates a 4-digit code. In demo mode, it displays instantly in the UI.
3. **Verification**: Enter OTP. If registration details (Name, Village, District) are required, farmer enters them.
4. **Active Session**: Farmer profile is stored in localStorage, enabling notifications and personalized dashboard updates.

### B. E-Token Booking & Delivery
1. Farmer navigates to **Procurement Centres** tab, searches for a Mandi, and clicks **"Book Digital Token"**.
2. **Details Page**: Form pre-fills profile name and phone. Farmer enters Aadhaar last 4 digits, bank passbook/registration number, crop type, quantity (quintals), vehicle type (Tractor, Truck, DCM, Bull-Cart), and registration plate number.
3. **Slot Picker**: Farmer selects a date. The UI calls `GET /api/centres/:id/slots` to query remaining capacities. Full slots are disabled. Farmer selects an hour slot (e.g., `09:30 AM - 10:30 AM`).
4. **Pass Generation**: After booking, confetti triggers, and `TokenPassModal` renders the E-Pass. Farmer can:
   - Export pass as PDF (via `pdfExport.ts` / jsPDF) containing government seal, barcode, instructions, and QR code.
   - Share to WhatsApp (opens `api.whatsapp.com` with formatted text details).

### C. Queue Lifecycle Management (Mandi Processing)
1. **Gate Entry**: Farmer arrives at Mandi. Gate operator scans the pass QR code. Status transitions from `BOOKED` to `CHECKED_IN`.
2. **Moisture Quality Test**: Officer opens `AdminDashboard`, selects the token under **Quality Testing**. Measures moisture. If moisture is below the crop's threshold (e.g., Paddy < 17%, Wheat < 12%), officer submits values. Status transitions to `TESTING`.
3. **Weighment**: Tractor pulls onto the electronic scale. Officer logs actual weight in quintals. System calculates payout: `Weight * (MSP + Bonus)`. Status transitions to `WEIGHING`.
4. **DBT Payout**: Payout is disbursed to bank account. Status transitions to `PAID`.
5. **Completion**: Vehicle departs. Status transitions to `COMPLETED` and token is archived.

---

## 🗄️ Database Schema & Data Models

The local file-backed database manages six primary object types:

### 1. `ProcurementCentre`
```typescript
interface ProcurementCentre {
  id: string;                     // Unique identifier (e.g. "PPC-TS-01")
  name: string;                   // English name
  name_te?: string;               // Telugu translation
  name_hi?: string;               // Hindi translation
  type: string;                   // Entity type (Mandi, PACS, PPC, FCI, etc.)
  district: string;
  mandal: string;
  state: string;
  address: string;
  lat: number;                    // GPS Latitude
  lng: number;                    // GPS Longitude
  status: 'open' | 'closed' | 'break' | 'quota_full';
  statusReason: string;
  statusReason_te?: string;
  statusReason_hi?: string;
  timings: {
    open: string;
    close: string;
    lunchBreak: string;
    workingDays: string;
  };
  acceptedCrops: Array<{
    cropId: string;
    name: string;
    msp: number;
    bonus: number;
    dailyQuotaQuintals: number;
    procuredTodayQuintals: number;
    maxMoisture: number;
    status: 'accepting' | 'full' | 'paused';
  }>;
  queue: {
    totalTokensIssuedToday: number;
    currentlyServingToken: string | null;
    activeQueueCount: number;
    avgMinutesPerToken: number;
    estimatedWaitTimeMinutes: number;
  };
  facilities: {
    coveredYard: boolean;
    electronicWeighbridge: boolean;
    moistureTestingLab: boolean;
    drinkingWater: boolean;
    canteen: boolean;
    restingShed: boolean;
    gunnyBagsStock: number;
    storageCapacityQuintals: number;
    occupiedCapacityQuintals: number;
  };
  contact: {
    officerName: string;
    phone: string;
    helpdesk: string;
  };
  rating: number;
}
```

### 2. `DigitalToken`
```typescript
interface DigitalToken {
  tokenNumber: string;            // Formatted ID (e.g., "KST-041")
  centreId: string;
  centreName: string;
  farmerName: string;
  farmerName_te?: string;
  phone: string;
  aadhaarLast4: string;
  passbookNo: string;
  cropId: string;
  cropName: string;
  quantityQuintals: number;
  vehicleType: string;
  vehicleNumber: string;
  slotDate: string;               // YYYY-MM-DD
  slotTime: string;               // Range description
  status: 'BOOKED' | 'CHECKED_IN' | 'TESTING' | 'WEIGHING' | 'PAID' | 'COMPLETED' | 'CANCELLED';
  moistureMeasured: number | null;
  gradeAssigned: string | null;
  totalWeightQuintals: number | null;
  netPayableAmount: number | null;
  issuedAt: string;               // ISO date-time
  completedAt?: string;           // ISO date-time
}
```

### 3. `Farmer`
```typescript
interface Farmer {
  id: string;                     // Incremental ID
  name: string;
  phone: string;                  // 10-digit primary key
  village: string;
  district: string;
  preferredLanguage: 'en' | 'te' | 'hi';
  createdAt: string;
}
```

---

## 📡 REST API Specifications

The Express API is exposed on port `5001`. Officer-facing mutations check the header `x-admin-pin` matching the env variable `ADMIN_PIN` (defaults to `1234`).

### Public Endpoints
- **Health Check**: `GET /api/health` -> Confirms server availability.
- **List Mandis**: `GET /api/centres` -> Fetch lists. Supports query variables (`query`, `cropId`, `district`, `status`, `maxDistance`, `userLat`, `userLng`). Calculates haversine distance when GPS coords are sent.
- **Get Mandi Details**: `GET /api/centres/:id` -> Detailed specifications.
- **Check Slot Capacities**: `GET /api/centres/:id/slots?date=YYYY-MM-DD` -> Returns hourly quotas and availability.
- **List Tokens**: `GET /api/tokens` -> Filterable by `centreId`, `phone`, or `status`.
- **Get Token**: `GET /api/tokens/:tokenNumber` -> Single E-Pass specifications.
- **Book Token**: `POST /api/tokens` -> Books a slot. Validates daily limits and double bookings.
- **MSP Price Catalog**: `GET /api/prices` -> Yields baseline MSP comparison data.
- **Read Active Broadcasts**: `GET /api/announcements` -> Weather and emergency logs.
- **Get Analytics Summary**: `GET /api/analytics` -> Accumulates global totals for dashboards.
- **Request OTP**: `POST /api/farmers/otp/request` -> Generates 4-digit code. In demo mode, OTP is logged to console and returned in body.
- **Verify OTP**: `POST /api/farmers/otp/verify` -> Validates OTP, authenticates, and registers profile.
- **Farmer Profile**: `GET /api/farmers/:phone` -> Load user data.
- **Notifications Log**: `GET /api/notifications?phone=...` -> History of SMS alerts sent to farmer.
- **Mark Notice Read**: `PATCH /api/notifications/:id/read` -> Updates state.
- **Mark All Notices Read**: `POST /api/notifications/read-all` -> Clear notifications indicator.

### Officer / Admin Mutation Endpoints (Require `x-admin-pin` header)
- **Change Mandi Operating Status**: `PATCH /api/centres/:id/status` -> Sets open/closed states.
- **Configure Crop Quotas**: `POST /api/centres/:id/crops` -> Update limits, status, bonus.
- **Advance Queue / Call Next**: `POST /api/queue/:centreId/call-next` -> Dequeues token and updates active token display.
- **Update Token Stages**: `PATCH /api/tokens/:tokenNumber/status` -> Inspects and weigh-logs vehicle token.
- **Broadcast Mandi Announcement**: `POST /api/announcements` -> Pushes weather / emergency notices to registered farmers.
- **System Reset**: `POST /api/reset` -> Restores database to original seeded state.
