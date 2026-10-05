import React, { useState, useMemo } from 'react';
import { StoreNavbar } from './StoreNavbar';
import { HeroBanner } from './HeroBanner';
import { CategoryBar } from './CategoryBar';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { CartDrawer } from './CartDrawer';
import { StoreFooter } from './StoreFooter';
import { useStore } from '../../context/StoreContext';
import { Product, Order } from '../../types';
import { SlidersHorizontal, Sparkles, AlertCircle } from 'lucide-react';

interface StorefrontViewProps {
  onNavigate: (route: string) => void;
}

export const StorefrontView: React.FC<StorefrontViewProps> = ({ onNavigate }) => {
  const { products, categories, addToCart } = useStore();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('featured');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Active products filter
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => p.is_active)
      .filter((p) => {
        if (!selectedCategoryId) return true;
        return p.category_id === selectedCategoryId;
      })
      .filter((p) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') {
          const priceA = a.discount_price ?? a.price;
          const priceB = b.discount_price ?? b.price;
          return priceA - priceB;
        }
        if (sortBy === 'price-desc') {
          const priceA = a.discount_price ?? a.price;
          const priceB = b.discount_price ?? b.price;
          return priceB - priceA;
        }
        if (sortBy === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        // default featured
        if (a.is_featured === b.is_featured) return 0;
        return a.is_featured ? -1 : 1;
      });
  }, [products, selectedCategoryId, searchQuery, sortBy]);

  const { setBuyNowItem } = useStore();

  const handleBuyNow = (product: Product, quantity: number) => {
    setBuyNowItem({ product, quantity });
    setSelectedProduct(null);
    onNavigate('/checkout');
  };

  const activeCategoryObj = categories.find((c) => c.id === selectedCategoryId);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-neutral-100 flex flex-col font-sans">
      {/* Navigation Bar */}
      <StoreNavbar
        onNavigate={onNavigate}
        onOpenCart={() => setIsCartOpen(true)}
        selectedCategory={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* If no search and on main page, show Hero Banner */}
        {!selectedCategoryId && !searchQuery && <HeroBanner />}

        {/* Category Navigation Bar */}
        <CategoryBar
          selectedCategory={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />

        {/* Catalog Section */}
        <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-black text-white font-['Space_Grotesk'] tracking-tight uppercase">
                  {searchQuery
                    ? `Results for "${searchQuery}"`
                    : activeCategoryObj
                    ? activeCategoryObj.name
                    : 'Current Releases'}
                </h2>
                <span className="text-xs font-mono font-bold text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded">
                  {filteredProducts.length} items
                </span>
              </div>
              {activeCategoryObj?.description && !searchQuery && (
                <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-xl">
                  {activeCategoryObj.description}
                </p>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <SlidersHorizontal className="w-4 h-4 text-neutral-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#13487E] cursor-pointer"
              >
                <option value="featured">Featured Drops</option>
                <option value="newest">Newest Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="min-h-[300px] rounded-2xl bg-neutral-900/40 border border-neutral-800/80 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-neutral-500" />
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                No products found
              </h3>
              <p className="text-xs text-neutral-400 max-w-md">
                We couldn't find any products matching your filter criteria. Try clearing search or selecting another category.
              </p>
              <button
                onClick={() => {
                  setSelectedCategoryId(null);
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelectProduct={(p) => setSelectedProduct(p)}
                  onBuyNow={handleBuyNow}
                />
              ))}
            </div>
          )}
        </section>

        {/* Feature Highlights Banner */}
        <section className="border-t border-neutral-800 bg-[#0d0d11] py-10 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#13487E]/10 border border-[#13487E]/20 flex items-center justify-center text-[#13487E] flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  260+ GSM Heavyweight
                </h4>
                <p className="text-xs text-neutral-400 mt-1">
                  Custom combed cotton engineered for structural drape, wash endurance, and luxury comfort.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#13487E]/10 border border-[#13487E]/20 flex items-center justify-center text-[#13487E] flex-shrink-0">
                <span className="font-mono font-black text-sm">24H</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Fast Metro Dispatch
                </h4>
                <p className="text-xs text-neutral-400 mt-1">
                  Orders packaged securely in signature Jakariya's Mart dust bags with real-time delivery status updates.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#13487E]/10 border border-[#13487E]/20 flex items-center justify-center text-[#13487E] flex-shrink-0">
                <span className="font-mono font-black text-sm">100%</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Original Authenticity
                </h4>
                <p className="text-xs text-neutral-400 mt-1">
                  Direct from the official Jakariya's Mart atelier. No bootlegs, zero compromises on anime & techwear aesthetics.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <StoreFooter
        onNavigate={onNavigate}
        onSelectCategory={setSelectedCategoryId}
      />

      {/* Modals & Drawers */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onBuyNow={handleBuyNow}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => {
          setBuyNowItem(null);
          setIsCartOpen(false);
          onNavigate('/checkout');
        }}
      />
    </div>
  );
};
