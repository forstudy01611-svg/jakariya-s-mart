import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Phone,
  MapPin,
  ShoppingBag,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Copy,
  Check,
  RefreshCw,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Truck,
  X,
  Download,
  Eye,
  FileText,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Order, DeliveryPaymentMethod } from '../../types';
import {
  formatBDT,
  isValidBdPhone,
  calculateDeliveryCharge,
  isDhakaDistrict,
} from '../../utils/bangladesh';
import { StoreNavbar } from './StoreNavbar';
import { StoreFooter } from './StoreFooter';
import { InvoiceDocument } from '../common/InvoiceDocument';

const ALL_BD_DISTRICTS = [
  'Dhaka',
  'Gazipur',
  'Narayanganj',
  'Chattogram',
  'Sylhet',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Rangpur',
  'Mymensingh',
  'Cox\'s Bazar',
  'Cumilla',
  'Bogura',
  'Jashore',
  'Tangail',
  'Kishoreganj',
  'Manikganj',
  'Munshiganj',
  'Narsingdi',
  'Faridpur',
  'Feni',
  'Noakhali',
  'Brahmanbaria',
  'Chandpur',
  'Pabna',
  'Sirajganj',
  'Naogaon',
  'Natore',
  'Kushtia',
  'Satkhira',
  'Patuakhali',
  'Bhola',
  'Moulvibazar',
  'Habiganj',
  'Dinajpur',
  'Jamalpur',
];

interface CheckoutViewProps {
  onNavigate: (path: string) => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({ onNavigate }) => {
  const { cart, cartTotal, settings, placeOrder, checkTrxIdExists, buyNowItems, setBuyNowItems } = useStore();

  // Customer Form State (5 fields: 4 required, 1 optional)
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('Dhaka');
  const [fullAddress, setFullAddress] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  // Input Refs for focusing without abrupt scroll jumping
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const districtSelectRef = useRef<HTMLSelectElement | null>(null);
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const trxInputRef = useRef<HTMLInputElement | null>(null);

  // Manual Delivery Charge Payment State
  const [deliveryPaymentMethod, setDeliveryPaymentMethod] = useState<DeliveryPaymentMethod>('bKash');
  const [transactionId, setTransactionId] = useState('');
  const [copiedNumber, setCopiedNumber] = useState<'bkash' | 'nagad' | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  
  // Popup Error Modal State (pops up anywhere on screen, preventing unwanted jumps to the top)
  const [popupError, setPopupError] = useState<{
    title: string;
    message: string;
    field?: 'name' | 'phone' | 'district' | 'address' | 'trxId' | 'items' | 'general';
  } | null>(null);

  const triggerPopupError = (
    title: string,
    message: string,
    field?: 'name' | 'phone' | 'district' | 'address' | 'trxId' | 'items' | 'general'
  ) => {
    setPopupError({ title, message, field });
  };

  const handleClosePopup = () => {
    const targetField = popupError?.field;
    setPopupError(null);

    // Gently bring the target input into view without page jump
    setTimeout(() => {
      if (targetField === 'name' && nameInputRef.current) {
        nameInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nameInputRef.current.focus({ preventScroll: true });
      } else if (targetField === 'phone' && phoneInputRef.current) {
        phoneInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        phoneInputRef.current.focus({ preventScroll: true });
      } else if (targetField === 'district' && districtSelectRef.current) {
        districtSelectRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        districtSelectRef.current.focus({ preventScroll: true });
      } else if (targetField === 'address' && addressInputRef.current) {
        addressInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        addressInputRef.current.focus({ preventScroll: true });
      } else if (targetField === 'trxId' && trxInputRef.current) {
        trxInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        trxInputRef.current.focus({ preventScroll: true });
      }
    }, 100);
  };

  // Close popup modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && popupError) {
        handleClosePopup();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [popupError]);

