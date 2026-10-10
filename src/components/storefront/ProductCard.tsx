import React, { useState } from 'react';
import { Plus, Check, Maximize2 } from 'lucide-react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { formatBDT } from '../../utils/bangladesh';
import { ImageLightboxModal } from './ImageLightboxModal';

interface ProductCardProps {
  product: Product;
  onNavigate: (path: string) => void;
  onBuyNow: (product: Product, quantity: number, selected_variants?: Record<string, string>) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onNavigate,
  onBuyNow,
}) => {
  const { categories, addToCart, cart } = useStore();
  const { t, language } = useLanguage();
  const { isDark } = useTheme();
  const [added, setAdded] = React.useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const category = categories.find((c) => c.id === product.category_id);
  const cartItem = cart.find((i) => i.product.id === product.id);
  const isOutOfStock = product.stock <= 0;

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLightboxOpen(true);
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    
    // If product has variants, must go to detail page to select
    if (product.variants && product.variants.length > 0) {
      onNavigate(`/product/${product.id}`);
      return;
    }

    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const discountPercent =
    product.discount_price && product.discount_price < product.price
      ? Math.round(((product.price - product.discount_price) / product.price) * 100)
      : null;

  const displayPrice = product.discount_price ?? product.price;

  return (
    <div
      onClick={() => onNavigate(`/product/${product.id}`)}
      className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col justify-between ${
        isDark
          ? 'bg-neutral-900/70 border border-neutral-800 hover:border-neutral-700 hover:shadow-xl hover:shadow-black/50'
          : 'bg-white border border-slate-200/90 hover:border-blue-300 hover:shadow-xl hover:shadow-slate-200/60 shadow-xs'
      }`}
    >
      {/* Image Container */}
      <div className={`relative aspect-square w-full overflow-hidden group/img ${isDark ? 'bg-neutral-950' : 'bg-slate-100'}`}>
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Click to Expand Button - ONLY clicking this button opens large lightbox */}
        <button
          onClick={handleImageClick}
          className="absolute bottom-2.5 right-2.5 z-10 px-2 py-1.5 rounded-lg bg-black/85 hover:bg-[#13487E] text-white border border-neutral-700/80 backdrop-blur-xs transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-1.5 text-[10px] font-bold"
          title={t('click_to_zoom')}
          aria-label="Click to expand"
        >
          <Maximize2 className="w-3.5 h-3.5 text-blue-400 group-hover:text-white" />
          <span className="text-[10px]">{language === 'bn' ? 'বড় ছবি' : 'Expand'}</span>
        </button>

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start pointer-events-none">
          {discountPercent && (
            <span className="bg-[#13487E] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider shadow">
              {t('save')} {discountPercent}%
            </span>
          )}
          {product.is_featured && (
            <span className="bg-black/80 backdrop-blur border border-white/20 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-md tracking-wider">
              {t('hot_drop')}
            </span>
          )}
        </div>

        {/* Stock status overlay if low or out */}
        {isOutOfStock ? (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded">
              {t('sold_out')}
            </span>
          </div>
        ) : product.stock <= 5 ? (
          <div className="absolute bottom-2 left-2">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase px-2 py-0.5 rounded">
              {t('only_left', { n: product.stock })}
            </span>
          </div>
        ) : null}
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {category && (
            <p className={`text-[11px] font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
              {category.name}
            </p>
          )}

          <h3 className={`text-sm sm:text-base font-bold group-hover:text-[#13487E] transition-colors line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {product.name}
          </h3>

          <p className={`text-xs line-clamp-2 mt-1 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
            {product.description}
          </p>
        </div>

        {/* Price & Actions (Add to Bag & Buy Now) */}
        <div className={`space-y-3 pt-3 border-t ${isDark ? 'border-neutral-850' : 'border-slate-100'}`}>
          <div className="flex items-baseline gap-2">
            <span className={`text-lg font-black font-['Space_Grotesk'] ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatBDT(displayPrice)}
            </span>
            {product.discount_price && product.discount_price < product.price && (
              <span className={`text-xs line-through ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                {formatBDT(product.price)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleQuickAdd}
              disabled={isOutOfStock}
              className={`py-2 px-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider border cursor-pointer ${
                isOutOfStock
                  ? isDark
                    ? 'bg-neutral-800 text-neutral-600 border-neutral-800 cursor-not-allowed'
                    : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : added
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : isDark
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
              }`}
              title={isOutOfStock ? t('sold_out') : t('add')}
            >
              {added ? (
                <Check className="w-3 h-3 stroke-[3]" />
              ) : (
                <Plus className="w-3 h-3" />
              )}
              <span>{added ? t('added') : t('add')}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (product.variants && product.variants.length > 0) {
                  onNavigate(`/product/${product.id}`);
                  return;
                }
                onBuyNow(product, 1);
              }}
              disabled={isOutOfStock}
              className={`py-2 px-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider cursor-pointer ${
                isOutOfStock
                  ? isDark
                    ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-[#13487E] hover:bg-[#0d3a66] text-white shadow-md shadow-[#13487E]/20'
              }`}
            >
              <span>{t('buy_now')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Responsive Fullscreen Image Lightbox */}
      <ImageLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={product.images && product.images.length > 0 ? product.images : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80']}
        initialIndex={0}
        product={product}
        onNavigateProduct={onNavigate}
        onBuyNow={(prod, qty) => {
          if (prod.variants && prod.variants.length > 0) {
            onNavigate(`/product/${prod.id}`);
          } else {
            onBuyNow(prod, qty);
          }
        }}
      />
    </div>
  );
};
