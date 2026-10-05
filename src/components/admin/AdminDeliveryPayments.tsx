import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Copy,
  Check,
  Filter,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  Phone,
  User,
  Banknote,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { DeliveryPayment, DeliveryPaymentStatus, DeliveryPaymentMethod } from '../../types';
import { formatBDT } from '../../utils/bangladesh';

interface AdminDeliveryPaymentsProps {
  onNavigate: (route: string) => void;
}

export const AdminDeliveryPayments: React.FC<AdminDeliveryPaymentsProps> = ({ onNavigate }) => {
  const {
    deliveryPayments,
    orders,
    approveDeliveryPayment,
    rejectDeliveryPayment,
    deleteDeliveryPayment,
    settings,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | DeliveryPaymentStatus>('All');
  const [methodFilter, setMethodFilter] = useState<'All' | DeliveryPaymentMethod>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Reject Modal State
  const [rejectModalPayment, setRejectModalPayment] = useState<DeliveryPayment | null>(null);
  const [rejectReason, setRejectReason] = useState('Transaction ID not found or unverified in account');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ type, message });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const handleCopyTrx = (trxId: string, id: string) => {
    navigator.clipboard.writeText(trxId);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast(`Transaction ID "${trxId}" copied to clipboard!`);
  };

  // Metrics Calculation
  const totalCount = deliveryPayments.length;
  const pendingPayments = deliveryPayments.filter((p) => p.status === 'Pending');
  const approvedPayments = deliveryPayments.filter((p) => p.status === 'Approved');
  const rejectedPayments = deliveryPayments.filter((p) => p.status === 'Rejected');

  const pendingCount = pendingPayments.length;
  const approvedCount = approvedPayments.length;
  const rejectedCount = rejectedPayments.length;

  const totalCollected = approvedPayments.reduce((sum, p) => sum + p.amount, 0);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return deliveryPayments.filter((p) => {
      // Status filter
      if (statusFilter !== 'All' && p.status !== statusFilter) return false;

      // Method filter
      if (methodFilter !== 'All' && p.payment_method !== methodFilter) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTrx = p.transaction_id?.toLowerCase().includes(query);
        const matchesOrder = p.order_id?.toLowerCase().includes(query);
        const matchesName = p.customer_name?.toLowerCase().includes(query);
        const matchesPhone = p.customer_phone?.toLowerCase().includes(query);
        const matchesId = p.id?.toLowerCase().includes(query);
        return matchesTrx || matchesOrder || matchesName || matchesPhone || matchesId;
      }

      return true;
    });
  }, [deliveryPayments, statusFilter, methodFilter, searchQuery]);

  const handleApprove = async (paymentId: string) => {
    setIsProcessing(true);
    try {
      const res = await approveDeliveryPayment(paymentId);
      showToast(res.message, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to approve payment', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalPayment) return;
    setIsProcessing(true);
    try {
      const res = await rejectDeliveryPayment(rejectModalPayment.id, rejectReason);
      showToast(res.message, 'success');
      setRejectModalPayment(null);
    } catch (err: any) {
      showToast(err?.message || 'Failed to reject payment', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedbackToast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-4 duration-300 border ${
            feedbackToast.type === 'success'
              ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
              : 'bg-red-950 border-red-500 text-red-300'
          }`}
        >
          {feedbackToast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          )}
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white font-['Space_Grotesk'] tracking-tight">
              DELIVERY CHARGE PAYMENTS
            </h1>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-bold font-mono animate-pulse">
                {pendingCount} Pending Verification
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manually verify and approve customer bKash & Nagad advance delivery charges to confirm COD orders
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/admin/settings')}
            className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-bold transition-all flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#13487E]" />
            <span>bKash / Nagad Numbers</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Pending Verification */}
        <div className="p-4 rounded-2xl bg-[#0d0d12] border border-amber-500/30 space-y-1.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Pending Review
            </span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-['Space_Grotesk'] font-mono">
            {pendingCount}
          </div>
          <p className="text-[11px] text-neutral-400">Needs manual TrxID verification</p>
        </div>

        {/* Approved Payments */}
        <div className="p-4 rounded-2xl bg-[#0d0d12] border border-emerald-500/30 space-y-1.5">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Approved
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-['Space_Grotesk'] font-mono">
            {approvedCount}
          </div>
          <p className="text-[11px] text-neutral-400">Confirmed COD orders</p>
        </div>

        {/* Rejected Payments */}
        <div className="p-4 rounded-2xl bg-[#0d0d12] border border-neutral-800 space-y-1.5">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-400">
              Rejected
            </span>
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-['Space_Grotesk'] font-mono">
            {rejectedCount}
          </div>
          <p className="text-[11px] text-neutral-400">Invalid / unverified TrxIDs</p>
        </div>

        {/* Total Collected */}
        <div className="p-4 rounded-2xl bg-[#0d0d12] border border-[#13487E]/40 space-y-1.5">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#13487E]">
              Delivery Collected
            </span>
            <div className="p-1.5 rounded-lg bg-[#13487E]/10 text-[#13487E]">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-['Space_Grotesk'] font-mono">
            {formatBDT(totalCollected)}
          </div>
          <p className="text-[11px] text-neutral-400">From {approvedCount} verified payments</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0d0d12] border border-neutral-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((status) => {
            const isActive = statusFilter === status;
            const count =
              status === 'All'
                ? totalCount
                : status === 'Pending'
                ? pendingCount
                : status === 'Approved'
                ? approvedCount
                : rejectedCount;

            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#13487E] text-white shadow-md shadow-[#13487E]/20'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                <span>{status}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-neutral-800 text-neutral-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Method Selector */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value as any)}
            aria-label="Filter payments by method"
            className="bg-neutral-950 border border-neutral-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-[#13487E]"
          >
            <option value="All">All Methods (bKash & Nagad)</option>
            <option value="bKash">bKash Only</option>
            <option value="Nagad">Nagad Only</option>
          </select>

          {/* Search Box */}
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="Search TrxID, Order ID, Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 pl-9 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#13487E]"
            />
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>

      {/* Payments List / Table */}
      <div className="rounded-2xl bg-[#0d0d12] border border-neutral-800/80 overflow-hidden shadow-xl">
        {filteredPayments.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center mx-auto text-neutral-500">
              <CreditCard className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-white">No delivery payments found</p>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'All' || methodFilter !== 'All'
                ? 'Try adjusting your search or active filter tabs.'
                : 'When customers submit bKash or Nagad Transaction IDs during COD checkout, they will appear here for verification.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950/80 text-[10px] uppercase font-black tracking-wider text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="px-4 py-3">Payment ID / Date</th>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer Info</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Transaction ID (TrxID)</th>
                  <th className="px-4 py-3">Delivery Fee</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredPayments.map((payment) => {
                  const isCopied = copiedId === payment.id;
                  const isBkash = payment.payment_method === 'bKash';
                  const linkedOrder = orders.find((o) => o.id === payment.order_id);

                  return (
                    <tr
                      key={payment.id}
                      className="hover:bg-neutral-900/40 transition-colors group"
                    >
                      {/* Payment ID & Date */}
                      <td className="px-4 py-3.5 space-y-0.5">
                        <span className="font-mono font-bold text-white block">
                          {payment.id}
                        </span>
                        <span className="text-[10px] text-neutral-500 block">
                          {new Date(payment.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* Order ID Link */}
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => onNavigate(`/admin/orders/${payment.order_id}`)}
                          className="font-mono text-[#13487E] hover:underline font-bold flex items-center gap-1 group/btn"
                        >
                          <span>{payment.order_id}</span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                        </button>
                        {linkedOrder && (
                          <span className="text-[10px] text-neutral-400 block mt-0.5 font-mono">
                            Total: {formatBDT(linkedOrder.total)}
                          </span>
                        )}
                      </td>

                      {/* Customer Name & Phone */}
                      <td className="px-4 py-3.5 space-y-0.5">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <User className="w-3 h-3 text-neutral-500 flex-shrink-0" />
                          <span>{payment.customer_name}</span>
                        </div>
                        <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-neutral-500 flex-shrink-0" />
                          <a
                            href={`tel:${payment.customer_phone}`}
                            className="hover:text-[#13487E] hover:underline"
                          >
                            {payment.customer_phone}
                          </a>
                        </div>
                      </td>

                      {/* Method (bKash / Nagad Badge) */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold tracking-wider ${
                            isBkash
                              ? 'bg-[#e2136e]/15 text-[#ff4b8b] border border-[#e2136e]/30'
                              : 'bg-[#f7941d]/15 text-[#ffa834] border border-[#f7941d]/30'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {payment.payment_method}
                        </span>
                      </td>

                      {/* Transaction ID with Copy Button */}
                      <td className="px-4 py-3.5">
                        <div className="inline-flex items-center gap-1.5 p-1.5 rounded-lg bg-neutral-950 border border-neutral-800">
                          <span className="font-mono font-black text-amber-300 text-xs px-1 select-all">
                            {payment.transaction_id || 'N/A'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyTrx(payment.transaction_id, payment.id)}
                            title="Copy Transaction ID"
                            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Delivery Fee Amount */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-black text-white text-sm text-[#13487E]">
                          {formatBDT(payment.amount)}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            payment.status === 'Approved'
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                              : payment.status === 'Rejected'
                              ? 'bg-red-950/80 text-red-300 border border-red-500/40'
                              : 'bg-amber-950/80 text-amber-300 border border-amber-500/40 animate-pulse'
                          }`}
                        >
                          {payment.status === 'Approved' && <CheckCircle className="w-3 h-3" />}
                          {payment.status === 'Rejected' && <XCircle className="w-3 h-3" />}
                          {payment.status === 'Pending' && <Clock className="w-3 h-3" />}
                          <span>{payment.status}</span>
                        </span>
                        {payment.admin_notes && (
                          <span className="text-[10px] text-red-400 block mt-1 line-clamp-1" title={payment.admin_notes}>
                            {payment.admin_notes}
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-4 py-3.5 text-right space-x-2 whitespace-nowrap">
                        {payment.status === 'Pending' ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleApprove(payment.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] uppercase tracking-wider transition-all shadow-md shadow-emerald-900/30 flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => setRejectModalPayment(payment)}
                              className="px-3 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 text-red-200 border border-red-800 font-bold text-[11px] uppercase tracking-wider transition-all"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onNavigate(`/admin/orders/${payment.order_id}`)}
                              className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-[11px] font-bold transition-colors flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Order</span>
                            </button>
                            {payment.status === 'Rejected' && (
                              <button
                                type="button"
                                onClick={() => handleApprove(payment.id)}
                                className="text-[11px] text-emerald-400 hover:underline font-bold"
                              >
                                Re-Approve
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Reason Confirmation Modal */}
      {rejectModalPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-md bg-[#0d0d12] border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-2xl text-neutral-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-400 border-b border-neutral-800 pb-3">
              <div className="p-2 rounded-xl bg-red-950 border border-red-800">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-white font-['Space_Grotesk']">
                  Reject Delivery Payment?
                </h3>
                <p className="text-xs text-neutral-400">
                  Order <span className="font-mono text-white">{rejectModalPayment.order_id}</span> will be marked as Cancelled
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-400">Customer:</span>
                <span className="text-white font-bold">{rejectModalPayment.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Transaction ID:</span>
                <span className="font-mono font-bold text-amber-400">{rejectModalPayment.transaction_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Delivery Amount:</span>
                <span className="font-mono font-bold text-white">{formatBDT(rejectModalPayment.amount)}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300">
                Reason for Rejection (গ্রাহক দেখতে পাবে):
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                aria-label="Reason for payment rejection"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              >
                <option value="Transaction ID not found or unverified in account">
                  Transaction ID not found or unverified in account
                </option>
                <option value="Incorrect delivery charge amount sent">
                  Incorrect delivery charge amount sent
                </option>
                <option value="Duplicate or fake transaction ID provided">
                  Duplicate or fake transaction ID provided
                </option>
                <option value="Payment not received within allowed timeframe">
                  Payment not received within allowed timeframe
                </option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalPayment(null)}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmReject}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-red-950/50"
              >
                {isProcessing ? 'Rejecting...' : 'Confirm Reject & Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
