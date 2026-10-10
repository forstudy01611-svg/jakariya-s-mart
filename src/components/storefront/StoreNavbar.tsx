import React, { useState } from 'react';
import { ShoppingBag, Search, Menu, X, ArrowRight, Sun, Moon } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

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
  const { settings, categories, cartCount } = useStore();
  const { language, toggleLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const activeCategories = categories.filter((c) => c.is_active && !c.parent_id);
  const selectedCatObj = categories.find((c) => c.id === selectedCategory);

  return (
    <header
      className={`sticky top-0 z-40 w-full backdrop-blur-md transition-colors duration-300 ${
        isDark
          ? 'bg-[#0a0a0c]/90 border-b border-neutral-800 text-neutral-100'
          : 'bg-white/95 border-b border-slate-200/90 text-slate-900 shadow-xs'
      }`}
    >
      {/* Top Announcement Bar */}
      {settings.announcement_enabled && settings.announcement && (
        <div className="bg-[#13487E] text-white text-xs font-bold py-1.5 px-4 text-center tracking-wider uppercase flex items-center justify-center gap-2 select-none">
          <span>{settings.announcement}</span>
        </div>
      )}

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          
          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 focus:outline-none transition-colors ${
                isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
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
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#13487E] to-[#0a2f57] flex items-center justify-center shadow-md shadow-[#13487E]/25 font-black text-white text-xl tracking-tighter">
                J
              </div>
              <div>
                <span
                  className={`text-xl sm:text-2xl font-black tracking-tight font-['Space_Grotesk'] group-hover:text-[#13487E] transition-colors ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {(!settings.store_name || settings.store_name.toLowerCase().includes('fugo')) ? "Jakariya's Mart" : settings.store_name}
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Categories */}
          <nav className="hidden lg:flex items-center space-x-1">
            <button
              onClick={() => onSelectCategory(null)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                selectedCategory === null
                  ? isDark
                    ? 'text-[#13487E] bg-neutral-900 border border-neutral-800 shadow-xs'
                    : 'text-[#13487E] bg-blue-50 border border-blue-200/80 shadow-xs'
                  : isDark
                    ? 'text-neutral-300 hover:text-white hover:bg-neutral-900/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {t('all_drops')}
            </button>
            {activeCategories.slice(0, 5).map((category) => (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  selectedCategory === category.id || selectedCatObj?.parent_id === category.id
                    ? isDark
                      ? 'text-[#13487E] bg-neutral-900 border border-neutral-800 shadow-xs'
                      : 'text-[#13487E] bg-blue-50 border border-blue-200/80 shadow-xs'
                    : isDark
                      ? 'text-neutral-300 hover:text-white hover:bg-neutral-900/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {category.name}
              </button>
            ))}
          </nav>

          {/* Right Action Icons: Search, Theme Toggle, Language Toggle, Cart */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Search Input on Desktop */}
            <div className="hidden md:flex relative items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t('search_placeholder')}
                className={`w-44 lg:w-60 text-sm rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-[#13487E] transition-all ${
                  isDark
                    ? 'bg-neutral-900/90 border border-neutral-800 text-white placeholder-neutral-500'
                    : 'bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                }`}
              />
              <Search
                className={`w-4 h-4 absolute left-3 pointer-events-none ${
                  isDark ? 'text-neutral-400' : 'text-slate-400'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className={`absolute right-2.5 text-xs ${
                    isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Mobile Search Button */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className={`md:hidden p-2 transition-colors ${
                isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Theme Switcher: Small Square Button for Light / Dark Mode */}
            <button
              onClick={toggleTheme}
              className={`w-10 h-10 aspect-square rounded-xl border flex flex-col items-center justify-center transition-all group shadow-xs active:scale-95 cursor-pointer ${
                isDark
                  ? 'bg-neutral-900 border-neutral-800 hover:border-[#13487E] text-amber-400'
                  : 'bg-slate-100 border-slate-200 hover:border-[#13487E] text-slate-700'
              }`}
              title={
                isDark
                  ? (language === 'bn' ? 'লাইট মোড অন করুন' : 'Switch to Light Mode')
                  : (language === 'bn' ? 'ডার্ক মোড অন করুন' : 'Switch to Dark Mode')
              }
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 stroke-[2.2] text-amber-400 group-hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 stroke-[2.2] text-indigo-600 group-hover:-rotate-12 transition-transform" />
              )}
              <span className="text-[8px] font-bold uppercase tracking-wider mt-0.5 leading-none opacity-85 font-mono">
                {isDark ? 'LIGHT' : 'DARK'}
              </span>
            </button>

            {/* Language Switcher: Small Square Button for Customer */}
            <button
              onClick={toggleLanguage}
              className={`w-10 h-10 aspect-square rounded-xl border flex flex-col items-center justify-center transition-all group shadow-xs active:scale-95 cursor-pointer ${
                isDark
                  ? 'bg-neutral-900 border-neutral-800 hover:border-[#13487E] text-white'
                  : 'bg-slate-100 border-slate-200 hover:border-[#13487E] text-slate-800'
              }`}
              title={language === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
              aria-label="Toggle language"
            >
              <span className="font-mono text-xs font-black tracking-tight group-hover:text-[#13487E] transition-colors leading-none">
                {language === 'bn' ? 'EN' : 'বাং'}
              </span>
              <span
                className={`text-[8px] font-bold uppercase tracking-wider mt-0.5 leading-none transition-colors ${
                  isDark ? 'text-neutral-400 group-hover:text-neutral-200' : 'text-slate-500 group-hover:text-slate-800'
                }`}
              >
                {language === 'bn' ? 'বাংলা' : 'ENG'}
              </span>
            </button>

            {/* Cart Button with Count Badge */}
            <button
              onClick={onOpenCart}
              className={`relative flex items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                isDark
                  ? 'bg-neutral-900 border-neutral-800 text-white hover:border-[#13487E] hover:text-[#13487E]'
                  : 'bg-slate-100 border-slate-200 text-slate-800 hover:border-[#13487E] hover:text-[#13487E]'
              }`}
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#13487E] text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#0a0a0c] animate-pulse">
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
                placeholder={t('search_placeholder')}
                className={`w-full text-sm rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:border-[#13487E] ${
                  isDark
                    ? 'bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500'
                    : 'bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                }`}
                autoFocus
              />
              <Search
                className={`w-4 h-4 absolute left-3 top-3.5 ${
                  isDark ? 'text-neutral-400' : 'text-slate-400'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className={`absolute right-3 top-3 text-xs ${
                    isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mobile Category Drawer / Menu */}
        {mobileMenuOpen && (
          <div
            className={`lg:hidden border-t py-3 space-y-1 ${
              isDark ? 'border-neutral-800' : 'border-slate-200'
            }`}
          >
            <button
              onClick={() => {
                onSelectCategory(null);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                selectedCategory === null
                  ? isDark
                    ? 'text-[#13487E] bg-neutral-900'
                    : 'text-[#13487E] bg-blue-50'
                  : isDark
                    ? 'text-neutral-300 hover:bg-neutral-900'
                    : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {t('all_drops')}
            </button>
            {activeCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  onSelectCategory(category.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-between transition-colors ${
                  selectedCategory === category.id || selectedCatObj?.parent_id === category.id
                    ? isDark
                      ? 'text-[#13487E] bg-neutral-900'
                      : 'text-[#13487E] bg-blue-50'
                    : isDark
                      ? 'text-neutral-300 hover:bg-neutral-900'
                      : 'text-slate-700 hover:bg-slate-100'
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
