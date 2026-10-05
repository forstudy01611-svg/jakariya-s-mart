import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  CreditCard,
  Users,
  Image as ImageIcon,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Plus,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { AUTHORIZED_ADMIN_EMAIL } from '../../types';

interface AdminLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentPath,
  onNavigate,
  children,
}) => {
  const { adminUser, logoutAdmin, orders, deliveryPayments } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pendingOrdersCount = orders.filter((o) => o.order_status === 'Pending').length;
  const pendingDeliveryPaymentsCount = deliveryPayments.filter((p) => p.status === 'Pending').length;

  const navItems = [
    {
      label: 'Dashboard',
      path: '/admin',
      icon: LayoutDashboard,
    },
    {
      label: 'Delivery Payments',
      path: '/admin/delivery-payments',
      icon: CreditCard,
      badge: pendingDeliveryPaymentsCount > 0 ? pendingDeliveryPaymentsCount : undefined,
    },
    {
      label: 'Orders',
      path: '/admin/orders',
      icon: ShoppingBag,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
    },
    {
      label: 'Products',
      path: '/admin/products',
      icon: Package,
    },
    {
      label: 'Categories',
      path: '/admin/categories',
      icon: Layers,
    },
    {
      label: 'Customers',
      path: '/admin/customers',
      icon: Users,
    },
    {
      label: 'Banners',
      path: '/admin/banners',
      icon: ImageIcon,
    },
    {
      label: 'Settings',
      path: '/admin/settings',
      icon: Settings,
    },
  ];

  const handleLogout = () => {
    logoutAdmin();
    onNavigate('/admin/login');
  };

  const isActive = (itemPath: string) => {
    if (itemPath === '/admin') {
      return currentPath === '/admin';
    }
    return currentPath.startsWith(itemPath);
  };

  return (
    <div className="min-h-screen bg-[#070709] text-neutral-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0a0a0d] border-r border-neutral-800/80 flex-shrink-0 min-h-screen sticky top-0 h-screen">
        {/* Brand Area */}
        <div className="p-6 border-b border-neutral-800/80 flex items-center justify-between">
          <button
            onClick={() => onNavigate('/admin')}
            className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 rounded-xl bg-[#13487E] text-white font-black text-xl flex items-center justify-center shadow-lg shadow-[#13487E]/25">
              J
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white font-['Space_Grotesk']">
                Jakariya's Mart
              </span>
              <span className="block text-[10px] uppercase font-bold tracking-widest text-[#13487E]">
                Admin Console
              </span>
            </div>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-[#13487E] text-white shadow-md shadow-[#13487E]/20'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? 'text-black stroke-[2.5]' : 'text-neutral-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      active ? 'bg-black text-[#13487E]' : 'bg-[#13487E] text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Add Product Button */}
        <div className="p-4 border-t border-neutral-800/80">
          <button
            onClick={() => onNavigate('/admin/products/new')}
            className="w-full py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:border-[#13487E]"
          >
            <Plus className="w-4 h-4 text-[#13487E]" />
            <span>New Product</span>
          </button>
        </div>

        {/* Bottom User Profile & View Store */}
        <div className="p-4 border-t border-neutral-800/80 bg-neutral-950/40 space-y-3">
          <button
            onClick={() => onNavigate('/')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-[#13487E]" />
              View Customer Store
            </span>
          </button>

          <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold text-white uppercase">
                {adminUser?.email ? adminUser.email[0] : 'A'}
              </div>
              <span className="text-xs text-neutral-300 truncate max-w-[110px]" title={adminUser?.email || AUTHORIZED_ADMIN_EMAIL}>
                {adminUser?.email || AUTHORIZED_ADMIN_EMAIL}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-900 transition-colors"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden bg-[#0a0a0d] border-b border-neutral-800 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <button
          onClick={() => onNavigate('/admin')}
          className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-[#13487E] text-white font-black flex items-center justify-center">
            J
          </div>
          <div>
            <span className="font-black text-white font-['Space_Grotesk']">Jakariya's Mart</span>
            <span className="text-[10px] text-[#13487E] font-bold block -mt-1">ADMIN</span>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/')}
            className="p-2 text-neutral-400 hover:text-white"
            title="View Store"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-neutral-400 hover:text-white"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0e0e12] border-b border-neutral-800 px-4 py-4 space-y-2 z-30">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => {
                  onNavigate(item.path);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                  active ? 'bg-[#13487E] text-white' : 'text-neutral-300 hover:bg-neutral-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-black text-[#13487E]">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
            <span className="text-xs text-neutral-400 truncate">
              {adminUser?.email || AUTHORIZED_ADMIN_EMAIL}
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded bg-red-950/60 border border-red-800 text-xs text-red-300 font-bold flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Desktop Top Header Bar */}
        <header className="hidden md:flex h-16 bg-[#0a0a0d]/60 backdrop-blur border-b border-neutral-800/80 px-8 items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-500 uppercase font-mono tracking-wider">Jakariya's Mart PORTAL</span>
            <span className="text-neutral-600">/</span>
            <span className="text-[#13487E] font-bold uppercase tracking-wider">
              {currentPath.replace('/admin/', '').replace('/admin', 'Dashboard') || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('/')}
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg hover:border-neutral-700"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#13487E]" />
              <span>Customer Storefront</span>
            </button>

            <div className="h-4 w-px bg-neutral-800" />

            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono text-neutral-300">Live Sync Active</span>
            </div>
          </div>
        </header>

        {/* View container */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
