-- ==============================================================================
-- Jakariya's Mart SECURE DATABASE SCHEMA & ROW LEVEL SECURITY (RLS) FOR SUPABASE
-- Authorized Admin: mindboogle535@gmail.com
-- Project: https://supabase.com/dashboard/project/hvnnwadosqhzhsstlpiq/sql/new
-- ==============================================================================

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Products Table
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
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Orders Table (Bangladesh Delivery & COD Specification)
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

-- 4. Banners Table
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

-- 5. Store Settings Table (Configured for Bangladesh BDT ৳)
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
    social_links JSONB DEFAULT '{"facebook":"","instagram":"","tiktok":"","youtube":""}'::jsonb
);

-- ==============================================================================
-- DATABASE LEVEL AUTHORIZATION FUNCTION
-- Verifies that the requesting authenticated user has the exact authorized admin email
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.role() = 'authenticated' AND
    LOWER(auth.jwt() ->> 'email') = 'mindboogle535@gmail.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies if any
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Admin full access on categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public read categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public write categories" ON public.categories;

DROP POLICY IF EXISTS "Public can view active products" ON public.products;
DROP POLICY IF EXISTS "Admin full access on products" ON public.products;
DROP POLICY IF EXISTS "Allow public read products" ON public.products;
DROP POLICY IF EXISTS "Allow public write products" ON public.products;

DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Admin full access on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public read orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public write orders" ON public.orders;

DROP POLICY IF EXISTS "Public can view active banners" ON public.banners;
DROP POLICY IF EXISTS "Admin full access on banners" ON public.banners;
DROP POLICY IF EXISTS "Allow public read banners" ON public.banners;
DROP POLICY IF EXISTS "Allow public write banners" ON public.banners;

DROP POLICY IF EXISTS "Public can view settings" ON public.settings;
DROP POLICY IF EXISTS "Admin full access on settings" ON public.settings;
DROP POLICY IF EXISTS "Allow public read settings" ON public.settings;
DROP POLICY IF EXISTS "Allow public write settings" ON public.settings;

-- 1. CATEGORIES POLICIES
-- Anyone can view categories on the storefront
CREATE POLICY "Public can view categories" 
ON public.categories FOR SELECT 
USING (true);

-- Only verified admin (mindboogle535@gmail.com) can insert, update, or delete categories
CREATE POLICY "Admin full access on categories" 
ON public.categories FOR ALL 
TO authenticated 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- 2. PRODUCTS POLICIES
-- Anyone can view products on the storefront
CREATE POLICY "Public can view products" 
ON public.products FOR SELECT 
USING (true);

-- Only verified admin (mindboogle535@gmail.com) can insert, update, or delete products
CREATE POLICY "Admin full access on products" 
ON public.products FOR ALL 
TO authenticated 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- 3. ORDERS POLICIES
-- Customers can place new orders at checkout
CREATE POLICY "Public can insert orders" 
ON public.orders FOR INSERT 
WITH CHECK (true);

-- Only verified admin (mindboogle535@gmail.com) can view, process, update status, and manage orders
CREATE POLICY "Admin full access on orders" 
ON public.orders FOR ALL 
TO authenticated 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- 4. BANNERS POLICIES
-- Anyone can view active banners on homepage
CREATE POLICY "Public can view banners" 
ON public.banners FOR SELECT 
USING (true);

-- Only verified admin can manage banners
CREATE POLICY "Admin full access on banners" 
ON public.banners FOR ALL 
TO authenticated 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- 5. SETTINGS POLICIES
-- Anyone can view settings (brand name, delivery fees, phone)
CREATE POLICY "Public can view settings" 
ON public.settings FOR SELECT 
USING (true);

-- Only verified admin can update settings
CREATE POLICY "Admin full access on settings" 
ON public.settings FOR ALL 
TO authenticated 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- Realtime subscription for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
