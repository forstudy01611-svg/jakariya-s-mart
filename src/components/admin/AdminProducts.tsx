import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Star,
  CheckCircle,
  XCircle,
  AlertTriangle,
  SlidersHorizontal,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { formatBDT } from '../../utils/bangladesh';

interface AdminProductsProps {
  onNavigate: (path: string) => void;
}

export const AdminProducts: React.FC<AdminProductsProps> = ({ onNavigate }) => {
  const { products, categories, settings, deleteProduct, updateProduct } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');

  // Confirmation dialog for deletion
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSku = p.sku && p.sku.toLowerCase().includes(q);
        if (!matchesName && !matchesSku) return false;
      }
      // Category filter
      if (selectedCategory !== 'all') {
        const childSubIds = categories.filter((c) => c.parent_id === selectedCategory).map((c) => c.id);
        const matchesDirectly = p.category_id === selectedCategory;
        const matchesSubcategory = p.subcategory_id === selectedCategory;
        const matchesChild = childSubIds.includes(p.category_id) || (p.subcategory_id ? childSubIds.includes(p.subcategory_id) : false);

        if (!matchesDirectly && !matchesSubcategory && !matchesChild) {
          return false;
        }
      }
      // Status filter
      if (statusFilter === 'active' && !p.is_active) return false;
      if (statusFilter === 'disabled' && p.is_active) return false;

      // Stock filter
      if (stockFilter === 'in_stock' && p.stock <= 0) return false;
      if (stockFilter === 'low_stock' && (p.stock > 5 || p.stock <= 0)) return false;
      if (stockFilter === 'out_of_stock' && p.stock > 0) return false;

      return true;
    });
  }, [products, searchQuery, selectedCategory, statusFilter, stockFilter]);

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
      setProductToDelete(null);
    } catch (err) {
      console.error('Failed to delete product', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateProduct(product.id, { is_active: !product.is_active });
  };

  const handleToggleFeatured = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateProduct(product.id, { is_featured: !product.is_featured });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-['Space_Grotesk'] tracking-tight">
            PRODUCT CATALOG
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage streetwear inventory, pricing, drop categories, and visuals.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/admin/products/new')}
          className="px-4 py-2.5 rounded-xl bg-[#13487E] hover:bg-[#0d3a66] text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#13487E]/25 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0d0d12] border border-neutral-800/80 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or SKU..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#13487E]"
            />
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-[#13487E] cursor-pointer"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories
                .filter((c) => !c.parent_id)
                .map((main) => {
                  const subs = categories.filter((c) => c.parent_id === main.id);
                  return (
                    <React.Fragment key={main.id}>
                      <option value={main.id}>
                        {main.name}
                      </option>
                      {subs.map((s) => (
                        <option key={s.id} value={s.id}>
                          &nbsp;&nbsp;↳ {s.name}
                        </option>
                      ))}
                    </React.Fragment>
                  );
                })}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-[#13487E] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active (Visible)</option>
              <option value="disabled">Disabled (Hidden)</option>
            </select>
          </div>

          {/* Stock Filter */}
          <div>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-[#13487E] cursor-pointer"
            >
              <option value="all">All Inventory</option>
              <option value="in_stock">In Stock (&gt;0)</option>
              <option value="low_stock">Low Stock (≤5)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-800/60">
          <span>
            Showing <strong className="text-white">{filteredProducts.length}</strong> of{' '}
            {products.length} products
          </span>
          {(searchQuery || selectedCategory !== 'all' || statusFilter !== 'all' || stockFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setStatusFilter('all');
                setStockFilter('all');
              }}
              className="text-[#13487E] hover:underline"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[#0d0d12] border border-neutral-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/60 text-neutral-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4">Featured</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500">
                    No products matched your criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const category = categories.find((c) => c.id === product.category_id);
                  const isOutOfStock = product.stock <= 0;
                  const isLowStock = product.stock > 0 && product.stock <= 5;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-neutral-900/50 transition-colors cursor-pointer group"
                      onClick={() => onNavigate(`/admin/products/${product.id}/edit`)}
                    >
                      {/* Product Thumbnail & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-neutral-950 border border-neutral-800 overflow-hidden flex-shrink-0">
                            <img
                              src={product.images[0] || ''}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-[#13487E] transition-colors max-w-xs truncate">
                              {product.name}
                            </div>
                            <div className="text-[10px] text-neutral-500 line-clamp-1 max-w-xs">
                              {product.description}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-4 font-mono text-neutral-400">
                        {product.sku || '—'}
                      </td>

                      {/* Category & Subcategory */}
                      <td className="py-3 px-4 text-neutral-300">
                        {category ? (
                          <div className="space-y-1">
                            <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[11px] inline-block font-medium">
                              {category.name}
                            </span>
                            {product.subcategory_id && (() => {
                              const sub = categories.find((c) => c.id === product.subcategory_id);
                              if (!sub) return null;
                              return (
                                <div className="text-[10px] text-sky-400 flex items-center gap-1 font-mono pl-1">
                                  <span>↳</span>
                                  <span>{sub.name}</span>
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <span className="text-neutral-500 italic">Uncategorized</span>
                        )}
                      </td>

                      {/* Price / Discount */}
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-white">
                          {formatBDT(product.discount_price ?? product.price)}
                        </div>
                        {product.discount_price && product.discount_price < product.price && (
                          <div className="text-[10px] text-neutral-500 line-through">
                            {formatBDT(product.price)}
                          </div>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-4">
                        <span
                          className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                            isOutOfStock
                              ? 'bg-red-950/60 text-red-400 border border-red-800'
                              : isLowStock
                              ? 'bg-amber-950/60 text-amber-400 border border-amber-800'
                              : 'text-neutral-300'
                          }`}
                        >
                          {product.stock} pcs
                        </span>
                      </td>

                      {/* Featured Toggle */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={(e) => handleToggleFeatured(product, e)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            product.is_featured
                              ? 'bg-[#13487E]/15 text-[#13487E] border-[#13487E]/40'
                              : 'text-neutral-600 border-neutral-800 hover:text-neutral-400'
                          }`}
                          title={product.is_featured ? 'Featured drop' : 'Mark as featured'}
                        >
                          <Star className={`w-3.5 h-3.5 ${product.is_featured ? 'fill-[#13487E]' : ''}`} />
                        </button>
                      </td>

                      {/* Active Status */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={(e) => handleToggleActive(product, e)}
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                            product.is_active
                              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-500'
                          }`}
                        >
                          {product.is_active ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>Disabled</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => onNavigate(`/admin/products/${product.id}/edit`)}
                            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-[#13487E] border border-neutral-800 transition-colors"
                            title="Edit Product"
                            aria-label="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setProductToDelete(product)}
                            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-red-400 border border-neutral-800 transition-colors"
                            title="Delete Product"
                            aria-label="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-[#0d0d12] border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-2xl text-neutral-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2 rounded-xl bg-red-950/60 border border-red-800">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Delete Product?
                </h3>
                <p className="text-xs text-neutral-400">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
              <span className="text-neutral-400">Target Product: </span>
              <strong className="text-white font-semibold">{productToDelete.name}</strong>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-bold text-neutral-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
