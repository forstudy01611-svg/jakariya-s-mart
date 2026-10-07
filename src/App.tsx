import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { StorefrontView } from './components/storefront/StorefrontView';
import { CheckoutView } from './components/storefront/CheckoutView';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminProducts } from './components/admin/AdminProducts';
import { AdminProductForm } from './components/admin/AdminProductForm';
import { AdminCategories } from './components/admin/AdminCategories';
import { AdminOrders } from './components/admin/AdminOrders';
import { AdminOrderDetail } from './components/admin/AdminOrderDetail';
import { AdminCustomers } from './components/admin/AdminCustomers';
import { AdminBanners } from './components/admin/AdminBanners';
import { AdminDeliveryPayments } from './components/admin/AdminDeliveryPayments';
import { AdminSettings } from './components/admin/AdminSettings';
import { AdminCoupons } from './components/admin/AdminCoupons';
import { NeonLoader } from './components/storefront/NeonLoader';
import { ProductDetailView } from './components/storefront/ProductDetailView';
import { AUTHORIZED_ADMIN_USERNAME } from './types';

// Helper to resolve current path supporting standard pathname as well as preview hash routing
const resolveCurrentPath = (): string => {
  if (typeof window === 'undefined') return '/';
  const hash = window.location.hash.replace(/^#\/?/, '/');
  if (hash.startsWith('/admin') || hash.startsWith('/checkout') || hash.startsWith('/product')) {
    return hash;
  }
  if (window.location.pathname === '/checkout' || window.location.pathname.startsWith('/product')) {
    return window.location.pathname;
  }
  return window.location.pathname || '/';
};

const AppContent: React.FC = () => {
  const { adminUser, authInitialized } = useStore();
  const [currentPath, setCurrentPath] = useState<string>(resolveCurrentPath);
  const [showLoader, setShowLoader] = useState(true);

  // Initial loader timing
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 1500); 
    return () => clearTimeout(timer);
  }, []);

  // Keep in sync with browser back / forward and hash changes inside iframe
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(resolveCurrentPath());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigate = (newPath: string) => {
    if (newPath === currentPath) return;
    try {
      window.history.pushState({}, '', newPath);
    } catch {
      // ignore
    }
    if (newPath.startsWith('/admin') || newPath.startsWith('/checkout')) {
      try {
        window.location.hash = newPath;
      } catch {
        // ignore
      }
    } else if (window.location.hash.startsWith('#/admin') || window.location.hash.startsWith('#/checkout')) {
      try {
        history.replaceState(null, '', window.location.pathname);
      } catch {
        window.location.hash = '';
      }
    }
    setCurrentPath(newPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auth Guard: Only username 'junaid&jakariya' is permitted to access any /admin page
  // Wait until authInitialized is true before evaluating to allow session restoration on page refresh
  useEffect(() => {
    if (!authInitialized) return;
    const isAuthorized =
      adminUser &&
      adminUser.role === 'admin' &&
      adminUser.username?.toLowerCase() === AUTHORIZED_ADMIN_USERNAME.toLowerCase();
    if (currentPath.startsWith('/admin') && currentPath !== '/admin/login' && !isAuthorized) {
      navigate('/admin/login');
    }
  }, [currentPath, adminUser, authInitialized]);

  // If on /admin/login and already authenticated with authorized username, redirect to /admin
  useEffect(() => {
    if (!authInitialized) return;
    const isAuthorized =
      adminUser &&
      adminUser.role === 'admin' &&
      adminUser.username?.toLowerCase() === AUTHORIZED_ADMIN_USERNAME.toLowerCase();
    if (currentPath === '/admin/login' && isAuthorized) {
      navigate('/admin');
    }
  }, [currentPath, adminUser, authInitialized]);

  // Route: Standalone Checkout Page
  if (currentPath === '/checkout' || currentPath.startsWith('/checkout')) {
    return (
      <>
        <NeonLoader isLoading={showLoader} />
        <CheckoutView onNavigate={navigate} />
      </>
    );
  }

  // Route: Product Detail Page
  if (currentPath.startsWith('/product/')) {
    const productId = currentPath.split('/product/')[1];
    return (
      <>
        <NeonLoader isLoading={showLoader} />
        <ProductDetailView productId={productId} onNavigate={navigate} />
      </>
    );
  }

  // Route: Storefront
  if (!currentPath.startsWith('/admin')) {
    return (
      <>
        <NeonLoader isLoading={showLoader} />
        <StorefrontView onNavigate={navigate} />
      </>
    );
  }

  // If loading session for protected admin routes, show clean session check screen
  if (!authInitialized && currentPath !== '/admin/login') {
    return (
      <>
        <NeonLoader isLoading={showLoader} />
        <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center text-white space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#13487E] text-white font-black text-2xl flex items-center justify-center animate-pulse shadow-lg shadow-[#13487E]/30 font-['Space_Grotesk']">
            J
          </div>
          <div className="text-xs uppercase font-bold tracking-widest text-neutral-400">
            Verifying Supabase Session...
          </div>
        </div>
      </>
    );
  }

  // Route: Admin Login
  if (currentPath === '/admin/login') {
    return (
      <>
        <NeonLoader isLoading={showLoader} />
        <AdminLogin
          onSuccess={() => navigate('/admin')}
          onNavigateHome={() => navigate('/')}
        />
      </>
    );
  }

  // Admin Sub-routes within AdminLayout
  const renderAdminView = () => {
    // 1. /admin/products/new
    if (currentPath === '/admin/products/new') {
      return <AdminProductForm onNavigate={navigate} />;
    }

    // 2. /admin/products/:id/edit
    const productEditMatch = currentPath.match(/^\/admin\/products\/([^/]+)\/edit$/);
    if (productEditMatch) {
      return (
        <AdminProductForm
          productId={productEditMatch[1]}
          onNavigate={navigate}
        />
      );
    }

    // 3. /admin/products
    if (currentPath === '/admin/products') {
      return <AdminProducts onNavigate={navigate} />;
    }

    // 4. /admin/categories
    if (currentPath === '/admin/categories') {
      return <AdminCategories />;
    }

    // 5. /admin/orders/:id
    const orderDetailMatch = currentPath.match(/^\/admin\/orders\/([^/]+)$/);
    if (orderDetailMatch && orderDetailMatch[1] !== 'new') {
      return (
        <AdminOrderDetail
          orderId={orderDetailMatch[1]}
          onNavigate={navigate}
        />
      );
    }

    // Delivery Payments: /admin/delivery-payments
    if (currentPath === '/admin/delivery-payments') {
      return <AdminDeliveryPayments onNavigate={navigate} />;
    }

    // 6. /admin/orders
    if (currentPath === '/admin/orders') {
      return <AdminOrders onNavigate={navigate} />;
    }

    // 7. /admin/customers
    if (currentPath === '/admin/customers') {
      return <AdminCustomers onNavigate={navigate} />;
    }

    // Coupons: /admin/coupons
    if (currentPath === '/admin/coupons') {
      return <AdminCoupons />;
    }

    // 8. /admin/banners
    if (currentPath === '/admin/banners') {
      return <AdminBanners />;
    }

    // 9. /admin/settings
    if (currentPath === '/admin/settings') {
      return <AdminSettings />;
    }

    // 10. Default /admin -> Dashboard
    return <AdminDashboard onNavigate={navigate} />;
  };

  return (
    <>
      <NeonLoader isLoading={showLoader} />
      <AdminLayout currentPath={currentPath} onNavigate={navigate}>
        {renderAdminView()}
      </AdminLayout>
    </>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
