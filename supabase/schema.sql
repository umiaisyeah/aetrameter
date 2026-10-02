-- ==============================================================================
-- SIMBA-IN: Sistem Informasi Monitoring & Billing Air Industri
-- PT Aetra Air Tangerang
-- Supabase Database Schema & Field Reading Realtime Integration
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM Types
DO $$ BEGIN
    CREATE TYPE workflow_status_type AS ENUM (
        'Belum Dibaca',
        'Pending Verification',
        'Verified',
        'Invoiced'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE customer_class_type AS ENUM (
        'Premium',
        'Platinum',
        'Gold',
        'Silver',
        'Bronze'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE reader_category_type AS ENUM (
        'Kontraktor',
        'Key Account',
        'Lainnya'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 3. Table: meter_readers (Petugas Pembaca Meter Lapangan)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.meter_readers (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    nip TEXT NOT NULL,
    no_hp TEXT,
    kategori TEXT NOT NULL DEFAULT 'Kontraktor',
    perusahaan TEXT,
    assigned_cycles TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Cuti', 'Nonaktif')),
    email TEXT,
    wilayah TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. Table: cycle_schedules (Jadwal Plotting Siklus 1 Tahun)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.cycle_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cycle TEXT NOT NULL,
    bulan TEXT NOT NULL,
    hari_h INTEGER NOT NULL CHECK (hari_h BETWEEN 1 AND 31),
    tgl_pra_baca INTEGER,
    tgl_verifikasi INTEGER,
    tgl_billing INTEGER,
    tanggal_mulai TEXT,
    tanggal_selesai TEXT,
    petugas_utama TEXT,
    kategori_petugas TEXT,
    catatan TEXT,
    target_pelanggan INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT cycle_bulan_unique UNIQUE (cycle, bulan)
);

-- ==============================================================================
-- 5. Table: industry_customers (Data Pelanggan Industri & Stand Meter Lapangan)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.industry_customers (
    id TEXT PRIMARY KEY, -- e.g. 'IND-1001'
    nama TEXT NOT NULL,
    email TEXT NOT NULL,
    cycle TEXT NOT NULL,
    kelas TEXT NOT NULL DEFAULT 'Gold',
    lalu NUMERIC NOT NULL DEFAULT 0,
    skrg NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Belum Dibaca' CHECK (status IN ('Belum Dibaca', 'Pending Verification', 'Verified', 'Invoiced')),
    bulan TEXT NOT NULL DEFAULT 'September 2026',
    catatan TEXT,
    history NUMERIC[] DEFAULT '{}',
    foto_meter TEXT DEFAULT '',
    foto_bpm TEXT DEFAULT '',
    lokasi TEXT,
    diameter_pipa TEXT,
    petugas_baca TEXT,
    kategori_petugas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by cycle and status
CREATE INDEX IF NOT EXISTS idx_industry_customers_cycle ON public.industry_customers(cycle);
CREATE INDEX IF NOT EXISTS idx_industry_customers_status ON public.industry_customers(status);
CREATE INDEX IF NOT EXISTS idx_industry_customers_bulan ON public.industry_customers(bulan);

-- ==============================================================================
-- 6. Table: audit_logs (Rekam Jejak Aktivitas Operasional)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    time TEXT NOT NULL,
    "user" TEXT NOT NULL,
    role TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ==============================================================================
-- 7. Row Level Security (RLS)
-- ==============================================================================
ALTER TABLE public.industry_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meter_readers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycle_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow read & write for public/anon key (Admin Dashboard & Field Reader App)
DROP POLICY IF EXISTS "Public full access to industry_customers" ON public.industry_customers;
DROP POLICY IF EXISTS "Allow public all access" ON public.industry_customers;
CREATE POLICY "Allow public all access" 
    ON public.industry_customers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access to meter_readers" ON public.meter_readers;
DROP POLICY IF EXISTS "Allow public all access" ON public.meter_readers;
CREATE POLICY "Allow public all access" 
    ON public.meter_readers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access to cycle_schedules" ON public.cycle_schedules;
DROP POLICY IF EXISTS "Allow public all access" ON public.cycle_schedules;
CREATE POLICY "Allow public all access" 
    ON public.cycle_schedules FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access to audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow public all access" ON public.audit_logs;
CREATE POLICY "Allow public all access" 
    ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 8. Enable Supabase Realtime
-- When field readers input meter readings on site, Admin dashboard updates live!
-- ==============================================================================
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.industry_customers;
EXCEPTION WHEN duplicate_object THEN null; WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.meter_readers;
EXCEPTION WHEN duplicate_object THEN null; WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cycle_schedules;
EXCEPTION WHEN duplicate_object THEN null; WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
EXCEPTION WHEN duplicate_object THEN null; WHEN others THEN null;
END $$;

-- ==============================================================================
-- 9. Trigger for updated_at
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_industry_customers_updated_at ON public.industry_customers;
CREATE TRIGGER trigger_industry_customers_updated_at
    BEFORE UPDATE ON public.industry_customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_meter_readers_updated_at ON public.meter_readers;
CREATE TRIGGER trigger_meter_readers_updated_at
    BEFORE UPDATE ON public.meter_readers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_cycle_schedules_updated_at ON public.cycle_schedules;
CREATE TRIGGER trigger_cycle_schedules_updated_at
    BEFORE UPDATE ON public.cycle_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
