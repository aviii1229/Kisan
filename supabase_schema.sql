-- ==============================================================================
-- Kisan Setu Database Schema for Supabase (PostgreSQL)
-- Execute this script in your Supabase SQL Editor (Dashboard -> SQL Editor -> New query)
-- ==============================================================================

-- DROP EXISTING TABLES IF THEY WERE CREATED WITHOUT QUOTED CAMELCASE COLUMNS
DROP TABLE IF EXISTS public.tokens CASCADE;
DROP TABLE IF EXISTS public.centres CASCADE;
DROP TABLE IF EXISTS public.farmers CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.msp_catalog CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.voice_history CASCADE;

-- 1. CENTRES TABLE
CREATE TABLE public.centres (
    "id" VARCHAR(255) PRIMARY KEY,
    "name" TEXT NOT NULL,
    "name_te" TEXT,
    "name_hi" TEXT,
    "type" TEXT DEFAULT 'PPC',
    "type_te" TEXT,
    "type_hi" TEXT,
    "district" TEXT NOT NULL,
    "mandal" TEXT NOT NULL,
    "state" TEXT DEFAULT 'Telangana',
    "address" TEXT NOT NULL,
    "lat" NUMERIC(10, 6) NOT NULL,
    "lng" NUMERIC(10, 6) NOT NULL,
    "status" VARCHAR(50) DEFAULT 'open',
    "statusReason" TEXT DEFAULT '',
    "statusReason_te" TEXT,
    "statusReason_hi" TEXT,
    "timings" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "acceptedCrops" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "queue" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "facilities" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "contact" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "rating" NUMERIC(3, 2) DEFAULT 4.5,
    "reviewsCount" INT DEFAULT 0,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FARMERS TABLE
CREATE TABLE public.farmers (
    "id" VARCHAR(255) PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" VARCHAR(50) UNIQUE NOT NULL,
    "village" TEXT,
    "district" TEXT,
    "preferredLanguage" VARCHAR(10) DEFAULT 'te',
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TOKENS (PROCUREMENT BOOKINGS) TABLE
CREATE TABLE public.tokens (
    "tokenNumber" VARCHAR(255) PRIMARY KEY,
    "centreId" VARCHAR(255) REFERENCES public.centres("id") ON DELETE CASCADE,
    "centreName" TEXT NOT NULL,
    "farmerName" TEXT NOT NULL,
    "farmerName_te" TEXT,
    "phone" VARCHAR(50) NOT NULL,
    "aadhaarLast4" VARCHAR(10) NOT NULL,
    "passbookNo" VARCHAR(100) NOT NULL,
    "cropId" VARCHAR(100) NOT NULL,
    "cropName" TEXT NOT NULL,
    "quantityQuintals" NUMERIC(10, 2) NOT NULL,
    "vehicleType" VARCHAR(100) NOT NULL,
    "vehicleNumber" VARCHAR(50) NOT NULL,
    "slotDate" VARCHAR(50) NOT NULL,
    "slotTime" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) DEFAULT 'BOOKED',
    "moistureMeasured" NUMERIC(5, 2),
    "gradeAssigned" VARCHAR(50),
    "totalWeightQuintals" NUMERIC(10, 2),
    "netPayableAmount" NUMERIC(12, 2),
    "issuedAt" TIMESTAMPTZ DEFAULT NOW(),
    "completedAt" TIMESTAMPTZ,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ANNOUNCEMENTS TABLE
CREATE TABLE public.announcements (
    "id" VARCHAR(255) PRIMARY KEY,
    "centreId" VARCHAR(255),
    "centreName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "title_te" TEXT,
    "title_hi" TEXT,
    "message" TEXT NOT NULL,
    "message_te" TEXT,
    "message_hi" TEXT,
    "severity" VARCHAR(50) DEFAULT 'info',
    "timestamp" TIMESTAMPTZ DEFAULT NOW(),
    "active" BOOLEAN DEFAULT TRUE,
    "isActive" BOOLEAN DEFAULT TRUE
);

-- 5. MSP CATALOG TABLE
CREATE TABLE public.msp_catalog (
    "id" VARCHAR(50) PRIMARY KEY,
    "name" TEXT NOT NULL,
    "name_te" TEXT,
    "name_hi" TEXT,
    "msp" NUMERIC(10, 2) NOT NULL,
    "marketAvg" NUMERIC(10, 2) NOT NULL,
    "unit" VARCHAR(20) DEFAULT 'Quintal',
    "category" VARCHAR(50) DEFAULT 'Cereals',
    "maxMoisture" NUMERIC(5, 2) DEFAULT 17,
    "season" VARCHAR(50),
    "priceTrend" VARCHAR(50),
    "icon" VARCHAR(10)
);

-- 6. NOTIFICATIONS TABLE
CREATE TABLE public.notifications (
    "id" VARCHAR(50) PRIMARY KEY,
    "phone" VARCHAR(20) NOT NULL,
    "title" TEXT NOT NULL,
    "title_te" TEXT,
    "title_hi" TEXT,
    "message" TEXT NOT NULL,
    "message_te" TEXT,
    "message_hi" TEXT,
    "type" VARCHAR(30) DEFAULT 'booking',
    "read" BOOLEAN DEFAULT FALSE,
    "timestamp" TIMESTAMPTZ DEFAULT NOW()
);

-- 7. VOICE HISTORY LOGS TABLE
CREATE TABLE public.voice_history (
    "id" BIGSERIAL PRIMARY KEY,
    "phone" VARCHAR(20),
    "query" TEXT,
    "response" TEXT,
    "timestamp" TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX idx_centres_district ON public.centres("district");
CREATE INDEX idx_tokens_phone ON public.tokens("phone");
CREATE INDEX idx_tokens_centreId ON public.tokens("centreId");
CREATE INDEX idx_tokens_status ON public.tokens("status");
CREATE INDEX idx_notifications_phone ON public.notifications("phone");

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.centres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msp_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_history ENABLE ROW LEVEL SECURITY;

-- Allow anonymous & authenticated users full read and write access
CREATE POLICY "Allow public read centres" ON public.centres FOR SELECT USING (true);
CREATE POLICY "Allow public write centres" ON public.centres FOR ALL USING (true);

CREATE POLICY "Allow public read farmers" ON public.farmers FOR SELECT USING (true);
CREATE POLICY "Allow public write farmers" ON public.farmers FOR ALL USING (true);

CREATE POLICY "Allow public read tokens" ON public.tokens FOR SELECT USING (true);
CREATE POLICY "Allow public write tokens" ON public.tokens FOR ALL USING (true);

CREATE POLICY "Allow public read announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Allow public write announcements" ON public.announcements FOR ALL USING (true);

CREATE POLICY "Allow public read msp_catalog" ON public.msp_catalog FOR SELECT USING (true);
CREATE POLICY "Allow public write msp_catalog" ON public.msp_catalog FOR ALL USING (true);

CREATE POLICY "Allow public read notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow public write notifications" ON public.notifications FOR ALL USING (true);

CREATE POLICY "Allow public write voice_history" ON public.voice_history FOR ALL USING (true);

-- ==============================================================================
-- SEED INITIAL MSP CATALOG DATA
-- ==============================================================================
INSERT INTO public.msp_catalog ("id", "name", "name_te", "name_hi", "msp", "marketAvg", "unit", "category", "maxMoisture", "season", "priceTrend", "icon")
VALUES 
('paddy-common', 'Paddy (Common)', 'వరి (సాధారణ రకం)', 'धान (सामान्य)', 2369, 2180, 'Quintal', 'Cereals', 17, 'Kharif 2026', '+5.4% YoY', '🌾'),
('paddy-grade-a', 'Paddy (Grade A / Sona Masoori)', 'వరి (గ్రేడ్-ఎ / సోనా మసూరి)', 'धान (ग्रेड-ए / सोना मसूरी)', 2320, 2450, 'Quintal', 'Cereals', 17, 'Kharif 2026', '+5.8% YoY', '🌾'),
('cotton-long', 'Cotton (Long Staple)', 'పత్తి (పొడుగు పింజ)', 'कपास (लंबा रेशा)', 8110, 7350, 'Quintal', 'Fiber', 12, 'Kharif 2026', '+7.2% YoY', '☁️'),
('maize', 'Maize (Corn)', 'మొక్కజొన్న', 'मक्का', 2400, 2100, 'Quintal', 'Cereals', 14, 'Kharif 2026', '+6.1% YoY', '🌽'),
('soyabean', 'Soyabean (Yellow)', 'సోయాబీన్ (పసుపు)', 'सोयाबीन (पीला)', 5328, 4650, 'Quintal', 'Oilseeds', 12, 'Kharif 2026', '+4.9% YoY', '🌱'),
('chilli', 'Red Chilli (Teja / Guntur)', 'ఎండు మిర్చి (తేజ / గుంటూరు)', 'लाल मिर्च (తేజ / గుంటూరు)', 18500, 19800, 'Quintal', 'Spices', 10, 'Rabi 2026', '+12.4% YoY', '🌶️')
ON CONFLICT ("id") DO NOTHING;
