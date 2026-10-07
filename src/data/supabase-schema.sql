-- ==============================================================================
-- Jakariya's Mart COMPLETE & IDEMPOTENT SUPABASE SQL SCHEMA
-- Run this SQL in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
-- ==============================================================================

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Products Table (Includes variants JSONB)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    discount_price NUMERIC,
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    stock INTEGER DEFAULT 0,
    sku TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    variants JSONB DEFAULT '[]'::jsonb,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add variants column if upgrading existing table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_price NUMERIC;

-- 3. Orders Table (Bangladesh Delivery & COD Tracking)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    customer_address TEXT NOT NULL,
    customer_city TEXT,
    division TEXT,
    district TEXT,
    upazila TEXT,
    union_ward TEXT,
    delivery_instructions TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC NOT NULL,
    delivery_charge NUMERIC NOT NULL,
    total NUMERIC NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cash_on_delivery',
    payment_status TEXT NOT NULL DEFAULT 'Pending',
    order_status TEXT NOT NULL DEFAULT 'Pending',
    delivery_payment_method TEXT,
    delivery_transaction_id TEXT,
    delivery_payment_status TEXT DEFAULT 'Pending',
    delivery_payment_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe migrations for existing orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS division TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS upazila TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS union_ward TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_instructions TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_payment_method TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_transaction_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_payment_status TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_payment_id TEXT;

-- 4. Delivery Payments Table (Manual bKash / Nagad Advance Delivery Verification)
CREATE TABLE IF NOT EXISTS public.delivery_payments (
    id TEXT PRIMARY KEY,
    order_id TEXT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    payment_method TEXT NOT NULL,
    transaction_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Banners Table
CREATE TABLE IF NOT EXISTS public.banners (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    button_text TEXT DEFAULT 'Shop Now',
    button_url TEXT DEFAULT '#catalog',
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 1
);

-- 6. Store Settings Table (Includes bKash, Nagad, Policies, Site Views)
CREATE TABLE IF NOT EXISTS public.settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    store_name TEXT NOT NULL DEFAULT 'Jakariya''s Mart',
    tagline TEXT DEFAULT 'Modern Streetwear & Anime Apparel - Bangladesh',
    logo_url TEXT DEFAULT '',
    phone TEXT DEFAULT '+880 1700-123456',
    email TEXT DEFAULT 'support@jakariyasmart.com',
    address TEXT DEFAULT 'House 14, Road 11, Block D, Banani, Dhaka-1213, Bangladesh',
    delivery_charge NUMERIC DEFAULT 80,
    delivery_charge_outside NUMERIC DEFAULT 120,
    currency_symbol TEXT DEFAULT '৳',
    announcement TEXT DEFAULT 'CASH ON DELIVERY (COD) AVAILABLE ALL OVER BANGLADESH | FAST 48H COURIER',
    announcement_enabled BOOLEAN DEFAULT TRUE,
    social_links JSONB DEFAULT '{"facebook":"","instagram":"","tiktok":"","youtube":""}'::jsonb,
    bkash_number TEXT DEFAULT '01700-123456',
    bkash_type TEXT DEFAULT 'Personal (Send Money)',
    nagad_number TEXT DEFAULT '01800-123456',
    nagad_type TEXT DEFAULT 'Personal (Send Money)',
    payment_instructions TEXT DEFAULT 'COD order confirm করতে উপরে দেওয়া নম্বরে Delivery Charge Send Money করুন এবং নিচের বক্সে Transaction ID দিন।',
    delivery_policy_enabled BOOLEAN DEFAULT TRUE,
    delivery_policy_text TEXT DEFAULT 'Return Policy: 1. পার্সেল রিসিভ করার সময় অবশ্যই আনবক্সিং ভিডিও করবেন।',
    site_views INTEGER DEFAULT 0
);

-- Migration for existing settings table
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS bkash_number TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS bkash_type TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS nagad_number TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS nagad_type TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS payment_instructions TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS delivery_policy_enabled BOOLEAN;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS delivery_policy_text TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS site_views INTEGER DEFAULT 0;

-- 7. Admin Profiles Table
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default Singleton Settings row if not exists
INSERT INTO public.settings (id, store_name, tagline, delivery_charge, delivery_charge_outside)
VALUES (1, 'Jakariya''s Mart', 'Modern Streetwear & Anime Apparel - Bangladesh', 80, 120)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Categories Policies
DROP POLICY IF EXISTS "Allow public read categories" ON public.categories;
DROP POLICY IF EXISTS "Allow all on categories" ON public.categories;
CREATE POLICY "Allow public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow all on categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

-- Products Policies
DROP POLICY IF EXISTS "Allow public read products" ON public.products;
DROP POLICY IF EXISTS "Allow all on products" ON public.products;
CREATE POLICY "Allow public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow all on products" ON public.products FOR ALL USING (true) WITH CHECK (true);

-- Orders Policies
DROP POLICY IF EXISTS "Allow public read orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Allow all on orders" ON public.orders;
CREATE POLICY "Allow public read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all on orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

-- Delivery Payments Policies
DROP POLICY IF EXISTS "Allow public read delivery_payments" ON public.delivery_payments;
DROP POLICY IF EXISTS "Allow public insert delivery_payments" ON public.delivery_payments;
DROP POLICY IF EXISTS "Allow all on delivery_payments" ON public.delivery_payments;
CREATE POLICY "Allow public read delivery_payments" ON public.delivery_payments FOR SELECT USING (true);
CREATE POLICY "Allow public insert delivery_payments" ON public.delivery_payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all on delivery_payments" ON public.delivery_payments FOR ALL USING (true) WITH CHECK (true);

-- Banners Policies
DROP POLICY IF EXISTS "Allow public read banners" ON public.banners;
DROP POLICY IF EXISTS "Allow all on banners" ON public.banners;
CREATE POLICY "Allow public read banners" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Allow all on banners" ON public.banners FOR ALL USING (true) WITH CHECK (true);

-- Settings Policies
DROP POLICY IF EXISTS "Allow public read settings" ON public.settings;
DROP POLICY IF EXISTS "Allow all on settings" ON public.settings;
CREATE POLICY "Allow public read settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Allow all on settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);

-- Admin Profiles Policies
DROP POLICY IF EXISTS "Allow public read admin_profiles" ON public.admin_profiles;
DROP POLICY IF EXISTS "Allow all on admin_profiles" ON public.admin_profiles;
CREATE POLICY "Allow public read admin_profiles" ON public.admin_profiles FOR SELECT USING (true);
CREATE POLICY "Allow all on admin_profiles" ON public.admin_profiles FOR ALL USING (true) WITH CHECK (true);

-- Realtime Configuration for Live Orders & Payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'delivery_payments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_payments;
  END IF;
END $$;