  // Compute Subtotal & Items based on whether it's a Buy Now or Cart Checkout
  const activeItems = buyNowItems
    ? buyNowItems.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        subtotal: (item.product.discount_price ?? item.product.price) * item.quantity,
        selected_variants: item.selected_variants,
      }))
    : cart.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        subtotal: (item.product.discount_price ?? item.product.price) * item.quantity,
        selected_variants: item.selected_variants,
      }));

  const activeSubtotal = buyNowItems
    ? buyNowItems.reduce((sum, item) => sum + (item.product.discount_price ?? item.product.price) * item.quantity, 0)
    : cartTotal;

  // Delivery Charge calculation based on District
  const isDhaka = isDhakaDistrict(district);
  const deliveryFee = calculateDeliveryCharge(
    district,
    settings.delivery_charge,
    settings.delivery_charge_outside
  );
  const grandTotal = activeSubtotal + deliveryFee;

  const currentBkashNumber = settings.bkash_number || '01700-123456';
  const currentNagadNumber = settings.nagad_number || '01800-123456';

  const handleCopy = (num: string, type: 'bkash' | 'nagad') => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(type);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 0. Active Items validation
    if (activeItems.length === 0) {
      triggerPopupError(
        'কার্ট খালি (No Items in Cart)',
        'অর্ডার সম্পন্ন করতে অনুগ্রহ করে অন্তত একটি পণ্য কার্টে যোগ করুন বা Buy Now নির্বাচন করুন।',
        'items'
      );
      return;
    }

    // 1. Name validation (Required)
    if (!fullName.trim()) {
      triggerPopupError(
        'নাম প্রদান করুন (Full Name Required)',
        'অনুগ্রহ করে আপনার পুরো নাম লিখুন। নাম ছাড়া অর্ডার সম্পন্ন করা সম্ভব নয়।',
        'name'
      );
      return;
    }

    if (fullName.trim().length < 2) {
      triggerPopupError(
        'সঠিক নাম লিখুন (Invalid Name)',
        'অনুগ্রহ করে কমপক্ষে ২ অক্ষরের একটি সঠিক পূর্ণাঙ্গ নাম লিখুন।',
        'name'
      );
      return;
    }

    // 2. Phone validation (Required)
    if (!phone.trim()) {
      triggerPopupError(
        'মোবাইল নম্বর প্রদান করুন (Phone Required)',
        'ডেলিভারি যোগাযোগের জন্য আপনার ১১ ডিজিটের সচল মোবাইল নম্বর দিন।',
        'phone'
      );
      return;
    }

    if (!isValidBdPhone(phone.trim())) {
      triggerPopupError(
        'সঠিক মোবাইল নম্বর দিন (Invalid Mobile Number)',
        'অনুগ্রহ করে সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 01712345678 বা 018...)।',
        'phone'
      );
      return;
    }

    // 3. District validation (Required)
    if (!district) {
      triggerPopupError(
        'জেলা নির্বাচন করুন (District Required)',
        'ডেলিভারি চার্জ নির্ধারণের জন্য আপনার জেলা নির্বাচন করুন।',
        'district'
      );
      return;
    }

    // 4. Full Delivery Address validation (Required)
    if (!fullAddress.trim()) {
      triggerPopupError(
        'ডেলিভারি ঠিকানা দিন (Address Required)',
        'পার্সেল পৌঁছানোর জন্য আপনার সম্পূর্ণ ডেলিভারি ঠিকানা (বাসা/রোড, এলাকা, থানা) লিখুন।',
        'address'
      );
      return;
    }

    if (fullAddress.trim().length < 5) {
      triggerPopupError(
        'পূর্ণাঙ্গ ঠিকানা দিন (Incomplete Address)',
        'অনুগ্রহ করে আরও বিস্তারিত ডেলিভারি ঠিকানা প্রদান করুন (কমপক্ষে ৫ অক্ষর)।',
        'address'
      );
      return;
    }

    // Note: deliveryInstructions is OPTIONAL - intentionally skipped from blocking validation!

    // 5. Manual Delivery Charge Payment validation (Transaction ID - Required)
    const cleanTrxId = transactionId.trim().toUpperCase();
    if (!cleanTrxId) {
      triggerPopupError(
        'Transaction ID (TrxID) দিন',
        `ক্যাশ অন ডেলিভারিতে অর্ডার কনফার্ম করতে ${deliveryPaymentMethod}-এ ডেলিভারি চার্জ (${formatBDT(deliveryFee)}) পাঠানোর পর পাওয়া TrxID টি দিন।`,
        'trxId'
      );
      return;
    }

    if (cleanTrxId.length < 4) {
      triggerPopupError(
        'সঠিক TrxID দিন (Invalid TrxID)',
        'অনুগ্রহ করে একটি সঠিক ও পূর্ণাঙ্গ Transaction ID দিন (কমপক্ষে ৪ অক্ষর)।',
        'trxId'
      );
      return;
    }

    // Check duplicate TrxID
    if (checkTrxIdExists(cleanTrxId)) {
      triggerPopupError(
        'ব্যবহৃত Transaction ID (Duplicate TrxID)',
        `এই Transaction ID (${cleanTrxId}) ইতিমধ্যে অন্য একটি অর্ডারে ব্যবহার করা হয়েছে। দয়া করে সঠিক TrxID দিন।`,
        'trxId'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanedDigits = phone.replace(/[\s\-\(\)]/g, '');
      const formattedPhone = cleanedDigits.startsWith('+880')
        ? cleanedDigits
        : cleanedDigits.startsWith('880')
        ? `+${cleanedDigits}`
        : `+88${cleanedDigits.startsWith('0') ? cleanedDigits : '0' + cleanedDigits}`;

      const orderItems = activeItems.map((item) => {
        const unitPrice = item.product.discount_price ?? item.product.price;
        return {
          product_id: item.product.id,
          product_name: item.product.name,
          product_image: item.product.images[0] || '',
          quantity: item.quantity,
          price: unitPrice,
          subtotal: unitPrice * item.quantity,
          selected_variants: item.selected_variants,
        };
      });

      const timestampSuffix = Math.floor(1000 + Math.random() * 9000);
      const uniqueId = `JM-BD-${Date.now().toString().slice(-4)}${timestampSuffix}`;

      const order = await placeOrder({
        id: uniqueId,
        customer_name: fullName.trim(),
        customer_phone: formattedPhone,
        customer_address: `${fullAddress.trim()}, ${district}`,
        division: isDhaka ? 'Dhaka' : 'Other',
        district,
        upazila: 'Sadar',
        delivery_instructions: deliveryInstructions.trim() || undefined,
        customer_city: district,
        items: orderItems,
        subtotal: activeSubtotal,
        delivery_charge: deliveryFee,
        total: grandTotal,
        payment_method: 'cash_on_delivery',
        delivery_payment_method: deliveryPaymentMethod,
        delivery_transaction_id: cleanTrxId,
        notes: deliveryInstructions.trim() || undefined,
      });

      setCreatedOrder(order);
      setBuyNowItems(null);
    } catch (err: any) {
      triggerPopupError(
        'অর্ডার সম্পন্ন করা যায়নি (Submission Failed)',
        err?.message || 'অর্ডার সম্পন্ন করার সময় সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
        'general'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] text-neutral-100 flex flex-col font-sans">
      <StoreNavbar
        onNavigate={onNavigate}
        onOpenCart={() => {}}
        selectedCategory={null}
        onSelectCategory={() => {}}
        searchQuery=""
        onSearchChange={() => {}}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 space-y-6">
        {/* Back Button */}
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-white transition-colors px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800"
        >
          <ArrowLeft className="w-4 h-4 text-[#13487E]" />
          <span>Back to Store (ফিরে যান)</span>
        </button>

        {createdOrder ? (
          /* Order Confirmation Success View with Full Visible Invoice */
          <div className="space-y-6">
            {/* Success Notification Banner */}
            <div className="bg-[#0d0d12] border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-4 text-center shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#13487E] bg-[#13487E]/10 px-3 py-1 rounded-full font-bold">
                  Order Successfully Placed (#{createdOrder.id})
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white font-['Space_Grotesk'] tracking-tight">
                  ধন্যবাদ, {createdOrder.customer_name}!
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300 max-w-lg mx-auto leading-relaxed">
                  আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে। নিচে আপনার অফিসিয়াল ইনভয়েসটি দেওয়া হলো। আপনি চাইলে এটি সংরক্ষণ বা ডাউনলোড করতে পারবেন।
                </p>
              </div>

              {/* Simulated SMS Notification Notice */}
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-left space-y-1 max-w-lg mx-auto text-xs">
                <div className="flex items-center gap-2 text-emerald-300 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Confirmation SMS Notification</span>
                </div>
                <p className="text-[11px] text-neutral-300 font-mono">
                  [SMS Sent to {createdOrder.customer_phone}]: "Dear {createdOrder.customer_name}, order #{createdOrder.id} confirmed. TrxID: {createdOrder.delivery_transaction_id}. Thank you for shopping with Jakariya's Mart!"
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/')}
                  className="px-6 py-3 rounded-xl bg-[#13487E] hover:bg-[#0d3a66] text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#13487E]/25"
                >
                  Continue Shopping (কেনাকাটা চালিয়ে যান)
                </button>
              </div>
            </div>

            {/* VISIBLE OFFICIAL CUSTOMER INVOICE DOCUMENT */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#13487E]" />
                  <span>Customer Order Invoice (গ্রাহক ইনভয়েস রশিদ)</span>
                </h2>
                <span className="text-[10px] text-neutral-500 font-mono">Invoice Auto-Generated</span>
              </div>

              {/* Render Invoice Directly On Screen */}
              <InvoiceDocument 
                order={createdOrder} 
                settings={settings} 
                showActions={true} 
              />
            </div>
          </div>
        ) : (
          /* Standalone Checkout Page Content */
          <div className="bg-[#0d0d12] border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#13487E]">
                  {buyNowItems ? 'Direct Buy Now Checkout' : 'Express Checkout'}
                </span>
                <span className="text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-300 px-2 py-0.5 rounded font-mono font-bold">
                  Cash on Delivery (COD)
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-['Space_Grotesk'] mt-1">
                Jakariya's Mart Checkout
              </h1>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {/* Order Summary Box */}
              <div className="p-4 sm:p-5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-[#13487E]" />
                    <span>Order Summary (অর্ডার সারসংক্ষেপ)</span>
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {activeItems.length} item(s)
                  </span>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto">
                  {activeItems.map((item, idx) => {
                    const itemPrice = item.product.discount_price ?? item.product.price;
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg bg-neutral-900 overflow-hidden flex-shrink-0 border border-neutral-800">
                          <img
                            src={item.product.images[0] || ''}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate">{item.product.name}</h4>
                          {item.selected_variants && Object.entries(item.selected_variants).length > 0 && (
                            <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                              {Object.entries(item.selected_variants).map(([k, v]) => (
                                <span key={k} className="text-[10px] text-neutral-400">
                                  {k}: <span className="text-neutral-200">{v}</span>
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="text-[10px] text-neutral-500 font-mono mt-1">
                            {item.quantity} × {formatBDT(itemPrice)}
                          </div>
                        </div>
                        <div className="text-right font-mono text-xs sm:text-sm font-bold text-white">
                          {formatBDT(itemPrice * item.quantity)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-neutral-800 space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between text-neutral-400">
                    <span>Subtotal (পণ্যের মূল্য):</span>
                    <span className="font-mono font-bold text-white">{formatBDT(activeSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <div className="flex items-center gap-1.5">
                      <span>Delivery Charge (ডেলিভারি চার্জ):</span>
                      <span className="text-[10px] font-mono font-bold bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                        {isDhaka ? 'Inside Dhaka' : 'Outside Dhaka'}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-emerald-400">{formatBDT(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-white pt-2.5 border-t border-neutral-800">
                    <span>Total Amount (সর্বমোট):</span>
                    <span className="font-mono text-xl text-[#13487E]">{formatBDT(grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* 5 Required Customer Information Fields */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-800 pb-2">
                  <User className="w-4 h-4 text-[#13487E]" />
                  <span>Customer Information (গ্রাহকের তথ্য)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 1. Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-300">
                      1. Name (আপনার নাম) <span className="text-[#13487E]">*</span>
                    </label>
                    <input
                      ref={nameInputRef}
                      type="text"
                      placeholder="e.g. Asif Mahmud"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`w-full bg-neutral-950 border rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none transition-all ${
                        popupError?.field === 'name'
                          ? 'border-red-500 ring-2 ring-red-500/20'
                          : 'border-neutral-800 focus:border-[#13487E]'
                      }`}
                    />
                  </div>

                  {/* 2. Phone Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-300">
                      2. Phone Number (মোবাইল নম্বর) <span className="text-[#13487E]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        ref={phoneInputRef}
                        type="tel"
                        placeholder="01712345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={`w-full bg-neutral-950 border rounded-xl px-4 py-3 pl-10 text-sm font-mono text-white placeholder-neutral-600 focus:outline-none transition-all ${
                          popupError?.field === 'phone'
                            ? 'border-red-500 ring-2 ring-red-500/20'
                            : 'border-neutral-800 focus:border-[#13487E]'
                        }`}
                      />
                      <Phone className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  {/* 3. District */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-300">
                      3. District (জেলা) <span className="text-[#13487E]">*</span>
                    </label>
                    <select
                      ref={districtSelectRef}
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className={`w-full bg-neutral-950 border rounded-xl px-3.5 py-3 text-xs sm:text-sm text-white focus:outline-none transition-all ${
                        popupError?.field === 'district'
                          ? 'border-red-500 ring-2 ring-red-500/20'
                          : 'border-neutral-800 focus:border-[#13487E]'
                      }`}
                    >
                      {ALL_BD_DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d} {d.toLowerCase() === 'dhaka' ? '(Inside Dhaka - ৳80)' : '(Outside Dhaka - ৳120)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 4. Full Delivery Address */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-neutral-300">
                      4. Full Delivery Address (সম্পূর্ণ ঠিকানা) <span className="text-[#13487E]">*</span>
                    </label>
                    <input
                      ref={addressInputRef}
                      type="text"
                      placeholder="House/Holding, Road, Area, Thana / Post Office"
                      value={fullAddress}
                      onChange={(e) => setFullAddress(e.target.value)}
                      className={`w-full bg-neutral-950 border rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none transition-all ${
                        popupError?.field === 'address'
                          ? 'border-red-500 ring-2 ring-red-500/20'
                          : 'border-neutral-800 focus:border-[#13487E]'
                      }`}
                    />
                  </div>

                  {/* 5. Delivery Instructions (Optional) */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-neutral-300">
                      5. Delivery Instructions (Optional - বিশেষ নির্দেশনা)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Call before delivery, deliver after 3 PM"
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#13487E]"
                    />
                  </div>
                </div>
              </div>

              {/* MANDATORY COD DELIVERY CHARGE PAYMENT NOTICE */}
              <div className="p-4 rounded-xl bg-[#13487E]/15 border border-[#13487E] space-y-1.5">
                <div className="flex items-center gap-2 text-white font-black text-xs sm:text-sm">
                  <AlertCircle className="w-4 h-4 text-[#13487E] flex-shrink-0" />
                  <span>"COD order confirm করতে আগে Delivery Charge পরিশোধ করুন।"</span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed pl-6">
                  ক্যাশ অন ডেলিভারিতে অর্ডার কনফার্ম করতে অনুগ্রহ করে নিচের bKash বা Nagad নম্বরে অগ্রিম ডেলিভারি চার্জ <strong className="text-white font-mono">{formatBDT(deliveryFee)}</strong> Send Money করুন। বাকি পণ্যের মূল্য <strong className="text-white font-mono">{formatBDT(activeSubtotal)}</strong> পার্সেল পাওয়ার পর ডেলিভারি ম্যানকে ক্যাশ পরিশোধ করবেন।
                </p>
              </div>

              {/* Payment Method & TrxID Section */}
              <div className="space-y-4 p-5 rounded-xl bg-[#0a0a0d] border border-neutral-800">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#13487E]" />
                    <span>পেমেন্ট মাধ্যম ও ট্রানজেকশন আইডি (TrxID):</span>
                  </span>
                  <span className="text-xs text-emerald-400 font-mono font-bold">
                    Charge: {formatBDT(deliveryFee)}
                  </span>
                </div>

                {/* bKash & Nagad Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* bKash Card */}
                  <div
                    onClick={() => setDeliveryPaymentMethod('bKash')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                      deliveryPaymentMethod === 'bKash'
                        ? 'bg-[#e2136e]/10 border-[#e2136e]'
                        : 'bg-neutral-950 border-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#e2136e] text-white flex items-center justify-center font-bold text-xs">
                          b
                        </div>
                        <div>
                          <span className="font-bold text-white text-xs sm:text-sm block">bKash Personal</span>
                          <span className="text-[10px] text-neutral-400">Send Money</span>
                        </div>
                      </div>
                      {deliveryPaymentMethod === 'bKash' && (
                        <span className="w-5 h-5 rounded-full bg-[#e2136e] flex items-center justify-center text-white text-xs">✓</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2">
                      <span className="font-mono font-black text-white text-xs sm:text-sm select-all">
                        {currentBkashNumber}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(currentBkashNumber, 'bkash');
                        }}
                        className="px-2.5 py-1 rounded bg-neutral-800 text-neutral-300 text-xs font-bold flex items-center gap-1.5"
                      >
                        {copiedNumber === 'bkash' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedNumber === 'bkash' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Nagad Card */}
                  <div
                    onClick={() => setDeliveryPaymentMethod('Nagad')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                      deliveryPaymentMethod === 'Nagad'
                        ? 'bg-[#f7941d]/10 border-[#f7941d]'
                        : 'bg-neutral-950 border-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#f7941d] text-white flex items-center justify-center font-bold text-xs">
                          N
                        </div>
                        <div>
                          <span className="font-bold text-white text-xs sm:text-sm block">Nagad Personal</span>
                          <span className="text-[10px] text-neutral-400">Send Money</span>
                        </div>
                      </div>
                      {deliveryPaymentMethod === 'Nagad' && (
                        <span className="w-5 h-5 rounded-full bg-[#f7941d] flex items-center justify-center text-white text-xs">✓</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2">
                      <span className="font-mono font-black text-white text-xs sm:text-sm select-all">
                        {currentNagadNumber}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(currentNagadNumber, 'nagad');
                        }}
                        className="px-2.5 py-1 rounded bg-neutral-800 text-neutral-300 text-xs font-bold flex items-center gap-1.5"
                      >
                        {copiedNumber === 'nagad' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedNumber === 'nagad' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Transaction ID Input */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-white flex items-center gap-1">
                    <span>{deliveryPaymentMethod} Transaction ID (TrxID)</span>
                    <span className="text-[#13487E]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      ref={trxInputRef}
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                      placeholder="e.g. 9K382J879L"
                      className={`w-full bg-neutral-950 border rounded-xl px-4 py-3 text-base font-mono font-bold text-amber-300 placeholder-neutral-600 focus:outline-none uppercase transition-all ${
                        popupError?.field === 'trxId'
                          ? 'border-red-500 ring-2 ring-red-500/20'
                          : 'border-neutral-700 focus:border-[#13487E]'
                      }`}
                    />
                    <ShieldCheck className="w-5 h-5 text-neutral-500 absolute right-4 top-3.5" />
                  </div>
                  <p className="text-xs text-neutral-400">
                    টাকা পাঠানোর পর প্রাপ্ত TrxID টি এখানে দিন। (কোনো পিন, ওটিপি বা সেন্ডার নম্বর লাগবে না)।
                  </p>
                </div>
              </div>

              {/* Delivery & Exchange Policy Section */}
              {settings.delivery_policy_enabled !== false && (
                <div className="p-4 sm:p-5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-neutral-800 text-xs font-bold uppercase tracking-wider text-white">
                    <RefreshCw className="w-4 h-4 text-[#13487E]" />
                    <span>Delivery & Exchange Policy</span>
                  </div>
                  <div className="text-xs text-neutral-300 leading-relaxed whitespace-pre-line font-sans">
                    {settings.delivery_policy_text || `Return Policy:
1️⃣ প্রোডাক্ট হাতে পাওয়ার সময় অবশ্যই Unboxing Video করতে হবে।
2️⃣ যদি কোনো সমস্যা থাকে, তাহলে সেই Unboxing Video সহ আমাদের জানাতে হবে।
3️⃣ ভিডিও ছাড়া কোনো ধরনের ক্লেইম গ্রহণযোগ্য হবে না।
4️⃣ সমস্যার প্রমাণ নিশ্চিত হওয়ার পর, সর্বোচ্চ ৭ দিনের মধ্যে এক্সচেঞ্জ করা হবে।

🚚 এক্সচেঞ্জ প্রসেস:
✅ আমরা ডেলিভারি ম্যানের মাধ্যমে নতুন প্রোডাক্ট পাঠিয়ে দেব।
✅ কাস্টোমারকে নষ্ট/সমস্যাযুক্ত প্রোডাক্টটি ভালোভাবে প্যাকেজিং করে ডেলিভারি ম্যানের কাছে দিতে হবে।
✅ পণ্যে কোনো সমস্যা হলে সেটি এক্সচেঞ্জ করার ক্ষেত্রে এক্সচেঞ্জ ফি ও ডেলিভারি চার্জের সম্পূর্ণ দায়িত্ব Jakariya's Mart বহন করবে।`}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-xl bg-[#13487E] hover:bg-[#0d3a66] text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#13487E]/25 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Submitting Order & TrxID...</span>
                ) : (
                  <>
                    <span>Submit Payment & Confirm COD Order</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

      {/* Missing Required Field Popup Error Modal */}
      {popupError && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={handleClosePopup}
        >
          <div
            className="relative w-full max-w-md bg-[#0f0f16] border border-amber-500/40 rounded-2xl p-6 sm:p-7 shadow-2xl text-center space-y-4 shadow-black/90"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button top-right */}
            <button
              type="button"
              onClick={handleClosePopup}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              aria-label="Close error popup"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Glowing Alert Icon */}
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/15">
              <AlertCircle className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>

            <div className="space-y-2">
              <div className="inline-block px-3 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
                প্রয়োজনীয় তথ্য অসম্পূর্ণ
              </div>
              <h3 className="text-xl font-black text-white font-['Space_Grotesk'] tracking-tight">
                {popupError.title}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">
                {popupError.message}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleClosePopup}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-600 to-[#13487E] hover:from-amber-500 hover:to-[#175697] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#13487E]/30 cursor-pointer"
                autoFocus
              >
                ঠিক আছে, পূরণ করছি
              </button>
            </div>
          </div>
        </div>
      )}
    </main>

      <StoreFooter
        onNavigate={onNavigate}
        onSelectCategory={() => {}}
      />
    </div>
  );
};
