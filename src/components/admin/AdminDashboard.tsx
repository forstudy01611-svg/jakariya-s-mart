import React from 'react';
import {
  Package,
  Layers,
  ShoppingBag,
  CreditCard,
  Users,
  Banknote,
  Clock,
  CheckCircle,
  Truck,
  RotateCcw,
  XCircle,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { OrderStatus } from '../../types';
import { formatBDT } from '../../utils/bangladesh';

interface AdminDashboardProps {
  onNavigate: (path: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { products, categories, orders, customers, settings, deliveryPayments } = useStore();

  // Compute real metrics from database
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.is_active).length;
  const totalCategories = categories.length;
  const totalOrders = orders.length;
  const totalCustomers = customers.length;
  const pendingDeliveryPayments = deliveryPayments.filter((p) => p.status === 'Pending').length;

  const totalSales = orders
    .filter((o) => o.payment_status === 'Paid' || o.order_status === 'Delivered')
    .reduce((sum, o) => sum + o.total, 0);

  const getOrderStatusCount = (status: OrderStatus) =>
    orders.filter((o) => o.order_status === status).length;

  const pendingOrders = getOrderStatusCount('Pending');
  const confirmedOrders = getOrderStatusCount('Confirmed');
  const processingOrders = getOrderStatusCount('Processing');
  const shippedOrders = getOrderStatusCount('Shipped');
  const deliveredOrders = getOrderStatusCount('Delivered');
  const cancelledOrders = getOrderStatusCount('Cancelled');

  // Low stock products warning
  const lowStockProducts = products.filter((p) => p.stock <= 5 && p.is_active);

  // Compute best selling products from order items
  const bestSellers = React.useMemo(() => {
    const counts: Record<string, { count: number; name: string; image: string; revenue: number; price: number }> = {};

    orders.forEach((order) => {
      if (order.order_status === 'Cancelled') return;
      order.items.forEach((item) => {
        if (!counts[item.product_id]) {
          counts[item.product_id] = {
            count: 0,
            name: item.product_name,
            image: item.product_image,
            revenue: 0,
            price: item.price,
          };
        }
        counts[item.product_id].count += item.quantity;
        counts[item.product_id].revenue += item.subtotal;
      });
    });

    return Object.entries(counts)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [orders]);

  // Recent orders
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const getStatusBadge = (status: OrderStatus) => {
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
      default:
        return 'bg-neutral-800 text-neutral-300';
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-['Space_Grotesk'] tracking-tight">
            STORE OVERVIEW
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time analytics and inventory health for <span className="text-[#13487E] font-bold">{(!settings.store_name || settings.store_name.toLowerCase().includes('fugo')) ? "Jakariya's Mart" : settings.store_name}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/admin/delivery-payments')}
            className={`px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              pendingDeliveryPayments > 0
                ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/50 text-amber-300 animate-pulse'
                : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
            }`}
          >
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>Delivery Payments ({pendingDeliveryPayments})</span>
          </button>
          <button
            onClick={() => onNavigate('/admin/products/new')}
            className="px-4 py-2 rounded-xl bg-[#13487E] hover:bg-[#0d3a66] text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#13487E]/20 flex items-center gap-1.5"
          >
            <span>+ Add Product</span>
          </button>
          <button
            onClick={() => onNavigate('/admin/orders')}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-bold text-xs uppercase tracking-wider transition-all"
          >
            <span>Manage Orders</span>
          </button>
        </div>
      </div>

      {/* Pending Delivery Payments Notification Banner */}
      {pendingDeliveryPayments > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0 animate-pulse">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-amber-300 uppercase tracking-wide font-['Space_Grotesk']">
                {pendingDeliveryPayments} Pending Delivery Charge Payment{pendingDeliveryPayments > 1 ? 's' : ''}
              </h3>
              <p className="text-xs text-neutral-300">
                Customers have submitted bKash / Nagad TrxIDs awaiting manual verification to confirm orders.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('/admin/delivery-payments')}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap self-start sm:self-auto"
          >
            Review & Verify Now →
          </button>
        </div>
      )}

      {/* 5 Primary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Sales */}
        <div className="p-4 rounded-2xl bg-[#0d0d12] border border-neutral-800/80 space-y-2 col-span-2 sm:col-span-1 lg:col-span-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Sales</span>
            <div className="p-1.5 rounded-lg bg-[#13487E]/10 text-[#13487E]">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-['Space_Grotesk']">
            {formatBDT(totalSales)}
          </div>
          <div className="text-[11px] text-neutral-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Delivered & Paid orders</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-4 rounded-2xl bg-[#0d0d12] border border-neutral-800/80 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
            <div className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-['Space_Grotesk']">
            {totalOrders}
          </div>
          <div className="text-[11px] text-[#13487E] font-medium">
            {pendingOrders} awaiting action
          </div>
        </div>

        {/* Total Products */}
        <div className="p-4 rounded-2xl bg-[#0d0d12] border border-neutral-800/80 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Products</span>
            <div className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-['Space_Grotesk']">
            {totalProducts}
          </div>
          <div className="text-[11px] text-neutral-400">
            {activeProducts} active in store
          </div>
        </div>

        {/* Total Categories */}
        <div className="p-4 rounded-2xl bg-[#0d0d12] border border-neutral-800/80 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-bold uppercase tracking-wider">Categories</span>
            <div className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-['Space_Grotesk']">
            {totalCategories}
          </div>
          <div className="text-[11px] text-neutral-400">
            Active departments
          </div>
        </div>

        {/* Total Customers */}
        <div className="p-4 rounded-2xl bg-[#0d0d12] border border-neutral-800/80 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-bold uppercase tracking-wider">Customers</span>
            <div className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-['Space_Grotesk']">
            {totalCustomers}
          </div>
          <div className="text-[11px] text-neutral-400">
            Registered buyers
          </div>
        </div>
      </div>

      {/* 6 Order Status Breakdown Cards */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400">
          Order Status Breakdown
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Pending */}
          <div
            onClick={() => onNavigate('/admin/orders')}
            className="p-3.5 rounded-xl bg-neutral-900/60 border border-amber-900/40 hover:border-amber-600/80 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-amber-400 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Pending
              </span>
            </div>
            <div className="text-xl font-black text-white font-mono">{pendingOrders}</div>
            <div className="text-[10px] text-neutral-500 mt-1">Requires review</div>
          </div>

          {/* Confirmed */}
          <div
            onClick={() => onNavigate('/admin/orders')}
            className="p-3.5 rounded-xl bg-neutral-900/60 border border-sky-900/40 hover:border-sky-600/80 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-sky-400 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Confirmed
              </span>
            </div>
            <div className="text-xl font-black text-white font-mono">{confirmedOrders}</div>
            <div className="text-[10px] text-neutral-500 mt-1">Order accepted</div>
          </div>

          {/* Processing */}
          <div
            onClick={() => onNavigate('/admin/orders')}
            className="p-3.5 rounded-xl bg-neutral-900/60 border border-purple-900/40 hover:border-purple-600/80 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-purple-400 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> Processing
              </span>
            </div>
            <div className="text-xl font-black text-white font-mono">{processingOrders}</div>
            <div className="text-[10px] text-neutral-500 mt-1">Packaging in progress</div>
          </div>

          {/* Shipped */}
          <div
            onClick={() => onNavigate('/admin/orders')}
            className="p-3.5 rounded-xl bg-neutral-900/60 border border-blue-900/40 hover:border-blue-600/80 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-blue-400 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" /> Shipped
              </span>
            </div>
            <div className="text-xl font-black text-white font-mono">{shippedOrders}</div>
            <div className="text-[10px] text-neutral-500 mt-1">With courier partner</div>
          </div>

          {/* Delivered */}
          <div
            onClick={() => onNavigate('/admin/orders')}
            className="p-3.5 rounded-xl bg-neutral-900/60 border border-emerald-900/40 hover:border-emerald-600/80 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Delivered
              </span>
            </div>
            <div className="text-xl font-black text-white font-mono">{deliveredOrders}</div>
            <div className="text-[10px] text-neutral-500 mt-1">Successfully fulfilled</div>
          </div>

          {/* Cancelled */}
          <div
            onClick={() => onNavigate('/admin/orders')}
            className="p-3.5 rounded-xl bg-neutral-900/60 border border-red-900/40 hover:border-red-600/80 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-red-400 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" /> Cancelled
              </span>
            </div>
            <div className="text-xl font-black text-white font-mono">{cancelledOrders}</div>
            <div className="text-[10px] text-neutral-500 mt-1">Voided or returned</div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert if any */}
      {lowStockProducts.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                Inventory Alert: {lowStockProducts.length} product(s) low on stock
              </h4>
              <p className="text-xs text-neutral-400 mt-0.5">
                {lowStockProducts.map((p) => `${p.name} (${p.stock} left)`).join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('/admin/products')}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-bold transition-colors whitespace-nowrap"
          >
            Restock
          </button>
        </div>
      )}

      {/* Two Column Layout: Recent Orders & Best Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders (2 cols) */}
        <div className="lg:col-span-2 bg-[#0d0d12] border border-neutral-800/80 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Recent Orders
            </h3>
            <button
              onClick={() => onNavigate('/admin/orders')}
              className="text-xs text-[#13487E] hover:underline flex items-center gap-1 font-semibold"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 text-xs">
              No orders placed yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Order ID</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Items</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-neutral-900/50 transition-colors">
                      <td className="py-3 font-mono font-bold text-[#13487E]">
                        {order.id}
                      </td>
                      <td className="py-3">
                        <div className="font-semibold text-white">{order.customer_name}</div>
                        <div className="text-[10px] text-neutral-500 font-mono">{order.customer_phone}</div>
                      </td>
                      <td className="py-3 text-neutral-300">
                        {order.items.reduce((s, i) => s + i.quantity, 0)} pcs
                      </td>
                      <td className="py-3 font-mono font-bold text-white">
                        {formatBDT(order.total)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                            order.order_status
                          )}`}
                        >
                          {order.order_status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onNavigate(`/admin/orders/${order.id}`)}
                          className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors text-[11px]"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Best Selling Products (1 col) */}
        <div className="bg-[#0d0d12] border border-neutral-800/80 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Top Selling Drops
            </h3>
            <span className="text-[10px] font-mono text-neutral-500">By Units Sold</span>
          </div>

          {bestSellers.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 text-xs">
              No sales data accumulated yet.
            </div>
          ) : (
            <div className="space-y-3">
              {bestSellers.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2 rounded-xl bg-neutral-950/60 border border-neutral-800/60"
                >
                  <span className="w-5 text-center font-mono font-black text-xs text-[#13487E]">
                    #{idx + 1}
                  </span>
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-900 flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                    <p className="text-[10px] text-neutral-400">
                      {item.count} units sold · {formatBDT(item.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
