import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Tag, Check, AlertCircle } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { formatBDT } from '../../utils/bangladesh';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onCheckout,
}) => {
  const {
    cart,
    removeFromCart,
    updateCartQuantity,
    cartTotal,
    settings,
    appliedCoupon,
    applyCouponCode,
    removeAppliedCoupon,
    calculateDiscountForCoupon,
  } = useStore();
  const { t, language } = useLanguage();
  const { isDark } = useTheme();

  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Real-time coupon calculation for items in cart
  const couponCheck = appliedCoupon ? calculateDiscountForCoupon(appliedCoupon, cart) : null;
  const discountAmount = couponCheck && couponCheck.isValid ? couponCheck.discount : 0;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponMsg(null);
    if (!couponInput.trim()) return;

    setIsApplyingCoupon(true);
    const result = applyCouponCode(couponInput.trim(), cart);
    setCouponMsg({ text: result.message, success: result.success });
    setIsApplyingCoupon(false);

    if (result.success) {
      setCouponInput('');
    }
  };

  const handleRemoveCoupon = () => {
    removeAppliedCoupon();
    setCouponMsg(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className={`w-screen max-w-md border-l flex flex-col shadow-2xl transition-colors duration-300 ${
            isDark
              ? 'bg-[#0e0e12] border-neutral-800 text-white'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Drawer Header */}
          <div
            className={`p-4 sm:p-6 border-b flex items-center justify-between ${
              isDark ? 'border-neutral-800' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-[#13487E]" />
              <h2 className="text-lg font-black uppercase tracking-tight font-['Space_Grotesk']">
                {t('your_cart')} ({cart.reduce((s, i) => s + i.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div
                  className={`w-16 h-16 rounded-2xl border flex items-center justify-center ${
                    isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-500' : 'bg-slate-100 border-slate-200 text-slate-400'
                  }`}
                >
                  <ShoppingBag className="w-8 h-8 stroke-1" />
                </div>
                <div>
                  <h3 className={`text-base font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {t('cart_empty')}
                  </h3>
                  <p className={`text-xs mt-1.5 max-w-xs ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                    {language === 'bn' ? 'আমাদের নতুন কালেকশন ঘুরে দেখুন এবং পছন্দের পণ্য অর্ডার করুন।' : "Explore the latest Jakariya's Mart drops and gear up for the season."}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                    isDark
                      ? 'bg-neutral-900 hover:bg-neutral-800 text-[#13487E] border-neutral-800'
                      : 'bg-slate-100 hover:bg-slate-200 text-[#13487E] border-slate-200'
                  }`}
                >
                  {language === 'bn' ? 'শপিং শুরু করুন' : 'Start Shopping'}
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const itemPrice = item.product.discount_price ?? item.product.price;
                const itemSubtotal = itemPrice * item.quantity;

                return (
                  <div
                    key={item.id}
                    className={`flex gap-4 p-3.5 rounded-2xl border transition-all ${
                      isDark
                        ? 'bg-neutral-900/60 border-neutral-800/80'
                        : 'bg-slate-50 border-slate-200 shadow-2xs'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div
                      className={`w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border ${
                        isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-slate-100 border-slate-200'
                      }`}
                    >
                      <img
                        src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className={`text-sm font-bold line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {item.product.name}
                          </h4>
                          {item.selected_variants && Object.entries(item.selected_variants).length > 0 && (
                            <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                              {Object.entries(item.selected_variants).map(([key, value]) => (
                                <span key={key} className={`text-[10px] font-medium ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                                  {key}: <span className={isDark ? 'text-neutral-200' : 'text-slate-800 font-semibold'}>{value}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-neutral-400 hover:text-red-500 p-1 cursor-pointer transition-colors"
                          title="Remove item"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className={`text-xs font-mono ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                        {formatBDT(itemPrice)} each
                      </div>

                      {/* Quantity & Item Subtotal */}
                      <div className="flex items-center justify-between pt-1">
                        <div
                          className={`flex items-center border rounded-lg ${
                            isDark ? 'border-neutral-700 bg-neutral-950' : 'border-slate-300 bg-white'
                          }`}
                        >
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            className={`p-1 cursor-pointer transition-colors ${
                              isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                            }`}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-bold font-mono">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            className={`p-1 cursor-pointer transition-colors disabled:opacity-30 ${
                              isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                            }`}
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className={`text-sm font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {formatBDT(itemSubtotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer */}
          {cart.length > 0 && (
            <div
              className={`p-4 sm:p-6 border-t space-y-4 ${
                isDark ? 'border-neutral-800 bg-neutral-950/90' : 'border-slate-200 bg-slate-50'
              }`}
            >
              {/* Coupon Code Section */}
              <div className="space-y-2">
                {appliedCoupon && discountAmount > 0 ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 ml-1.5 font-bold">
                          (-{formatBDT(discountAmount)})
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="p-1 rounded text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Remove coupon"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Coupon code (e.g. JM10)"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          className={`w-full pl-9 pr-3 py-2 border rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[#13487E] ${
                            isDark
                              ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500'
                              : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                          }`}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isApplyingCoupon || !couponInput.trim()}
                        className="px-4 py-2 rounded-xl bg-[#13487E] hover:bg-[#0d3a66] disabled:opacity-40 text-xs font-bold text-white uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                    {couponMsg && (
                      <div
                        className={`text-[11px] flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${
                          couponMsg.success
                            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                            : 'text-red-600 dark:text-red-400 bg-red-500/10'
                        }`}
                      >
                        {couponMsg.success ? (
                          <Check className="w-3 h-3 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        )}
                        <span>{couponMsg.text}</span>
                      </div>
                    )}
                  </form>
                )}
              </div>

              {/* Price Breakdown */}
              <div className={`space-y-1.5 pt-2 border-t ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
                <div className={`flex justify-between text-xs ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                  <span>{t('subtotal')}</span>
                  <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatBDT(cartTotal)}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>{language === 'bn' ? `কুপন ছাড় (${appliedCoupon?.code})` : `Coupon Discount (${appliedCoupon?.code})`}</span>
                    <span className="font-mono">
                      - {formatBDT(discountAmount)}
                    </span>
                  </div>
                )}

                <div className={`flex justify-between text-xs ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                  <span>{t('delivery_charge')}</span>
                  <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatBDT(settings.delivery_charge || 80)} ({language === 'bn' ? 'ঢাকা' : 'Dhaka'}) / ৳120 ({language === 'bn' ? 'ঢাকার বাইরে' : 'Outside'})
                  </span>
                </div>

                <div className={`flex justify-between text-base font-black pt-2 border-t ${
                  isDark ? 'border-neutral-800 text-white' : 'border-slate-200 text-slate-900'
                }`}>
                  <span>{t('total')} ({language === 'bn' ? 'ক্যাশ অন ডেলিভারি' : 'Cash on Delivery'})</span>
                  <span className="font-mono text-lg text-[#13487E] dark:text-[#6ea8fe]">
                    {formatBDT(
                      Math.max(0, cartTotal - discountAmount) + (settings.delivery_charge || 80)
                    )}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onCheckout();
                }}
                className="w-full py-3.5 px-6 rounded-xl bg-[#13487E] hover:bg-[#0d3a66] text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-[#13487E]/25 cursor-pointer"
              >
                <span>{t('proceed_to_checkout')}</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
