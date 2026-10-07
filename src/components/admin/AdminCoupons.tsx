import React, { useState, useMemo } from 'react';
import {
  Tag,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Percent,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
  X,
  Package,
  ShoppingBag,
  Clock,
  SlidersHorizontal,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Coupon, Product } from '../../types';
import { formatBDT } from '../../utils/bangladesh';

export const AdminCoupons: React.FC = () => {
  const { coupons, products, addCoupon, updateCoupon, deleteCoupon, toggleCouponStatus } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [appliesFilter, setAppliesFilter] = useState<'all' | 'all_products' | 'specific'>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isDeleting, setIsDeleting] = useState<Coupon | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewingProductsCoupon, setViewingProductsCoupon] = useState<Coupon | null>(null);

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDiscountType, setFormDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [formDiscountValue, setFormDiscountValue] = useState<number>(10);
  const [formAppliesTo, setFormAppliesTo] = useState<'all' | 'specific'>('all');
  const [formProductIds, setFormProductIds] = useState<string[]>([]);
  const [formMinOrder, setFormMinOrder] = useState<string>('');
  const [formMaxDiscount, setFormMaxDiscount] = useState<string>('');
  const [formEndDate, setFormEndDate] = useState<string>('');
  const [formUsageLimit, setFormUsageLimit] = useState<string>('');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  const [productSearch, setProductSearch] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered coupons
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCode = c.code.toLowerCase().includes(q);
        const matchesDesc = c.description?.toLowerCase().includes(q);
        if (!matchesCode && !matchesDesc) return false;
      }

      if (statusFilter === 'active' && !c.is_active) return false;
      if (statusFilter === 'inactive' && c.is_active) return false;

      if (appliesFilter === 'all_products' && c.applies_to !== 'all') return false;
      if (appliesFilter === 'specific' && c.applies_to !== 'specific') return false;

      return true;
    });
  }, [coupons, searchQuery, statusFilter, appliesFilter]);

  // Filtered products for modal picker
  const filteredModalProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const q = productSearch.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormCode('');
    setFormDescription('');
    setFormDiscountType('percentage');
    setFormDiscountValue(10);
    setFormAppliesTo('all');
    setFormProductIds([]);
    setFormMinOrder('');
    setFormMaxDiscount('');
    setFormEndDate('');
    setFormUsageLimit('');
    setFormIsActive(true);
    setProductSearch('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormCode(coupon.code);
    setFormDescription(coupon.description || '');
    setFormDiscountType(coupon.discount_type);
    setFormDiscountValue(coupon.discount_value);
    setFormAppliesTo(coupon.applies_to);
    setFormProductIds(coupon.product_ids || []);
    setFormMinOrder(coupon.min_order_amount ? String(coupon.min_order_amount) : '');
    setFormMaxDiscount(coupon.max_discount_amount ? String(coupon.max_discount_amount) : '');
    setFormEndDate(coupon.end_date ? coupon.end_date.split('T')[0] : '');
    setFormUsageLimit(coupon.usage_limit ? String(coupon.usage_limit) : '');
    setFormIsActive(coupon.is_active);
    setProductSearch('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggleProductSelection = (productId: string) => {
    setFormProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleSelectAllProducts = () => {
    setFormProductIds(products.map((p) => p.id));
  };

  const handleDeselectAllProducts = () => {
    setFormProductIds([]);
  };

  const handleGenerateCode = () => {
    const prefixes = ['JM', 'EID', 'DISCOUNT', 'DEAL', 'SAVE', 'VIP', 'FLASH'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(10 + Math.random() * 90);
    setFormCode(`${randomPrefix}${randomNum}`);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanCode = formCode.trim().toUpperCase();
    if (!cleanCode) {
      setFormError('কুপন কোড প্রদান করা আবশ্যক (Coupon Code is required).');
      return;
    }

    if (cleanCode.length < 3) {
      setFormError('কুপন কোড কমপক্ষে ৩ অক্ষরের হতে হবে (Min 3 characters).');
      return;
    }

    // Check duplicate code (excluding current editing coupon)
    const duplicate = coupons.find(
      (c) => c.code.toUpperCase() === cleanCode && (!editingCoupon || c.id !== editingCoupon.id)
    );
    if (duplicate) {
      setFormError(`"${cleanCode}" কোডটি ইতিমধ্যে বিদ্যমান রয়েছে। অন্য কোড দিন।`);
      return;
    }

    if (formDiscountValue <= 0) {
      setFormError('ডিসকাউন্ট এর পরিমাণ ০ এর চেয়ে বেশি হতে হবে।');
      return;
    }

    if (formDiscountType === 'percentage' && formDiscountValue > 100) {
      setFormError('শতাংশ (%) ডিসকাউন্ট সর্বোচ্চ ১০০% হতে পারে।');
      return;
    }

    if (formAppliesTo === 'specific' && formProductIds.length === 0) {
      setFormError('নির্দিষ্ট প্রোডাক্টে ডিসকাউন্ট দিতে অন্তত একটি প্রোডাক্ট সিলেক্ট করুন।');
      return;
    }

    setIsSubmitting(true);
    try {
      const couponPayload = {
        code: cleanCode,
        description: formDescription.trim() || undefined,
        discount_type: formDiscountType,
        discount_value: Number(formDiscountValue),
        applies_to: formAppliesTo,
        product_ids: formAppliesTo === 'specific' ? formProductIds : undefined,
        min_order_amount: formMinOrder ? Number(formMinOrder) : undefined,
        max_discount_amount: formMaxDiscount ? Number(formMaxDiscount) : undefined,
        end_date: formEndDate ? new Date(formEndDate).toISOString() : undefined,
        usage_limit: formUsageLimit ? Number(formUsageLimit) : undefined,
        is_active: formIsActive,
      };

      if (editingCoupon) {
        await updateCoupon(editingCoupon.id, couponPayload);
      } else {
        await addCoupon(couponPayload);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'কুপন সংরক্ষণে ত্রুটি হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCoupon = async () => {
    if (!isDeleting) return;
    try {
      await deleteCoupon(isDeleting.id);
      setIsDeleting(null);
    } catch (err) {
      console.error('Failed to delete coupon', err);
    }
  };

  // Stats calculation
  const totalCoupons = coupons.length;
  const activeCouponsCount = coupons.filter((c) => c.is_active).length;
  const totalUsesCount = coupons.reduce((sum, c) => sum + (c.usage_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-6 h-6 text-[#13487E]" />
            <h1 className="text-2xl sm:text-3xl font-black text-white font-['Space_Grotesk'] tracking-tight">
              COUPONS & DISCOUNTS
            </h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Create discount codes, configure percentage or flat off, and target all or specific products.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-[#13487E] hover:bg-[#0d3a66] text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#13487E]/25 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Coupon</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-[#0a0a0d] border border-neutral-800/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Total Coupons
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
              {totalCoupons}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#13487E]/20 text-[#13487E] flex items-center justify-center">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0a0a0d] border border-neutral-800/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Active Coupons
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-1">
              {activeCouponsCount}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0a0a0d] border border-neutral-800/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between col-span-2 lg:col-span-1">
          <div>
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Total Redeemed
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono mt-1">
              {totalUsesCount} times
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#0a0a0d] border border-neutral-800/80 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search coupon code or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#13487E]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-[#13487E]"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {/* Scope Filter */}
          <select
            value={appliesFilter}
            onChange={(e) => setAppliesFilter(e.target.value as any)}
            className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-[#13487E]"
          >
            <option value="all">All Scopes</option>
            <option value="all_products">🌐 All Products</option>
            <option value="specific">🎯 Specific Products</option>
          </select>
        </div>
      </div>

      {/* Coupons List */}
      {filteredCoupons.length === 0 ? (
        <div className="bg-[#0a0a0d] border border-neutral-800/80 rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 mx-auto">
            <Tag className="w-8 h-8 stroke-1" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Coupons Found</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              Create your first promotional discount coupon code for your customers.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 rounded-xl bg-[#13487E] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#0d3a66] transition-colors"
          >
            + Create Coupon
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCoupons.map((coupon) => {
            const isPercentage = coupon.discount_type === 'percentage';
            const isSpecific = coupon.applies_to === 'specific';
            const targetedCount = coupon.product_ids?.length || 0;

            return (
              <div
                key={coupon.id}
                className={`bg-[#0a0a0d] border rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 relative group overflow-hidden ${
                  coupon.is_active
                    ? 'border-neutral-800/80 hover:border-neutral-700'
                    : 'border-red-950/40 opacity-75'
                }`}
              >
                {/* Decorative Top Pill */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-lg font-mono text-sm font-black tracking-wider flex items-center gap-1.5 border shadow-inner ${
                        coupon.is_active
                          ? 'bg-[#13487E]/20 text-[#6ea8fe] border-[#13487E]/40'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                      }`}
                    >
                      <Tag className="w-3.5 h-3.5 text-[#13487E]" />
                      {coupon.code}
                    </span>

                    <button
                      onClick={() => handleCopyCode(coupon.code, coupon.id)}
                      className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
                      title="Copy coupon code"
                    >
                      {copiedId === coupon.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      coupon.is_active
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {coupon.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>

                {/* Discount Badge & Description */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white font-mono tracking-tight">
                      {isPercentage ? `${coupon.discount_value}% OFF` : `৳${coupon.discount_value} OFF`}
                    </span>
                    <span className="text-xs text-neutral-400">
                      ({isPercentage ? 'Percentage Discount' : 'Flat BDT Discount'})
                    </span>
                  </div>

                  {coupon.description && (
                    <p className="text-xs text-neutral-300 line-clamp-2">{coupon.description}</p>
                  )}
                </div>

                {/* Target Scope & Constraints */}
                <div className="space-y-2 py-3 border-y border-neutral-800/80 text-xs text-neutral-400">
                  {/* Applicability */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-neutral-400">
                      <Layers className="w-3.5 h-3.5 text-neutral-500" />
                      Applicable On:
                    </span>
                    {isSpecific ? (
                      <button
                        onClick={() => setViewingProductsCoupon(coupon)}
                        className="font-bold text-[#6ea8fe] hover:underline flex items-center gap-1"
                      >
                        🎯 {targetedCount} Selected Products
                      </button>
                    ) : (
                      <span className="font-bold text-neutral-200">🌐 All Products in Store</span>
                    )}
                  </div>

                  {/* Min Order */}
                  {coupon.min_order_amount && (
                    <div className="flex items-center justify-between">
                      <span>Minimum Order:</span>
                      <span className="font-mono text-neutral-200 font-bold">
                        {formatBDT(coupon.min_order_amount)}
                      </span>
                    </div>
                  )}

                  {/* Max Discount (for %) */}
                  {isPercentage && coupon.max_discount_amount && (
                    <div className="flex items-center justify-between">
                      <span>Max Discount Cap:</span>
                      <span className="font-mono text-neutral-200 font-bold">
                        {formatBDT(coupon.max_discount_amount)}
                      </span>
                    </div>
                  )}

                  {/* Usage Info */}
                  <div className="flex items-center justify-between">
                    <span>Usage Count:</span>
                    <span className="font-mono text-amber-400 font-bold">
                      {coupon.usage_count || 0} times
                      {coupon.usage_limit ? ` / max ${coupon.usage_limit}` : ''}
                    </span>
                  </div>

                  {/* Expiry Date */}
                  {coupon.end_date && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        Expires On:
                      </span>
                      <span className="font-mono text-neutral-300">
                        {new Date(coupon.end_date).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between gap-2 pt-3 mt-1">
                  <button
                    onClick={() => toggleCouponStatus(coupon.id)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                      coupon.is_active
                        ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-red-400 hover:border-red-900'
                        : 'bg-emerald-950/40 border-emerald-900 text-emerald-400 hover:bg-emerald-900/60'
                    }`}
                  >
                    {coupon.is_active ? 'Disable' : 'Enable'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(coupon)}
                      className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors"
                      title="Edit coupon"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setIsDeleting(coupon)}
                      className="p-2 rounded-lg bg-neutral-900 hover:bg-red-950/40 text-neutral-400 hover:text-red-400 border border-neutral-800 hover:border-red-900/50 transition-colors"
                      title="Delete coupon"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Targeted Products Modal */}
      {viewingProductsCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#0e0e12] border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#13487E] uppercase tracking-wider">
                  Targeted Products
                </div>
                <h3 className="text-lg font-black text-white font-mono">
                  Coupon: {viewingProductsCoupon.code}
                </h3>
              </div>
              <button
                onClick={() => setViewingProductsCoupon(null)}
                className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 max-h-[60vh] overflow-y-auto space-y-2">
              {products
                .filter((p) => viewingProductsCoupon.product_ids?.includes(p.id))
                .map((prod) => (
                  <div
                    key={prod.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-950 flex-shrink-0 border border-neutral-800">
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{prod.name}</h4>
                      <div className="text-[11px] font-mono text-neutral-400">
                        {formatBDT(prod.discount_price ?? prod.price)}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <div className="p-4 border-t border-neutral-800 text-right bg-neutral-950">
              <button
                onClick={() => setViewingProductsCoupon(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-[#0e0e12] border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#13487E]/20 text-[#13487E] flex items-center justify-center">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white font-['Space_Grotesk']">
                    {editingCoupon ? 'EDIT COUPON CODE' : 'CREATE NEW COUPON'}
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    কুপন কোড, ডিসকাউন্ট টাইপ (%) এবং প্রোডাক্ট নির্বাচনের কনফিগারেশন।
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-950/40 border border-red-900 rounded-xl text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Coupon Code & Generate Button */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">
                  Coupon Code (কুপন কোড) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. EID20, JM10, FLASH50"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-sm font-mono font-bold text-white placeholder-neutral-500 focus:outline-none focus:border-[#13487E]"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    className="px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Generate</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">
                  Description / Note (বিবরণ)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10% discount on all streetwear hoodies"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#13487E]"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">
                    Discount Type (ডিসকাউন্ট টাইপ)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormDiscountType('percentage')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                        formDiscountType === 'percentage'
                          ? 'bg-[#13487E] border-[#13487E] text-white'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Percent className="w-3.5 h-3.5" />
                      <span>Percentage (%)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormDiscountType('fixed')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                        formDiscountType === 'fixed'
                          ? 'bg-[#13487E] border-[#13487E] text-white'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span>Fixed ৳ (Flat)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">
                    {formDiscountType === 'percentage'
                      ? 'Discount Percentage (শতাংশ %)'
                      : 'Discount Amount (টাকার পরিমাণ ৳)'}{' '}
                    *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      max={formDiscountType === 'percentage' ? 100 : 100000}
                      value={formDiscountValue}
                      onChange={(e) => setFormDiscountValue(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-sm font-mono font-bold text-white focus:outline-none focus:border-[#13487E]"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                      {formDiscountType === 'percentage' ? '%' : 'BDT (৳)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Product Applicability (All vs Specific Products) */}
              <div className="border border-neutral-800 rounded-2xl p-4 bg-neutral-950/60 space-y-3">
                <label className="block text-xs font-black text-white uppercase tracking-wider">
                  Applies To (কুপনটি কোন প্রোডাক্টে প্রযোজ্য হবে?) *
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    onClick={() => setFormAppliesTo('all')}
                    className={`cursor-pointer p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                      formAppliesTo === 'all'
                        ? 'bg-[#13487E]/20 border-[#13487E] text-white'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="appliesTo"
                      checked={formAppliesTo === 'all'}
                      onChange={() => setFormAppliesTo('all')}
                      className="accent-[#13487E] w-4 h-4"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">🌐 All Products (সব প্রোডাক্ট)</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        ওয়েবসাইটের যেকোনো প্রোডাক্ট অর্ডারে প্রযোজ্য হবে
                      </div>
                    </div>
                  </label>

                  <label
                    onClick={() => setFormAppliesTo('specific')}
                    className={`cursor-pointer p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                      formAppliesTo === 'specific'
                        ? 'bg-[#13487E]/20 border-[#13487E] text-white'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="appliesTo"
                      checked={formAppliesTo === 'specific'}
                      onChange={() => setFormAppliesTo('specific')}
                      className="accent-[#13487E] w-4 h-4"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">
                        🎯 Specific Products (নির্দিষ্ট প্রোডাক্ট)
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        শুধু আপনার সিলেক্ট করা প্রোডাক্টগুলোতে প্রযোজ্য হবে
                      </div>
                    </div>
                  </label>
                </div>

                {/* Specific Product Selection Matrix */}
                {formAppliesTo === 'specific' && (
                  <div className="mt-3 pt-3 border-t border-neutral-800 space-y-3">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                      <div className="relative flex-1 w-full">
                        <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search products to include in coupon..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#13487E]"
                        />
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        <span className="text-xs font-bold text-[#13487E]">
                          {formProductIds.length} of {products.length} Selected
                        </span>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={handleSelectAllProducts}
                            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-[11px] font-bold text-neutral-200 rounded-md"
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={handleDeselectAllProducts}
                            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-[11px] font-bold text-neutral-200 rounded-md"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Scrollable Product Checklist */}
                    <div className="max-h-52 overflow-y-auto border border-neutral-800 rounded-xl divide-y divide-neutral-800/80 bg-neutral-900/60 p-1">
                      {filteredModalProducts.length === 0 ? (
                        <div className="p-4 text-center text-xs text-neutral-500">
                          কোনো প্রোডাক্ট পাওয়া যায়নি
                        </div>
                      ) : (
                        filteredModalProducts.map((p) => {
                          const isSelected = formProductIds.includes(p.id);
                          return (
                            <label
                              key={p.id}
                              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                isSelected ? 'bg-[#13487E]/20 text-white' : 'hover:bg-neutral-800/60 text-neutral-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleProductSelection(p.id)}
                                className="w-4 h-4 rounded accent-[#13487E] cursor-pointer"
                              />
                              <div className="w-9 h-9 rounded-md overflow-hidden bg-neutral-950 flex-shrink-0 border border-neutral-800">
                                <img
                                  src={p.images[0]}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold truncate">{p.name}</div>
                                <div className="text-[10px] text-neutral-400 font-mono">
                                  {formatBDT(p.discount_price ?? p.price)} | Stock: {p.stock}
                                </div>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Optional Advanced Constraints */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Optional Constraints & Limits</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                      Min Order Subtotal (সর্বনিম্ন অর্ডার ৳)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 500"
                      value={formMinOrder}
                      onChange={(e) => setFormMinOrder(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#13487E]"
                    />
                  </div>

                  {formDiscountType === 'percentage' && (
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                        Max Discount Cap (সর্বোচ্চ ছাড় ৳)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 500"
                        value={formMaxDiscount}
                        onChange={(e) => setFormMaxDiscount(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#13487E]"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                      Expiry Date (মেয়াদ শেষ হওয়ার তারিখ)
                    </label>
                    <input
                      type="date"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#13487E]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                      Max Total Usage Limit (ব্যবহারের সীমা)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 100"
                      value={formUsageLimit}
                      onChange={(e) => setFormUsageLimit(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#13487E]"
                    />
                  </div>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-neutral-900/80 border border-neutral-800 rounded-xl">
                <div>
                  <div className="text-xs font-bold text-white">Coupon Status (সক্রিয় অবস্থা)</div>
                  <div className="text-[11px] text-neutral-400">
                    সক্রিয় থাকলে কাস্টমার চেকআউটে এই কুপনটি ব্যবহার করতে পারবে
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#13487E]"></div>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-bold text-neutral-300 border border-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#13487E] hover:bg-[#0d3a66] text-white font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'Saving...'
                    : editingCoupon
                    ? 'Update Coupon'
                    : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#0e0e12] border border-neutral-800 rounded-2xl w-full max-w-md p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-950/60 text-red-400 border border-red-900/50 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Delete Coupon Code?</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Are you sure you want to delete coupon{' '}
                <strong className="text-white font-mono">{isDeleting.code}</strong>? This action cannot
                be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsDeleting(null)}
                className="px-4 py-2 rounded-xl bg-neutral-900 text-neutral-300 text-xs font-bold border border-neutral-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCoupon}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
