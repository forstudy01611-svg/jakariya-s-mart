import React, { useState } from 'react';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Printer,
  FileText,
  Copy,
  Check,
  Eye,
  Download,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { OrderStatus, PaymentStatus } from '../../types';
import { formatBDT, formatBdPhone } from '../../utils/bangladesh';
import { InvoiceModal } from '../common/InvoiceModal';

interface AdminOrderDetailProps {
  orderId: string;
  onNavigate: (path: string) => void;
}

export const AdminOrderDetail: React.FC<AdminOrderDetailProps> = ({
  orderId,
  onNavigate,
}) => {
  const {
    orders,
    settings,
    updateOrderStatus,
    updatePaymentStatus,
    deliveryPayments,
    approveDeliveryPayment,
    rejectDeliveryPayment,
  } = useStore();

  const order = orders.find((o) => o.id === orderId);
  const [copied, setCopied] = useState(false);
  const [copiedTrx, setCopiedTrx] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const deliveryPayment = deliveryPayments.find(
    (p) => p.order_id === orderId || p.id === order?.delivery_payment_id
  );

  if (!order) {
    return (
      <div className="space-y-4 text-center py-16">
        <h2 className="text-xl font-bold text-white">Order not found</h2>
        <p className="text-xs text-neutral-400">
          The requested order ID "{orderId}" does not exist in the database.
        </p>
        <button
          onClick={() => onNavigate('/admin/orders')}
          className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-bold text-[#13487E]"
        >
          ← Back to Orders
        </button>
      </div>
    );
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-950/60 border-amber-800 text-amber-300';
      case 'Confirmed':
        return 'bg-sky-950/60 border-sky-800 text-sky-300';
      case 'Processing':
        return 'bg-purple-950/60 border-purple-800 text-purple-300';
      case 'Shipped':
        return 'bg-blue-950/60 border-blue-800 text-blue-300';
      case 'Delivered':
        return 'bg-emerald-950/60 border-emerald-800 text-emerald-300';
      case 'Cancelled':
        return 'bg-red-950/60 border-red-800 text-red-300';
    }
  };

  const getPaymentBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'Paid':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-800';
      case 'Pending':
        return 'text-amber-400 bg-amber-950/40 border-amber-800';
      case 'Failed':
        return 'text-red-400 bg-red-950/40 border-red-800';
      case 'Refunded':
        return 'text-neutral-400 bg-neutral-900 border-neutral-700';
    }
  };

  const formattedDate = new Date(order.created_at).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/admin/orders')}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white font-['Space_Grotesk'] tracking-tight">
                ORDER {order.id}
              </h1>
              <button
                onClick={handleCopyId}
                className="text-[10px] font-mono text-neutral-400 hover:text-[#13487E] px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800"
              >
                {copied ? 'Copied!' : 'Copy ID'}
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-500" />
              <span>Placed on {formattedDate}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Official Invoice Modal Button */}
          <button
            type="button"
            onClick={() => setShowInvoiceModal(true)}
            className="px-3.5 py-2 rounded-xl bg-[#13487E] hover:bg-[#0d3a66] text-xs font-black uppercase tracking-wider text-white transition-all shadow-md shadow-[#13487E]/20 flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View & Download Invoice</span>
          </button>

          <button
            type="button"
            onClick={() => setShowInvoiceModal(true)}
            className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-bold text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Invoice Modal for Admin */}
      <InvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        order={order}
        settings={settings}
      />

      {/* Main Order Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Items and Summary (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items List */}
          <div className="bg-[#0d0d12] border border-neutral-800/80 rounded-2xl p-5 sm:p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 pb-2 border-b border-neutral-800/60">
              Purchased Drops ({order.items.reduce((s, i) => s + i.quantity, 0)})
            </h2>

            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/60"
                >
                  <div className="w-16 h-16 rounded-lg bg-neutral-900 overflow-hidden flex-shrink-0 border border-neutral-800">
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">
                      {item.product_name}
                    </h3>
                    {item.selected_variants && Object.entries(item.selected_variants).length > 0 && (
                      <div className="flex flex-wrap gap-x-2 mt-0.5">
                        {Object.entries(item.selected_variants).map(([k, v]) => (
                          <span key={k} className="text-[10px] text-neutral-400 font-medium">
                            {k}: <span className="text-neutral-200">{v}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-neutral-400 mt-1">
                      Quantity: <strong className="text-white">{item.quantity}</strong> × {formatBDT(item.price)}
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-sm font-black text-white">
                      {formatBDT(item.subtotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-4 border-t border-neutral-800/80 space-y-2.5">
              <div className="flex justify-between text-xs text-neutral-400">
                <span className="font-semibold text-neutral-300">Subtotal:</span>
                <span className="font-mono text-white font-bold text-sm">
                  {formatBDT(order.subtotal)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-neutral-400">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-300">Delivery Charge:</span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      order.district?.trim().toLowerCase() === 'dhaka' || order.delivery_charge === 80
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                        : 'bg-blue-950/60 border-blue-800 text-blue-300'
                    }`}
                  >
                    {order.district?.trim().toLowerCase() === 'dhaka' || order.delivery_charge === 80
                      ? 'Inside Dhaka District (৳80)'
                      : `Outside Dhaka District (${order.district || 'Non-Dhaka'}) (৳120)`}
                  </span>
                </div>
                <span className="font-mono text-white font-bold text-sm">
                  {formatBDT(order.delivery_charge)}
                </span>
              </div>
              <div className="flex justify-between items-baseline text-base font-black text-white pt-2.5 border-t border-neutral-800">
                <div className="flex flex-col">
                  <span>Total (Cash on Delivery):</span>
                  <span className="text-[10px] text-neutral-400 font-mono font-normal">
                    Formula: Subtotal ({formatBDT(order.subtotal)}) + Delivery Charge ({formatBDT(order.delivery_charge)})
                  </span>
                </div>
                <span className="font-mono text-[#13487E] text-xl font-black">
                  {formatBDT(order.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Note if any */}
          {order.notes && (
            <div className="bg-[#0d0d12] border border-neutral-800/80 rounded-2xl p-5 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#13487E]" />
                Customer Delivery Note
              </h3>
              <p className="text-xs text-neutral-300 italic bg-neutral-950 p-3 rounded-xl border border-neutral-800/60">
                "{order.notes}"
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Status Controls & Customer Info (1 col) */}
        <div className="space-y-6">
          {/* Delivery Charge Payment Verification Card */}
          <div className="bg-[#0d0d12] border border-[#13487E]/40 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#13487E]" />
                <span>Delivery Charge Payment</span>
              </h2>
              {deliveryPayment && (
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    deliveryPayment.status === 'Approved'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                      : deliveryPayment.status === 'Rejected'
                      ? 'bg-red-950/80 text-red-300 border-red-500/40'
                      : 'bg-amber-950/80 text-amber-300 border-amber-500/40 animate-pulse'
                  }`}
                >
                  {deliveryPayment.status}
                </span>
              )}
            </div>

            {actionMsg && (
              <div
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  actionMsg.success
                    ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                    : 'bg-red-950/80 border border-red-500/50 text-red-300'
                }`}
              >
                {actionMsg.success ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <span>{actionMsg.text}</span>
              </div>
            )}

            {deliveryPayment ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Payment ID:</span>
                  <span className="font-mono text-white font-bold">{deliveryPayment.id}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Method:</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                      deliveryPayment.payment_method === 'bKash'
                        ? 'bg-[#e2136e]/20 text-[#ff4b8b] border border-[#e2136e]/30'
                        : 'bg-[#f7941d]/20 text-[#ffa834] border border-[#f7941d]/30'
                    }`}
                  >
                    {deliveryPayment.payment_method}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Delivery Charge:</span>
                  <span className="font-mono text-emerald-400 font-black text-sm">
                    {formatBDT(deliveryPayment.amount)}
                  </span>
                </div>

                {/* Transaction ID with Copy Button */}
                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                  <span className="text-[10px] text-neutral-400 block font-bold uppercase tracking-wider">
                    Transaction ID (TrxID)
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-amber-300 text-sm select-all">
                      {deliveryPayment.transaction_id || order.delivery_transaction_id || 'N/A'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const trx = deliveryPayment.transaction_id || order.delivery_transaction_id || '';
                        if (trx) {
                          navigator.clipboard.writeText(trx);
                          setCopiedTrx(true);
                          setTimeout(() => setCopiedTrx(false), 2000);
                        }
                      }}
                      className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-[10px] font-bold flex items-center gap-1 transition-colors border border-neutral-800"
                    >
                      {copiedTrx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between text-[11px] text-neutral-500">
                  <span>Submitted:</span>
                  <span className="font-mono">
                    {new Date(deliveryPayment.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Admin Approval / Rejection Actions */}
                {deliveryPayment.status === 'Pending' ? (
                  <div className="pt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={async () => {
                        setActionLoading(true);
                        try {
                          const res = await approveDeliveryPayment(deliveryPayment.id);
                          setActionMsg({ text: res.message, success: true });
                        } catch (err: any) {
                          setActionMsg({ text: err?.message || 'Approval failed', success: false });
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-900/30 flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Approve</span>
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={async () => {
                        setActionLoading(true);
                        try {
                          const res = await rejectDeliveryPayment(deliveryPayment.id, 'Transaction ID not verified');
                          setActionMsg({ text: res.message, success: true });
                        } catch (err: any) {
                          setActionMsg({ text: err?.message || 'Rejection failed', success: false });
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                      className="py-2.5 px-3 rounded-xl bg-red-950 hover:bg-red-900 text-red-200 border border-red-800 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                ) : deliveryPayment.status === 'Approved' ? (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Delivery Charge Paid & Verified</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <span>Payment Rejected: {deliveryPayment.admin_notes || 'Unverified'}</span>
                    </div>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={async () => {
                        setActionLoading(true);
                        try {
                          const res = await approveDeliveryPayment(deliveryPayment.id);
                          setActionMsg({ text: res.message, success: true });
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                      className="w-full py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-xs font-bold transition-colors"
                    >
                      Re-Approve Payment
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-400 text-xs">
                No delivery charge payment record linked to this order.
              </div>
            )}
          </div>

          {/* Status Controls Card */}
          <div className="bg-[#0d0d12] border border-neutral-800/80 rounded-2xl p-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 pb-2 border-b border-neutral-800/60">
              Update Statuses
            </h2>

            {/* Order Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Fulfillment Status
              </label>
              <select
                value={order.order_status}
                onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                className={`w-full text-xs font-bold uppercase tracking-wider rounded-xl border p-2.5 focus:outline-none cursor-pointer ${getOrderStatusBadge(
                  order.order_status
                )}`}
              >
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Payment Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Payment Status
              </label>
              <select
                value={order.payment_status}
                onChange={(e) => updatePaymentStatus(order.id, e.target.value as PaymentStatus)}
                className={`w-full text-xs font-bold uppercase tracking-wider rounded-xl border p-2.5 focus:outline-none cursor-pointer ${getPaymentBadge(
                  order.payment_status
                )}`}
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Failed">Failed</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>

            <div className="pt-2 text-[10px] text-neutral-500 font-mono">
              Last status change recorded in database.
            </div>
          </div>

          {/* Customer Info Card */}
          <div className="bg-[#0d0d12] border border-neutral-800/80 rounded-2xl p-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 pb-2 border-b border-neutral-800/60">
              Customer & Delivery
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-[#13487E] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white text-sm">{order.customer_name}</div>
                  <div className="text-[10px] text-neutral-400">Verified Buyer</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#13487E] flex-shrink-0" />
                <a
                  href={`tel:${order.customer_phone}`}
                  className="font-mono text-neutral-300 hover:text-white"
                >
                  {order.customer_phone}
                </a>
              </div>

              {order.customer_email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[#13487E] flex-shrink-0" />
                  <a
                    href={`mailto:${order.customer_email}`}
                    className="text-neutral-300 hover:text-white truncate"
                  >
                    {order.customer_email}
                  </a>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-neutral-800/60">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#13487E] flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-semibold text-neutral-200">Bangladesh Delivery Address:</div>
                    
                    {order.division && (
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/80">
                        <div>
                          <span className="text-neutral-500">Division: </span>
                          <span className="font-bold text-white">{order.division}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500">District: </span>
                          <span className="font-bold text-white">{order.district}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500">Upazila/Thana: </span>
                          <span className="font-bold text-white">{order.upazila}</span>
                        </div>
                        {order.union_ward && (
                          <div>
                            <span className="text-neutral-500">Union/Ward: </span>
                            <span className="font-bold text-white">{order.union_ward}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-neutral-300 mt-1 leading-relaxed bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/60 font-mono text-[11px]">
                      {order.customer_address}
                    </div>

                    {order.delivery_instructions && (
                      <div className="text-[11px] text-amber-300 bg-amber-950/30 border border-amber-800/50 p-2 rounded-lg">
                        <strong>Instructions:</strong> {order.delivery_instructions}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-neutral-800/60">
                <CreditCard className="w-4 h-4 text-[#13487E] flex-shrink-0" />
                <div>
                  <div className="font-semibold text-neutral-200">Payment Method:</div>
                  <div className="text-[#13487E] font-bold text-xs flex items-center gap-1.5 mt-0.5">
                    <span>Cash on Delivery (ক্যাশ অন ডেলিভারি)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
