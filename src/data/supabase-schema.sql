-- ==============================================================================
-- Jakariya's Mart COMPLETE & IDEMPOTENT SUPABASE SQL SCHEMA
-- Run this SQL in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
-- ==============================================================================

-- 1. Categories Table (Supports Hierarchical Subcategories)
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 1,
    parent_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add parent_id column if upgrading existing table
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS parent_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL;

-- 2. Products Table (Includes variants JSONB and subcategory)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    discount_price NUMERIC,
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    subcategory_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    stock INTEGER DEFAULT 0,
    sku TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    variants JSONB DEFAULT '[]'::jsonb,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if upgrading existing table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL;
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
    coupon_code TEXT,
    coupon_discount NUMERIC,
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
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_discount NUMERIC;
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

ALTER TABLE public.banners ALTER COLUMN title DROP NOT NULL;

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

-- 8. Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL DEFAULT 'percentage',
    discount_value NUMERIC NOT NULL,
    applies_to TEXT NOT NULL DEFAULT 'all',
    product_ids JSONB DEFAULT '[]'::jsonb,
    min_order_amount NUMERIC,
    max_discount_amount NUMERIC,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    usage_limit INTEGER,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrations for existing coupons table
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS min_order_amount NUMERIC;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS max_discount_amount NUMERIC;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS usage_limit INTEGER;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS applies_to TEXT DEFAULT 'all';
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS product_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS description TEXT;

-- Seed default coupons if not exists
INSERT INTO public.coupons (id, code, discount_type, discount_value, applies_to, min_order_amount, is_active, usage_count, description)
VALUES 
  ('cpn-1', 'JM10', 'percentage', 10, 'all', 500, true, 5, '10% discount on all store products for orders above ৳500'),
  ('cpn-2', 'CYBER20', 'percentage', 20, 'all', 1000, true, 2, '20% special discount on orders above ৳1000'),
  ('cpn-3', 'WELCOME100', 'fixed', 100, 'all', 1200, true, 8, 'Flat ৳100 discount on your order above ৳1200')
ON CONFLICT (code) DO NOTHING;

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
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

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

-- Coupons Policies (Allow public to view coupons, update usage on purchase, and full manage)
DROP POLICY IF EXISTS "Allow public read coupons" ON public.coupons;
DROP POLICY IF EXISTS "Allow public update coupons usage" ON public.coupons;
DROP POLICY IF EXISTS "Allow all on coupons" ON public.coupons;
DROP POLICY IF EXISTS "Public can view active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admin full access on coupons" ON public.coupons;

CREATE POLICY "Allow public read coupons" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "Allow public update coupons usage" ON public.coupons FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on coupons" ON public.coupons FOR ALL USING (true) WITH CHECK (true);

-- Realtime Configuration for Live Orders, Payments & Coupons
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

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'coupons'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;
  END IF;
END $$;
