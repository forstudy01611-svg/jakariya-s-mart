import React from 'react';
import { Lock, Mail, Phone, MapPin, Instagram, Facebook, Youtube } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface StoreFooterProps {
  onNavigate: (route: string) => void;
  onSelectCategory: (catId: string | null) => void;
}

export const StoreFooter: React.FC<StoreFooterProps> = ({
  onNavigate,
  onSelectCategory,
}) => {
  const { settings, categories, adminUser } = useStore();
  const activeCategories = categories.filter((c) => c.is_active);

  return (
    <footer className="w-full bg-[#070709] border-t border-neutral-800 text-neutral-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Brand info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#13487E] flex items-center justify-center font-black text-white text-lg">
                J
              </div>
              <span className="text-2xl font-black text-white font-['Space_Grotesk'] tracking-tight">
                {(!settings.store_name || settings.store_name.toLowerCase().includes('fugo')) ? "Jakariya's Mart" : settings.store_name}
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {settings.tagline || 'Modern Streetwear & Anime Apparel'}. Re-engineered silhouettes, heavyweight custom fabrics, and tactical urban design.
            </p>
            <div className="flex items-center gap-3 pt-2">
              {settings.social_links.instagram && (
                <a
                  href={settings.social_links.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-[#13487E] hover:border-[#13487E] transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {settings.social_links.facebook && (
                <a
                  href={settings.social_links.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-[#13487E] hover:border-[#13487E] transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {settings.social_links.youtube && (
                <a
                  href={settings.social_links.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-[#13487E] hover:border-[#13487E] transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Shop Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">
              Collections
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onSelectCategory(null)}
                  className="hover:text-[#13487E] transition-colors"
                >
                  All Releases
                </button>
              </li>
              {activeCategories.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => onSelectCategory(c.id)}
                    className="hover:text-[#13487E] transition-colors"
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">
              Direct Contact
            </h4>
            <div className="space-y-2.5 text-xs text-neutral-400">
              {settings.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#13487E]" />
                  <span>{settings.phone}</span>
                </div>
              )}
              {settings.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#13487E]" />
                  <span>{settings.email}</span>
                </div>
              )}
              {settings.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#13487E] flex-shrink-0 mt-0.5" />
                  <span>{settings.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Admin & Security */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">
              Staff & Management
            </h4>
            <p className="text-xs text-neutral-400">
              Authorized Jakariya's Mart personnel portal for store catalog, real-time orders, and inventory control.
            </p>
            <button
              onClick={() => onNavigate(adminUser ? '/admin' : '/admin/login')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-[#13487E] text-xs font-semibold text-neutral-300 hover:text-white transition-all group"
            >
              <Lock className="w-3.5 h-3.5 text-[#13487E] group-hover:scale-110 transition-transform" />
              <span>Admin Management Portal</span>
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>© {new Date().getFullYear()} {settings.store_name || "Jakariya's Mart"}. All rights reserved.</p>
          <div className="flex items-center gap-4 text-neutral-400">
            <span>Terms of Service</span>
            <span>·</span>
            <span>Privacy Policy</span>
            <span>·</span>
            <span className="text-[#13487E] font-mono">Jakariya's Mart ENGINE v2.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
