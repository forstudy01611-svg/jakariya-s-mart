import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Eye,
  Clock,
  CheckCircle,
  Truck,
  RotateCcw,
  XCircle,
  SlidersHorizontal,
  DollarSign,
  ArrowUpRight,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Order, OrderStatus, PaymentStatus } from '../../types';
import { formatBDT } from '../../utils/bangladesh';

interface AdminOrdersProps {
  onNavigate: (path: string) => void;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({ onNavigate }) => {
  const {
    orders,
    settings,
    updateOrderStatus,
    updatePaymentStatus,
    deleteOrder,
    clearAllOrders,
    clearPendingOrders,
    refreshAllData,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'total-high' | 'total-low'>('newest');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchId = order.id.toLowerCase().includes(q);
          const matchName = order.customer_name.toLowerCase().includes(q);
          const matchPhone = order.customer_phone.toLowerCase().includes(q);
          const matchEmail = order.customer_email?.toLowerCase().includes(q);
          if (!matchId && !matchName && !matchPhone && !matchEmail) return false;
        }

        // Order status
        if (orderStatusFilter !== 'all' && order.order_status !== orderStatusFilter) {
          return false;
        }

        // Payment status
        if (paymentStatusFilter !== 'all' && order.payment_status !== paymentStatusFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        if (sortBy === 'total-high') {
          return b.total - a.total;
        }
        if (sortBy === 'total-low') {
          return a.total - b.total;
        }
        return 0;
      });
  }, [orders, searchQuery, orderStatusFilter, paymentStatusFilter, sortBy]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-['Space_Grotesk'] tracking-tight">
            ORDER PIPELINE
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Process, dispatch, and track customer purchases in real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh Button */}
          <button
            type="button"
            disabled={isRefreshing}
            onClick={async () => {
              setIsRefreshing(true);
              const res = await refreshAllData();
              setActionNotice(res.message);
              setTimeout(() => {
                setIsRefreshing(false);
                setActionNotice(null);
              }, 2500);
            }}
            className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Refresh orders from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#13487E] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          {/* Clear Pending Orders Button */}
          {orders.some((o) => o.order_status === 'Pending') && (
            <button
              type="button"
              onClick={async () => {
                if (window.confirm('আপনি কি নিশ্চিত যে সকল Pending (টেস্ট) অর্ডার মুছে ফেলতে চান?')) {
                  const res = await clearPendingOrders();
                  setActionNotice(res.message);
                  setTimeout(() => setActionNotice(null), 3000);
                }
              }}
              className="px-3 py-2 rounded-xl bg-amber-950/40 hover:bg-amber-950/70 border border-amber-800/60 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Pending ({orders.filter((o) => o.order_status === 'Pending').length})</span>
            </button>
          )}

          {/* Clear All Orders Button */}
          {orders.length > 0 && (
            <button
              type="button"
              onClick={async () => {
                if (window.confirm('সতর্কতা: আপনি কি নিশ্চিত যে সমস্ত অর্ডার হিস্ট্রি মুছে ফেলতে চান?')) {
                  const res = await clearAllOrders();
                  setActionNotice(res.message);
                  setTimeout(() => setActionNotice(null), 3000);
                }
              }}
              className="px-3 py-2 rounded-xl bg-red-950/30 hover:bg-red-950/60 border border-red-800/50 text-red-400 text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Clear all orders history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}

          <span className="text-xs font-mono text-neutral-400 px-2 py-1 rounded bg-neutral-950 border border-neutral-800">
            Total: {orders.length}
          </span>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="bg-[#0d0d12] border border-neutral-800/80 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order ID, name, phone..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#13487E]"
            />
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
          </div>

          {/* Order Status Filter */}
          <div>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-[#13487E] cursor-pointer"
            >
              <option value="all">All Order Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-[#13487E] cursor-pointer"
            >
              <option value="all">All Payment Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-[#13487E] cursor-pointer"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="total-high">Total: High to Low</option>
              <option value="total-low">Total: Low to High</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-800/60">
          <span>
            Showing <strong className="text-white">{filteredOrders.length}</strong> matching orders
          </span>
          {(searchQuery || orderStatusFilter !== 'all' || paymentStatusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setOrderStatusFilter('all');
                setPaymentStatusFilter('all');
              }}
              className="text-[#13487E] hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#0d0d12] border border-neutral-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/60 text-neutral-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Order ID</th>
                <th className="py-3.5 px-4">Customer & Phone</th>
                <th className="py-3.5 px-4">Bangladesh Address</th>
                <th className="py-3.5 px-4">Delivery Fee</th>
                <th className="py-3.5 px-4">Total (BDT)</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Items</th>
                <th className="py-3.5 px-4">Order Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-neutral-500">
                    No orders found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const dateStr = new Date(order.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={order.id}
                      onClick={() => onNavigate(`/admin/orders/${order.id}`)}
                      className="hover:bg-neutral-900/50 transition-colors cursor-pointer group"
                    >
                      {/* Order ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#13487E] group-hover:underline whitespace-nowrap">
                        {order.id}
                      </td>

                      {/* Customer info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white whitespace-nowrap">{order.customer_name}</div>
                        <div className="text-[10px] text-neutral-400 font-mono">
                          {order.customer_phone}
                        </div>
                      </td>

                      {/* Bangladesh Address */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="text-white font-medium truncate" title={order.customer_address}>
                          {order.district ? `${order.upazila ? order.upazila + ', ' : ''}${order.district}, ${order.division || 'BD'}` : order.customer_address}
                        </div>
                        <div className="text-[10px] text-neutral-500 truncate" title={order.customer_address}>
                          {order.customer_address}
                        </div>
                      </td>

                      {/* Delivery Charge with Dhaka / Outside Dhaka indicator */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-white text-xs">
                          {formatBDT(order.delivery_charge)}
                        </div>
                        <span
                          className={`inline-block text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border mt-0.5 ${
                            order.district?.trim().toLowerCase() === 'dhaka' || order.delivery_charge === 80
                              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                              : 'bg-blue-950/60 border-blue-800 text-blue-300'
                          }`}
                        >
                          {order.district?.trim().toLowerCase() === 'dhaka' || order.delivery_charge === 80
                            ? 'Inside Dhaka (৳80)'
                            : 'Outside Dhaka (৳120)'}
                        </span>
                      </td>

                      {/* Total & Subtotal */}
                      <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                        <div className="font-black text-white text-sm">
                          {formatBDT(order.total)}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          Sub: {formatBDT(order.subtotal)}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-neutral-400 whitespace-nowrap font-mono text-[11px]">
                        {dateStr}
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4 text-neutral-300">
                        <span className="font-mono font-bold text-white">{order.items.reduce((s, i) => s + i.quantity, 0)} pcs</span>
                        <span className="text-[10px] text-neutral-500 block truncate max-w-[130px]">
                          {order.items.map((i) => i.product_name).join(', ')}
                        </span>
                      </td>

                      {/* Order Status Dropdown / Badge */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={order.order_status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                          className={`text-[10px] font-bold uppercase tracking-wider rounded border px-2 py-1 focus:outline-none cursor-pointer ${getOrderStatusBadge(
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
                      </td>

                      {/* Action View & Delete */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate(`/admin/orders/${order.id}`);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-semibold transition-colors inline-flex items-center gap-1"
                          >
                            <span>Details</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (window.confirm(`অর্ডার #${order.id} মুছে ফেলতে চান?`)) {
                                await deleteOrder(order.id);
                                setActionNotice(`অর্ডার #${order.id} ডিলিট করা হয়েছে।`);
                                setTimeout(() => setActionNotice(null), 2500);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-red-950/60 text-neutral-400 hover:text-red-400 border border-neutral-800 hover:border-red-800 transition-colors"
                            title="Delete this order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
