import React, { useState, useMemo } from 'react';
import { StoreNavbar } from './StoreNavbar';
import { HeroBanner } from './HeroBanner';
import { CategoryBar } from './CategoryBar';
import { ProductCard } from './ProductCard';
import { CartDrawer } from './CartDrawer';
import { StoreFooter } from './StoreFooter';
import { useStore } from '../../context/StoreContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Product } from '../../types';
import { SlidersHorizontal, AlertCircle, ShieldCheck, Truck, Headphones } from 'lucide-react';
import { motion } from 'motion/react';

interface StorefrontViewProps {
  onNavigate: (route: string) => void;
}

export const StorefrontView: React.FC<StorefrontViewProps> = ({ onNavigate }) => {
  const { products, categories } = useStore();
  const { t } = useLanguage();
  const { isDark } = useTheme();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('featured');
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Active products filter (supports hierarchical categories and subcategories)
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => p.is_active)
      .filter((p) => {
        if (!selectedCategoryId) return true;
        const childIds = categories.filter((c) => c.parent_id === selectedCategoryId).map((c) => c.id);
        const matchesParent = p.category_id === selectedCategoryId;
        const matchesSubcategory = p.subcategory_id === selectedCategoryId;
        const matchesChildOfParent =
          childIds.includes(p.category_id) || (p.subcategory_id ? childIds.includes(p.subcategory_id) : false);

        return matchesParent || matchesSubcategory || matchesChildOfParent;
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

  const { setBuyNowItems } = useStore();

  const handleBuyNow = (product: Product, quantity: number, selected_variants?: Record<string, string>) => {
    setBuyNowItems([{
      id: `${product.id}-${selected_variants ? JSON.stringify(selected_variants) : ''}`,
      product,
      quantity,
      selected_variants
    }]);
    onNavigate('/checkout');
  };

  const activeCategoryObj = categories.find((c) => c.id === selectedCategoryId);
  const parentCategoryObj = activeCategoryObj?.parent_id
    ? categories.find((c) => c.id === activeCategoryObj.parent_id)
    : null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
        isDark ? 'bg-[#0a0a0c] text-neutral-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
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
        {/* If no search and on main page, show Clean Image Hero Banner */}
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
              <div className="flex items-center gap-2.5">
                <h2
                  className={`text-2xl sm:text-3xl font-black font-['Space_Grotesk'] tracking-tight uppercase ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {searchQuery
                    ? `${t('search_results_for')} "${searchQuery}"`
                    : activeCategoryObj
                    ? parentCategoryObj
                      ? `${parentCategoryObj.name} › ${activeCategoryObj.name}`
                      : activeCategoryObj.name
                    : t('current_releases')}
                </h2>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${
                    isDark
                      ? 'text-neutral-400 bg-neutral-900 border-neutral-800'
                      : 'text-slate-600 bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  {filteredProducts.length} {t('items_count')}
                </span>
              </div>
              {activeCategoryObj?.description && !searchQuery && (
                <p className={`text-xs sm:text-sm mt-1 max-w-xl ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                  {activeCategoryObj.description}
                </p>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <SlidersHorizontal className={`w-4 h-4 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={`text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-[#13487E] cursor-pointer transition-colors ${
                  isDark
                    ? 'bg-neutral-900 border border-neutral-800 text-neutral-200'
                    : 'bg-white border border-slate-200 text-slate-800 shadow-2xs'
                }`}
              >
                <option value="featured">{t('sort_featured')}</option>
                <option value="newest">{t('sort_newest')}</option>
                <option value="price-asc">{t('sort_price_asc')}</option>
                <option value="price-desc">{t('sort_price_desc')}</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div
              className={`min-h-[300px] rounded-2xl flex flex-col items-center justify-center p-8 text-center space-y-3 ${
                isDark
                  ? 'bg-neutral-900/40 border border-neutral-800/80'
                  : 'bg-white border border-slate-200 shadow-xs'
              }`}
            >
              <AlertCircle className="w-10 h-10 text-neutral-400" />
              <h3 className={`text-base font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {t('no_products_found')}
              </h3>
              <p className={`text-xs max-w-md ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                {t('no_products_desc')}
              </p>
              <button
                onClick={() => {
                  setSelectedCategoryId(null);
                  setSearchQuery('');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-neutral-800 hover:bg-neutral-700 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                {t('reset_filters')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onNavigate={onNavigate}
                  onBuyNow={handleBuyNow}
                />
              ))}
            </div>
          )}
        </section>

        {/* Store Trust & Feature Highlights Banner (Above Footer) */}
        <section
          className={`border-t py-12 px-4 sm:px-6 transition-colors duration-300 ${
            isDark ? 'border-neutral-800 bg-[#0d0d11]' : 'border-slate-200 bg-white'
          }`}
        >
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className={`p-6 rounded-2xl border flex items-start gap-4 transition-all ${
                isDark
                  ? 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-[#13487E]/10 border border-[#13487E]/20 flex items-center justify-center text-[#13487E] flex-shrink-0">
                <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h4 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {t('highlight_quality_title')}
                </h4>
                <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                  {t('highlight_quality_desc')}
                </p>
              </div>
            </div>

            <div
              className={`p-6 rounded-2xl border flex items-start gap-4 transition-all ${
                isDark
                  ? 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-[#13487E]/10 border border-[#13487E]/20 flex items-center justify-center text-[#13487E] flex-shrink-0">
                <Truck className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h4 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {t('highlight_delivery_title')}
                </h4>
                <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                  {t('highlight_delivery_desc')}
                </p>
              </div>
            </div>

            <div
              className={`p-6 rounded-2xl border flex items-start gap-4 transition-all ${
                isDark
                  ? 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-[#13487E]/10 border border-[#13487E]/20 flex items-center justify-center text-[#13487E] flex-shrink-0">
                <Headphones className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h4 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {t('highlight_support_title')}
                </h4>
                <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                  {t('highlight_support_desc')}
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

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => {
          setBuyNowItems(null);
          setIsCartOpen(false);
          onNavigate('/checkout');
        }}
      />
    </motion.div>
  );
};
