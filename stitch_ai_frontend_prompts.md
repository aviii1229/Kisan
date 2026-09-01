# 🌾 Kisan Setu (किसान सेतु) — Stitch AI Frontend Design & Prompt Suite

> **Theme**: Calm, Soothing, Organic Agriculture & Government Transparency  
> **Backend Base URL**: `http://localhost:5001/api`  
> **Primary Color Palette**: Soothing Sage/Mint (`#b5d6cc`), Forest Green (`#1E4D3B`), Warm Cream/Sand (`#FAF7F0`), Earth Slate (`#3A4D46`), Gold Accents (`#D9A036`)

---

## 🎨 Design System Guidelines (For Stitch AI)

When generating UI components in Stitch AI, apply these core visual and structural principles:

- **Mood & Aesthetics**: Simple, tranquil, highly accessible for rural farmers. Soft rounded corners (`rounded-2xl`), subtle shadows, glassmorphism (`backdrop-blur-md`), and high legibility.
- **Typography**: Clean serif/sans blend — Inter or Outfit for clean metrics; Warm serif for titles (`Playfair Display` or `Merriweather`).
- **Language Support**: Seamless multi-language rendering for **English**, **Telugu (తెలుగు)**, and **Hindi (हिंदी)**.
- **Responsive Layout**: Mobile-first with a bottom navigation bar on screens `< lg` and top ribbon header on `>= lg`.

---

## 📋 Master System Prompt (Global Context)

Copy and paste this master prompt into **Stitch AI** to establish the foundation and design system:

```text
Build a calm, soothing, and elegant web application called "Kisan Setu" (Government Agriculture Procurement & Mandi Queue Management System).

DESIGN SYSTEM:
- Theme: Peaceful, clean rural agriculture. Soft organic palette with Soothing Sage (#b5d6cc), Forest Green (#1E4D3B), Warm Sand (#FAF7F0), Muted Slate (#4A5D55), and Soft Amber (#D9A036).
- Style: Ultra-clean UI with soft rounded corners (rounded-2xl), subtle inner glows, glassmorphic headers (backdrop-blur-md), and spacious padding.
- Typography: High readability typography supporting English, Hindi (हिंदी), and Telugu (తెలుగు).

BACKEND API & DATA MODELS:
- Base API URL: http://localhost:5001/api
- Key Resources:
  1. GET /api/centres — List procurement mandis with status (open/closed/quota_full), facilities, accepted crops, queue metrics.
  2. GET /api/centres/:id — Detailed centre info.
  3. POST /api/tokens/book — Book digital queue pass (Farmer Name, Phone, Aadhaar, Crop, Quintals, Slot Time).
  4. GET /api/tokens/my-tokens?phone=X — Retrieve active digital tokens for a farmer.
  5. GET /api/prices — MSP (Minimum Support Price) catalog with market price comparison and moisture limits.
  6. GET /api/analytics — State procurement statistics, total quintals, daily quotas, crop breakdown.
  7. GET /api/announcements — Live system broadcasts and weather/quota alerts.
  8. POST /api/voice/chat — Multilingual AI Assistant (English, Telugu, Hindi) for voice and text booking.

LAYOUT STRUCTURE:
- Auto-hiding top navigation header on scroll with logo, tab links (Centres, Map, MSP Board, Live Queue, Voice AI, Analytics, Officer Portal), language toggle (EN/TE/HI), and farmer login.
- Mobile bottom navigation bar for quick access on smartphone screens.
```

---

## 📑 Page-by-Page Stitch AI Prompts

Use the prompts below in Stitch AI to generate each individual page/screen:

---

### 1. 🏬 Procurement Centres Directory (`/centres`)

