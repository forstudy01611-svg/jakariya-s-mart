import React from 'react';
import { CornerDownRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

interface CategoryBarProps {
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const { categories, products } = useStore();
  const { t } = useLanguage();
  const { isDark } = useTheme();

  // Active Main categories (top-level)
  const mainCategories = categories
    .filter((c) => c.is_active && !c.parent_id)
    .sort((a, b) => a.display_order - b.display_order);

  // Identify current parent category if a category or subcategory is selected
  const selectedCatObj = categories.find((c) => c.id === selectedCategory);
  const activeParentId = selectedCatObj ? selectedCatObj.parent_id || selectedCatObj.id : null;
  const activeParentObj = categories.find((c) => c.id === activeParentId);

  // Subcategories belonging to currently selected/active parent
  const activeSubcategories = activeParentId
    ? categories
        .filter((c) => c.is_active && c.parent_id === activeParentId)
        .sort((a, b) => a.display_order - b.display_order)
    : [];

  // Calculate product count for main category (includes child subcategories)
  const getMainCategoryProductCount = (mainCatId: string | null) => {
    if (!mainCatId) return products.filter((p) => p.is_active).length;
    const childIds = categories.filter((c) => c.parent_id === mainCatId).map((c) => c.id);
    return products.filter(
      (p) =>
        p.is_active &&
        (p.category_id === mainCatId || (p.subcategory_id && childIds.includes(p.subcategory_id)))
    ).length;
  };

  // Calculate product count for a specific subcategory
  const getSubcategoryProductCount = (subId: string) => {
    return products.filter(
      (p) => p.is_active && (p.subcategory_id === subId || p.category_id === subId)
    ).length;
  };

  return (
    <div
      className={`w-full transition-colors duration-300 border-b ${
        isDark ? 'bg-[#0d0d11] border-neutral-800' : 'bg-slate-100/70 border-slate-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Tier 1: Main Categories Bar */}
        <div className="py-3 flex items-center gap-2 overflow-x-auto scrollbar-none no-scrollbar">
          {/* All Products Button */}
          <button
            onClick={() => onSelectCategory(null)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              selectedCategory === null
                ? 'bg-[#13487E] text-white shadow-md shadow-[#13487E]/25'
                : isDark
                ? 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'
                : 'bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 shadow-2xs'
            }`}
          >
            <span>{t('all_products')}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                selectedCategory === null
                  ? 'bg-white/20 text-white'
                  : isDark
                  ? 'bg-neutral-800 text-neutral-400'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {getMainCategoryProductCount(null)}
            </span>
          </button>

          {/* Main Category Buttons */}
          {mainCategories.map((category) => {
            const count = getMainCategoryProductCount(category.id);
            // Highlighted if selected directly or if one of its subcategories is selected
            const isParentActive = activeParentId === category.id;

            return (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  isParentActive
                    ? 'bg-[#13487E] text-white shadow-md shadow-[#13487E]/25'
                    : isDark
                    ? 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'
                    : 'bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <span>{category.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isParentActive
                      ? 'bg-white/20 text-white'
                      : isDark
                      ? 'bg-neutral-800 text-neutral-400'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tier 2: Subcategories Bar (Appears when active parent has subcategories) */}
        {activeSubcategories.length > 0 && activeParentObj && (
          <div
            className={`py-2.5 pt-1.5 flex items-center gap-2 overflow-x-auto scrollbar-none no-scrollbar border-t ${
              isDark ? 'border-neutral-800/80' : 'border-slate-200/80'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 whitespace-nowrap pl-1 pr-1.5">
              <CornerDownRight className="w-3.5 h-3.5 text-[#13487E]" />
              <span className="uppercase tracking-wider">Subcategories:</span>
            </div>

            {/* "All in {Parent}" Pill */}
            <button
              onClick={() => onSelectCategory(activeParentObj.id)}
              className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === activeParentObj.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : isDark
                  ? 'bg-neutral-900/90 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>All {activeParentObj.name}</span>
            </button>

            {/* Subcategory Pills */}
            {activeSubcategories.map((sub) => {
              const subCount = getSubcategoryProductCount(sub.id);
              const isSubSelected = selectedCategory === sub.id;

              return (
                <button
                  key={sub.id}
                  onClick={() => onSelectCategory(sub.id)}
                  className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSubSelected
                      ? 'bg-sky-600 text-white shadow-xs'
                      : isDark
                      ? 'bg-neutral-900/90 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{sub.name}</span>
                  <span
                    className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                      isSubSelected
                        ? 'bg-white/20 text-white'
                        : isDark
                        ? 'bg-neutral-800 text-neutral-400'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {subCount}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
