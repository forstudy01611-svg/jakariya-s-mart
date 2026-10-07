import React, { useRef, useState } from 'react';
import { Download, Printer, Copy, Check, Eye, X, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import { Order, StoreSettings } from '../../types';
import { formatBDT } from '../../utils/bangladesh';

interface InvoiceDocumentProps {
  order: Order;
  settings: StoreSettings;
  showActions?: boolean;
}

export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({
  order,
  settings,
  showActions = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleCopyOrderInfo = () => {
    const text = `INVOICE: #${order.id}
Customer: ${order.customer_name} (${order.customer_phone})
Address: ${order.customer_address}
Total: ${formatBDT(order.total)}
Delivery Charge: ${formatBDT(order.delivery_charge)} (${order.delivery_payment_method || 'bKash'} - TrxID: ${order.delivery_transaction_id || 'N/A'})
COD Due: ${formatBDT(order.subtotal)}
Date: ${new Date(order.created_at).toLocaleString('en-GB')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate an authentic standalone HTML invoice file and download it directly
  const handleDownloadInvoiceFile = () => {
    const itemsHtml = order.items
      .map((item, idx) => {
        const variants = item.selected_variants
          ? Object.entries(item.selected_variants)
              .map(([k, v]) => `<span style="display:inline-block; margin-right:8px; font-size:11px; color:#666; background:#f3f4f6; padding:2px 6px; border-radius:4px;">${k}: <strong>${v}</strong></span>`)
              .join(' ')
          : '';
        return `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 8px; font-size: 13px; color: #111;">
              <div style="font-weight: bold;">${idx + 1}. ${item.product_name}</div>
              ${variants ? `<div style="margin-top: 4px;">${variants}</div>` : ''}
            </td>
            <td style="padding: 12px 8px; font-size: 13px; text-align: center; color: #333; font-weight: bold;">${item.quantity}</td>
            <td style="padding: 12px 8px; font-size: 13px; text-align: right; color: #333; font-family: monospace;">৳${item.price.toLocaleString('en-BD')}</td>
            <td style="padding: 12px 8px; font-size: 13px; text-align: right; color: #111; font-weight: bold; font-family: monospace;">৳${item.subtotal.toLocaleString('en-BD')}</td>
          </tr>
        `;
      })
      .join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>Invoice #${order.id} - ${settings.store_name}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f9fafb;
      margin: 0;
      padding: 30px 15px;
      color: #111827;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #13487E;
      padding-bottom: 24px;
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 28px;
      font-weight: 900;
      color: #13487E;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: -0.5px;
    }
    .tagline {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-badge {
      display: inline-block;
      background: #13487E;
      color: #ffffff;
      padding: 4px 12px;
      font-size: 12px;
      font-weight: 900;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .order-id {
      font-family: monospace;
      font-size: 16px;
      font-weight: bold;
      margin-top: 6px;
      color: #1f2937;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 28px;
    }
    .info-box {
      background: #f9fafb;
      border: 1px solid #f3f4f6;
      border-radius: 12px;
      padding: 16px;
    }
    .info-box h4 {
      margin: 0 0 8px 0;
      font-size: 11px;
      text-transform: uppercase;
      color: #9ca3af;
      letter-spacing: 1px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    th {
      background: #f3f4f6;
      padding: 10px 8px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #4b5563;
    }
    .totals-container {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 30px;
    }
    .totals-box {
      width: 320px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
      color: #4b5563;
    }
    .grand-total {
      display: flex;
      justify-content: space-between;
      border-top: 2px solid #111827;
      padding-top: 10px;
      margin-top: 8px;
      font-size: 18px;
      font-weight: 900;
      color: #13487E;
    }
    .footer-note {
      text-align: center;
      border-top: 1px dashed #e5e7eb;
      padding-top: 20px;
      font-size: 12px;
      color: #9ca3af;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .invoice-card { box-shadow: none; border: none; padding: 20px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <h1 class="brand-title">${settings.store_name}</h1>
        <div class="tagline">${settings.tagline || 'Modern Streetwear & Anime Apparel - Bangladesh'}</div>
        <div style="font-size: 12px; color: #4b5563; margin-top: 8px;">
          📞 ${settings.phone || '01700-123456'} | ✉️ ${settings.email || 'support@jakariyasmart.com'}<br>
          📍 ${settings.address || 'Dhaka, Bangladesh'}
        </div>
      </div>
      <div class="invoice-meta">
        <div class="invoice-badge">Official Invoice</div>
        <div class="order-id">#${order.id}</div>
        <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Date: ${new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        <div style="font-size: 11px; color: #10b981; font-weight: bold; margin-top: 4px;">Status: ${order.order_status}</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="info-box">
        <h4>Customer Details (গ্রাহকের তথ্য)</h4>
        <div style="font-weight: bold; font-size: 15px; color: #111;">${order.customer_name}</div>
        <div style="font-size: 13px; color: #374151; font-family: monospace; margin-top: 4px;">📱 ${order.customer_phone}</div>
        <div style="font-size: 13px; color: #4b5563; margin-top: 4px;">📍 ${order.customer_address}</div>
        ${order.district ? `<div style="font-size: 12px; color: #6b7280; margin-top: 2px;">District: <strong>${order.district}</strong> (${order.division || 'Bangladesh'})</div>` : ''}
      </div>

      <div class="info-box">
        <h4>Payment & Delivery Status (পেমেন্ট বিবরণ)</h4>
        <div style="font-size: 13px; color: #374151; margin-bottom: 4px;">Payment Method: <strong>Cash on Delivery (COD)</strong></div>
        <div style="font-size: 13px; color: #047857; margin-bottom: 4px;">
          ✓ Delivery Fee Paid: <strong>৳${order.delivery_charge.toLocaleString('en-BD')}</strong> (${order.delivery_payment_method || 'bKash'})
        </div>
        <div style="font-size: 12px; color: #b45309; font-family: monospace; background: #fef3c7; padding: 4px 8px; border-radius: 6px; display: inline-block;">
          TrxID: ${order.delivery_transaction_id || 'Verification in progress'}
        </div>
        <div style="font-size: 13px; color: #13487E; font-weight: bold; margin-top: 6px;">
          Due on Delivery (হাতে পেয়ে পরিশোধ): ৳${order.subtotal.toLocaleString('en-BD')}
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Item Description</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Unit Price</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="totals-container">
      <div class="totals-box">
        <div class="total-row">
          <span>Items Subtotal:</span>
          <span style="font-family: monospace; font-weight: bold;">৳${order.subtotal.toLocaleString('en-BD')}</span>
        </div>
        ${order.coupon_discount ? `
        <div class="total-row" style="color: #059669;">
          <span>Coupon Discount (${order.coupon_code || 'Applied'}):</span>
          <span style="font-family: monospace; font-weight: bold;">- ৳${order.coupon_discount.toLocaleString('en-BD')}</span>
        </div>
        ` : ''}
        <div class="total-row">
          <span>Delivery Charge (${order.district?.toLowerCase() === 'dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}):</span>
          <span style="font-family: monospace; font-weight: bold;">৳${order.delivery_charge.toLocaleString('en-BD')}</span>
        </div>
        <div class="total-row" style="color: #059669;">
          <span>Advance Delivery Charge Paid:</span>
          <span style="font-family: monospace; font-weight: bold;">- ৳${order.delivery_charge.toLocaleString('en-BD')}</span>
        </div>
        <div class="grand-total">
          <span>Cash on Delivery Due:</span>
          <span style="font-family: monospace;">৳${Math.max(0, order.subtotal - (order.coupon_discount || 0)).toLocaleString('en-BD')}</span>
        </div>
        <div style="font-size: 11px; color: #6b7280; text-align: right; margin-top: 4px;">
          Total Order Value: ৳${order.total.toLocaleString('en-BD')}
        </div>
      </div>
    </div>

    ${order.delivery_instructions ? `
    <div style="background: #fffbeb; border: 1px solid #fef3c7; padding: 12px; border-radius: 8px; margin-bottom: 24px; font-size: 12px; color: #92400e;">
      <strong>Delivery Instructions:</strong> ${order.delivery_instructions}
    </div>
    ` : ''}

    <div class="footer-note">
      <p style="margin: 0 0 6px 0; font-weight: bold; color: #4b5563;">Thank you for shopping with ${settings.store_name}!</p>
      <p style="margin: 0; font-size: 11px;">⚠️ পলিসি: পার্সেল রিসিভ করার সময় অবশ্যই আনবক্সিং ভিডিও করবেন। কোনো সমস্যা থাকলে ৭ দিনের মধ্যে যোগাযোগ করুন।</p>
    </div>
  </div>

  <div class="no-print" style="text-align:center; margin-top: 20px;">
    <button onclick="window.print()" style="background:#13487E; color:#fff; border:none; padding:12px 24px; font-size:14px; font-weight:bold; border-radius:8px; cursor:pointer;">
      🖨️ Print / Save as PDF
    </button>
  </div>
</body>
</html>`;

    // Create a Blob and trigger a direct file download
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${order.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Action Buttons (Download, Print, Copy) */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#13487E]" />
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Official Invoice #{order.id}</h4>
              <p className="text-[11px] text-neutral-400">View on screen, download HTML invoice or print to PDF</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Direct Download Button */}
            <button
              type="button"
              onClick={handleDownloadInvoiceFile}
              className="px-4 py-2.5 rounded-xl bg-[#13487E] hover:bg-[#0d3a66] text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-[#13487E]/20"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300 stroke-[3]" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Invoice (.html / PDF)</span>
                </>
              )}
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors border border-neutral-700"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>

            {/* Copy Info Button */}
            <button
              type="button"
              onClick={handleCopyOrderInfo}
              className="px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors border border-neutral-700"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Info</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Visually Stunning Printable & On-Screen Invoice Document Card */}
      <div 
        id={`invoice-container-${order.id}`}
        className="bg-white text-neutral-900 rounded-2xl p-6 sm:p-10 border border-neutral-200 shadow-xl text-left font-sans select-text overflow-hidden"
      >
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-[#13487E]">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#13487E] to-[#0d3a66] flex items-center justify-center font-black text-white text-xl shadow-md">
                J
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#13487E] font-['Space_Grotesk'] tracking-tight">
                  {settings.store_name}
                </h1>
                <p className="text-xs text-neutral-500 font-medium">
                  {settings.tagline || 'Modern Streetwear & Anime Apparel - Bangladesh'}
                </p>
              </div>
            </div>
            <div className="text-xs text-neutral-600 pt-2 space-y-0.5">
              <div>📞 Phone: <strong>{settings.phone || '01700-123456'}</strong></div>
              <div>✉️ Email: <strong>{settings.email || 'support@jakariyasmart.com'}</strong></div>
              <div>📍 Address: <strong>{settings.address || 'Dhaka, Bangladesh'}</strong></div>
            </div>
          </div>

          <div className="sm:text-right space-y-1">
            <div className="inline-block px-3 py-1 bg-[#13487E] text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-sm">
              Official Invoice
            </div>
            <div className="font-mono text-base font-black text-neutral-800 pt-1">
              #{order.id}
            </div>
            <div className="text-xs text-neutral-500">
              Date: <strong>{new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
            </div>
            <div className="text-xs text-emerald-600 font-bold">
              Status: <span className="uppercase">{order.order_status}</span>
            </div>
          </div>
        </div>

        {/* Customer & Payment Meta Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6">
          {/* Bill To */}
          <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-4 space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
              Billed To (গ্রাহকের তথ্য)
            </span>
            <div className="text-base font-bold text-neutral-900">{order.customer_name}</div>
            <div className="text-xs text-neutral-700 font-mono font-medium">📱 {order.customer_phone}</div>
            <div className="text-xs text-neutral-600 leading-relaxed">
              📍 {order.customer_address}
            </div>
            {order.district && (
              <div className="text-xs text-neutral-500 pt-1">
                District: <strong>{order.district}</strong> ({order.division || 'Bangladesh'})
              </div>
            )}
          </div>

          {/* Payment & Status */}
          <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-4 space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
              Payment & Verification (পেমেন্ট বিবরণ)
            </span>
            <div className="text-xs text-neutral-800 flex justify-between">
              <span>Payment Type:</span>
              <strong className="text-neutral-900">Cash on Delivery (COD)</strong>
            </div>
            <div className="text-xs text-emerald-700 flex justify-between">
              <span>Delivery Charge Paid:</span>
              <strong className="font-mono font-bold">
                {formatBDT(order.delivery_charge)} ({order.delivery_payment_method || 'bKash'})
              </strong>
            </div>
            <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg flex justify-between items-center font-mono">
              <span>TrxID:</span>
              <strong className="select-all">{order.delivery_transaction_id || 'Pending Check'}</strong>
            </div>
            <div className="text-xs text-[#13487E] flex justify-between pt-1 font-bold">
              <span>Due at Delivery (হাতে পেয়ে পরিশোধ):</span>
              <span className="font-mono text-sm">{formatBDT(order.subtotal)}</span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto my-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-100 text-neutral-600 uppercase text-[11px] font-black tracking-wider border-b border-neutral-200">
                <th className="py-3 px-3">Item Description</th>
                <th className="py-3 px-3 text-center">Qty</th>
                <th className="py-3 px-3 text-right">Unit Price</th>
                <th className="py-3 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-800">
              {order.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-neutral-50/60 transition-colors">
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-neutral-900 text-sm">{item.product_name}</div>
                    {item.selected_variants && Object.entries(item.selected_variants).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {Object.entries(item.selected_variants).map(([k, v]) => (
                          <span 
                            key={k} 
                            className="inline-block text-[10px] font-medium bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded border border-neutral-200"
                          >
                            {k}: <strong>{v}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold text-sm">{item.quantity}</td>
                  <td className="py-3.5 px-3 text-right font-mono text-neutral-600">{formatBDT(item.price)}</td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-neutral-900 text-sm">
                    {formatBDT(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Summary Breakdown */}
        <div className="flex justify-end pt-4 border-t border-neutral-200">
          <div className="w-full sm:w-80 space-y-2 text-xs text-neutral-600">
            <div className="flex justify-between">
              <span>Items Subtotal (পণ্যের মূল্য):</span>
              <span className="font-mono font-bold text-neutral-900">{formatBDT(order.subtotal)}</span>
            </div>

            {order.coupon_discount ? (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Coupon Discount ({order.coupon_code || 'Promo'}):</span>
                <span className="font-mono font-bold">- {formatBDT(order.coupon_discount)}</span>
              </div>
            ) : null}

            <div className="flex justify-between">
              <span>Delivery Fee ({order.district?.toLowerCase() === 'dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}):</span>
              <span className="font-mono font-bold text-neutral-900">{formatBDT(order.delivery_charge)}</span>
            </div>
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Advance Delivery Charge Paid:</span>
              <span className="font-mono font-bold">- {formatBDT(order.delivery_charge)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-2.5 border-t-2 border-neutral-900 text-base font-black text-[#13487E]">
              <span>Cash on Delivery Due:</span>
              <span className="font-mono text-lg">{formatBDT(Math.max(0, order.subtotal - (order.coupon_discount || 0)))}</span>
            </div>
            <div className="text-[10px] text-neutral-400 text-right">
              Total Order Value: {formatBDT(order.total)}
            </div>
          </div>
        </div>

        {/* Delivery Note if any */}
        {order.delivery_instructions && (
          <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
            <strong>Customer Delivery Instructions:</strong> {order.delivery_instructions}
          </div>
        )}

        {/* Footer & Return Policy */}
        <div className="mt-8 pt-6 border-t border-dashed border-neutral-200 text-center space-y-1 text-xs text-neutral-400">
          <div className="font-bold text-neutral-700">Thank you for shopping with {settings.store_name}!</div>
          <p className="text-[11px] text-neutral-500 max-w-xl mx-auto">
            ⚠️ ডেলিভারি পলিসি: পার্সেল খোলার সময় অবশ্যই স্পষ্ট আনবক্সিং ভিডিও (Unboxing Video) ধারণ করুন। ভিডিও ব্যতীত কোনো এক্সচেঞ্জ ক্লেইম গ্রহণযোগ্য হবে না।
          </p>
        </div>
      </div>
    </div>
  );
};
