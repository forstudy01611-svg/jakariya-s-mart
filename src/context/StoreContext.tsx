import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  Product,
  Category,
  Order,
  Banner,
  StoreSettings,
  CartItem,
  AdminUser,
  OrderStatus,
  PaymentStatus,
  Customer,
  AUTHORIZED_ADMIN_EMAIL,
  AUTHORIZED_ADMIN_USERNAME,
  AdminProfile,
  DeliveryPayment,
  DeliveryPaymentStatus,
  DeliveryPaymentMethod,
  Coupon,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_BANNERS,
  INITIAL_SETTINGS,
  INITIAL_ORDERS,
  INITIAL_DELIVERY_PAYMENTS,
  INITIAL_COUPONS,
} from '../data/initialData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { calculateDeliveryCharge } from '../utils/bangladesh';
import {
  safeSetItem,
  cleanupLegacyStorage,
  compressImageFile,
  idbStorage,
} from '../utils/storage';

interface StoreContextType {
  products: Product[];
  categories: Category[];
  orders: Order[];
  banners: Banner[];
  settings: StoreSettings;
  cart: CartItem[];
  customers: Customer[];
  deliveryPayments: DeliveryPayment[];
  coupons: Coupon[];
  appliedCoupon: Coupon | null;
  
  // Auth & Team
  adminUser: AdminUser | null;
  adminProfiles: AdminProfile[];
  addAdminProfile: (profile: Omit<AdminProfile, 'id'>) => Promise<AdminProfile>;
  deleteAdminProfile: (id: string) => Promise<void>;
  isLoading: boolean;
  authInitialized: boolean;
  error: string | null;

  // Cart operations
  addToCart: (product: Product, quantity?: number, selected_variants?: Record<string, string>) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;

  // Coupon operations
  addCoupon: (couponData: Omit<Coupon, 'id' | 'created_at' | 'usage_count'>) => Promise<Coupon>;
  updateCoupon: (id: string, updates: Partial<Coupon>) => Promise<Coupon>;
  deleteCoupon: (id: string) => Promise<void>;
  toggleCouponStatus: (id: string) => Promise<void>;
  applyCouponCode: (code: string, itemsToCalculate?: { product: Product; quantity: number }[]) => { success: boolean; message: string; discount?: number };
  removeAppliedCoupon: () => void;
  calculateDiscountForCoupon: (coupon: Coupon, items: { product: Product; quantity: number }[]) => { discount: number; eligibleSubtotal: number; isValid: boolean; reason?: string };

  // Order operations
  placeOrder: (orderData: {
    id?: string;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    customer_address: string;
    division?: string;
    district?: string;
    upazila?: string;
    union_ward?: string;
    delivery_instructions?: string;
    customer_city?: string;
    items: {
      product_id: string;
      product_name: string;
      product_image: string;
      quantity: number;
      price: number;
      subtotal: number;
      selected_variants?: Record<string, string>;
    }[];
    subtotal: number;
    coupon_code?: string;
    coupon_discount?: number;
    delivery_charge: number;
    total: number;
    payment_method?: 'Cash on Delivery' | 'cash_on_delivery';
    delivery_payment_method?: DeliveryPaymentMethod;
    delivery_transaction_id?: string;
    notes?: string;
  }) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  updatePaymentStatus: (orderId: string, status: PaymentStatus) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  clearAllOrders: () => Promise<{ success: boolean; message: string }>;
  clearPendingOrders: () => Promise<{ success: boolean; message: string }>;
  refreshAllData: () => Promise<{ success: boolean; message: string }>;

  // Delivery Payment Operations (Admin manual verification)
  approveDeliveryPayment: (paymentId: string) => Promise<{ success: boolean; message: string }>;
  rejectDeliveryPayment: (paymentId: string, reason?: string) => Promise<{ success: boolean; message: string }>;
  deleteDeliveryPayment: (paymentId: string) => Promise<void>;
  checkTrxIdExists: (trxId: string) => boolean;

