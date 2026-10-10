import React from 'react';
import { Lock, Mail, Phone, MapPin, Instagram, Facebook, Youtube } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useTheme } from '../../context/ThemeContext';

interface StoreFooterProps {
  onNavigate: (route: string) => void;
  onSelectCategory: (catId: string | null) => void;
}

export const StoreFooter: React.FC<StoreFooterProps> = ({
  onNavigate,
  onSelectCategory,
}) => {
  const { settings, categories, adminUser } = useStore();
  const { isDark } = useTheme();
  const activeCategories = categories.filter((c) => c.is_active);

  return (
    <footer
      className={`w-full border-t transition-colors duration-300 text-sm ${
        isDark
          ? 'bg-[#070709] border-neutral-800 text-neutral-400'
          : 'bg-slate-100 border-slate-200 text-slate-600'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Brand info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#13487E] flex items-center justify-center font-black text-white text-lg shadow-sm">
                J
              </div>
              <span
                className={`text-2xl font-black font-['Space_Grotesk'] tracking-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {(!settings.store_name || settings.store_name.toLowerCase().includes('fugo')) ? "Jakariya's Mart" : settings.store_name}
              </span>
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
              {settings.tagline || "Jakariya's Mart - Your Trusted Online Shopping Destination"}. Guaranteed authentic quality, fast nationwide delivery with cash on delivery, and 100% customer satisfaction.
            </p>
            <div className="flex items-center gap-2.5 pt-2">
              {settings.social_links.instagram && (
                <a
                  href={settings.social_links.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors ${
                    isDark
                      ? 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-[#13487E] hover:border-[#13487E]'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-[#13487E] hover:border-[#13487E] shadow-2xs'
                  }`}
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
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors ${
                    isDark
                      ? 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-[#13487E] hover:border-[#13487E]'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-[#13487E] hover:border-[#13487E] shadow-2xs'
                  }`}
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
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors ${
                    isDark
                      ? 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-[#13487E] hover:border-[#13487E]'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-[#13487E] hover:border-[#13487E] shadow-2xs'
                  }`}
                  aria-label="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Shop Categories */}
          <div className="space-y-3">
            <h4 className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Collections
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onSelectCategory(null)}
                  className={`hover:text-[#13487E] transition-colors cursor-pointer ${
                    isDark ? 'text-neutral-400' : 'text-slate-600'
                  }`}
                >
                  All Releases
                </button>
              </li>
              {activeCategories.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => onSelectCategory(c.id)}
                    className={`hover:text-[#13487E] transition-colors cursor-pointer ${
                      isDark ? 'text-neutral-400' : 'text-slate-600'
                    }`}
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Direct Contact
            </h4>
            <div className={`space-y-2.5 text-xs ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
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
            <h4 className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Staff & Management
            </h4>
            <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
              Authorized Jakariya's Mart personnel portal for store catalog, real-time orders, and inventory control.
            </p>
            <button
              onClick={() => onNavigate(adminUser ? '/admin' : '/admin/login')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all group cursor-pointer ${
                isDark
                  ? 'bg-neutral-900 border-neutral-800 hover:border-[#13487E] text-neutral-300 hover:text-white'
                  : 'bg-white border-slate-200 hover:border-[#13487E] text-slate-700 hover:text-slate-900 shadow-2xs'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-[#13487E] group-hover:scale-110 transition-transform" />
              <span>Admin Management Portal</span>
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className={`mt-12 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs ${
            isDark ? 'border-neutral-800 text-neutral-500' : 'border-slate-200 text-slate-500'
          }`}
        >
          <p>© {new Date().getFullYear()} {settings.store_name || "Jakariya's Mart"}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Terms of Service</span>
            <span>·</span>
            <span>Privacy Policy</span>
            <span>·</span>
            <span className="text-[#13487E] font-mono font-semibold">Jakariya's Mart ENGINE v2.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