```text
Generate a calm, soothing "Procurement Centres Directory" page for Kisan Setu.

UI LAYOUT:
- Top Search & Filter Bar:
  - Search input for MANDI name, village, or district.
  - Filter chips for District dropdown, Crop selection (Paddy, Wheat, Maize, Cotton), Status filter (Open, Quota Full, Closed), and Distance Radius.
  - "Near Me" GPS location button with smooth pulsing animation.
- Grid of Mandi Cards:
  - Header: Mandi Name, District badge, and Live Status Badge (Emerald for Open, Amber for Quota Full, Rose for Closed).
  - Metrics Grid: Today's Procured Quintals progress bar, Active Queue length, Estimated Wait Time.
  - Accepted Crops Pills: Crop name, MSP price (₹/Quintal), and Max Moisture %.
  - Contact & Officer Info with quick call button.
  - Primary Action Buttons: "Book Digital Pass Token" (Emerald primary button) and "View Facilities & Map" (Soft outlined button).

API INTEGRATION:
- Fetch centres from `GET http://localhost:5001/api/centres?district=X&crop=Y&status=Z`
- Send slot booking requests to `POST http://localhost:5001/api/tokens/book`
```

---

### 2. 🗺️ Interactive Mandi Map View (`/map`)

```text
Generate an interactive, serene "Mandi Map View" page for Kisan Setu.

UI LAYOUT:
- Full-screen Leaflet/Mapbox interactive map with custom styled map tiles (warm earth/light green style).
- Custom Map Markers:
  - Green circular pin for OPEN centres.
  - Amber pin for QUOTA FULL centres.
  - Slate pin for CLOSED centres.
- Interactive Marker Popup Card:
  - Mandi Name & Mandal.
  - Current Serving Token Number.
  - Available Slot Count.
  - Quick "Book Token Now" button inside popup.
- Side Panel / Floating Drawer (Collapsible):
  - Summary of nearest 5 procurement centres with distance in KM.
  - Search bar to locate mandis on the map.

API INTEGRATION:
- Fetch map markers from `GET http://localhost:5001/api/centres`
```

---

### 3. 📈 MSP Price Board & Quality Standards (`/prices`)

```text
Generate a transparent, soothing "MSP Price Board & Quality Standards" page for Kisan Setu.

UI LAYOUT:
- Season Selector Tabs: Kharif 2025-26, Rabi 2025-26.
- Highlight Banner: Official Government Minimum Support Price Guarantee notice with calm green background.
- Crop Price Grid/Table:
  - Crop Card: Crop Icon (🌾 Paddy, 🌽 Maize, 🧵 Cotton, 🌾 Wheat), Crop Name (in EN, TE, HI).
  - Official MSP Rate (e.g. ₹2,300 / Quintal).
  - Local Market Avg Comparison (e.g. ₹2,150 / Quintal) with "+₹150 Govt Bonus" badge.
  - Quality Standard Parameters: Max Moisture Allowed (e.g. 17%), Foreign Matter limit (1%), Broken Grains limit (2%).
  - Price Trend Indicator (Upward arrow in soft green).
- FAQ / Quality Check Calculator:
  - Interactive slider for Moisture % (e.g. 14% to 20%) showing whether grain passes moisture lab test or requires drying.

API INTEGRATION:
- Fetch catalog from `GET http://localhost:5001/api/prices`
```

---

### 4. 🎟️ Live Queue & Digital Token Pass Tracker (`/queue`)

```text
Generate a real-time "Live Queue & Token Pass Tracker" page for Kisan Setu.

