import React, { useState } from 'react';
import { X, Plus, Minus, ShoppingBag, Check, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { formatBDT } from '../../utils/bangladesh';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onBuyNow: (product: Product, quantity: number, selected_variants?: Record<string, string>) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onBuyNow,
}) => {
  const { categories, settings, addToCart } = useStore();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [variantError, setVariantError] = useState<string | null>(null);

  if (!product) return null;

  const category = categories.find((c) => c.id === product.category_id);
  const isOutOfStock = product.stock <= 0;
  const displayPrice = product.discount_price ?? product.price;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    
    // Validate variants
    if (product.variants && product.variants.length > 0) {
      const missingVariants = product.variants.filter(v => !selectedVariants[v.name]);
      if (missingVariants.length > 0) {
        setVariantError(`অনুগ্রহ করে ${missingVariants.map(v => v.name).join(', ')} সিলেক্ট করুন।`);
        return;
      }
    }

    addToCart(product, quantity, selectedVariants);
    setAdded(true);
    setVariantError(null);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 900);
  };

  const handleBuyNowClick = () => {
    if (isOutOfStock) return;

    // Validate variants
    if (product.variants && product.variants.length > 0) {
      const missingVariants = product.variants.filter(v => !selectedVariants[v.name]);
      if (missingVariants.length > 0) {
        setVariantError(`অনুগ্রহ করে ${missingVariants.map(v => v.name).join(', ')} সিলেক্ট করুন।`);
        return;
      }
    }

    onBuyNow(product, quantity, selectedVariants);
  };

  const handleSelectVariant = (variantName: string, option: string) => {
    setSelectedVariants(prev => ({ ...prev, [variantName]: option }));
    if (variantError) setVariantError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 overflow-y-auto">
          {/* Images Section */}
          <div className="p-6 bg-neutral-950 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-neutral-800">
            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800">
              <img
                src={product.images[selectedImageIndex] || product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />
              {product.discount_price && product.discount_price < product.price && (
                <span className="absolute top-3 left-3 bg-[#13487E] text-white text-xs font-black uppercase px-2.5 py-1 rounded">
                  SALE
                </span>
              )}
            </div>

            {/* Thumbnail selector */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                      selectedImageIndex === idx ? 'border-[#13487E]' : 'border-neutral-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="p-6 md:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Category & SKU */}
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="uppercase tracking-wider font-semibold text-[#13487E]">
                  {category?.name || 'Streetwear'}
                </span>
                {product.sku && (
                  <span className="font-mono text-neutral-500">SKU: {product.sku}</span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl font-black text-white font-['Space_Grotesk'] tracking-tight">
                {product.name}
              </h2>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-white font-['Space_Grotesk']">
                  {formatBDT(displayPrice)}
                </span>
                {product.discount_price && product.discount_price < product.price && (
                  <span className="text-base text-neutral-500 line-through">
                    {formatBDT(product.price)}
                  </span>
                )}
                {product.stock > 0 && (
                  <span className="ml-auto text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                    {product.stock} in stock
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="pt-2 border-t border-neutral-800">
                <p className="text-sm text-neutral-300 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Product Variants (Size, Color, etc.) */}
              {product.variants && product.variants.length > 0 && (
                <div className="pt-2 space-y-4 border-t border-neutral-800/50">
                  {product.variants.map((v) => (
                    <div key={v.id} className="space-y-2">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">
                        Select {v.name}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {v.options.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => handleSelectVariant(v.name, opt)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                              selectedVariants[v.name] === opt
                                ? 'bg-[#13487E] border-[#13487E] text-white shadow-lg shadow-[#13487E]/20'
                                : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-[#13487E] hover:text-white'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Variant Error Message */}
              {variantError && (
                <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-900/60 flex items-center gap-2 text-red-400 text-[11px] font-bold animate-pulse">
                  <X className="w-3.5 h-3.5" />
                  <span>{variantError}</span>
                </div>
              )}

              {/* Perks / Guarantees */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-neutral-400">
                <div className="p-2 rounded bg-neutral-950/60 border border-neutral-800 flex flex-col items-center text-center gap-1">
                  <Truck className="w-4 h-4 text-[#13487E]" />
                  <span>Fast Delivery</span>
                </div>
                <div className="p-2 rounded bg-neutral-950/60 border border-neutral-800 flex flex-col items-center text-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-[#13487E]" />
                  <span>100% Authentic</span>
                </div>
                <div className="p-2 rounded bg-neutral-950/60 border border-neutral-800 flex flex-col items-center text-center gap-1">
                  <RefreshCw className="w-4 h-4 text-[#13487E]" />
                  <span>Easy Exchange</span>
                </div>
              </div>
            </div>

            {/* Actions: Quantity, Add to Cart & Buy Now */}
            <div className="space-y-4 pt-4 border-t border-neutral-800">
              <div className="flex items-center gap-4">
                <span className="text-xs uppercase font-bold tracking-wider text-neutral-400">
                  Quantity
                </span>
                <div className="flex items-center border border-neutral-700 rounded-lg bg-neutral-950">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="p-2 text-neutral-400 hover:text-white disabled:opacity-40"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-sm font-bold text-white font-mono">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock || isOutOfStock}
                    className="p-2 text-neutral-400 hover:text-white disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Add to Bag Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    isOutOfStock
                      ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                      : added
                      ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700'
                  }`}
                >
                  {added ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Added!</span>
                    </>
                  ) : isOutOfStock ? (
                    <span>Sold Out</span>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Bag</span>
                    </>
                  )}
                </button>

                {/* Buy Now Button (Recommended) */}
                <button
                  onClick={handleBuyNowClick}
                  disabled={isOutOfStock}
                  className={`w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    isOutOfStock
                      ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-50'
                      : 'bg-[#13487E] hover:bg-[#0d3a66] text-white shadow-lg shadow-[#13487E]/25'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Buy Now • {formatBDT(displayPrice * quantity)}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
