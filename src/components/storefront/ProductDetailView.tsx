import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingBag, Check, ShieldCheck, Truck, RefreshCw, ArrowLeft, AlertCircle, Maximize2 } from 'lucide-react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatBDT } from '../../utils/bangladesh';
import { StoreNavbar } from './StoreNavbar';
import { StoreFooter } from './StoreFooter';
import { CartDrawer } from './CartDrawer';
import { ImageLightboxModal } from './ImageLightboxModal';
import { motion } from 'motion/react';

interface ProductDetailViewProps {
  productId: string;
  onNavigate: (path: string) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  productId,
  onNavigate,
}) => {
  const { products, categories, settings, addToCart, setBuyNowItems } = useStore();
  const { t } = useLanguage();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [variantError, setVariantError] = useState<string | null>(null);

  useEffect(() => {
    const found = products.find(p => p.id === productId);
    if (found) {
      setProduct(found);
    }
  }, [productId, products]);

  const [isCartOpen, setIsCartOpen] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#13487E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-neutral-400 font-bold uppercase tracking-widest text-xs">Loading Product Details...</p>
        </div>
      </div>
    );
  }

  const category = categories.find((c) => c.id === product.category_id);
  const isOutOfStock = product.stock <= 0;
  const displayPrice = product.discount_price ?? product.price;

  const getSelectedItems = () => {
    const items: { product: Product; quantity: number; selected_variants: Record<string, string> }[] = [];
    
    if (!product.variants || product.variants.length === 0) {
      items.push({ product, quantity, selected_variants: {} });
    } else {
      // For each variant type, we check what's selected
      // Note: This implementation assumes selecting multiple options for EACH variant type independently
      // if the user wants combinations, they should ideally be separate products or a more complex UI
      // but based on "V1, V2, V3" we'll treat them as individual selections.
      Object.entries(selectedOptions).forEach(([key, qty]) => {
        if (qty > 0) {
          const [vName, vValue] = key.split(':');
          items.push({
            product,
            quantity: qty,
            selected_variants: { [vName]: vValue }
          });
        }
      });
    }
    return items;
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    
    const selectedItems = getSelectedItems();

    // Validate variants: if product has variants, at least one must be selected
    if (product.variants && product.variants.length > 0 && selectedItems.length === 0) {
      setVariantError('অনুগ্রহ করে অন্তত একটি ভেরিয়েন্ট এবং তার পরিমাণ সিলেক্ট করুন।');
      return;
    }

    selectedItems.forEach(item => {
      addToCart(item.product, item.quantity, item.selected_variants);
    });
    
    setAdded(true);
    setVariantError(null);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNowClick = () => {
    if (isOutOfStock) return;

    const selectedItems = getSelectedItems();

    // Validate variants
    if (product.variants && product.variants.length > 0 && selectedItems.length === 0) {
      setVariantError('অনুগ্রহ করে অন্তত একটি ভেরিয়েন্ট এবং তার পরিমাণ সিলেক্ট করুন।');
      return;
    }

    // For Buy Now with multiple variants, we'll convert them to cart items format
    const buyNowCartItems = selectedItems.map(item => ({
      id: `${item.product.id}-${Object.entries(item.selected_variants).map(([k, v]) => `${k}:${v}`).join('|')}`,
      product: item.product,
      quantity: item.quantity,
      selected_variants: item.selected_variants
    }));

    setBuyNowItems(buyNowCartItems);
    onNavigate('/checkout');
  };

  const handleToggleVariant = (variantName: string, option: string) => {
    const key = `${variantName}:${option}`;
    setSelectedOptions(prev => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = 1;
      }
      return next;
    });
    if (variantError) setVariantError(null);
  };

  const handleUpdateOptionQty = (variantName: string, option: string, delta: number) => {
    const key = `${variantName}:${option}`;
    setSelectedOptions(prev => {
      const currentQty = prev[key] || 0;
      const newQty = Math.max(1, Math.min(product.stock, currentQty + delta));
      return { ...prev, [key]: newQty };
    });
  };

  // Calculate total price for all selected variants
  const totalSelectedPrice = Object.values(selectedOptions).reduce((sum, qty) => sum + qty * displayPrice, 0) || (quantity * displayPrice);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-neutral-100 flex flex-col font-sans">
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
          className="bg-neutral-900/40 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Images Section */}
            <div className="p-6 sm:p-10 bg-neutral-950 flex flex-col gap-6 border-b lg:border-b-0 lg:border-r border-neutral-800">
              <button
                onClick={() => onNavigate('/')}
                className="inline-flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-white transition-colors mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('back_to_catalog')}</span>
              </button>

              {/* Main Product Image - Click to zoom in large screen */}
              <div 
                onClick={() => setIsLightboxOpen(true)}
                className="relative aspect-square w-full rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-inner group/preview cursor-zoom-in"
                title={t('click_to_zoom')}
              >
                <img
                  src={product.images[selectedImageIndex] || product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover object-center group-hover/preview:scale-105 transition-transform duration-500"
                />

                {/* Corner Zoom Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLightboxOpen(true);
                  }}
                  className="absolute bottom-4 right-4 z-10 p-2.5 rounded-xl bg-black/75 hover:bg-[#13487E] text-white border border-neutral-700/80 backdrop-blur-xs transition-all shadow-lg hover:scale-110 active:scale-95"
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
              {product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                        selectedImageIndex === idx ? 'border-[#13487E] scale-105 shadow-md shadow-[#13487E]/30' : 'border-neutral-800 opacity-60 hover:opacity-100'
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
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span className="uppercase tracking-widest font-black text-[#13487E]">
                    {category?.name || 'Streetwear'}
                  </span>
                  {product.sku && (
                    <span className="font-mono text-neutral-600 bg-neutral-950 px-2 py-1 rounded border border-neutral-800">SKU: {product.sku}</span>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-['Space_Grotesk'] tracking-tight leading-tight">
                  {product.name}
                </h1>

                {/* Price */}
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-black text-white font-['Space_Grotesk']">
                    {formatBDT(displayPrice)}
                  </span>
                  {product.discount_price && product.discount_price < product.price && (
                    <span className="text-xl text-neutral-500 line-through font-medium">
                      {formatBDT(product.price)}
                    </span>
                  )}
                    {product.stock > 0 && (
                    <span className="ml-auto text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1 rounded-full uppercase tracking-wider">
                      {product.stock} {t('units_ready')}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className="pt-4 border-t border-neutral-800/60">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-3">{t('product_description')}</h3>
                  <p className="text-base text-neutral-300 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Product Variants (Size, Color, etc.) */}
                {product.variants && product.variants.length > 0 && (
                  <div className="pt-6 space-y-6 border-t border-neutral-800/60">
                    {product.variants.map((v) => (
                      <div key={v.id} className="space-y-3">
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-[0.2em] block">
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
                                    ? 'bg-[#13487E]/10 border-[#13487E] text-white' 
                                    : 'bg-neutral-950/40 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                                }`}
                              >
                                <div 
                                  className="flex items-center gap-3 cursor-pointer flex-1"
                                  onClick={() => handleToggleVariant(v.name, opt)}
                                >
                                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                                    isSelected ? 'bg-[#13487E] border-[#13487E]' : 'border-neutral-700'
                                  }`}>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[4]" />}
                                  </div>
                                  <span className="text-sm font-bold">{opt}</span>
                                </div>
                                
                                {isSelected && (
                                  <div className="flex items-center border border-neutral-700 rounded-xl bg-neutral-900/80 p-0.5">
                                    <button
                                      onClick={() => handleUpdateOptionQty(v.name, opt, -1)}
                                      className="p-1.5 text-neutral-500 hover:text-white transition-colors"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="px-3 text-xs font-black text-white font-mono min-w-[2rem] text-center">
                                      {selectedOptions[`${v.name}:${opt}`]}
                                    </span>
                                    <button
                                      onClick={() => handleUpdateOptionQty(v.name, opt, 1)}
                                      className="p-1.5 text-neutral-500 hover:text-white transition-colors"
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
                  <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/50 flex items-center gap-3 text-red-400 text-sm font-bold animate-in zoom-in-95 duration-200">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{variantError}</span>
                  </div>
                )}
              </div>

              {/* Actions: Quantity, Add to Cart & Buy Now */}
              <div className="space-y-6 pt-6 border-t border-neutral-800/60">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  {(!product.variants || product.variants.length === 0) && (
                    <div className="space-y-2">
                      <span className="text-xs uppercase font-bold tracking-[0.2em] text-neutral-500">
                        {t('quantity')}
                      </span>
                      <div className="flex items-center border-2 border-neutral-800 rounded-xl bg-neutral-950/80 p-1 w-fit">
                        <button
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          disabled={quantity <= 1 || isOutOfStock}
                          className="p-2.5 text-neutral-500 hover:text-white disabled:opacity-30 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-6 text-base font-black text-white font-mono min-w-[3rem] text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                          disabled={quantity >= product.stock || isOutOfStock}
                          className="p-2.5 text-neutral-500 hover:text-white disabled:opacity-30 transition-colors"
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
                      className={`h-14 px-6 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-500 border-2 ${
                        isOutOfStock
                          ? 'bg-neutral-800 border-neutral-800 text-neutral-600 cursor-not-allowed'
                          : added
                          ? 'bg-emerald-500 border-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                          : 'bg-transparent border-neutral-700 hover:border-white text-white hover:bg-neutral-800'
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
                      className={`h-14 px-6 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 ${
                        isOutOfStock
                          ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed opacity-50'
                          : 'bg-[#13487E] hover:bg-[#175697] text-white shadow-xl shadow-[#13487E]/20'
                      }`}
                    >
                      <Check className="w-5 h-5 stroke-[4]" />
                      <span>{t('order_now')} • {formatBDT(totalSelectedPrice)}</span>
                    </button>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="p-4 rounded-2xl bg-neutral-950/40 border border-neutral-800 flex flex-col items-center text-center gap-2 group hover:border-[#13487E]/30 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-[#13487E]/10 flex items-center justify-center text-[#13487E]">
                      <Truck className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{t('fast_delivery_guarantee')}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-neutral-950/40 border border-neutral-800 flex flex-col items-center text-center gap-2 group hover:border-[#13487E]/30 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-[#13487E]/10 flex items-center justify-center text-[#13487E]">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{t('cash_on_delivery_guarantee')}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-neutral-950/40 border border-neutral-800 flex flex-col items-center text-center gap-2 group hover:border-[#13487E]/30 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-[#13487E]/10 flex items-center justify-center text-[#13487E]">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{t('easy_replacement_guarantee')}</span>
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
