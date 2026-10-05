import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Layers,
  Upload,
  Check,
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
  Image as ImageIcon,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Category } from '../../types';

export const AdminCategories: React.FC = () => {
  const { categories, products, addCategory, updateCategory, deleteCategory, uploadImage } = useStore();

  // Create / Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    is_active: true,
    display_order: 1,
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Delete modal state
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [reassignTargetCatId, setReassignTargetCatId] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Products belonging to categoryToDelete
  const affectedProductsCount = categoryToDelete
    ? products.filter((p) => p.category_id === categoryToDelete.id).length
    : 0;

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      is_active: true,
      display_order: categories.length + 1,
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      image_url: cat.image_url,
      is_active: cat.is_active,
      display_order: cat.display_order,
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleOpenDeleteModal = (cat: Category) => {
    setCategoryToDelete(cat);
    // Find first other category to default reassign
    const otherCat = categories.find((c) => c.id !== cat.id);
    setReassignTargetCatId(otherCat ? otherCat.id : '');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      setFormData((prev) => ({ ...prev, image_url: url }));
    } catch {
      setErrorMsg('Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Category name is required.');
      return;
    }

    const slug = formData.slug.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: formData.name.trim(),
          slug,
          description: formData.description.trim(),
          image_url: formData.image_url,
          is_active: formData.is_active,
          display_order: Number(formData.display_order) || 1,
        });
      } else {
        await addCategory({
          name: formData.name.trim(),
          slug,
          description: formData.description.trim(),
          image_url: formData.image_url,
          is_active: formData.is_active,
          display_order: Number(formData.display_order) || 1,
        });
      }
      setModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);

    try {
      await deleteCategory(
        categoryToDelete.id,
        affectedProductsCount > 0 ? reassignTargetCatId : undefined
      );
      setCategoryToDelete(null);
    } catch (err: any) {
      console.error('Delete category error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (cat: Category) => {
    await updateCategory(cat.id, { is_active: !cat.is_active });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-['Space_Grotesk'] tracking-tight">
            CATEGORY ARCHITECTURE
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Organize departments, streetwear lines, and customer navigation hierarchy.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-[#13487E] hover:bg-[#0d3a66] text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#13487E]/25 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories
          .sort((a, b) => a.display_order - b.display_order)
          .map((cat) => {
            const productCount = products.filter((p) => p.category_id === cat.id).length;

            return (
              <div
                key={cat.id}
                className="bg-[#0d0d12] border border-neutral-800/80 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-neutral-700 transition-colors group"
              >
                {/* Header Image & Status */}
                <div className="relative h-36 bg-neutral-950 overflow-hidden">
                  <img
                    src={cat.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-75"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d12] via-[#0d0d12]/40 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-black/80 backdrop-blur text-white border border-neutral-700">
                      Order: #{cat.display_order}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(cat)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border backdrop-blur transition-colors ${
                        cat.is_active
                          ? 'bg-emerald-950/80 border-emerald-600 text-emerald-400'
                          : 'bg-neutral-900/80 border-neutral-700 text-neutral-400'
                      }`}
                    >
                      {cat.is_active ? 'Active' : 'Disabled'}
                    </button>
                  </div>

                  {/* Product Count Pill */}
                  <div className="absolute bottom-3 left-3">
                    <span className="text-xs font-mono font-bold bg-[#13487E] text-white px-2 py-0.5 rounded">
                      {productCount} {productCount === 1 ? 'Product' : 'Products'}
                    </span>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-base font-black text-white font-['Space_Grotesk'] tracking-tight group-hover:text-[#13487E] transition-colors">
                      {cat.name}
                    </h3>
                    <div className="text-[11px] font-mono text-neutral-500">
                      /{cat.slug}
                    </div>
                    {cat.description && (
                      <p className="text-xs text-neutral-400 line-clamp-2 mt-1.5 leading-relaxed">
                        {cat.description}
                      </p>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-neutral-800/80">
                    <span className="text-[10px] text-neutral-500 font-mono">
                      ID: {cat.id}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(cat)}
                        className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-[#13487E] border border-neutral-800 text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleOpenDeleteModal(cat)}
                        className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-red-400 border border-neutral-800 transition-colors"
                        title="Delete Category"
                        aria-label="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg bg-[#0d0d12] border border-neutral-800 rounded-2xl p-6 space-y-5 shadow-2xl text-neutral-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-lg font-black text-white font-['Space_Grotesk'] uppercase tracking-tight">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-neutral-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Category Name <span className="text-[#13487E]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New Arrivals, T-Shirts, Tactical Gear..."
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      name,
                      slug: !editingCategory ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : prev.slug,
                    }));
                  }}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#13487E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Slug / URL Path
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. t-shirts"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#13487E]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value, 10) || 1 })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#13487E]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Short tagline or department description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#13487E] resize-none"
                />
              </div>

              {/* Category Image */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Category Banner Image
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://... or upload below"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#13487E]"
                  />
                  <label className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-bold text-neutral-300 cursor-pointer flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-[#13487E]" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {formData.image_url && (
                  <div className="relative h-28 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950">
                    <img
                      src={formData.image_url}
                      alt="Category preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Enable Category on Store
                </span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    formData.is_active ? 'bg-[#13487E]' : 'bg-neutral-800'
                  }`}
                >
                  <span
                    className={`block w-3.5 h-3.5 rounded-full bg-black shadow transform transition-transform absolute top-0.5 ${
                      formData.is_active ? 'left-6' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-bold text-neutral-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#13487E] hover:bg-[#0d3a66] text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#13487E]/25 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safe Category Deletion Dialog */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-[#0d0d12] border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-2xl text-neutral-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Delete Category: {categoryToDelete.name}?
                </h3>
                <p className="text-xs text-neutral-400">
                  Review product relationships before removing this department.
                </p>
              </div>
            </div>

            {/* Check if products belong to this category */}
            {affectedProductsCount > 0 ? (
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 space-y-3">
                <div className="text-xs font-bold text-amber-300 flex items-center gap-2">
                  <span>⚠️ Notice: {affectedProductsCount} product(s) belong to this category!</span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  Jakariya's Mart protects products from accidental deletion. Select a destination category below to safely reassign these {affectedProductsCount} product(s):
                </p>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-neutral-400">
                    Reassign Products To:
                  </label>
                  <select
                    value={reassignTargetCatId}
                    onChange={(e) => setReassignTargetCatId(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#13487E]"
                  >
                    {categories
                      .filter((c) => c.id !== categoryToDelete.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-400">
                No active products currently belong to this category. It can be safely removed.
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-bold text-neutral-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting || (affectedProductsCount > 0 && !reassignTargetCatId)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Processing...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
