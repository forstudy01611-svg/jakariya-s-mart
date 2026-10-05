import React, { useState } from 'react';
import { ShoppingBag, Search, Shield, Menu, X, ArrowRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface StoreNavbarProps {
  onNavigate: (route: string) => void;
  onOpenCart: () => void;
  selectedCategory: string | null;
  onSelectCategory: (catId: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const StoreNavbar: React.FC<StoreNavbarProps> = ({
  onNavigate,
  onOpenCart,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}) => {
  const { settings, categories, cartCount, adminUser } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const activeCategories = categories.filter((c) => c.is_active);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#0a0a0c]/90 border-b border-neutral-800">
      {/* Top Announcement Bar */}
      {settings.announcement_enabled && settings.announcement && (
        <div className="bg-[#13487E] text-white text-xs font-bold py-1.5 px-4 text-center tracking-wider uppercase flex items-center justify-center gap-2">
          <span>{settings.announcement}</span>
        </div>
      )}

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-neutral-400 hover:text-white focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <button
              onClick={() => {
                onSelectCategory(null);
                onSearchChange('');
                onNavigate('/');
              }}
              className="flex items-center gap-2 text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#13487E] to-[#0d3a66] flex items-center justify-center shadow-lg shadow-[#13487E]/20 font-black text-white text-xl tracking-tighter">
                J
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-white font-['Space_Grotesk'] group-hover:text-[#13487E] transition-colors">
                  {(!settings.store_name || settings.store_name.toLowerCase().includes('fugo')) ? "Jakariya's Mart" : settings.store_name}
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Categories */}
          <nav className="hidden lg:flex items-center space-x-1">
            <button
              onClick={() => onSelectCategory(null)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? 'text-[#13487E] bg-neutral-900 border border-neutral-800'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-900/60'
              }`}
            >
              All Drops
            </button>
            {activeCategories.slice(0, 5).map((category) => (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'text-[#13487E] bg-neutral-900 border border-neutral-800'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-900/60'
                }`}
              >
                {category.name}
              </button>
            ))}
          </nav>

          {/* Right Action Icons: Search, Admin Portal, Cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Input on Desktop */}
            <div className="hidden md:flex relative items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search streetwear, hoodies..."
                className="w-48 lg:w-64 bg-neutral-900/80 border border-neutral-800 text-sm text-white placeholder-neutral-500 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-[#13487E] transition-all"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 text-xs text-neutral-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Mobile Search Button */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="md:hidden p-2 text-neutral-400 hover:text-white"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Link to Admin Panel */}
            <button
              onClick={() => onNavigate(adminUser ? '/admin' : '/admin/login')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-[#13487E]/60 text-xs font-medium text-neutral-300 hover:text-white transition-all shadow-sm group"
              title="Access Jakariya's Mart Admin Panel"
            >
              <Shield className="w-3.5 h-3.5 text-[#13487E] group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Admin Panel</span>
            </button>

            {/* Cart Button with Count Badge */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center justify-center p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white hover:border-[#13487E] hover:text-[#13487E] transition-all"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#13487E] text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-[#0a0a0c] animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Expansion */}
        {searchOpen && (
          <div className="md:hidden pb-3 pt-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search apparel, accessories..."
                className="w-full bg-neutral-900 border border-neutral-800 text-sm text-white placeholder-neutral-500 rounded-lg pl-9 pr-8 py-2.5 focus:outline-none focus:border-[#13487E]"
                autoFocus
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-3 text-xs text-neutral-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mobile Category Drawer / Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-neutral-800 py-3 space-y-1">
            <button
              onClick={() => {
                onSelectCategory(null);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                selectedCategory === null
                  ? 'text-[#13487E] bg-neutral-900'
                  : 'text-neutral-300 hover:bg-neutral-900'
              }`}
            >
              All Drops
            </button>
            {activeCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  onSelectCategory(category.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center justify-between ${
                  selectedCategory === category.id
                    ? 'text-[#13487E] bg-neutral-900'
                    : 'text-neutral-300 hover:bg-neutral-900'
                }`}
              >
                <span>{category.name}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-50" />
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};