UI LAYOUT:
- Live Counter Header:
  - Large digital readout of "Currently Serving Token Number" (e.g. #KST-104).
  - Active Queue Count & Average Processing Time (e.g. 12 mins per tractor).
- Phone Number Lookup Input:
  - Input field for farmer to enter registered phone number to pull up active E-Passes.
- Digital Token Pass Card (E-Pass):
  - Styled like a premium boarding pass / ticket with soft torn-edge accent.
  - Token # (e.g. KST-108), Farmer Name, Mandi Name, Crop & Quantity (50 Quintals), Slot Date & Time.
  - QR Code for gate scanning.
  - Visual Step Progress Tracker:
    [1. Booked ✓] -> [2. Gate Check-in] -> [3. Moisture Testing] -> [4. Weighbridge] -> [5. Direct Payment]
- Audio Alert Button: Option to read token status aloud in Hindi/Telugu.

API INTEGRATION:
- Fetch live queue metrics from `GET http://localhost:5001/api/queue/status?centreId=X`
- Fetch farmer tokens from `GET http://localhost:5001/api/tokens/my-tokens?phone=X`
```

---

### 5. 🎙️ Multilingual Voice AI Assistant (`/voice`)

```text
Generate a serene, futuristic yet rural-friendly "Multilingual Voice AI Assistant" page for Kisan Setu.

UI LAYOUT:
- Language Selection Ribbon: English | తెలుగు (Telugu) | हिंदी (Hindi).
- Central Animated Mic Sphere:
  - Large glowing mic button with gentle pulsing ripple animations when active.
  - "Tap to Speak or Type in your language" callout.
- Sample Voice Command Chips:
  - "Where is the nearest Paddy mandi in Guntur?"
  - "What is today's MSP price for Wheat?"
  - "Book a slot for 40 quintals tomorrow morning."
- Conversational Chat Feed:
  - User speech bubbles (soft green, right-aligned).
  - Kisan AI responses (soft cream/white cards, left-aligned) with built-in TTS audio play button.
- In-Chat Action Cards:
  - When AI recommends a mandi or slot, embed an interactive "Confirm Booking" card directly inside the chat feed.

API INTEGRATION:
- Post speech/text to `POST http://localhost:5001/api/voice/chat` with `{ message: "...", lang: "te" }`
```

---

### 6. 📊 State Analytics & Procurement Dashboard (`/analytics`)

```text
Generate an executive-level, transparent "State Procurement Analytics" dashboard for Kisan Setu.

UI LAYOUT:
- Key Performance Metric Cards:
  - Total Procurement: 4,85,200 Quintals (Gauge showing 78% of State Seasonal Target).
  - Active Procurement Centres: 42 / 45 Open.
  - Total Farmers Paid Directly to Bank Account: 12,480 Farmers (₹112 Crore disbursed).
  - Total Active Tokens Issued Today: 1,840.
- Charts & Visualizations:
  - Bar Chart: Procurement breakdown by Crop (Paddy vs Wheat vs Maize vs Cotton).
  - Donut Chart: District-wise procurement distribution.
  - Line Chart: 14-Day daily procurement trend vs queue wait times.
- State Transparency Table: District summary table with search and CSV export button.

API INTEGRATION:
- Fetch analytics data from `GET http://localhost:5001/api/analytics`
```

---

### 7. 🛡️ Mandi Officer Portal (`/admin`)

```text
Generate a clean, secure "Mandi Officer Portal & Queue Controller" dashboard for Kisan Setu.

UI LAYOUT:
- Security PIN Gate: 4-digit PIN authentication modal (Default PIN: 1234).
- Mandi Control Panel:
  - Status Toggle Switch: Open / Lunch Break / Quota Full / Closed.
  - Next Token Caller: Large "Call Next Farmer" button that advances currently serving token.
  - Quick Emergency Announcement Publisher: Form to send broadcast alerts to all connected farmers.
- Incoming Tokens Management Table:
  - List of today's booked tokens.
  - Status update controls (Mark Checked-in, Record Moisture %, Enter Weighbridge Weight, Approve Payment).

API INTEGRATION:
- Update token status via `PUT http://localhost:5001/api/tokens/:tokenNumber/status`
- Post broadcast alert via `POST http://localhost:5001/api/announcements`
```

---

## 🔌 Quick Environment & Connection Check

Make sure your backend server remains running in your terminal:
- **Server Address**: `http://localhost:5001`
- **CORS**: Already enabled for all origins (`*`) in `server/server.js`.
