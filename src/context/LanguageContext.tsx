import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'bn' | 'en';

interface Translations {
  [key: string]: {
    bn: string;
    en: string;
  };
}

export const TRANSLATIONS: Translations = {
  // Navigation & Search
  search_placeholder: {
    bn: 'পণ্য খুঁজুন...',
    en: 'Search products...',
  },
  all_products: {
    bn: 'সব পণ্য',
    en: 'All Products',
  },
  all_drops: {
    bn: 'সব কালেকশন',
    en: 'All Drops',
  },
  cart: {
    bn: 'কার্ট',
    en: 'Cart',
  },
  admin_portal: {
    bn: 'অ্যাডমিন পোর্টাল',
    en: 'Admin Portal',
  },

  // Catalog Filters & Sorting
  current_releases: {
    bn: 'জনপ্রিয় কালেকশন',
    en: 'Current Releases',
  },
  search_results_for: {
    bn: 'সার্চ ফলাফল:',
    en: 'Results for',
  },
  items_count: {
    bn: 'টি আইটেম',
    en: 'items',
  },
  sort_featured: {
    bn: 'সেরা কালেকশন',
    en: 'Featured Drops',
  },
  sort_newest: {
    bn: 'নতুন আগমন',
    en: 'Newest Arrivals',
  },
  sort_price_asc: {
    bn: 'দাম: কম থেকে বেশি',
    en: 'Price: Low to High',
  },
  sort_price_desc: {
    bn: 'দাম: বেশি থেকে কম',
    en: 'Price: High to Low',
  },
  no_products_found: {
    bn: 'কোনো পণ্য পাওয়া যায়নি',
    en: 'No products found',
  },
  no_products_desc: {
    bn: 'আপনার ফিল্টারের সাথে মিলে এমন কোনো পণ্য মেলেনি। অন্য ক্যাটাগরি বা সার্চ ট্রাই করুন।',
    en: "We couldn't find any products matching your filter criteria. Try clearing search or selecting another category.",
  },
  reset_filters: {
    bn: 'ফিল্টার রিসেট',
    en: 'Reset Filters',
  },

  // Product Card Badges & Actions
  save: {
    bn: 'ছাড়',
    en: 'SAVE',
  },
  hot_drop: {
    bn: 'হট অফার',
    en: 'HOT DROP',
  },
  sold_out: {
    bn: 'স্টক আউট',
    en: 'SOLD OUT',
  },
  only_left: {
    bn: 'মাত্র {n}টি বাকি',
    en: 'Only {n} left',
  },
  add: {
    bn: 'কার্ট',
    en: 'Add',
  },
  added: {
    bn: 'যোগ হয়েছে',
    en: 'Added',
  },
  buy_now: {
    bn: 'অর্ডার করুন',
    en: 'Buy Now',
  },
  click_to_zoom: {
    bn: 'বড় করে দেখুন',
    en: 'Click to expand',
  },

  // Highlights Section (Above Footer)
  highlight_quality_title: {
    bn: '১০০% আসল ও প্রিমিয়াম কোয়ালিটি',
    en: '100% Authentic & Premium Quality',
  },
  highlight_quality_desc: {
    bn: "Jakariya's Mart-এর প্রতিটি প্রোডাক্টের গুণগত মান শতভাগ নিখুঁতভাবে যাচাই করে সেরা কোয়ালিটি নিশ্চিত করা হয়।",
    en: "Every product is meticulously inspected to ensure guaranteed authenticity and peak customer satisfaction.",
  },
  highlight_delivery_title: {
    bn: 'সারা বাংলাদেশে ক্যাশ অন ডেলিভারি',
    en: 'Cash on Delivery Across Bangladesh',
  },
  highlight_delivery_desc: {
    bn: 'ঢাকা ও বাংলাদেশের সকল জেলায় দ্রুততম হোম ডেলিভারি। পার্সেল হাতে পেয়ে নিশ্চিন্তে মূল্য পরিশোধ করুন।',
    en: 'Swift and reliable doorstep dispatch across all 64 districts. Pay securely upon receiving your parcel.',
  },
  highlight_support_title: {
    bn: 'সহজ রিপ্লেসমেন্ট ও আন্তরিক সাপোর্ট',
    en: 'Easy Replacement & Dedicated Support',
  },
  highlight_support_desc: {
    bn: 'পণ্য পছন্দ না হলে বা কোনো সমস্যায় ঝামেলাহীন সহজ এক্সচেঞ্জ ও সার্বক্ষণিক কাস্টমার কেয়ার সেবা।',
    en: 'Hassle-free replacement guarantee with round-the-clock friendly customer support for any assistance.',
  },

  // Product Detail Page
  back_to_catalog: {
    bn: 'তালিকায় ফিরে যান',
    en: 'Back to Catalog',
  },
  units_ready: {
    bn: 'টি রেডি স্টক',
    en: 'Units Ready',
  },
  product_description: {
    bn: 'পণ্যের বিবরণ',
    en: 'Product Description',
  },
  select_variant: {
    bn: 'সিলেক্ট করুন',
    en: 'Select',
  },
  multiple_allowed: {
    bn: '(একাধিক সিলেক্ট করা যাবে)',
    en: '(Multiple can be selected)',
  },
  quantity: {
    bn: 'পরিমাণ',
    en: 'Quantity',
  },
  add_to_bag: {
    bn: 'কার্ট-এ যোগ করুন',
    en: 'Add to Bag',
  },
  order_now: {
    bn: 'এখনই অর্ডার করুন',
    en: 'Order Now',
  },
  cash_on_delivery_guarantee: {
    bn: 'ক্যাশ অন ডেলিভারি সুবিধা রয়েছে',
    en: 'Cash on Delivery Available',
  },
  fast_delivery_guarantee: {
    bn: 'সারা দেশে দ্রুত ডেলিভারি',
    en: 'Fast Nationwide Delivery',
  },
  easy_replacement_guarantee: {
    bn: '৭ দিনের সহজ রিপ্লেসমেন্ট',
    en: '7 Days Easy Replacement',
  },

  // Image Lightbox
  zoom_in: {
    bn: 'বড় করুন',
    en: 'Zoom In',
  },
  zoom_out: {
    bn: 'স্বাভাবিক',
    en: 'Reset Zoom',
  },
  close: {
    bn: 'বন্ধ করুন',
    en: 'Close',
  },
  view_details: {
    bn: 'বিস্তারিত দেখুন',
    en: 'View Details',
  },

  // Cart Drawer
  your_cart: {
    bn: 'আপনার কার্ট',
    en: 'Your Cart',
  },
  cart_empty: {
    bn: 'আপনার কার্ট খালি',
    en: 'Your cart is empty',
  },
  subtotal: {
    bn: 'সাবটোটাল',
    en: 'Subtotal',
  },
  delivery_charge: {
    bn: 'ডেলিভারি চার্জ',
    en: 'Delivery Charge',
  },
  total: {
    bn: 'সর্বমোট',
    en: 'Total',
  },
  proceed_to_checkout: {
    bn: 'অর্ডার সম্পন্ন করুন',
    en: 'Proceed to Checkout',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'jakariyas_mart_customer_lang_v1';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'en' || saved === 'bn') return saved;
    } catch {
      // ignore
    }
    return 'bn'; // Default to Bangla as requested for customer experience
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'bn' ? 'en' : 'bn');
  };

  const t = (key: string, replacements?: Record<string, string | number>): string => {
    const entry = TRANSLATIONS[key];
    let text = entry ? entry[language] || entry.en || key : key;
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
