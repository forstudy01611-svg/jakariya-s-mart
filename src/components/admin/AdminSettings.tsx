import React, { useState } from 'react';
import {
  Save,
  Check,
  Building,
  Phone,
  Mail,
  MapPin,
  Truck,
  CreditCard,
  DollarSign,
  Share2,
  Megaphone,
  RotateCcw,
  Database,
  ExternalLink,
  Copy,
  Code2,
  RefreshCw,
  Users,
  XCircle,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { configuredSupabaseUrl, supabaseProjectId } from '../../lib/supabase';
import { AUTHORIZED_ADMIN_EMAIL } from '../../types';

const SUPABASE_SCHEMA_SQL = `-- Jakariya's Mart E-Commerce Database Schema for Supabase
-- Copy and run in Supabase SQL Editor: https://supabase.com/dashboard/project/hvnnwadosqhzhsstlpiq/sql/new

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

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS division TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS upazila TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS union_ward TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_instructions TEXT;

CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS public.coupons (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL DEFAULT 'percentage',
    discount_value NUMERIC NOT NULL,
    applies_to TEXT NOT NULL DEFAULT 'all',
    product_ids JSONB DEFAULT '[]'::jsonb,
    min_order_amount NUMERIC,
    max_discount_amount NUMERIC,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.delivery_payments (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'bKash',
    transaction_id TEXT,
    status TEXT NOT NULL DEFAULT 'Pending',
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.role() = 'authenticated' AND
    LOWER(auth.jwt() ->> 'email') = 'mindboogle535@gmail.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admin full access on categories" ON public.categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Public can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admin full access on products" ON public.products FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Public can insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin full access on orders" ON public.orders FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Public can view banners" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Admin full access on banners" ON public.banners FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Public can view active coupons" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "Admin full access on coupons" ON public.coupons FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Public can insert delivery_payments" ON public.delivery_payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin full access on delivery_payments" ON public.delivery_payments FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Public can view settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admin full access on settings" ON public.settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin full access on admin_profiles" ON public.admin_profiles FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;`;

export const AdminSettings: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    resetToDemoData, 
    syncAllToSupabase,
    adminProfiles,
    addAdminProfile,
    deleteAdminProfile,
    resetAdminPassword
  } = useStore();

  const [formData, setFormData] = useState({ ...settings });
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // Member Modal
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [memberFormData, setMemberFormData] = useState({ name: '', role: '', email: '' });
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Supabase management
  const [sqlModalOpen, setSqlModalOpen] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await updateSettings(formData);
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 2500);
    } catch (err) {
      console.error('Failed to update settings', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetCatalog = () => {
    resetToDemoData();
    setResetConfirmOpen(false);
    window.location.reload();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  const handleSyncToSupabase = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await syncAllToSupabase();
      setSyncStatus(res);
    } catch (err: any) {
      setSyncStatus({ success: false, message: err?.message || 'Sync failed.' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-['Space_Grotesk'] tracking-tight">
            STORE SETTINGS
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Configure global brand parameters, Supabase database, and storefront dispatch.
          </p>
        </div>

        {successToast && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-xs font-bold animate-in fade-in">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      {/* Supabase Connection Card */}
      <div className="bg-[#0d0d12] border border-[#13487E]/30 rounded-2xl p-5 sm:p-6 space-y-4 relative overflow-hidden shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#13487E]/15 border border-[#13487E]/30 text-[#13487E] flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Supabase Database Integration
                </h3>
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-700/60 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  CONNECTED
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Active Project: <span className="font-mono text-[#13487E]">{supabaseProjectId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSqlModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-bold text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Code2 className="w-3.5 h-3.5 text-[#13487E]" />
              <span>SQL Schema</span>
            </button>

            <a
              href={`https://supabase.com/dashboard/project/${supabaseProjectId}/sql/new`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-[#13487E]/10 hover:bg-[#13487E]/20 border border-[#13487E]/30 text-xs font-bold text-[#13487E] transition-colors flex items-center gap-1.5"
            >
              <span>Supabase Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
            <span className="text-[10px] font-bold uppercase text-neutral-400">API Endpoint</span>
            <div className="font-mono text-white truncate text-[11px]">{configuredSupabaseUrl}</div>
          </div>
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
            <span className="text-[10px] font-bold uppercase text-neutral-400">Auth & Storage</span>
            <div className="text-neutral-300 text-[11px]">PostgreSQL + Supabase Storage enabled</div>
          </div>
        </div>

        {/* Sync action */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-[11px] text-neutral-400 max-w-md">
            Click to upload your active catalog, categories, hero banners, and store settings directly into your Supabase database.
          </p>

          <button
            type="button"
            onClick={handleSyncToSupabase}
            disabled={isSyncing}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-white transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#13487E] ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing Tables...' : 'Sync Catalog to Supabase'}</span>
          </button>
        </div>

        {syncStatus && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
              syncStatus.success
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : 'bg-amber-950/60 border-amber-800 text-amber-300'
            }`}
          >
            <span>{syncStatus.message}</span>
            {!syncStatus.success && (
              <button
                type="button"
                onClick={() => setSqlModalOpen(true)}
                className="underline font-bold ml-2 text-white hover:text-[#13487E]"
              >
                View SQL Script
              </button>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Brand & Store Identity */}
        <div className="bg-[#0d0d12] border border-neutral-800/80 rounded-2xl p-5 sm:p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 pb-2 border-b border-neutral-800/60 flex items-center gap-2">
            <Building className="w-4 h-4 text-[#13487E]" />
            <span>Store Identity</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Brand Name <span className="text-[#13487E]">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.store_name}
                onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#13487E]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Tagline / Slogan
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#13487E]"
              />
            </div>
          </div>
        </div>

        {/* Dispatch Rates & Currency */}
        <div className="bg-[#0d0d12] border border-neutral-800/80 rounded-2xl p-5 sm:p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 pb-2 border-b border-neutral-800/60 flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#13487E]" />
            <span>Shipping & Currency Configuration</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Currency Symbol
              </label>
              <input
                type="text"
                value={formData.currency_symbol}
                onChange={(e) => setFormData({ ...formData, currency_symbol: e.target.value })}
                placeholder="৳"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#13487E]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Inside Dhaka Metro (BDT ৳)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.delivery_charge}
                  onChange={(e) => setFormData({ ...formData, delivery_charge: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#13487E]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Outside Dhaka (BDT ৳)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.delivery_charge_outside}
                  onChange={(e) => setFormData({ ...formData, delivery_charge_outside: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#13487E]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Manual Delivery Charge Payment Accounts (bKash & Nagad) */}
        <div className="bg-[#0d0d12] border border-[#13487E]/30 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800/60">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#13487E]" />
              <span>bKash & Nagad Delivery Charge Accounts (COD Advance Payment)</span>
            </h2>
            <span className="text-[10px] font-bold text-amber-400 font-mono bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
              Manual Verification Only
            </span>
          </div>

          <p className="text-xs text-neutral-400">
            গ্রাহক ক্যাশ অন ডেলিভারিতে অর্ডার করার সময় ডেলিভারি চার্জ পরিশোধের জন্য নিচের নম্বর দুটি দেখতে পাবেন। আপনি যেকোনো সময় নম্বর ও অ্যাকাউন্ট টাইপ পরিবর্তন করতে পারবেন।
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* bKash Configuration */}
            <div className="p-4 rounded-xl bg-neutral-950 border border-[#e2136e]/30 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-800">
                <div className="w-6 h-6 rounded bg-[#e2136e] text-white flex items-center justify-center font-bold text-xs">
                  b
                </div>
                <span className="font-bold text-white text-xs">bKash Account Details</span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-neutral-400">
                  bKash Number (নম্বর)
                </label>
                <input
                  type="text"
                  required
                  value={formData.bkash_number || ''}
                  onChange={(e) => setFormData({ ...formData, bkash_number: e.target.value })}
                  placeholder="e.g. 01700-123456"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#e2136e]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-neutral-400">
                  Account Type / Instruction
                </label>
                <input
                  type="text"
                  value={formData.bkash_type || ''}
                  onChange={(e) => setFormData({ ...formData, bkash_type: e.target.value })}
                  placeholder="e.g. Personal (Send Money)"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#e2136e]"
                />
              </div>
            </div>

            {/* Nagad Configuration */}
            <div className="p-4 rounded-xl bg-neutral-950 border border-[#f7941d]/30 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-800">
                <div className="w-6 h-6 rounded bg-[#f7941d] text-white flex items-center justify-center font-bold text-xs">
                  N
                </div>
                <span className="font-bold text-white text-xs">Nagad Account Details</span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-neutral-400">
                  Nagad Number (নম্বর)
                </label>
                <input
                  type="text"
                  required
                  value={formData.nagad_number || ''}
                  onChange={(e) => setFormData({ ...formData, nagad_number: e.target.value })}
                  placeholder="e.g. 01800-123456"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#f7941d]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-neutral-400">
                  Account Type / Instruction
                </label>
                <input
                  type="text"
                  value={formData.nagad_type || ''}
                  onChange={(e) => setFormData({ ...formData, nagad_type: e.target.value })}
                  placeholder="e.g. Personal (Send Money)"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#f7941d]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Announcement Bar */}
        <div className="bg-[#0d0d12] border border-neutral-800/80 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800/60">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[#13487E]" />
              <span>Storefront Announcement Banner</span>
            </h2>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, announcement_enabled: !formData.announcement_enabled })}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                formData.announcement_enabled ? 'bg-[#13487E]' : 'bg-neutral-800'
              }`}
            >
              <span
                className={`block w-3.5 h-3.5 rounded-full bg-black shadow transform transition-transform absolute top-0.5 ${
                  formData.announcement_enabled ? 'left-6' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Banner Text
            </label>
            <input
              type="text"
              value={formData.announcement}
              onChange={(e) => setFormData({ ...formData, announcement: e.target.value })}
              placeholder="e.g. FREE EXPRESS SHIPPING ON ORDERS OVER $75 | DROP 01 LIVE NOW"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#13487E]"
            />
          </div>
        </div>

        {/* Delivery & Exchange Policy Configuration */}
        <div className="bg-[#0d0d12] border border-neutral-800/80 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800/60">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#13487E]" />
              <span>Checkout Delivery & Exchange Policy</span>
            </h2>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, delivery_policy_enabled: formData.delivery_policy_enabled === false ? true : false })}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                formData.delivery_policy_enabled !== false ? 'bg-[#13487E]' : 'bg-neutral-800'
              }`}
            >
              <span
                className={`block w-3.5 h-3.5 rounded-full bg-black shadow transform transition-transform absolute top-0.5 ${
                  formData.delivery_policy_enabled !== false ? 'left-6' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Policy Text (Edit & Update)
            </label>
            <textarea
              rows={8}
              value={formData.delivery_policy_text || ''}
              onChange={(e) => setFormData({ ...formData, delivery_policy_text: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white font-sans leading-relaxed focus:outline-none focus:border-[#13487E]"
            />
            <p className="text-[10px] text-neutral-500">
              This policy card is displayed to customers directly in the COD checkout modal below the payment section.
            </p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-[#0d0d12] border border-neutral-800/80 rounded-2xl p-5 sm:p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 pb-2 border-b border-neutral-800/60 flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#13487E]" />
            <span>Store Contact & Location</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Support Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#13487E]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Support Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#13487E]"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Physical Atelier / Head Office Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#13487E]"
              />
            </div>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="bg-[#0d0d12] border border-neutral-800/80 rounded-2xl p-5 sm:p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 pb-2 border-b border-neutral-800/60 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#13487E]" />
            <span>Official Social Channels</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Instagram URL
              </label>
              <input
                type="url"
                value={formData.social_links.instagram}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, instagram: e.target.value },
                  })
                }
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#13487E]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Facebook URL
              </label>
              <input
                type="url"
                value={formData.social_links.facebook}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, facebook: e.target.value },
                  })
                }
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#13487E]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                TikTok URL
              </label>
              <input
                type="url"
                value={formData.social_links.tiktok}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, tiktok: e.target.value },
                  })
                }
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#13487E]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                YouTube URL
              </label>
              <input
                type="url"
                value={formData.social_links.youtube}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, youtube: e.target.value },
                  })
                }
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#13487E]"
              />
            </div>
          </div>
        </div>


        {/* Team Management */}
        <div className="bg-[#0d0d12] border border-neutral-800/80 rounded-2xl p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800/60">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#13487E]" />
              <span>Authorized Team Members (Shared Login)</span>
            </h2>
          </div>

          <p className="text-[11px] text-neutral-400">
            All team members listed here utilize the primary administrative credentials (<strong>{AUTHORIZED_ADMIN_EMAIL}</strong>). This directory is for internal identity management and attribution.
          </p>

          <div className="space-y-3">
            {adminProfiles.length === 0 ? (
              <div className="text-center py-8 rounded-xl border border-dashed border-neutral-800 text-neutral-500 text-[11px] uppercase tracking-widest font-bold">
                No active team profiles
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {adminProfiles.map((profile) => (
                  <div key={profile.id} className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#13487E]/10 border border-[#13487E]/20 flex items-center justify-center text-[#13487E] font-black font-mono">
                        {profile.name[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{profile.name}</h4>
                        <p className="text-[10px] text-[#13487E] uppercase tracking-wider font-black">{profile.role}</p>
                        <p className="text-[10px] text-neutral-500 truncate">{profile.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Revoke admin profile for ${profile.name}?`)) {
                          deleteAdminProfile(profile.id);
                        }
                      }}
                      className="p-2 text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete profile"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setMemberModalOpen(true)}
                className="w-full py-3 rounded-xl border border-dashed border-neutral-800 text-neutral-500 hover:text-white hover:border-[#13487E]/50 hover:bg-[#13487E]/5 transition-all text-[10px] font-black uppercase tracking-widest"
              >
                + Register New Team Member
              </button>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setResetConfirmOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-bold text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
            <span>Reset Demo Catalog</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-xl bg-[#13487E] hover:bg-[#0d3a66] text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#13487E]/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 stroke-[3]" />
            <span>{isSaving ? 'Saving...' : 'Save Store Settings'}</span>
          </button>
        </div>
      </form>

      {/* SQL Setup Modal */}
      {sqlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-2xl bg-[#0d0d12] border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-2xl text-neutral-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-[#13487E]" />
                <h3 className="text-base font-black text-white font-['Space_Grotesk'] uppercase tracking-tight">
                  Supabase Database Schema Setup
                </h3>
              </div>
              <button
                onClick={() => setSqlModalOpen(false)}
                className="text-neutral-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              To create the PostgreSQL tables in your Supabase project (<strong>{supabaseProjectId}</strong>), open your Supabase SQL Editor and execute the script below:
            </p>

            <div className="relative">
              <pre className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-300 overflow-x-auto max-h-72 selection:bg-[#13487E] selection:text-white">
                {SUPABASE_SCHEMA_SQL}
              </pre>

              <button
                onClick={handleCopySql}
                className="absolute top-2 right-2 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-[#13487E] transition-colors flex items-center gap-1.5 shadow"
              >
                {sqlCopied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{sqlCopied ? 'Copied SQL!' : 'Copy Script'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
              <a
                href={`https://supabase.com/dashboard/project/${supabaseProjectId}/sql/new`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-[#13487E] hover:underline flex items-center gap-1"
              >
                <span>Open Supabase SQL Editor</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <button
                type="button"
                onClick={() => setSqlModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-bold text-neutral-300 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Member Modal */}
      {memberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-[#0d0d12] border border-neutral-800 rounded-2xl p-6 space-y-5 shadow-2xl text-neutral-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Register Team Member
              </h3>
              <button
                onClick={() => setMemberModalOpen(false)}
                className="text-neutral-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={memberFormData.name}
                  onChange={(e) => setMemberFormData({ ...memberFormData, name: e.target.value })}
                  placeholder="e.g. Tanvir Ahmed"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#13487E]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  Designation / Role
                </label>
                <input
                  type="text"
                  required
                  value={memberFormData.role}
                  onChange={(e) => setMemberFormData({ ...memberFormData, role: e.target.value })}
                  placeholder="e.g. Sales Manager"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#13487E]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  Contact Email
                </label>
                <input
                  type="email"
                  required
                  value={memberFormData.email}
                  onChange={(e) => setMemberFormData({ ...memberFormData, email: e.target.value })}
                  placeholder="e.g. member@jakariyasmart.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#13487E]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMemberModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-neutral-900 text-neutral-400 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isAddingMember || !memberFormData.name || !memberFormData.role || !memberFormData.email}
                onClick={async () => {
                  setIsAddingMember(true);
                  try {
                    await addAdminProfile(memberFormData);
                    setMemberModalOpen(false);
                    setMemberFormData({ name: '', role: '', email: '' });
                  } catch (err: any) {
                    alert(`Failed to add member: ${err.message}`);
                  } finally {
                    setIsAddingMember(false);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-[#13487E] hover:bg-[#0d3a66] text-white text-xs font-black uppercase tracking-widest disabled:opacity-50"
              >
                {isAddingMember ? 'Saving...' : 'Confirm Registration'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-[#0d0d12] border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-2xl text-neutral-100"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              Reset Demo Catalog?
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              This will restore all default Jakariya's Mart products, categories, hero banners, and demo orders. Any custom entries saved in local cache will be reset.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl bg-neutral-900 text-neutral-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetCatalog}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
              >
                Yes, Reset Demo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

