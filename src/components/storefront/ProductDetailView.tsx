import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingBag, Check, ShieldCheck, Truck, RefreshCw, ArrowLeft } from 'lucide-react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { formatBDT } from '../../utils/bangladesh';
import { StoreNavbar } from './StoreNavbar';
import { StoreFooter } from './StoreFooter';
import { CartDrawer } from './CartDrawer';
import { motion } from 'motion/react';

interface ProductDetailViewProps {
  productId: string;
  onNavigate: (path: string) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  productId,
  onNavigate,
}) => {
  const { products, categories, settings, addToCart, setBuyNowItem } = useStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
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
    setTimeout(() => setAdded(false), 2000);
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

    setBuyNowItem({ product, quantity, selected_variants: selectedVariants });
    onNavigate('/checkout');
  };

  const handleSelectVariant = (variantName: string, option: string) => {
    setSelectedVariants(prev => ({ ...prev, [variantName]: option }));
    if (variantError) setVariantError(null);
  };

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
                <span>Back to Catalog</span>
              </button>

              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-inner">
                <img
                  src={product.images[selectedImageIndex] || product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover object-center"
                />
                {product.discount_price && product.discount_price < product.price && (
                  <span className="absolute top-5 left-5 bg-[#13487E] text-white text-xs font-black uppercase px-3 py-1.5 rounded-lg shadow-lg">
                    SALE
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
                        selectedImageIndex === idx ? 'border-[#13487E] scale-105' : 'border-neutral-800 opacity-60 hover:opacity-100'
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
                      {product.stock} Units Ready
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className="pt-4 border-t border-neutral-800/60">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-3">Product Description</h3>
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
                          Select {v.name}
                        </label>
                        <div className="flex flex-wrap gap-2.5">
                          {v.options.map((opt) => (
                            <button
                              key={opt}
                              onClick={() => handleSelectVariant(v.name, opt)}
                              className={`px-5 py-2.5 rounded-xl border-2 text-sm font-bold transition-all duration-300 ${
                                selectedVariants[v.name] === opt
                                  ? 'bg-[#13487E] border-[#13487E] text-white shadow-[0_0_20px_rgba(19,72,126,0.3)]'
                                  : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200'
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
                  <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/50 flex items-center gap-3 text-red-400 text-sm font-bold animate-in zoom-in-95 duration-200">
                    <X className="w-4 h-4 flex-shrink-0" />
                    <span>{variantError}</span>
                  </div>
                )}
              </div>

              {/* Actions: Quantity, Add to Cart & Buy Now */}
              <div className="space-y-6 pt-6 border-t border-neutral-800/60">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <div className="space-y-2">
                    <span className="text-xs uppercase font-bold tracking-[0.2em] text-neutral-500">
                      Quantity
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
                          <span>Added to Bag</span>
                        </>
                      ) : isOutOfStock ? (
                        <span>Out of Stock</span>
                      ) : (
                        <>
                          <ShoppingBag className="w-5 h-5" />
                          <span>Add to Bag</span>
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
                      <span>Buy Now • {formatBDT(displayPrice * quantity)}</span>
                    </button>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="p-4 rounded-2xl bg-neutral-950/40 border border-neutral-800 flex flex-col items-center text-center gap-2 group hover:border-[#13487E]/30 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-[#13487E]/10 flex items-center justify-center text-[#13487E]">
                      <Truck className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Fast Courier</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-neutral-950/40 border border-neutral-800 flex flex-col items-center text-center gap-2 group hover:border-[#13487E]/30 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-[#13487E]/10 flex items-center justify-center text-[#13487E]">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Authentic</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-neutral-950/40 border border-neutral-800 flex flex-col items-center text-center gap-2 group hover:border-[#13487E]/30 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-[#13487E]/10 flex items-center justify-center text-[#13487E]">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Easy Swap</span>
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
    </div>
  );
};
