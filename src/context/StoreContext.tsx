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
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_BANNERS,
  INITIAL_SETTINGS,
  INITIAL_ORDERS,
  INITIAL_DELIVERY_PAYMENTS,
} from '../data/initialData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { calculateDeliveryCharge } from '../utils/bangladesh';

interface StoreContextType {
  products: Product[];
  categories: Category[];
  orders: Order[];
  banners: Banner[];
  settings: StoreSettings;
  cart: CartItem[];
  customers: Customer[];
  deliveryPayments: DeliveryPayment[];
  
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
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
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

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error('Failed to save products to localStorage', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error('Failed to save categories to localStorage', e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to save orders to localStorage', e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BANNERS, JSON.stringify(banners));
    } catch (e) {
      console.error('Failed to save banners to localStorage', e);
    }
  }, [banners]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ADMIN_PROFILES, JSON.stringify(adminProfiles));
    } catch (e) {
      console.error('Failed to save admin profiles', e);
    }
  }, [adminProfiles]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DELIVERY_PAYMENTS, JSON.stringify(deliveryPayments));
    } catch (e) {
      console.error('Failed to save delivery payments', e);
    }
  }, [deliveryPayments]);

  useEffect(() => {
    try {
      if (adminUser) {
        localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(adminUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
      }
    } catch (e) {
      console.error('Failed to save admin session', e);
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
        const [prodRes, catRes, orderRes, banRes, setRes, teamRes, payRes] = await Promise.all([
          client.from('products').select('*'),
          client.from('categories').select('*').order('display_order', { ascending: true }),
          client.from('orders').select('*').order('created_at', { ascending: false }),
          client.from('banners').select('*').order('display_order', { ascending: true }),
          client.from('settings').select('*').limit(1).maybeSingle(),
          client.from('admin_profiles').select('*').order('created_at', { ascending: true }),
          client.from('delivery_payments').select('*').order('created_at', { ascending: false }),
        ]);

        if (prodRes.data && prodRes.data.length > 0) setProducts(prodRes.data);
        if (catRes.data && catRes.data.length > 0) setCategories(catRes.data);
        if (orderRes.data && orderRes.data.length > 0) setOrders(orderRes.data);
        if (banRes.data && banRes.data.length > 0) setBanners(banRes.data);
        if (teamRes.data && teamRes.data.length > 0) setAdminProfiles(teamRes.data);
        if (payRes.data && payRes.data.length > 0) setDeliveryPayments(payRes.data);
        if (setRes.data) setSettings(setRes.data);

        // Check active session strictly against AUTHORIZED_ADMIN_EMAIL
        const { data: authData } = await client.auth.getSession();
        if (authData.session?.user) {
          const userEmail = authData.session.user.email?.toLowerCase();
          if (userEmail === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
            setAdminUser({
              id: authData.session.user.id,
              email: AUTHORIZED_ADMIN_EMAIL,
              role: 'admin',
            });
          } else {
            // Unauthorized user logged in, revoke session immediately
            await client.auth.signOut();
            setAdminUser(null);
          }
        } else {
          setAdminUser(null);
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
        if (userEmail === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
          setAdminUser({
            id: session.user.id,
            email: AUTHORIZED_ADMIN_EMAIL,
            role: 'admin',
          });
        } else {
          await client.auth.signOut();
          setAdminUser(null);
        }
      } else {
        setAdminUser(null);
      }
      setAuthInitialized(true);
    });

    // Supabase Realtime channel for orders
    try {
      const ordersChannel = client
        .channel('realtime_orders')
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
        .subscribe();

      return () => {
        authListener?.subscription?.unsubscribe();
        client.removeChannel(ordersChannel);
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
    }[];
    subtotal: number;
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
    // Dynamically uses settings configured by Admin (Inside Dhaka = ৳80, Outside Dhaka = ৳120 by default)
    const validatedDeliveryCharge = calculateDeliveryCharge(
      orderData.district,
      settings?.delivery_charge,
      settings?.delivery_charge_outside
    );

    // Formula: Total = Subtotal + Delivery Charge
    const calculatedTotal = calculatedSubtotal + validatedDeliveryCharge;

    const newOrder: Order = {
      ...orderData,
      id: newOrderId,
      subtotal: calculatedSubtotal,
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
        if (insertErr) throw insertErr;
      } catch (err: any) {
        console.error('Failed to insert product into Supabase:', err);
        throw new Error(err?.message || 'Failed to save product to database. Ensure schema is updated.');
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
        if (updateErr) throw updateErr;
      } catch (err: any) {
        console.error('Could not update product in Supabase:', err);
        throw new Error(err?.message || 'Failed to update product in database.');
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
    if (reassignToCategoryId) {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.category_id === id) {
            movedCount++;
            return { ...p, category_id: reassignToCategoryId, updated_at: new Date().toISOString() };
          }
          return p;
        })
      );

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase
            .from('products')
            .update({ category_id: reassignToCategoryId })
            .eq('category_id', id);
        } catch (err) {
          console.warn('Could not reassign products in Supabase:', err);
        }
      }
    }

    // Delete category
    setCategories((prev) => prev.filter((c) => c.id !== id));

    if (isSupabaseConfigured && supabase) {
      try {
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

    // High quality data URL fallback
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
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
    setCart([]);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.BANNERS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  };

  const syncAllToSupabase = async (): Promise<{ success: boolean; message: string }> => {
    const client = supabase;
    if (!client) {
      return { success: false, message: 'Supabase client is not initialized.' };
    }

    try {
      if (categories.length > 0) {
        const { error: catErr } = await client.from('categories').upsert(categories);
        if (catErr) throw catErr;
      }
      if (products.length > 0) {
        const { error: prodErr } = await client.from('products').upsert(products);
        if (prodErr) throw prodErr;
      }
      if (banners.length > 0) {
        const { error: banErr } = await client.from('banners').upsert(banners);
        if (banErr) throw banErr;
      }
      const { error: setErr } = await client.from('settings').upsert({ id: 1, ...settings });
      if (setErr) throw setErr;

      return {
        success: true,
        message: 'Successfully exported and synced all items into Supabase tables!',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Sync failed. Ensure tables are created in Supabase SQL editor.',
      };
    }
  };

  // Increment views on mount removed as requested

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
