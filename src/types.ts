export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded' | 'Delivery Charge Paid';

export type DeliveryPaymentStatus = 'Pending' | 'Approved' | 'Rejected';
export type DeliveryPaymentMethod = 'bKash' | 'Nagad';

export interface DeliveryPayment {
  id: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  amount: number;
  payment_method: DeliveryPaymentMethod;
  transaction_id: string;
  status: DeliveryPaymentStatus;
  admin_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url: string;
  is_active: boolean;
  display_order: number;
  created_at?: string;
}

export interface ProductVariant {
  id: string;
  name: string; // e.g., "Size: M" or "Color: Blue"
  options: string[]; // e.g., ["S", "M", "L"] or ["Red", "Blue"]
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discount_price?: number | null;
  category_id: string;
  stock: number;
  sku?: string;
  images: string[];
  is_featured: boolean;
  is_active: boolean;
  variants?: ProductVariant[];
  created_at: string;
  updated_at?: string;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address: string;
  // Bangladesh-specific administrative address structure
  division?: string;
  district?: string;
  upazila?: string;
  union_ward?: string;
  delivery_instructions?: string;
  customer_city?: string;
  items: OrderItem[];
  subtotal: number;
  delivery_charge: number;
  total: number;
  payment_method: 'Cash on Delivery' | 'cash_on_delivery';
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  delivery_payment_method?: DeliveryPaymentMethod;
  delivery_transaction_id?: string;
  delivery_payment_status?: DeliveryPaymentStatus;
  delivery_payment_id?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  button_text: string;
  button_url: string;
  is_active: boolean;
  display_order: number;
}

export interface StoreSettings {
  store_name: string;
  tagline: string;
  logo_url: string;
  phone: string;
  email: string;
  address: string;
  delivery_charge: number;
  delivery_charge_outside: number;
  currency_symbol: string;
  announcement: string;
  announcement_enabled: boolean;
  bkash_number: string;
  bkash_type: string;
  nagad_number: string;
  nagad_type: string;
  payment_instructions?: string;
  delivery_policy_enabled?: boolean;
  delivery_policy_text?: string;
  social_links: {
    facebook: string;
    instagram: string;
    tiktok: string;
    youtube: string;
  };
  site_views: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface AdminUser {
  id: string;
  email?: string;
  username?: string;
  role: 'admin';
}

export interface AdminProfile {
  id: string;
  name: string;
  role: string;
  email: string;
  created_at?: string;
}

export const AUTHORIZED_ADMIN_USERNAME = 'junaid&jakariya';
export const AUTHORIZED_ADMIN_EMAIL = 'support@jakariyasmart.com';