  // Product operations
  addProduct: (productData: Omit<Product, 'id' | 'created_at'>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<boolean>;

  // Category operations
  addCategory: (categoryData: Omit<Category, 'id'>) => Promise<Category>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<Category>;
  deleteCategory: (id: string, reassignToCategoryId?: string) => Promise<{ success: boolean; movedProductsCount: number }>;

  // Banner operations
  addBanner: (bannerData: Omit<Banner, 'id'>) => Promise<Banner>;
  updateBanner: (id: string, updates: Partial<Banner>) => Promise<Banner>;
  deleteBanner: (id: string) => Promise<void>;

  // Settings
  updateSettings: (updates: Partial<StoreSettings>) => Promise<void>;

  // Media upload
  uploadImage: (file: File) => Promise<string>;

  // Auth
  loginAdmin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logoutAdmin: () => void;
  resetAdminPassword: (password: string) => Promise<{ success: boolean; message: string; error?: string }>;
  resetToDemoData: () => void;
  syncAllToSupabase: () => Promise<{ success: boolean; message: string }>;
  sendPasswordReset: (emailToReset?: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  buyNowItems: CartItem[] | null;
  setBuyNowItems: (items: CartItem[] | null) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'jakariyas_mart_products_v7',
  CATEGORIES: 'jakariyas_mart_categories_v7',
  ORDERS: 'jakariyas_mart_orders_v7',
  BANNERS: 'jakariyas_mart_banners_v7',
  SETTINGS: 'jakariyas_mart_settings_v7',
  CART: 'jakariyas_mart_cart_v7',
  ADMIN_SESSION: 'jakariyas_mart_admin_session_v7',
  ADMIN_PROFILES: 'jakariyas_mart_admin_profiles_v7',
  DELIVERY_PAYMENTS: 'jakariyas_mart_delivery_payments_v7',
  COUPONS: 'jakariyas_mart_coupons_v7',
};

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [adminProfiles, setAdminProfiles] = useState<AdminProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_PROFILES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deliveryPayments, setDeliveryPayments] = useState<DeliveryPayment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DELIVERY_PAYMENTS);
      return saved ? JSON.parse(saved) : INITIAL_DELIVERY_PAYMENTS;
    } catch {
      return INITIAL_DELIVERY_PAYMENTS;
    }
  });

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COUPONS);
      return saved ? JSON.parse(saved) : INITIAL_COUPONS;
    } catch {
      return INITIAL_COUPONS;
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (!saved) return INITIAL_CATEGORIES;
      const parsed: Category[] = JSON.parse(saved);
      const hasAnySub = parsed.some((c) => Boolean(c.parent_id));
      if (!hasAnySub) {
        const defaultSubs = INITIAL_CATEGORIES.filter((c) => Boolean(c.parent_id));
        return [...parsed, ...defaultSubs];
      }
      return parsed;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [banners, setBanners] = useState<Banner[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BANNERS);
      return saved ? JSON.parse(saved) : INITIAL_BANNERS;
    } catch {
      return INITIAL_BANNERS;
    }
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.store_name || parsed.store_name.toLowerCase().includes('fugo')) {
          parsed.store_name = "Jakariya's Mart";
        }
        return { ...INITIAL_SETTINGS, ...parsed, store_name: "Jakariya's Mart" };
      }
      return INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [buyNowItems, setBuyNowItems] = useState<CartItem[] | null>(null);

  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed?.username?.toLowerCase() === AUTHORIZED_ADMIN_USERNAME.toLowerCase()) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Startup maintenance: clean legacy bloated localStorage keys and check IndexedDB hydration
  useEffect(() => {
    cleanupLegacyStorage();

    const hydrateFromIdb = async () => {
      try {
        const idbProducts = await idbStorage.getItem<Product[]>(STORAGE_KEYS.PRODUCTS);
        if (idbProducts && Array.isArray(idbProducts) && idbProducts.length > 0) {
          setProducts((current) => {
            // If current in-memory products is still the initial stock and IDB has custom products, sync
            if (current.length === INITIAL_PRODUCTS.length && current[0]?.id === INITIAL_PRODUCTS[0]?.id && idbProducts.length > 0) {
              return idbProducts;
            }
            return current;
          });
        }
      } catch {
        // ignore
      }
    };
    hydrateFromIdb();
  }, []);

  // Safe sync to storage with QuotaExceededError protection and IndexedDB persistence
  useEffect(() => {
    safeSetItem(STORAGE_KEYS.PRODUCTS, products);
  }, [products]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.CATEGORIES, categories);
  }, [categories]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.ORDERS, orders);
  }, [orders]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.BANNERS, banners);
  }, [banners]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.CART, cart);
  }, [cart]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.ADMIN_PROFILES, adminProfiles);
  }, [adminProfiles]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.DELIVERY_PAYMENTS, deliveryPayments);
  }, [deliveryPayments]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.COUPONS, coupons);
  }, [coupons]);

  useEffect(() => {
    if (adminUser) {
      safeSetItem(STORAGE_KEYS.ADMIN_SESSION, adminUser);
    } else {
      try {
        localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
      } catch {}
      idbStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION).catch(() => {});
    }
  }, [adminUser]);

  // If Supabase is connected, load data or listen
  useEffect(() => {
    const client = supabase;
    if (!isSupabaseConfigured || !client) {
      setAuthInitialized(true);
      return;
    }

    const fetchSupabaseData = async () => {
      setIsLoading(true);
      try {
        const [prodRes, catRes, orderRes, banRes, setRes, teamRes, payRes, cpnRes] = await Promise.all([
          client.from('products').select('*'),
          client.from('categories').select('*').order('display_order', { ascending: true }),
          client.from('orders').select('*').order('created_at', { ascending: false }),
          client.from('banners').select('*').order('display_order', { ascending: true }),
          client.from('settings').select('*').limit(1).maybeSingle(),
          client.from('admin_profiles').select('*').order('created_at', { ascending: true }),
          client.from('delivery_payments').select('*').order('created_at', { ascending: false }),
          client.from('coupons').select('*').order('created_at', { ascending: false }),
        ]);

        if (prodRes.data && prodRes.data.length > 0) setProducts(prodRes.data);
        if (catRes.data && catRes.data.length > 0) setCategories(catRes.data);
        if (orderRes.data && orderRes.data.length > 0) setOrders(orderRes.data);
        if (banRes.data && banRes.data.length > 0) setBanners(banRes.data);
        if (teamRes.data && teamRes.data.length > 0) setAdminProfiles(teamRes.data);
        if (payRes.data && payRes.data.length > 0) setDeliveryPayments(payRes.data);
        if (cpnRes.data && cpnRes.data.length > 0) setCoupons(cpnRes.data);
        if (setRes.data) setSettings(setRes.data);

        // Check active session against authorized admin emails
        const { data: authData } = await client.auth.getSession();
        if (authData.session?.user) {
          const userEmail = authData.session.user.email?.toLowerCase();
          if (
            userEmail === AUTHORIZED_ADMIN_EMAIL.toLowerCase() ||
            userEmail === 'mindboogle535@gmail.com'
          ) {
            setAdminUser({
              id: authData.session.user.id,
              email: userEmail,
              role: 'admin',
            });
          }
        }
      } catch (err: any) {
        console.warn('Supabase fetch error, using local data:', err.message);
      } finally {
        setIsLoading(false);
        setAuthInitialized(true);
      }
    };

    fetchSupabaseData();

    // Listen to Supabase Auth state changes
    const { data: authListener } = client.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const userEmail = session.user.email?.toLowerCase();
        if (
          userEmail === AUTHORIZED_ADMIN_EMAIL.toLowerCase() ||
          userEmail === 'mindboogle535@gmail.com'
        ) {
          setAdminUser({
            id: session.user.id,
            email: userEmail,
            role: 'admin',
          });
        }
      }
      setAuthInitialized(true);
    });

    // Supabase Realtime channel for orders and coupons
    try {
      const liveChannel = client
        .channel('realtime_store_events')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders((prev) => [payload.new as Order, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((o) => (o.id === (payload.new as Order).id ? (payload.new as Order) : o))
            );
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((o) => o.id !== (payload.old as Order).id));
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'coupons' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setCoupons((prev) => [payload.new as Coupon, ...prev.filter((c) => c.id !== (payload.new as Coupon).id)]);
          } else if (payload.eventType === 'UPDATE') {
            setCoupons((prev) =>
              prev.map((c) => (c.id === (payload.new as Coupon).id ? (payload.new as Coupon) : c))
            );
          } else if (payload.eventType === 'DELETE') {
            setCoupons((prev) => prev.filter((c) => c.id !== (payload.old as Coupon).id));
          }
        })
        .subscribe();

      return () => {
        authListener?.subscription?.unsubscribe();
        client.removeChannel(liveChannel);
      };
    } catch {
      return () => {
        authListener?.subscription?.unsubscribe();
      };
    }
  }, []);

  // Compute customers list from orders
  const customers: Customer[] = React.useMemo(() => {
    const customerMap: Record<string, Customer> = {};

    orders.forEach((order) => {
      const key = (order.customer_phone || order.customer_email || order.customer_name).trim().toLowerCase();
      if (!key) return;

      if (!customerMap[key]) {
        customerMap[key] = {
          id: `cust-${key.replace(/[^a-z0-9]/gi, '_')}`,
          name: order.customer_name,
          phone: order.customer_phone,
          email: order.customer_email || '',
          address: order.customer_address,
          total_orders: 1,
          total_spent: order.total,
          last_order_date: order.created_at,
        };
      } else {
        customerMap[key].total_orders += 1;
        customerMap[key].total_spent += order.total;
        if (new Date(order.created_at) > new Date(customerMap[key].last_order_date)) {
          customerMap[key].last_order_date = order.created_at;
          customerMap[key].address = order.customer_address;
          if (order.customer_email) customerMap[key].email = order.customer_email;
        }
      }
    });

    return Object.values(customerMap).sort((a, b) => b.total_spent - a.total_spent);
  }, [orders]);

  // Cart operations
  const addToCart = useCallback((product: Product, quantity = 1, selected_variants?: Record<string, string>) => {
    setCart((prev) => {
      // Create a unique ID for this cart item based on product ID and selected variants
      const variantString = selected_variants ? Object.entries(selected_variants).sort().map(([k, v]) => `${k}:${v}`).join('|') : '';
      const cartItemId = variantString ? `${product.id}-${variantString}` : product.id;

      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.id === cartItemId
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock || 99) }
            : item
        );
      }
      return [...prev, { 
        id: cartItemId,
        product, 
        quantity: Math.min(quantity, product.stock || 99),
        selected_variants
      }];
    });
  }, []);

  const removeFromCart = useCallback((cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  }, []);

  const updateCartQuantity = useCallback((cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === cartItemId ? { ...item, quantity } : item))
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => {
    const itemPrice = item.product.discount_price ?? item.product.price;
    return sum + itemPrice * item.quantity;
  }, 0);

  // Coupon Calculation Logic
  const calculateDiscountForCoupon = useCallback((
    coupon: Coupon,
    items: { product: Product; quantity: number }[]
  ): { discount: number; eligibleSubtotal: number; isValid: boolean; reason?: string } => {
    if (!coupon.is_active) {
      return { discount: 0, eligibleSubtotal: 0, isValid: false, reason: 'এই কুপনটি বর্তমানে নিষ্ক্রিয় রয়েছে।' };
    }

    if (coupon.end_date && new Date(coupon.end_date) < new Date()) {
      return { discount: 0, eligibleSubtotal: 0, isValid: false, reason: 'এই কুপনের মেয়াদ শেষ হয়ে গেছে।' };
    }

    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return { discount: 0, eligibleSubtotal: 0, isValid: false, reason: 'এই কুপনটির ব্যবহারের সর্বোচ্চ সীমা শেষ হয়েছে।' };
    }

    const totalCartSubtotal = items.reduce((sum, item) => {
      const price = item.product.discount_price ?? item.product.price;
      return sum + price * item.quantity;
    }, 0);

    if (coupon.min_order_amount && totalCartSubtotal < coupon.min_order_amount) {
      return {
        discount: 0,
        eligibleSubtotal: 0,
        isValid: false,
        reason: `সর্বনিম্ন ৳${coupon.min_order_amount.toLocaleString('en-BD')} অর্ডারে এই কুপনটি প্রযোজ্য।`,
      };
    }

    let eligibleSubtotal = 0;
    if (coupon.applies_to === 'all') {
      eligibleSubtotal = totalCartSubtotal;
    } else if (coupon.applies_to === 'specific' && coupon.product_ids && coupon.product_ids.length > 0) {
      const matchingItems = items.filter((item) => coupon.product_ids!.includes(item.product.id));
      eligibleSubtotal = matchingItems.reduce((sum, item) => {
        const price = item.product.discount_price ?? item.product.price;
        return sum + price * item.quantity;
      }, 0);

      if (eligibleSubtotal <= 0) {
        return {
          discount: 0,
          eligibleSubtotal: 0,
          isValid: false,
          reason: 'আপনার কার্টের প্রোডাক্টগুলোর জন্য এই কুপনটি প্রযোজ্য নয়। এটি নির্দিষ্ট কিছু প্রোডাক্টে প্রযোজ্য।',
        };
      }
    } else {
      eligibleSubtotal = totalCartSubtotal;
    }

    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = Math.round((eligibleSubtotal * coupon.discount_value) / 100);
      if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
        discount = coupon.max_discount_amount;
      }
    } else {
      discount = Math.min(coupon.discount_value, eligibleSubtotal);
    }

    return { discount, eligibleSubtotal, isValid: true };
  }, []);

  const applyCouponCode = useCallback((
    code: string,
    itemsToCalculate?: { product: Product; quantity: number }[]
  ): { success: boolean; message: string; discount?: number } => {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: 'অনুগ্রহ করে একটি কুপন কোড লিখুন।' };
    }

    const found = coupons.find((c) => c.code.trim().toUpperCase() === cleanCode);
    if (!found) {
      return { success: false, message: 'কুপন কোডটি সঠিক নয়। অনুগ্রহ করে যাচাই করে পুনরায় চেষ্টা করুন।' };
    }

    const items = itemsToCalculate || (buyNowItems && buyNowItems.length > 0 ? buyNowItems : cart);
    if (!items || items.length === 0) {
      return { success: false, message: 'কার্ট খালি থাকায় কুপন প্রয়োগ করা সম্ভব নয়।' };
    }

    const check = calculateDiscountForCoupon(found, items);
    if (!check.isValid) {
      return { success: false, message: check.reason || 'কুপনটি প্রযোজ্য নয়।' };
    }

    setAppliedCoupon(found);
    return {
      success: true,
      message: `অভিনন্দন! "${found.code}" কুপন সক্রিয় হয়েছে এবং ৳${check.discount.toLocaleString('en-BD')} ছাড় প্রয়োগ করা হয়েছে!`,
      discount: check.discount,
    };
  }, [coupons, cart, buyNowItems, calculateDiscountForCoupon]);

  const removeAppliedCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, []);

  // Coupon Admin CRUD Operations
  const addCoupon = async (couponData: Omit<Coupon, 'id' | 'created_at' | 'usage_count'>): Promise<Coupon> => {
    const newCoupon: Coupon = {
      ...couponData,
      id: `cpn-${Date.now()}`,
      code: couponData.code.trim().toUpperCase(),
      usage_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setCoupons((prev) => [newCoupon, ...prev]);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('coupons').insert([newCoupon]);
      } catch (err) {
        console.warn('Could not sync new coupon to Supabase:', err);
      }
    }

    return newCoupon;
  };

  const updateCoupon = async (id: string, updates: Partial<Coupon>): Promise<Coupon> => {
    let updated: Coupon | null = null;
    setCoupons((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          updated = { ...c, ...updates, updated_at: new Date().toISOString() };
          if (updates.code) updated.code = updates.code.trim().toUpperCase();
          return updated;
        }
        return c;
      })
    );

    if (isSupabaseConfigured && supabase && updated) {
      try {
        await supabase.from('coupons').update(updated).eq('id', id);
      } catch (err) {
        console.warn('Could not update coupon in Supabase:', err);
      }
    }

    return updated || ({} as Coupon);
  };

  const deleteCoupon = async (id: string): Promise<void> => {
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    if (appliedCoupon?.id === id) {
      setAppliedCoupon(null);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('coupons').delete().eq('id', id);
      } catch (err) {
        console.warn('Could not delete coupon in Supabase:', err);
      }
    }
  };

  const toggleCouponStatus = async (id: string): Promise<void> => {
    const found = coupons.find((c) => c.id === id);
    if (found) {
      await updateCoupon(id, { is_active: !found.is_active });
    }
  };

  // Check if Transaction ID is already used
  const checkTrxIdExists = useCallback((trxId: string): boolean => {
    if (!trxId) return false;
    const clean = trxId.trim().toUpperCase();
    return deliveryPayments.some(
      (p) => p.transaction_id && p.transaction_id.trim().toUpperCase() === clean
    );
  }, [deliveryPayments]);

  // Place order with manual Delivery Charge payment
  const placeOrder = async (orderData: {
    id?: string;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    customer_address: string;
    division?: string;
    district?: string;
    upazila?: string;
    union_ward?: string;
    delivery_instructions?: string;
    customer_city?: string;
    items: {
      product_id: string;
      product_name: string;
      product_image: string;
      quantity: number;
      price: number;
      subtotal: number;
      selected_variants?: Record<string, string>;
    }[];
    subtotal: number;
    coupon_code?: string;
    coupon_discount?: number;
    delivery_charge: number;
    total: number;
    payment_method?: 'Cash on Delivery' | 'cash_on_delivery';
    delivery_payment_method?: DeliveryPaymentMethod;
    delivery_transaction_id?: string;
    notes?: string;
  }): Promise<Order> => {
    const cleanTrxId = (orderData.delivery_transaction_id || '').trim().toUpperCase();

    // Strict validation: Duplicate Transaction ID check
    if (cleanTrxId) {
      const isDuplicate = deliveryPayments.some(
        (p) => p.transaction_id && p.transaction_id.trim().toUpperCase() === cleanTrxId
      );
      if (isDuplicate) {
        throw new Error(`এই Transaction ID (${cleanTrxId}) ইতিমধ্যে অন্য একটি অর্ডারে ব্যবহার করা হয়েছে। অনুগ্রহ করে সঠিক Transaction ID দিন।`);
      }
    }

    const timestampSuffix = Math.floor(1000 + Math.random() * 9000);
    const newOrderId = orderData.id || `JM-BD-${Date.now().toString().slice(-4)}${timestampSuffix}`;
    const paymentId = `PAY-${Date.now().toString().slice(-4)}${timestampSuffix}`;

    // Security check: Calculate items subtotal directly
    const calculatedSubtotal = orderData.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Security check: Calculate delivery charge strictly from selected district
    const validatedDeliveryCharge = calculateDeliveryCharge(
      orderData.district,
      settings?.delivery_charge,
      settings?.delivery_charge_outside
    );

    const discountAmount = Math.max(0, orderData.coupon_discount || 0);

    // Formula: Total = Subtotal - Discount + Delivery Charge
    const calculatedTotal = Math.max(0, calculatedSubtotal - discountAmount) + validatedDeliveryCharge;

    const newOrder: Order = {
      ...orderData,
      id: newOrderId,
      subtotal: calculatedSubtotal,
      coupon_code: orderData.coupon_code || undefined,
      coupon_discount: discountAmount > 0 ? discountAmount : undefined,
      delivery_charge: validatedDeliveryCharge,
      total: calculatedTotal,
      payment_method: 'cash_on_delivery',
      payment_status: 'Pending',
      order_status: 'Pending',
      delivery_payment_method: orderData.delivery_payment_method || 'bKash',
      delivery_transaction_id: cleanTrxId,
      delivery_payment_status: 'Pending',
      delivery_payment_id: paymentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newPayment: DeliveryPayment = {
      id: paymentId,
      order_id: newOrderId,
      customer_name: orderData.customer_name,
      customer_phone: orderData.customer_phone,
      amount: validatedDeliveryCharge,
      payment_method: orderData.delivery_payment_method || 'bKash',
      transaction_id: cleanTrxId,
      status: 'Pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Deduct stock from products
    setProducts((prev) =>
      prev.map((prod) => {
        const orderedItem = orderData.items.find((i) => i.product_id === prod.id);
        if (orderedItem) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - orderedItem.quantity),
          };
        }
        return prod;
      })
    );

    // Increment coupon usage count if coupon was used
    if (orderData.coupon_code) {
      const codeUpper = orderData.coupon_code.trim().toUpperCase();
      setCoupons((prev) =>
        prev.map((c) => {
          if (c.code.toUpperCase() === codeUpper) {
            const updated = { ...c, usage_count: (c.usage_count || 0) + 1 };
            if (isSupabaseConfigured && supabase) {
              Promise.resolve(supabase.from('coupons').update({ usage_count: updated.usage_count }).eq('id', c.id))
                .catch((e: any) => console.warn('Coupon usage update note:', e));
            }
            return updated;
          }
          return c;
        })
      );
    }

    // Save order and payment record locally
    setOrders((prev) => [newOrder, ...prev]);
    setDeliveryPayments((prev) => [newPayment, ...prev]);

    // Save to Supabase if available
    if (isSupabaseConfigured && supabase) {
      try {
        await Promise.all([
          supabase.from('orders').insert([newOrder]),
          supabase.from('delivery_payments').insert([newPayment]),
        ]);
      } catch (err) {
        console.warn('Could not sync order/payment to Supabase:', err);
      }
    }

    setAppliedCoupon(null);
    clearCart();
    return newOrder;
  };

  // Admin approves delivery charge payment
  const approveDeliveryPayment = async (paymentId: string): Promise<{ success: boolean; message: string }> => {
    const payment = deliveryPayments.find((p) => p.id === paymentId);
    if (!payment) {
      return { success: false, message: 'Payment record not found.' };
    }

    const updatedPayment: DeliveryPayment = {
      ...payment,
      status: 'Approved',
      updated_at: new Date().toISOString(),
    };

    setDeliveryPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? updatedPayment : p))
    );

    // Update linked order: order_status -> Confirmed, payment_status -> Delivery Charge Paid
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === payment.order_id || ord.delivery_payment_id === paymentId) {
          return {
            ...ord,
            order_status: 'Confirmed',
            payment_status: 'Delivery Charge Paid',
            delivery_payment_status: 'Approved',
            updated_at: new Date().toISOString(),
          };
        }
        return ord;
      })
    );

    if (isSupabaseConfigured && supabase) {
      try {
        await Promise.all([
          supabase
            .from('delivery_payments')
            .update({ status: 'Approved', updated_at: new Date().toISOString() })
            .eq('id', paymentId),
          supabase
            .from('orders')
            .update({
              order_status: 'Confirmed',
              payment_status: 'Delivery Charge Paid',
              delivery_payment_status: 'Approved',
              updated_at: new Date().toISOString(),
            })
            .eq('id', payment.order_id),
        ]);
      } catch (err) {
        console.warn('Could not sync payment approval to Supabase:', err);
      }
    }

    return { success: true, message: 'Payment verified & approved! Order is now Confirmed.' };
  };

  // Admin rejects delivery charge payment
  const rejectDeliveryPayment = async (paymentId: string, reason?: string): Promise<{ success: boolean; message: string }> => {
    const payment = deliveryPayments.find((p) => p.id === paymentId);
    if (!payment) {
      return { success: false, message: 'Payment record not found.' };
    }

    const updatedPayment: DeliveryPayment = {
      ...payment,
      status: 'Rejected',
      admin_notes: reason || 'Transaction ID not verified',
      updated_at: new Date().toISOString(),
    };

    setDeliveryPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? updatedPayment : p))
    );

    // Update linked order: order_status -> Cancelled, payment_status -> Failed
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === payment.order_id || ord.delivery_payment_id === paymentId) {
          return {
            ...ord,
            order_status: 'Cancelled',
            payment_status: 'Failed',
            delivery_payment_status: 'Rejected',
            updated_at: new Date().toISOString(),
          };
        }
        return ord;
      })
    );

    if (isSupabaseConfigured && supabase) {
      try {
        await Promise.all([
          supabase
            .from('delivery_payments')
            .update({
              status: 'Rejected',
              admin_notes: reason || 'Transaction ID not verified',
              updated_at: new Date().toISOString(),
            })
            .eq('id', paymentId),
          supabase
            .from('orders')
            .update({
              order_status: 'Cancelled',
              payment_status: 'Failed',
              delivery_payment_status: 'Rejected',
              updated_at: new Date().toISOString(),
            })
            .eq('id', payment.order_id),
        ]);
      } catch (err) {
        console.warn('Could not sync payment rejection to Supabase:', err);
      }
    }

    return { success: true, message: 'Payment rejected. Order has been marked as Cancelled.' };
  };

  // Delete delivery payment record
  const deleteDeliveryPayment = async (paymentId: string): Promise<void> => {
    setDeliveryPayments((prev) => prev.filter((p) => p.id !== paymentId));
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('delivery_payments').delete().eq('id', paymentId);
      } catch (err) {
        console.warn('Could not delete payment from Supabase:', err);
      }
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, order_status: status, updated_at: new Date().toISOString() }
          : order
      )
    );

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('orders')
          .update({ order_status: status, updated_at: new Date().toISOString() })
          .eq('id', orderId);
      } catch (err) {
        console.warn('Could not sync status update to Supabase:', err);
      }
    }
  };

  // Update payment status
  const updatePaymentStatus = async (orderId: string, status: PaymentStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, payment_status: status, updated_at: new Date().toISOString() }
          : order
      )
    );

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('orders')
          .update({ payment_status: status, updated_at: new Date().toISOString() })
          .eq('id', orderId);
      } catch (err) {
        console.warn('Could not sync payment status to Supabase:', err);
      }
    }
  };

  // Delete single order
  const deleteOrder = async (orderId: string): Promise<void> => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    setDeliveryPayments((prev) => prev.filter((p) => p.order_id !== orderId));

    if (isSupabaseConfigured && supabase) {
      try {
        await Promise.all([
          supabase.from('orders').delete().eq('id', orderId),
          supabase.from('delivery_payments').delete().eq('order_id', orderId),
        ]);
      } catch (err) {
        console.warn('Could not delete order in Supabase:', err);
      }
    }
  };

  // Clear all orders and delivery payments
  const clearAllOrders = async (): Promise<{ success: boolean; message: string }> => {
    setOrders([]);
    setDeliveryPayments([]);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.DELIVERY_PAYMENTS);

    if (isSupabaseConfigured && supabase) {
      try {
        await Promise.all([
          supabase.from('orders').delete().neq('id', 'placeholder-none'),
          supabase.from('delivery_payments').delete().neq('id', 'placeholder-none'),
        ]);
      } catch (err) {
        console.warn('Could not clear orders from Supabase:', err);
      }
    }

    return { success: true, message: 'সকল অর্ডার এবং পেমেন্ট হিস্ট্রি সফলভাবে ক্লিয়ার ও রিফ্রেশ করা হয়েছে।' };
  };

  // Clear only Pending orders
  const clearPendingOrders = async (): Promise<{ success: boolean; message: string }> => {
    const pendingOrderIds = orders.filter((o) => o.order_status === 'Pending').map((o) => o.id);
    
    setOrders((prev) => prev.filter((o) => o.order_status !== 'Pending'));
    setDeliveryPayments((prev) => prev.filter((p) => !pendingOrderIds.includes(p.order_id)));

    if (isSupabaseConfigured && supabase && pendingOrderIds.length > 0) {
      try {
        await Promise.all([
          supabase.from('orders').delete().eq('order_status', 'Pending'),
          supabase.from('delivery_payments').delete().eq('status', 'Pending'),
        ]);
      } catch (err) {
        console.warn('Could not clear pending orders from Supabase:', err);
      }
    }

    return { success: true, message: 'সকল Pending অর্ডার সফলভাবে রিমুভ ও রিফ্রেশ করা হয়েছে।' };
  };

  // Refresh all data from Supabase live
  const refreshAllData = async (): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    const client = supabase;
    if (isSupabaseConfigured && client) {
      try {
        const [prodRes, catRes, orderRes, banRes, setRes, teamRes, payRes] = await Promise.all([
          client.from('products').select('*'),
          client.from('categories').select('*').order('display_order', { ascending: true }),
          client.from('orders').select('*').order('created_at', { ascending: false }),
          client.from('banners').select('*').order('display_order', { ascending: true }),
          client.from('settings').select('*').limit(1).maybeSingle(),
          client.from('admin_profiles').select('*').order('created_at', { ascending: true }),
          client.from('delivery_payments').select('*').order('created_at', { ascending: false }),
        ]);

        if (prodRes.data) setProducts(prodRes.data);
        if (catRes.data) setCategories(catRes.data);
        if (orderRes.data) setOrders(orderRes.data);
        if (banRes.data) setBanners(banRes.data);
        if (teamRes.data) setAdminProfiles(teamRes.data);
        if (payRes.data) setDeliveryPayments(payRes.data);
        if (setRes.data) setSettings(setRes.data);

        return { success: true, message: 'ডাটাবেজ থেকে সকল ডেটা সফলভাবে রিফ্রেশ ও সিঙ্ক করা হয়েছে।' };
      } catch (err: any) {
        return { success: false, message: err?.message || 'রিফ্রেশ করতে সমস্যা হয়েছে।' };
      } finally {
        setIsLoading(false);
      }
    } else {
      // Local reload
      try {
        const savedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
        if (savedOrders) setOrders(JSON.parse(savedOrders));
        const savedPay = localStorage.getItem(STORAGE_KEYS.DELIVERY_PAYMENTS);
        if (savedPay) setDeliveryPayments(JSON.parse(savedPay));
      } catch (e) {
        console.error(e);
      }
      setIsLoading(false);
      return { success: true, message: 'লোকাল স্টোরেজ থেকে ডেটা রিফ্রেশ করা হয়েছে।' };
    }
  };

  // Add Product
  const addProduct = async (productData: Omit<Product, 'id' | 'created_at'>): Promise<Product> => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setProducts((prev) => [newProduct, ...prev]);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error: insertErr } = await supabase.from('products').insert([newProduct]);
        if (insertErr) {
          console.warn('Supabase product insert warning (saved locally):', insertErr.message);
        }
      } catch (err: any) {
        console.warn('Failed to insert product into Supabase (saved locally):', err);
      }
    }

    return newProduct;
  };

  // Update Product
  const updateProduct = async (id: string, updates: Partial<Product>): Promise<Product> => {
    let updatedProduct: Product | null = null;

    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id === id) {
          updatedProduct = {
            ...prod,
            ...updates,
            updated_at: new Date().toISOString(),
          };
          return updatedProduct;
        }
        return prod;
      })
    );

    if (!updatedProduct) {
      throw new Error(`Product with ID ${id} not found`);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error: updateErr } = await supabase
          .from('products')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (updateErr) {
          console.warn('Could not update product in Supabase (updated locally):', updateErr.message);
        }
      } catch (err: any) {
        console.warn('Could not update product in Supabase (updated locally):', err);
      }
    }

    return updatedProduct;
  };

  // Delete Product
  const deleteProduct = async (id: string): Promise<boolean> => {
    setProducts((prev) => prev.filter((p) => p.id !== id));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('products').delete().eq('id', id);
      } catch (err) {
        console.warn('Could not delete product in Supabase:', err);
      }
    }

    return true;
  };

  // Add Category
  const addCategory = async (categoryData: Omit<Category, 'id'>): Promise<Category> => {
    const newCategory: Category = {
      ...categoryData,
      id: `cat-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    setCategories((prev) => [...prev, newCategory]);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('categories').insert([newCategory]);
      } catch (err) {
        console.warn('Could not insert category into Supabase:', err);
      }
    }

    return newCategory;
  };

  // Update Category
  const updateCategory = async (id: string, updates: Partial<Category>): Promise<Category> => {
    let updatedCat: Category | null = null;

    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id === id) {
          updatedCat = { ...cat, ...updates };
          return updatedCat;
        }
        return cat;
      })
    );

    if (!updatedCat) {
      throw new Error(`Category with ID ${id} not found`);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('categories').update(updates).eq('id', id);
      } catch (err) {
        console.warn('Could not update category in Supabase:', err);
      }
    }

    return updatedCat;
  };

  // Delete Category with safe product reassignment
  const deleteCategory = async (
    id: string,
    reassignToCategoryId?: string
  ): Promise<{ success: boolean; movedProductsCount: number }> => {
    let movedCount = 0;

    // Move any products in this category to another category if provided
    setProducts((prev) =>
      prev.map((p) => {
        let updated = { ...p };
        let changed = false;

        if (p.category_id === id) {
          if (reassignToCategoryId) {
            updated.category_id = reassignToCategoryId;
            movedCount++;
            changed = true;
          }
        }

        if (p.subcategory_id === id) {
          updated.subcategory_id = null;
          changed = true;
        }

        return changed ? { ...updated, updated_at: new Date().toISOString() } : p;
      })
    );

    if (reassignToCategoryId && isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('products')
          .update({ category_id: reassignToCategoryId })
          .eq('category_id', id);
      } catch (err) {
        console.warn('Could not reassign products in Supabase:', err);
      }
    }

    // Detach or reassign child subcategories whose parent was this category
    setCategories((prev) =>
      prev
        .filter((c) => c.id !== id)
        .map((c) => {
          if (c.parent_id === id) {
            return {
              ...c,
              parent_id: reassignToCategoryId || null,
            };
          }
          return c;
        })
    );

    if (isSupabaseConfigured && supabase) {
      try {
        // Update any subcategories in Supabase
        await supabase
          .from('categories')
          .update({ parent_id: reassignToCategoryId || null })
          .eq('parent_id', id);

        await supabase.from('categories').delete().eq('id', id);
      } catch (err) {
        console.warn('Could not delete category in Supabase:', err);
      }
    }

    return { success: true, movedProductsCount: movedCount };
  };

  // Add Banner
  const addBanner = async (bannerData: Omit<Banner, 'id'>): Promise<Banner> => {
    const newBanner: Banner = {
      ...bannerData,
      id: `ban-${Date.now()}`,
    };

    setBanners((prev) => [...prev, newBanner]);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('banners').insert([newBanner]);
      } catch (err) {
        console.warn('Could not insert banner into Supabase:', err);
      }
    }

    return newBanner;
  };

  // Update Banner
  const updateBanner = async (id: string, updates: Partial<Banner>): Promise<Banner> => {
    let updatedBan: Banner | null = null;

    setBanners((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          updatedBan = { ...b, ...updates };
          return updatedBan;
        }
        return b;
      })
    );

    if (!updatedBan) {
      throw new Error(`Banner with ID ${id} not found`);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('banners').update(updates).eq('id', id);
      } catch (err) {
        console.warn('Could not update banner in Supabase:', err);
      }
    }

    return updatedBan;
  };

  // Delete Banner
  const deleteBanner = async (id: string): Promise<void> => {
    setBanners((prev) => prev.filter((b) => b.id !== id));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('banners').delete().eq('id', id);
      } catch (err) {
        console.warn('Could not delete banner in Supabase:', err);
      }
    }
  };

  // Settings
  const updateSettings = async (updates: Partial<StoreSettings>): Promise<void> => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      return next;
    });

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('settings').upsert({ id: 1, ...updates });
      } catch (err) {
        console.warn('Could not update settings in Supabase:', err);
      }
    }
  };

  // Upload image: uses Supabase Storage if configured, or converts to responsive base64
  const uploadImage = async (file: File): Promise<string> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('fugo-assets')
          .upload(filePath, file);

        if (!uploadError) {
          const { data } = supabase.storage.from('fugo-assets').getPublicUrl(filePath);
          if (data?.publicUrl) {
            return data.publicUrl;
          }
        }
      } catch (err) {
        console.warn('Supabase storage upload failed, falling back to data URL:', err);
      }
    }

    // High quality, lightweight compressed data URL fallback (reduces 5MB+ photos to ~40KB-70KB)
    return await compressImageFile(file, 900, 0.75);
  };

  // Admin Auth - Strictly restricted to authorized username: junaid&jakariya and password: jakaria.jaku4825
  const loginAdmin = async (
    usernameInput: string,
    passwordInput: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    const sanitizedUsername = (usernameInput || '').trim().toLowerCase();

    if (!sanitizedUsername) {
      setIsLoading(false);
      return { success: false, error: 'Please enter your admin username.' };
    }

    if (!passwordInput) {
      setIsLoading(false);
      return { success: false, error: 'Please enter your admin password.' };
    }

    // Strict Credentials Check:
    // Only username "junaid&jakariya" and password "jakaria.jaku4825" are allowed.
    // Old email and previous passwords will strictly fail.
    if (
      sanitizedUsername === AUTHORIZED_ADMIN_USERNAME.toLowerCase() &&
      passwordInput === 'jakaria.jaku4825'
    ) {
      const user: AdminUser = {
        id: 'jakariya-admin-session',
        username: AUTHORIZED_ADMIN_USERNAME,
        email: AUTHORIZED_ADMIN_EMAIL,
        role: 'admin',
      };
      setAdminUser(user);
      setIsLoading(false);
      return { success: true };
    }

    setIsLoading(false);
    return {
      success: false,
      error: 'Invalid username or password. Access denied.',
    };
  };

  // Password reset request using Supabase Auth
  const sendPasswordReset = async (
    emailToReset?: string
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    const client = supabase;
    if (!client) return { success: false, error: 'Supabase client not initialized.' };

    const targetEmail = (emailToReset || AUTHORIZED_ADMIN_EMAIL).trim().toLowerCase();
    if (targetEmail !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
      return {
        success: false,
        error: `Password reset is only available for the authorized admin (${AUTHORIZED_ADMIN_EMAIL}).`,
      };
    }

    try {
      const { error: resetErr } = await client.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: `${window.location.origin}/admin/login`,
      });
      if (resetErr) {
        return { success: false, error: resetErr.message };
      }
      return {
        success: true,
        message: `Password reset email dispatched to ${targetEmail}. Please check your inbox.`,
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to dispatch reset email.' };
    }
  };

  // Emergency / Initial Admin Reset (User provided password reset)
  const resetAdminPassword = async (
    password: string
  ): Promise<{ success: boolean; message: string; error?: string }> => {
    const client = supabase;
    if (!client) return { success: false, message: 'Supabase client not initialized.', error: 'Supabase missing' };

    try {
      // 1. Try to initialize (SignUp) in case the user doesn't exist yet in the new project
      const { data: signUpData, error: signUpError } = await client.auth.signUp({
        email: AUTHORIZED_ADMIN_EMAIL,
        password: password,
      });

      if (!signUpError && signUpData.user && signUpData.session) {
        setAdminUser({
          id: signUpData.user.id,
          email: AUTHORIZED_ADMIN_EMAIL,
          role: 'admin',
        });
        return {
          success: true,
          message: `Admin account (${AUTHORIZED_ADMIN_EMAIL}) successfully initialized and logged in with the provided password.`,
        };
      }

      // 2. If user exists, but we are not logged in, we cannot reset without email for security.
      // However, if we are ALREADY logged in as the admin, we can update the password.
      const { data: sessionData } = await client.auth.getSession();
      if (sessionData.session?.user?.email?.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
        const { error: updateError } = await client.auth.updateUser({ password });
        if (!updateError) {
          return { success: true, message: 'Admin password updated successfully to your provided password.' };
        }
        return { success: false, message: 'Update failed.', error: updateError.message };
      }

      return {
        success: false,
        message: 'Admin account already exists. Please use the "Forgot Password?" option on the login page to receive a secure reset link via email.',
        error: signUpError?.message || 'User already exists',
      };
    } catch (err: any) {
      return { success: false, message: 'Operation failed.', error: err.message };
    }
  };

  const addAdminProfile = async (profileData: Omit<AdminProfile, 'id'>): Promise<AdminProfile> => {
    const client = supabase;
    const newProfile: AdminProfile = {
      id: crypto.randomUUID(),
      ...profileData,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && client) {
      const { data, error: pgErr } = await client.from('admin_profiles').insert(newProfile).select().single();
      if (pgErr) throw pgErr;
      if (data) {
        setAdminProfiles((prev) => [...prev, data]);
        return data;
      }
    }

    setAdminProfiles((prev) => [...prev, newProfile]);
    return newProfile;
  };

  const deleteAdminProfile = async (id: string): Promise<void> => {
    const client = supabase;
    if (isSupabaseConfigured && client) {
      const { error: pgErr } = await client.from('admin_profiles').delete().eq('id', id);
      if (pgErr) throw pgErr;
    }
    setAdminProfiles((prev) => prev.filter((p) => p.id !== id));
  };

  const logoutAdmin = async () => {
    const client = supabase;
    if (client) {
      await client.auth.signOut().catch(() => {});
    }
    setAdminUser(null);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
  };

  const resetToDemoData = () => {
    setProducts(INITIAL_PRODUCTS);
    setCategories(INITIAL_CATEGORIES);
    setOrders(INITIAL_ORDERS);
    setBanners(INITIAL_BANNERS);
    setSettings(INITIAL_SETTINGS);
    setCoupons(INITIAL_COUPONS);
    setAppliedCoupon(null);
    setCart([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
      localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
      localStorage.removeItem(STORAGE_KEYS.ORDERS);
      localStorage.removeItem(STORAGE_KEYS.BANNERS);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.COUPONS);
    } catch {}
    idbStorage.removeItem(STORAGE_KEYS.PRODUCTS).catch(() => {});
    idbStorage.removeItem(STORAGE_KEYS.CATEGORIES).catch(() => {});
    idbStorage.removeItem(STORAGE_KEYS.ORDERS).catch(() => {});
    idbStorage.removeItem(STORAGE_KEYS.BANNERS).catch(() => {});
    idbStorage.removeItem(STORAGE_KEYS.SETTINGS).catch(() => {});
    idbStorage.removeItem(STORAGE_KEYS.COUPONS).catch(() => {});
  };

  const syncAllToSupabase = async (): Promise<{ success: boolean; message: string }> => {
    const client = supabase;
    if (!client) {
      return { success: false, message: 'Supabase client is not initialized.' };
    }

    try {
      const syncedItems: string[] = [];
      const warnings: string[] = [];

      // 1. Categories
      if (categories.length > 0) {
        try {
          const { error: catErr } = await client.from('categories').upsert(categories);
          if (catErr) {
            console.warn('Category sync warning:', catErr.message);
            warnings.push(`Categories: ${catErr.message}`);
          } else {
            syncedItems.push(`${categories.length} Categories`);
          }
        } catch (e: any) {
          warnings.push(`Categories: ${e.message}`);
        }
      }

      // 2. Products
      if (products.length > 0) {
        try {
          const { error: prodErr } = await client.from('products').upsert(products);
          if (prodErr) {
            console.error('Products sync error:', prodErr.message);
            warnings.push(`Products: ${prodErr.message}`);
          } else {
            syncedItems.push(`${products.length} Products`);
          }
        } catch (e: any) {
          warnings.push(`Products: ${e.message}`);
        }
      }

      // 3. Banners
      if (banners.length > 0) {
        try {
          const { error: banErr } = await client.from('banners').upsert(banners);
          if (!banErr) {
            syncedItems.push(`${banners.length} Banners`);
          }
        } catch (e) {
          // ignore banner table issues
        }
      }

      // 4. Coupons
      if (coupons.length > 0) {
        try {
          const { error: cpnErr } = await client.from('coupons').upsert(coupons);
          if (!cpnErr) {
            syncedItems.push(`${coupons.length} Coupons`);
          } else {
            console.warn('Coupons table sync note:', cpnErr.message);
            // Non-fatal if user has not yet created coupons table in Supabase
          }
        } catch (e) {
          // ignore
        }
      }

      // 5. Settings
      try {
        const { error: setErr } = await client.from('settings').upsert({ id: 1, ...settings });
        if (!setErr) syncedItems.push('Settings');
      } catch (e) {
        // ignore
      }

      if (syncedItems.length === 0 && warnings.length > 0) {
        return {
          success: false,
          message: `সিঙ্ক ব্যর্থ হয়েছে: ${warnings.join(' | ')}`,
        };
      }

      return {
        success: true,
        message: `সফলভাবে ক্যাটালগ ও পণ্যসমূহ ডাটাবেজে সিঙ্ক হয়েছে! (${syncedItems.join(', ')})`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Sync failed. Please check your Supabase connection.',
      };
    }
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        orders,
        banners,
        settings,
        cart,
        customers,
        deliveryPayments,
        coupons,
        appliedCoupon,
        adminUser,
        adminProfiles,
        addAdminProfile,
        deleteAdminProfile,
        isLoading,
        authInitialized,
        error,

        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartCount,
        cartTotal,

        addCoupon,
        updateCoupon,
        deleteCoupon,
        toggleCouponStatus,
        applyCouponCode,
        removeAppliedCoupon,
        calculateDiscountForCoupon,

        placeOrder,
        updateOrderStatus,
        updatePaymentStatus,
        deleteOrder,
        clearAllOrders,
        clearPendingOrders,
        refreshAllData,

        approveDeliveryPayment,
        rejectDeliveryPayment,
        deleteDeliveryPayment,
        checkTrxIdExists,

        addProduct,
        updateProduct,
        deleteProduct,

        addCategory,
        updateCategory,
        deleteCategory,

        addBanner,
        updateBanner,
        deleteBanner,

        updateSettings,
        uploadImage,

        loginAdmin,
        logoutAdmin,
        resetAdminPassword,
        resetToDemoData,
        syncAllToSupabase,
        sendPasswordReset,
        buyNowItems,
        setBuyNowItems,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
