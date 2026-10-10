import React, { useState, useEffect } from 'react';
import { Plus, Minus, ShoppingBag, Check, ShieldCheck, Truck, RefreshCw, ArrowLeft, AlertCircle, Maximize2 } from 'lucide-react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { formatBDT } from '../../utils/bangladesh';
import { StoreNavbar } from './StoreNavbar';
import { StoreFooter } from './StoreFooter';
import { CartDrawer } from './CartDrawer';
import { ImageLightboxModal } from './ImageLightboxModal';
import { motion } from 'motion/react';

interface ProductDetailViewProps {
  productId: string;
  onNavigate: (route: string) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  productId,
  onNavigate,
}) => {
  const { products, categories, addToCart, setBuyNowItems } = useStore();
  const { t } = useLanguage();
  const { isDark } = useTheme();

  const product = products.find((p) => p.id === productId);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [added, setAdded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [variantError, setVariantError] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setSelectedImageIndex(0);
    setQuantity(1);
    setSelectedOptions({});
    setVariantError(null);
  }, [productId]);

  if (!product) {
    return (
      <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#0a0a0c] text-white' : 'bg-slate-50 text-slate-900'}`}>
        <StoreNavbar
          onNavigate={onNavigate}
          onOpenCart={() => setIsCartOpen(true)}
          selectedCategory={null}
          onSelectCategory={() => {}}
          searchQuery=""
          onSearchChange={() => {}}
        />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-12 h-12 text-neutral-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t('no_products_found')}</h2>
          <p className={`text-sm mb-6 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>The product you are looking for does not exist or has been removed.</p>
          <button
            onClick={() => onNavigate('/')}
            className="px-6 py-2.5 rounded-xl bg-[#13487E] text-white font-bold text-sm cursor-pointer"
          >
            {t('back_to_catalog')}
          </button>
        </div>
        <StoreFooter onNavigate={onNavigate} onSelectCategory={() => {}} />
      </div>
    );
  }

  const category = categories.find((c) => c.id === product.category_id);
  const isOutOfStock = product.stock <= 0;
  const displayPrice = product.discount_price ?? product.price;

  const handleToggleVariant = (variantName: string, option: string) => {
    const key = `${variantName}:${option}`;
    setVariantError(null);
    setSelectedOptions((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = 1;
      }
      return next;
    });
  };

  const handleUpdateOptionQty = (variantName: string, option: string, delta: number) => {
    const key = `${variantName}:${option}`;
    setSelectedOptions((prev) => {
      const currentQty = prev[key] || 0;
      const newQty = Math.max(1, Math.min(product.stock, currentQty + delta));
      return { ...prev, [key]: newQty };
    });
  };

  const totalSelectedPrice = Object.values(selectedOptions).reduce((sum, qty) => sum + qty * displayPrice, 0) || (quantity * displayPrice);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    if (product.variants && product.variants.length > 0) {
      const selectedKeys = Object.keys(selectedOptions);
      if (selectedKeys.length === 0) {
        setVariantError('অনুগ্রহ করে অন্তত একটি ভ্যারিয়েন্ট নির্বাচন করুন।');
        return;
      }
      selectedKeys.forEach((key) => {
        const [varName, optVal] = key.split(':');
        const qty = selectedOptions[key];
        addToCart(product, qty, { [varName]: optVal });
      });
    } else {
      addToCart(product, quantity);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleBuyNowClick = () => {
    if (isOutOfStock) return;
    if (product.variants && product.variants.length > 0) {
      const selectedKeys = Object.keys(selectedOptions);
      if (selectedKeys.length === 0) {
        setVariantError('অনুগ্রহ করে অন্তত একটি ভ্যারিয়েন্ট নির্বাচন করুন।');
        return;
      }
      const buyNowArray = selectedKeys.map((key) => {
        const [varName, optVal] = key.split(':');
        const qty = selectedOptions[key];
        return {
          id: `${product.id}-${key}`,
          product,
          quantity: qty,
          selected_variants: { [varName]: optVal },
        };
      });
      setBuyNowItems(buyNowArray);
    } else {
      setBuyNowItems([
        {
          id: product.id,
          product,
          quantity,
        },
      ]);
    }
    onNavigate('/checkout');
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-[#0a0a0c] text-neutral-100' : 'bg-slate-50 text-slate-900'}`}>
      <StoreNavbar
        onNavigate={onNavigate}
        onOpenCart={() => setIsCartOpen(true)}
        selectedCategory={null}
        onSelectCategory={() => {}}
        searchQuery=""
        onSearchChange={() => {}}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={`rounded-3xl overflow-hidden shadow-xl border transition-colors ${
            isDark ? 'bg-neutral-900/40 border-neutral-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Images Section */}
            <div
              className={`p-6 sm:p-10 flex flex-col gap-6 border-b lg:border-b-0 lg:border-r ${
                isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-slate-50/70 border-slate-200'
              }`}
            >
              <button
                onClick={() => onNavigate('/')}
                className={`inline-flex items-center gap-2 text-xs font-bold transition-colors mb-2 cursor-pointer ${
                  isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('back_to_catalog')}</span>
              </button>

              {/* Main Product Image */}
              <div 
                onClick={() => setIsLightboxOpen(true)}
                className={`relative aspect-square w-full rounded-2xl overflow-hidden border shadow-inner group/preview cursor-zoom-in ${
                  isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200'
                }`}
                title={t('click_to_zoom')}
              >
                <img
                  src={product.images?.[selectedImageIndex] || product.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'}
                  alt={product.name}
                  className="w-full h-full object-cover object-center group-hover/preview:scale-105 transition-transform duration-500"
                />

                {/* Corner Zoom Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLightboxOpen(true);
                  }}
                  className="absolute bottom-4 right-4 z-10 p-2.5 rounded-xl bg-black/75 hover:bg-[#13487E] text-white border border-neutral-700/80 backdrop-blur-xs transition-all shadow-lg hover:scale-110 active:scale-95 cursor-pointer"
                  title={t('click_to_zoom')}
                  aria-label="Enlarge image"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                {product.discount_price && product.discount_price < product.price && (
                  <span className="absolute top-5 left-5 bg-[#13487E] text-white text-xs font-black uppercase px-3 py-1.5 rounded-lg shadow-lg">
                    {t('save')} {Math.round(((product.price - product.discount_price) / product.price) * 100)}%
                  </span>
                )}
              </div>

              {/* Thumbnail selector */}
              {product.images.filter((img) => Boolean(img && img.trim())).length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {product.images.filter((img) => Boolean(img && img.trim())).map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
                        selectedImageIndex === idx
                          ? 'border-[#13487E] scale-105 shadow-md shadow-[#13487E]/30'
                          : isDark
                          ? 'border-neutral-800 opacity-60 hover:opacity-100'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="p-6 sm:p-10 md:p-12 flex flex-col space-y-8">
              <div className="space-y-4">
                {/* Category & SKU */}
                <div className="flex items-center justify-between text-xs">
                  <span className="uppercase tracking-widest font-black text-[#13487E]">
                    {category?.name || 'Streetwear'}
                  </span>
                  {product.sku && (
                    <span
                      className={`font-mono px-2 py-1 rounded border ${
                        isDark ? 'text-neutral-400 bg-neutral-950 border-neutral-800' : 'text-slate-500 bg-slate-100 border-slate-200'
                      }`}
                    >
                      SKU: {product.sku}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1
                  className={`text-3xl sm:text-4xl lg:text-5xl font-black font-['Space_Grotesk'] tracking-tight leading-tight ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {product.name}
                </h1>

                {/* Price */}
                <div className="flex items-center gap-4">
                  <span className={`text-4xl font-black font-['Space_Grotesk'] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatBDT(displayPrice)}
                  </span>
                  {product.discount_price && product.discount_price < product.price && (
                    <span className={`text-xl line-through font-medium ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                      {formatBDT(product.price)}
                    </span>
                  )}
                  {product.stock > 0 && (
                    <span className="ml-auto text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
                      {product.stock} {t('units_ready')}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className={`pt-4 border-t ${isDark ? 'border-neutral-800/60' : 'border-slate-200'}`}>
                  <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                    {t('product_description')}
                  </h3>
                  <p className={`text-base leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                    {product.description}
                  </p>
                </div>

                {/* Product Variants (Size, Color, etc.) */}
                {product.variants && product.variants.length > 0 && (
                  <div className={`pt-6 space-y-6 border-t ${isDark ? 'border-neutral-800/60' : 'border-slate-200'}`}>
                    {product.variants.map((v) => (
                      <div key={v.id} className="space-y-3">
                        <label className={`text-xs font-bold uppercase tracking-[0.2em] block ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                          {t('select_variant')} {v.name} {t('multiple_allowed')}
                        </label>
                        <div className="space-y-2">
                          {v.options.map((opt) => {
                            const isSelected = !!selectedOptions[`${v.name}:${opt}`];
                            return (
                              <div 
                                key={opt} 
                                className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all duration-300 ${
                                  isSelected 
                                    ? isDark
                                      ? 'bg-[#13487E]/15 border-[#13487E] text-white'
                                      : 'bg-blue-50 border-[#13487E] text-slate-900'
                                    : isDark
                                    ? 'bg-neutral-950/40 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 shadow-2xs'
                                }`}
                              >
                                <div 
                                  className="flex items-center gap-3 cursor-pointer flex-1"
                                  onClick={() => handleToggleVariant(v.name, opt)}
                                >
                                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                                    isSelected ? 'bg-[#13487E] border-[#13487E]' : isDark ? 'border-neutral-700' : 'border-slate-300'
                                  }`}>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[4]" />}
                                  </div>
                                  <span className="text-sm font-bold">{opt}</span>
                                </div>
                                
                                {isSelected && (
                                  <div
                                    className={`flex items-center border rounded-xl p-0.5 ${
                                      isDark ? 'border-neutral-700 bg-neutral-900/80' : 'border-slate-300 bg-white shadow-2xs'
                                    }`}
                                  >
                                    <button
                                      onClick={() => handleUpdateOptionQty(v.name, opt, -1)}
                                      className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className={`px-3 text-xs font-black font-mono min-w-[2rem] text-center ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                      {selectedOptions[`${v.name}:${opt}`]}
                                    </span>
                                    <button
                                      onClick={() => handleUpdateOptionQty(v.name, opt, 1)}
                                      className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Variant Error Message */}
                {variantError && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-500 text-sm font-bold animate-in zoom-in-95 duration-200">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{variantError}</span>
                  </div>
                )}
              </div>

              {/* Actions: Quantity, Add to Cart & Buy Now */}
              <div className={`space-y-6 pt-6 border-t ${isDark ? 'border-neutral-800/60' : 'border-slate-200'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  {(!product.variants || product.variants.length === 0) && (
                    <div className="space-y-2">
                      <span className={`text-xs uppercase font-bold tracking-[0.2em] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                        {t('quantity')}
                      </span>
                      <div className={`flex items-center border-2 rounded-xl p-1 w-fit ${
                        isDark ? 'border-neutral-800 bg-neutral-950/80' : 'border-slate-200 bg-white shadow-2xs'
                      }`}>
                        <button
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          disabled={quantity <= 1 || isOutOfStock}
                          className="p-2.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className={`px-6 text-base font-black font-mono min-w-[3rem] text-center ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                          disabled={quantity >= product.stock || isOutOfStock}
                          className="p-2.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 h-fit self-end">
                    {/* Add to Bag Button */}
                    <button
                      onClick={handleAddToCart}
                      disabled={isOutOfStock}
                      className={`h-14 px-6 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 border-2 cursor-pointer ${
                        isOutOfStock
                          ? 'bg-neutral-800 border-neutral-800 text-neutral-600 cursor-not-allowed'
                          : added
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                          : isDark
                          ? 'bg-transparent border-neutral-700 hover:border-white text-white hover:bg-neutral-800'
                          : 'bg-white border-slate-300 hover:border-slate-400 text-slate-800 hover:bg-slate-100 shadow-2xs'
                      }`}
                    >
                      {added ? (
                        <>
                          <Check className="w-5 h-5 stroke-[4]" />
                          <span>{t('added')}</span>
                        </>
                      ) : isOutOfStock ? (
                        <span>{t('sold_out')}</span>
                      ) : (
                        <>
                          <ShoppingBag className="w-5 h-5" />
                          <span>{t('add_to_bag')}</span>
                        </>
                      )}
                    </button>

                    {/* Buy Now Button */}
                    <button
                      onClick={handleBuyNowClick}
                      disabled={isOutOfStock}
                      className={`h-14 px-6 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer ${
                        isOutOfStock
                          ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed opacity-50'
                          : 'bg-[#13487E] hover:bg-[#0d3a66] text-white shadow-md shadow-[#13487E]/20'
                      }`}
                    >
                      <Check className="w-5 h-5 stroke-[4]" />
                      <span>{t('order_now')} • {formatBDT(totalSelectedPrice)}</span>
                    </button>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div
                    className={`p-4 rounded-2xl border flex flex-col items-center text-center gap-2 transition-colors ${
                      isDark ? 'bg-neutral-950/40 border-neutral-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#13487E]/10 flex items-center justify-center text-[#13487E]">
                      <Truck className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                      {t('fast_delivery_guarantee')}
                    </span>
                  </div>
                  <div
                    className={`p-4 rounded-2xl border flex flex-col items-center text-center gap-2 transition-colors ${
                      isDark ? 'bg-neutral-950/40 border-neutral-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#13487E]/10 flex items-center justify-center text-[#13487E]">
                      <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                      {t('cash_on_delivery_guarantee')}
                    </span>
                  </div>
                  <div
                    className={`p-4 rounded-2xl border flex flex-col items-center text-center gap-2 transition-colors ${
                      isDark ? 'bg-neutral-950/40 border-neutral-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#13487E]/10 flex items-center justify-center text-[#13487E]">
                      <RefreshCw className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                      {t('easy_replacement_guarantee')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <StoreFooter
        onNavigate={onNavigate}
        onSelectCategory={() => {}}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => {
          setIsCartOpen(false);
          onNavigate('/checkout');
        }}
      />

      {/* Fullscreen High-Resolution Image Lightbox for PC & Mobile */}
      <ImageLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={product.images && product.images.length > 0 ? product.images : []}
        initialIndex={selectedImageIndex}
        product={product}
        onBuyNow={handleBuyNowClick}
      />
    </div>
  );
};
