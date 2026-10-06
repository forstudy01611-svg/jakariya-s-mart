import React from 'react';
import { Plus, Check } from 'lucide-react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { formatBDT } from '../../utils/bangladesh';

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
  const { categories, settings, addToCart, cart } = useStore();
  const [added, setAdded] = React.useState(false);

  const category = categories.find((c) => c.id === product.category_id);
  const cartItem = cart.find((i) => i.product.id === product.id);
  const cartQuantity = cartItem?.quantity || 0;
  const isOutOfStock = product.stock <= 0;

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
      className="group relative bg-neutral-900/60 rounded-xl border border-neutral-800 hover:border-neutral-700 overflow-hidden cursor-pointer transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:shadow-black/50"
    >
      {/* Image Container */}
      <div className="relative aspect-square w-full bg-neutral-950 overflow-hidden">
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
          {discountPercent && (
            <span className="bg-[#13487E] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider shadow">
              SAVE {discountPercent}%
            </span>
          )}
          {product.is_featured && (
            <span className="bg-neutral-900/90 backdrop-blur border border-neutral-700 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wider">
              HOT DROP
            </span>
          )}
        </div>

        {/* Stock status overlay if low or out */}
        {isOutOfStock ? (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded">
              SOLD OUT
            </span>
          </div>
        ) : product.stock <= 5 ? (
          <div className="absolute bottom-2 left-2">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase px-2 py-0.5 rounded">
              Only {product.stock} left
            </span>
          </div>
        ) : null}
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {category && (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              {category.name}
            </p>
          )}

          <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#13487E] transition-colors line-clamp-1">
            {product.name}
          </h3>

          <p className="text-xs text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Actions (Add to Bag & Buy Now) */}
        <div className="space-y-3 pt-2 border-t border-neutral-800/80">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-white font-['Space_Grotesk']">
              {formatBDT(displayPrice)}
            </span>
            {product.discount_price && product.discount_price < product.price && (
              <span className="text-xs text-neutral-500 line-through">
                {formatBDT(product.price)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleQuickAdd}
              disabled={isOutOfStock}
              className={`py-2 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider border ${
                isOutOfStock
                  ? 'bg-neutral-800 text-neutral-600 border-neutral-800 cursor-not-allowed'
                  : added
                  ? 'bg-emerald-500 text-black border-emerald-500'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
              }`}
              title={isOutOfStock ? 'Out of stock' : 'Add to cart'}
            >
              {added ? (
                <Check className="w-3 h-3 stroke-[3]" />
              ) : (
                <Plus className="w-3 h-3" />
              )}
              <span>{added ? 'Added' : 'Add'}</span>
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
              className={`py-2 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider ${
                isOutOfStock
                  ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                  : 'bg-[#13487E] hover:bg-[#0d3a66] text-white shadow-lg shadow-[#13487E]/20'
              }`}
            >
              <span>Buy Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
