import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Layers,
  Upload,
  Check,
  AlertTriangle,
  FolderTree,
  CornerDownRight,
  Search,
  Tag,
  Boxes,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Category } from '../../types';

export const AdminCategories: React.FC = () => {
  const { categories, products, addCategory, updateCategory, deleteCategory, uploadImage } = useStore();

  // Filter & Search states
  const [filterType, setFilterType] = useState<'all' | 'main' | 'sub'>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
    is_subcategory: false,
    parent_id: '',
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Delete modal state
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [reassignTargetCatId, setReassignTargetCatId] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Main Categories (those with no parent_id)
  const mainCategories = categories.filter((c) => !c.parent_id);

  // Count subcategories for a given parent
  const getSubcategories = (parentId: string) => {
    return categories
      .filter((c) => c.parent_id === parentId)
      .sort((a, b) => a.display_order - b.display_order);
  };

  // Products count for a category (and its subcategories if main)
  const getCategoryProductCount = (category: Category) => {
    if (category.parent_id) {
      // It's a subcategory: match either subcategory_id or direct category_id
      return products.filter((p) => p.subcategory_id === category.id || p.category_id === category.id).length;
    }
    // Main category: count products assigned directly or to any of its subcategories
    const childIds = categories.filter((c) => c.parent_id === category.id).map((c) => c.id);
    return products.filter(
      (p) => p.category_id === category.id || (p.subcategory_id && childIds.includes(p.subcategory_id))
    ).length;
  };

  // Products belonging strictly to categoryToDelete
  const affectedProductsCount = categoryToDelete
    ? products.filter((p) => p.category_id === categoryToDelete.id || p.subcategory_id === categoryToDelete.id).length
    : 0;

  // Subcategories belonging to categoryToDelete (if it's a parent)
  const affectedSubcategoriesCount = categoryToDelete && !categoryToDelete.parent_id
    ? categories.filter((c) => c.parent_id === categoryToDelete.id).length
    : 0;

  // Open modal to add a brand new Main Category
  const handleOpenAddMainCategory = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      is_active: true,
      display_order: mainCategories.length + 1,
      is_subcategory: false,
      parent_id: '',
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  // Open modal pre-selected to add a Subcategory under a specific parent
  const handleOpenAddSubcategory = (parentId?: string) => {
    setEditingCategory(null);
    const defaultParent = parentId || (mainCategories[0]?.id || '');
    const siblingCount = defaultParent ? getSubcategories(defaultParent).length : 0;

    setFormData({
      name: '',
      slug: '',
      description: '',
      image_url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80',
      is_active: true,
      display_order: siblingCount + 1,
      is_subcategory: true,
      parent_id: defaultParent,
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  // Open modal to edit existing category
  const handleOpenEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      image_url: cat.image_url,
      is_active: cat.is_active,
      display_order: cat.display_order,
      is_subcategory: Boolean(cat.parent_id),
      parent_id: cat.parent_id || '',
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleOpenDeleteModal = (cat: Category) => {
    setCategoryToDelete(cat);
    // Find first other category to default reassign
    const otherCat = categories.find((c) => c.id !== cat.id && !c.parent_id);
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

    if (formData.is_subcategory && !formData.parent_id) {
      setErrorMsg('Please select a parent category for this subcategory.');
      return;
    }

    const slug = formData.slug.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const finalParentId = formData.is_subcategory ? formData.parent_id : null;

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
          parent_id: finalParentId,
        });
      } else {
        await addCategory({
          name: formData.name.trim(),
          slug,
          description: formData.description.trim(),
          image_url: formData.image_url,
          is_active: formData.is_active,
          display_order: Number(formData.display_order) || 1,
          parent_id: finalParentId,
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

  // Filtered categories based on filterType and search
  const filteredMainCategories = mainCategories
    .filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const subs = getSubcategories(c.id);
      return (
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        subs.some((s) => s.name.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => a.display_order - b.display_order);

  const allSubcategories = categories
    .filter((c) => Boolean(c.parent_id))
    .filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
    })
    .sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-['Space_Grotesk'] tracking-tight flex items-center gap-2.5">
            <FolderTree className="w-7 h-7 text-[#13487E]" />
            <span>CATEGORIES & SUBCATEGORIES</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage your store's department tree, subcategory divisions, and navigation hierarchy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenAddSubcategory()}
            className="px-3.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:border-[#13487E]"
          >
            <Plus className="w-3.5 h-3.5 text-[#13487E] stroke-[3]" />
            <span>New Subcategory</span>
          </button>

          <button
            onClick={handleOpenAddMainCategory}
            className="px-4 py-2.5 rounded-xl bg-[#13487E] hover:bg-[#0d3a66] text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#13487E]/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Main Category</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d0d12] border border-neutral-800/80 rounded-2xl p-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filterType === 'all'
                ? 'bg-[#13487E] text-white'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All ({categories.length})</span>
          </button>

          <button
            onClick={() => setFilterType('main')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filterType === 'main'
                ? 'bg-[#13487E] text-white'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Main Categories ({mainCategories.length})</span>
          </button>

          <button
            onClick={() => setFilterType('sub')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filterType === 'sub'
                ? 'bg-[#13487E] text-white'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <CornerDownRight className="w-3.5 h-3.5" />
            <span>Subcategories ({allSubcategories.length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search category or subcategory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#13487E]"
          />
        </div>
      </div>

      {/* Main Categories + Nested Subcategories View (Default & Main filter) */}
      {filterType !== 'sub' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMainCategories.map((cat) => {
              const subcategories = getSubcategories(cat.id);
              const totalProductCount = getCategoryProductCount(cat);

              return (
                <div
                  key={cat.id}
                  className="bg-[#0d0d12] border border-neutral-800/80 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-neutral-700 transition-all group shadow-md"
                >
                  {/* Category Banner Image & Badges */}
                  <div>
                    <div className="relative h-36 bg-neutral-950 overflow-hidden">
                      <img
                        src={cat.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-75"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d12] via-[#0d0d12]/40 to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-black/80 backdrop-blur text-white border border-neutral-700 flex items-center gap-1">
                          <Tag className="w-3 h-3 text-[#13487E]" />
                          <span>Order: #{cat.display_order}</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => handleToggleActive(cat)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border backdrop-blur transition-colors cursor-pointer ${
                            cat.is_active
                              ? 'bg-emerald-950/80 border-emerald-600 text-emerald-400'
                              : 'bg-neutral-900/80 border-neutral-700 text-neutral-400'
                          }`}
                        >
                          {cat.is_active ? 'Active' : 'Disabled'}
                        </button>
                      </div>

                      {/* Product Count Pill */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        <span className="text-xs font-mono font-bold bg-[#13487E] text-white px-2.5 py-0.5 rounded shadow">
                          {totalProductCount} {totalProductCount === 1 ? 'Product' : 'Products'}
                        </span>
                        {subcategories.length > 0 && (
                          <span className="text-[11px] font-mono font-bold bg-neutral-900/90 border border-neutral-700 text-sky-400 px-2 py-0.5 rounded backdrop-blur">
                            {subcategories.length} {subcategories.length === 1 ? 'Subcategory' : 'Subcategories'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-4 space-y-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-black text-white font-['Space_Grotesk'] tracking-tight group-hover:text-[#13487E] transition-colors">
                            {cat.name}
                          </h3>
                        </div>
                        <div className="text-[11px] font-mono text-neutral-500 mt-0.5">
                          /{cat.slug}
                        </div>
                        {cat.description && (
                          <p className="text-xs text-neutral-400 line-clamp-2 mt-1.5 leading-relaxed">
                            {cat.description}
                          </p>
                        )}
                      </div>

                      {/* Nested Subcategories Section */}
                      <div className="pt-3 border-t border-neutral-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                            <CornerDownRight className="w-3 h-3 text-[#13487E]" />
                            <span>Subcategories ({subcategories.length})</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => handleOpenAddSubcategory(cat.id)}
                            className="text-[10px] font-bold text-[#13487E] hover:text-sky-300 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3 stroke-[3]" />
                            <span>Add Sub</span>
                          </button>
                        </div>

                        {subcategories.length === 0 ? (
                          <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/60 text-center text-[11px] text-neutral-500">
                            No subcategories yet.
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {subcategories.map((sub) => {
                              const subProdCount = products.filter(
                                (p) => p.subcategory_id === sub.id || p.category_id === sub.id
                              ).length;

                              return (
                                <div
                                  key={sub.id}
                                  className="flex items-center justify-between p-2 rounded-xl bg-neutral-950/80 border border-neutral-800/70 hover:border-neutral-700 transition-colors"
                                >
                                  <div className="min-w-0 pr-2">
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${
                                          sub.is_active ? 'bg-emerald-400' : 'bg-neutral-600'
                                        }`}
                                      />
                                      <span className="text-xs font-bold text-neutral-200 truncate">
                                        {sub.name}
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-neutral-500 font-mono pl-3">
                                      /{sub.slug} • {subProdCount} item(s)
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                      onClick={() => handleOpenEditModal(sub)}
                                      className="p-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                                      title="Edit Subcategory"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleOpenDeleteModal(sub)}
                                      className="p-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
                                      title="Delete Subcategory"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Main Category Footer Actions */}
                  <div className="p-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between bg-neutral-950/30">
                    <span className="text-[10px] text-neutral-500 font-mono">
                      ID: {cat.id}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(cat)}
                        className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-[#13487E] border border-neutral-800 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleOpenDeleteModal(cat)}
                        className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-red-400 border border-neutral-800 transition-colors cursor-pointer"
                        title="Delete Category"
                        aria-label="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredMainCategories.length === 0 && (
            <div className="text-center py-12 bg-[#0d0d12] border border-neutral-800 rounded-2xl text-neutral-400 text-xs">
              No categories found matching "{searchQuery}".
            </div>
          )}
        </div>
      )}

      {/* Subcategories Only View (When 'sub' filter is active) */}
      {filterType === 'sub' && (
        <div className="bg-[#0d0d12] border border-neutral-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/80 text-neutral-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Subcategory</th>
                  <th className="py-3.5 px-4">Parent Category</th>
                  <th className="py-3.5 px-4">Slug</th>
                  <th className="py-3.5 px-4">Order</th>
                  <th className="py-3.5 px-4">Products</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {allSubcategories.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-neutral-500">
                      No subcategories created yet. Click "New Subcategory" to add one!
                    </td>
                  </tr>
                ) : (
                  allSubcategories.map((sub) => {
                    const parent = categories.find((c) => c.id === sub.parent_id);
                    const prodCount = products.filter(
                      (p) => p.subcategory_id === sub.id || p.category_id === sub.id
                    ).length;

                    return (
                      <tr key={sub.id} className="hover:bg-neutral-900/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-neutral-950 border border-neutral-800 overflow-hidden flex-shrink-0">
                              <img
                                src={sub.image_url || 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80'}
                                alt={sub.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-bold text-white text-xs">{sub.name}</div>
                              {sub.description && (
                                <div className="text-[10px] text-neutral-400 line-clamp-1 max-w-xs">
                                  {sub.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {parent ? (
                            <span className="px-2.5 py-1 rounded-lg bg-[#13487E]/20 border border-[#13487E]/30 text-sky-300 font-bold text-[11px] inline-flex items-center gap-1.5">
                              <Tag className="w-3 h-3 text-[#13487E]" />
                              <span>{parent.name}</span>
                            </span>
                          ) : (
                            <span className="text-neutral-500 italic">None</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-neutral-400 text-[11px]">
                          /{sub.slug}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-neutral-300">
                          #{sub.display_order}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                            {prodCount} items
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(sub)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border cursor-pointer ${
                              sub.is_active
                                ? 'bg-emerald-950/80 border-emerald-600 text-emerald-400'
                                : 'bg-neutral-900/80 border-neutral-700 text-neutral-400'
                            }`}
                          >
                            {sub.is_active ? 'Active' : 'Disabled'}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(sub)}
                              className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleOpenDeleteModal(sub)}
                              className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-red-400 border border-neutral-800 transition-colors cursor-pointer"
                              title="Delete Subcategory"
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
      )}

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg bg-[#0d0d12] border border-neutral-800 rounded-2xl p-6 space-y-5 shadow-2xl text-neutral-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <h3 className="text-lg font-black text-white font-['Space_Grotesk'] uppercase tracking-tight">
                  {editingCategory
                    ? editingCategory.parent_id
                      ? 'Edit Subcategory'
                      : 'Edit Main Category'
                    : formData.is_subcategory
                    ? 'Add New Subcategory'
                    : 'Add New Main Category'}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Configure department title, hierarchy level, and storefront URL.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-neutral-400 hover:text-white text-sm cursor-pointer"
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
              {/* Category Level Switcher (Main vs Subcategory) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Hierarchy Level
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-neutral-950 border border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, is_subcategory: false, parent_id: '' }))}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      !formData.is_subcategory
                        ? 'bg-[#13487E] text-white shadow'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Main Category</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const defaultParent = mainCategories[0]?.id || '';
                      setFormData((prev) => ({
                        ...prev,
                        is_subcategory: true,
                        parent_id: prev.parent_id || defaultParent,
                      }));
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formData.is_subcategory
                        ? 'bg-[#13487E] text-white shadow'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <CornerDownRight className="w-3.5 h-3.5" />
                    <span>Subcategory</span>
                  </button>
                </div>
              </div>

              {/* If Subcategory: Select Parent Category */}
              {formData.is_subcategory && (
                <div className="space-y-1.5 p-3 rounded-xl bg-sky-950/20 border border-[#13487E]/40 animate-in fade-in">
                  <label className="text-xs font-bold uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                    <CornerDownRight className="w-3.5 h-3.5 text-[#13487E]" />
                    <span>Belongs Under Parent Category <span className="text-[#13487E]">*</span></span>
                  </label>
                  <select
                    required
                    value={formData.parent_id}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#13487E] cursor-pointer"
                  >
                    <option value="" disabled>-- Select Main Category --</option>
                    {mainCategories
                      .filter((c) => !editingCategory || c.id !== editingCategory.id)
                      .map((parent) => (
                        <option key={parent.id} value={parent.id}>
                          {parent.name} (/{parent.slug})
                        </option>
                      ))}
                  </select>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    This subcategory will appear under the selected parent in the catalog and storefront filters.
                  </p>
                </div>
              )}

              {/* Category Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  {formData.is_subcategory ? 'Subcategory Name' : 'Category Name'} <span className="text-[#13487E]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    formData.is_subcategory
                      ? 'e.g. Anime Graphic Tees, Cargo Pants, Zip Hoodies...'
                      : 'e.g. T-Shirts & Oversized, Hoodies, Jackets...'
                  }
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

              {/* Slug and Display Order */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Slug / URL Path
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. anime-tees"
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

              {/* Description */}
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
                  Enable on Storefront
                </span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
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
                  className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-bold text-neutral-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#13487E] hover:bg-[#0d3a66] text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#13487E]/25 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting
                    ? 'Saving...'
                    : editingCategory
                    ? 'Save Changes'
                    : formData.is_subcategory
                    ? 'Create Subcategory'
                    : 'Create Category'}
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
                  Delete {categoryToDelete.parent_id ? 'Subcategory' : 'Category'}: {categoryToDelete.name}?
                </h3>
                <p className="text-xs text-neutral-400">
                  {categoryToDelete.parent_id
                    ? 'This subcategory will be removed from its parent category.'
                    : 'Review subcategories and products before removing this main category.'}
                </p>
              </div>
            </div>

            {/* Subcategory warning if it's a parent */}
            {affectedSubcategoriesCount > 0 && (
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 space-y-1">
                <div className="font-bold text-sky-400 flex items-center gap-1.5">
                  <CornerDownRight className="w-3.5 h-3.5" />
                  <span>Contains {affectedSubcategoriesCount} Subcategory(ies)</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Deleting this parent will detach its {affectedSubcategoriesCount} subcategory(ies) and convert them to standalone main categories.
                </p>
              </div>
            )}

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
                          {c.parent_id ? `↳ ${c.name} (Sub)` : c.name}
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
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-bold text-neutral-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting || (affectedProductsCount > 0 && !reassignTargetCatId)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition-colors disabled:opacity-50 cursor-pointer"
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
