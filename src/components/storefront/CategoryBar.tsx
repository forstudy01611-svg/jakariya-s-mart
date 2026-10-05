import React from 'react';
import { useStore } from '../../context/StoreContext';

interface CategoryBarProps {
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const { categories, products } = useStore();
  const activeCategories = categories
    .filter((c) => c.is_active)
    .sort((a, b) => a.display_order - b.display_order);

  const getProductCount = (catId: string | null) => {
    if (!catId) return products.filter((p) => p.is_active).length;
    return products.filter((p) => p.is_active && p.category_id === catId).length;
  };

  return (
    <div className="w-full bg-[#0d0d11] border-b border-neutral-800 py-4 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
          <button
            onClick={() => onSelectCategory(null)}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              selectedCategory === null
                ? 'bg-[#13487E] text-white shadow-md shadow-[#13487E]/20'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'
            }`}
          >
            <span>All Products</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                selectedCategory === null ? 'bg-black/20 text-black' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {getProductCount(null)}
            </span>
          </button>

          {activeCategories.map((category) => {
            const count = getProductCount(category.id);
            const isSelected = selectedCategory === category.id;

            return (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-[#13487E] text-white shadow-md shadow-[#13487E]/20'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'
                }`}
              >
                <span>{category.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isSelected ? 'bg-black/20 text-black' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
