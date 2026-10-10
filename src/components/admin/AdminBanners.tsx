import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Upload,
  ArrowRight,
  Eye,
  EyeOff,
  Image as ImageIcon,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Banner } from '../../types';

export const AdminBanners: React.FC = () => {
  const { banners, addBanner, updateBanner, deleteBanner, uploadImage } = useStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    button_text: 'Shop Now',
    button_url: '#catalog',
    is_active: true,
    display_order: 1,
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleOpenAdd = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      image_url: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=1600&auto=format&fit=crop&q=80',
      button_text: 'Explore Drop',
      button_url: '#catalog',
      is_active: true,
      display_order: banners.length + 1,
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleOpenEdit = (ban: Banner) => {
    setEditingBanner(ban);
    setFormData({
      title: ban.title,
      subtitle: ban.subtitle,
      image_url: ban.image_url,
      button_text: ban.button_text,
      button_url: ban.button_url,
      is_active: ban.is_active,
      display_order: ban.display_order,
    });
    setErrorMsg('');
    setModalOpen(true);
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
    if (!formData.image_url.trim()) {
      setErrorMsg('Banner image URL or file is required.');
      return;
    }

    const finalTitle = formData.title.trim() || 'Store Banner';

    setIsSubmitting(true);
    try {
      if (editingBanner) {
        await updateBanner(editingBanner.id, {
          title: finalTitle,
          subtitle: formData.subtitle.trim(),
          image_url: formData.image_url.trim(),
          button_text: formData.button_text.trim(),
          button_url: formData.button_url.trim(),
          is_active: formData.is_active,
          display_order: Number(formData.display_order) || 1,
        });
      } else {
        await addBanner({
          title: finalTitle,
          subtitle: formData.subtitle.trim(),
          image_url: formData.image_url.trim(),
          button_text: formData.button_text.trim(),
          button_url: formData.button_url.trim(),
          is_active: formData.is_active,
          display_order: Number(formData.display_order) || 1,
        });
      }
      setModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save banner.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    await updateBanner(banner.id, { is_active: !banner.is_active });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-['Space_Grotesk'] tracking-tight">
            HOMEPAGE HERO BANNERS
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Configure visual carousels, seasonal drops, and promotional call-to-actions.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-[#13487E] hover:bg-[#0d3a66] text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#13487E]/25 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Banner</span>
        </button>
      </div>

      {/* Banners List */}
      <div className="space-y-4">
        {banners
          .sort((a, b) => a.display_order - b.display_order)
          .map((banner) => (
            <div
              key={banner.id}
              className="bg-[#0d0d12] border border-neutral-800/80 rounded-2xl overflow-hidden flex flex-col md:flex-row hover:border-neutral-700 transition-colors"
            >
              {/* Banner Preview Image (3:1) */}
              <div className="relative w-full md:w-80 aspect-[3/1] bg-neutral-950 flex-shrink-0 overflow-hidden">
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-black/80 text-white border border-neutral-700">
                    Order: #{banner.display_order}
                  </span>
                </div>
              </div>

              {/* Banner Details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(banner)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        banner.is_active
                          ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-500'
                      }`}
                    >
                      {banner.is_active ? 'Active' : 'Disabled'}
                    </button>
                    <span className="text-[10px] font-mono text-neutral-500">ID: {banner.id}</span>
                  </div>

                  <h3 className="text-lg font-black text-white font-['Space_Grotesk'] tracking-tight">
                    {banner.title}
                  </h3>

                  <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                    {banner.subtitle}
                  </p>
                </div>

                {/* Button link info & actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-neutral-800/80">
                  <div className="text-xs text-neutral-400 flex items-center gap-2">
                    <span className="font-semibold text-neutral-300">Button:</span>
                    <span className="px-2 py-0.5 rounded bg-neutral-900 text-[#13487E] font-bold text-[11px]">
                      {banner.button_text} → {banner.button_url}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(banner)}
                      className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-[#13487E] border border-neutral-800 text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => deleteBanner(banner.id)}
                      className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-red-400 border border-neutral-800 transition-colors"
                      title="Delete Banner"
                      aria-label="Delete Banner"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Modal for Add / Edit Banner */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg bg-[#0d0d12] border border-neutral-800 rounded-2xl p-6 space-y-5 shadow-2xl text-neutral-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-lg font-black text-white font-['Space_Grotesk'] uppercase tracking-tight">
                {editingBanner ? 'Edit Banner' : 'Create New Hero Banner'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-neutral-400 hover:text-white"
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
              {/* Banner Image */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                    Banner Image <span className="text-[#13487E]">*</span>
                  </label>
                  <span className="text-[11px] text-[#13487E] font-medium">
                    Recommended: 1920×640px or 1200×400px (3:1 Ratio)
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    placeholder="https://... or upload image file"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#13487E]"
                  />
                  <label className="px-3.5 py-2 rounded-xl bg-[#13487E]/20 hover:bg-[#13487E]/30 border border-[#13487E]/50 text-xs font-bold text-[#13487E] cursor-pointer flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploading}
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {formData.image_url && (
                  <div className="relative aspect-[21/9] max-h-40 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950">
                    <img
                      src={formData.image_url}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Banner Name / Note (Internal Reference) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Banner Name / Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Summer Promo / Eid Drop (Admin reference)"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#13487E]"
                />
                <p className="text-[11px] text-neutral-500">
                  Note: The storefront displays this clean banner image directly without any text overlay.
                </p>
              </div>

              {/* Click URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Click Redirect URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. #catalog or https://..."
                  value={formData.button_url}
                  onChange={(e) => setFormData({ ...formData, button_url: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#13487E]"
                />
                <p className="text-[11px] text-neutral-500">
                  When customers click the banner, they will be redirected to this link.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value, 10) || 1 })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#13487E]"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800 mt-5">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Active
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
              </div>

              {/* Form buttons */}
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
                  {isSubmitting ? 'Saving...' : editingBanner ? 'Save Changes' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
