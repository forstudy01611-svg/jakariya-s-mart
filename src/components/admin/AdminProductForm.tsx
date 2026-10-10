import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Upload,
  Trash2,
  Star,
  Check,
  Plus,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Product, ProductVariant } from '../../types';

interface AdminProductFormProps {
  productId?: string;
  onNavigate: (path: string) => void;
}

export const AdminProductForm: React.FC<AdminProductFormProps> = ({
  productId,
  onNavigate,
}) => {
  const { products, categories, settings, addProduct, updateProduct, uploadImage } = useStore();

  const isEditing = Boolean(productId);
  const existingProduct = products.find((p) => p.id === productId);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discount_price: '',
    category_id: categories.find((c) => !c.parent_id)?.id || categories[0]?.id || '',
    subcategory_id: '',
    stock: '',
    sku: '',
    is_featured: false,
    is_active: true,
  });

  const [images, setImages] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState(false);

  // Populate existing product on edit
  useEffect(() => {
    if (isEditing && existingProduct) {
      setFormData({
        name: existingProduct.name,
        description: existingProduct.description,
        price: existingProduct.price.toString(),
        discount_price: existingProduct.discount_price !== null && existingProduct.discount_price !== undefined
          ? existingProduct.discount_price.toString()
          : '',
        category_id: existingProduct.category_id || (categories.find((c) => !c.parent_id)?.id || categories[0]?.id || ''),
        subcategory_id: existingProduct.subcategory_id || '',
        stock: existingProduct.stock.toString(),
        sku: existingProduct.sku || '',
        is_featured: existingProduct.is_featured,
        is_active: existingProduct.is_active,
      });
      setImages(existingProduct.images || []);
      setVariants(existingProduct.variants || []);
    } else if (!isEditing && categories.length > 0) {
      // If creating a new product and no category selected, or current selection is invalid
      setFormData((prev) => {
        const isCurrentValid = categories.some((c) => c.id === prev.category_id);
        if (!prev.category_id || !isCurrentValid) {
          const defaultCat = categories.find((c) => !c.parent_id)?.id || categories[0]?.id || '';
          return { ...prev, category_id: defaultCat, subcategory_id: '' };
        }
        return prev;
      });
    }
  }, [isEditing, existingProduct, categories]);

  // Handle file uploads
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setErrorMsg('');

    try {
      const uploadPromises = Array.from(files).map((file) => uploadImage(file));
      const uploadedUrls = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...uploadedUrls]);
    } catch (err: any) {
      setErrorMsg('Failed to process image upload. Please try again.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Add image via URL
  const handleAddImageUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setImages((prev) => [...prev, urlInput.trim()]);
    setUrlInput('');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSetMainImage = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const target = prev[index];
      const rest = prev.filter((_, idx) => idx !== index);
      return [target, ...rest];
    });
  };

  const handleAddVariant = () => {
    const newVariant: ProductVariant = {
      id: `var-${Date.now()}`,
      name: '',
      options: [''],
    };
    setVariants([...variants, newVariant]);
  };

  const handleUpdateVariant = (id: string, name: string) => {
    setVariants(variants.map(v => v.id === id ? { ...v, name } : v));
  };

  const handleRemoveVariant = (id: string) => {
    setVariants(variants.filter(v => v.id !== id));
  };

  const handleAddOption = (variantId: string) => {
    setVariants(variants.map(v => v.id === variantId ? { ...v, options: [...v.options, ''] } : v));
  };

  const handleUpdateOption = (variantId: string, optionIdx: number, value: string) => {
    setVariants(variants.map(v => v.id === variantId ? {
      ...v,
      options: v.options.map((opt, idx) => idx === optionIdx ? value : opt)
    } : v));
  };

  const handleRemoveOption = (variantId: string, optionIdx: number) => {
    setVariants(variants.map(v => v.id === variantId ? {
      ...v,
      options: v.options.filter((_, idx) => idx !== optionIdx)
    } : v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Product name is required.');
      return;
    }
    const parsedPrice = parseFloat(formData.price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setErrorMsg('Please enter a valid price.');
      return;
    }

    const parsedStock = parseInt(formData.stock, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      setErrorMsg('Please enter a valid stock quantity.');
      return;
    }

    if (images.length === 0) {
      setErrorMsg('Please attach at least one product image or URL.');
      return;
    }

    const parsedDiscountPrice = formData.discount_price.trim()
      ? parseFloat(formData.discount_price)
      : null;

    if (!formData.category_id || !categories.some(c => c.id === formData.category_id)) {
      setErrorMsg('Please select a valid category.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parsedPrice,
        discount_price: parsedDiscountPrice,
        category_id: formData.category_id,
        subcategory_id: formData.subcategory_id.trim() || null,
        stock: parsedStock,
        sku: formData.sku.trim() || undefined,
        images,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
        variants: variants.filter(v => v.name.trim() !== '' && v.options.some(opt => opt.trim() !== '')),
      };

      if (isEditing && productId) {
        await updateProduct(productId, payload);
      } else {
        await addProduct(payload);
      }

      setSuccessToast(true);
      setTimeout(() => {
        onNavigate('/admin/products');
      }, 700);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('/admin/products')}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white font-['Space_Grotesk'] tracking-tight">
              {isEditing ? 'EDIT PRODUCT' : 'CREATE NEW PRODUCT'}
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              {isEditing
                ? `Updating "${existingProduct?.name || productId}"`
                : "Add a new streetwear item to the Jakariya's Mart catalog"}
            </p>
          </div>
        </div>

        {successToast && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-xs font-bold animate-in fade-in">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Product Saved Successfully!</span>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Column: Product Details (2 cols) */}
          <div className="md:col-span-2 space-y-5">
            {/* General Info Card */}
            <div className="bg-[#0d0d12] border border-neutral-800/80 rounded-2xl p-5 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 pb-2 border-b border-neutral-800/60">
                General Information
              </h2>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Product Name <span className="text-[#13487E]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jakariya's Mart Cyber-Ronin Oversized Tee"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#13487E]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe material, cut, GSM, artwork specs, sizing guide..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#13487E] resize-y"
                />
              </div>

              {/* Category, Subcategory, and SKU Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Main Category <span className="text-[#13487E]">*</span>
                  </label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => {
                      const newCatId = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        category_id: newCatId,
                        subcategory_id: '',
                      }));
                    }}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#13487E] cursor-pointer"
                  >
                    {categories
                      .filter((c) => !c.parent_id)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                      Subcategory
                    </label>
                    <span className="text-[10px] text-neutral-500 font-normal">Optional</span>
                  </div>
                  {(() => {
                    const availableSubs = categories.filter((c) => c.parent_id === formData.category_id);
                    return (
                      <select
                        value={formData.subcategory_id}
                        disabled={availableSubs.length === 0}
                        onChange={(e) => setFormData({ ...formData, subcategory_id: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#13487E] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {availableSubs.length > 0 ? '-- None (General) --' : 'No Subcategories'}
                        </option>
                        {availableSubs.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            ↳ {sub.name}
                          </option>
                        ))}
                      </select>
                    );
                  })()}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. JM-TEE-001"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder-neutral-600 focus:outline-none focus:border-[#13487E]"
                  />
                </div>
              </div>
            </div>

            {/* Images Card */}
            <div className="bg-[#0d0d12] border border-neutral-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800/60">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Product Images ({images.length})
                </h2>
                <span className="text-[10px] text-neutral-500">First image will be the primary cover</span>
              </div>

              {/* Upload Drop Area */}
              <div className="border-2 border-dashed border-neutral-800 rounded-xl p-6 text-center hover:border-[#13487E]/50 transition-colors bg-neutral-950/40">
                <input
                  type="file"
                  id="image-upload"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[#13487E]">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {isUploading ? 'Uploading & Processing...' : 'Click to Upload Product Photos'}
                    </span>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      PNG, JPG, WebP supported. Multiple files allowed.
                    </p>
                  </div>
                </label>
              </div>

              {/* Or Add Image by URL */}
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Or paste an image URL (e.g. Unsplash / CDN)..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#13487E]"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-bold text-neutral-200 transition-colors"
                >
                  + Add URL
                </button>
              </div>

              {/* Image Previews Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800"
                    >
                      <img
                        src={imgUrl}
                        alt={`Preview ${idx}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Main cover badge */}
                      {idx === 0 && (
                        <span className="absolute top-1.5 left-1.5 bg-[#13487E] text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow">
                          MAIN
                        </span>
                      )}

                      {/* Hover action overlay */}
                      <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {idx !== 0 && (
                          <button
                            type="button"
                            onClick={() => handleSetMainImage(idx)}
                            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-[#13487E] text-neutral-300 hover:text-white text-[10px] font-bold transition-colors"
                            title="Set as Main Cover"
                          >
                            Set Main
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="p-1.5 rounded-lg bg-neutral-900 hover:bg-red-600 text-neutral-300 hover:text-white transition-colors"
                          title="Delete image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Variants Card */}
            <div className="bg-[#0d0d12] border border-neutral-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800/60">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Product Variants (e.g. Size, Color)
                </h2>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="px-2.5 py-1 rounded-lg bg-[#13487E]/20 text-[#13487E] hover:bg-[#13487E]/30 text-[10px] font-black uppercase transition-colors"
                >
                  + Add Variant
                </button>
              </div>

              <div className="space-y-4">
                {variants.length === 0 && (
                  <p className="text-[10px] text-neutral-500 italic">No variants added. Useful for things like Sizes (S, M, L) or Colors.</p>
                )}
                {variants.map((v) => (
                  <div key={v.id} className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Variant Name (e.g. Size)</label>
                        <input
                          type="text"
                          placeholder="Size, Color, etc."
                          value={v.name}
                          onChange={(e) => handleUpdateVariant(v.id, e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#13487E]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(v.id)}
                        className="mt-5 p-2 rounded-lg bg-red-950/30 text-red-500 hover:bg-red-950/50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase block">Options</label>
                      <div className="flex flex-wrap gap-2">
                        {v.options.map((opt, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <input
                              type="text"
                              placeholder="M, Red, etc."
                              value={opt}
                              onChange={(e) => handleUpdateOption(v.id, idx, e.target.value)}
                              className="bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-white w-24 focus:outline-none focus:border-[#13487E]"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(v.id, idx)}
                              className="p-1 text-neutral-500 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleAddOption(v.id)}
                          className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[10px] font-bold text-neutral-400 hover:text-white transition-colors border border-neutral-700"
                        >
                          + Option
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Pricing, Inventory & Status (1 col) */}
          <div className="space-y-5">
            {/* Pricing Card */}
            <div className="bg-[#0d0d12] border border-neutral-800/80 rounded-2xl p-5 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 pb-2 border-b border-neutral-800/60">
                Pricing (৳ BDT)
              </h2>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Regular Price (BDT) <span className="text-[#13487E]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-neutral-500 font-mono text-sm font-bold">
                    ৳
                  </span>
                  <input
                    type="number"
                    step="1"
                    required
                    placeholder="1250"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#13487E]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Sale / Discount Price (BDT)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-neutral-500 font-mono text-sm font-bold">
                    ৳
                  </span>
                  <input
                    type="number"
                    step="1"
                    placeholder="e.g. 1150 (Optional)"
                    value={formData.discount_price}
                    onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#13487E]"
                  />
                </div>
                <span className="text-[10px] text-neutral-500">
                  Leave empty if not currently on sale.
                </span>
              </div>
            </div>

            {/* Inventory Card */}
            <div className="bg-[#0d0d12] border border-neutral-800/80 rounded-2xl p-5 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 pb-2 border-b border-neutral-800/60">
                Inventory
              </h2>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Available Stock <span className="text-[#13487E]">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#13487E]"
                />
                <span className="text-[10px] text-neutral-500">
                  Orders will automatically decrement this stock count.
                </span>
              </div>
            </div>

            {/* Status & Options Card */}
            <div className="bg-[#0d0d12] border border-neutral-800/80 rounded-2xl p-5 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 pb-2 border-b border-neutral-800/60">
                Visibility & Badges
              </h2>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                <div>
                  <div className="text-xs font-bold text-white uppercase tracking-wider">
                    Store Visibility
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    Visible on customer store
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    formData.is_active ? 'bg-[#13487E]' : 'bg-neutral-800'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-black shadow transform transition-transform absolute top-1 ${
                      formData.is_active ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Featured Drop Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                <div>
                  <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-[#13487E]" />
                    Featured Drop
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    Pins to top of catalog
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_featured: !formData.is_featured })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    formData.is_featured ? 'bg-[#13487E]' : 'bg-neutral-800'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-black shadow transform transition-transform absolute top-1 ${
                      formData.is_featured ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Save Buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-[#13487E] hover:bg-[#0d3a66] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#13487E]/25 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Saving Product...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{isEditing ? 'Save Changes' : 'Create Product'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onNavigate('/admin/products')}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
