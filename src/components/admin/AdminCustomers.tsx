import React, { useState } from 'react';
import {
  Search,
  User,
  Phone,
  Mail,
  ShoppingBag,
  DollarSign,
  Calendar,
  MapPin,
  X,
  ArrowUpRight,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Customer } from '../../types';
import { formatBDT } from '../../utils/bangladesh';

interface AdminCustomersProps {
  onNavigate: (path: string) => void;
}

export const AdminCustomers: React.FC<AdminCustomersProps> = ({ onNavigate }) => {
  const { customers, orders, settings } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filteredCustomers = customers.filter((cust) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      cust.name.toLowerCase().includes(q) ||
      cust.phone.toLowerCase().includes(q) ||
      (cust.email && cust.email.toLowerCase().includes(q))
    );
  });

  // Orders for selected customer
  const customerOrders = selectedCustomer
    ? orders.filter(
        (o) =>
          o.customer_phone === selectedCustomer.phone ||
          (selectedCustomer.email && o.customer_email === selectedCustomer.email) ||
          o.customer_name.toLowerCase() === selectedCustomer.name.toLowerCase()
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-['Space_Grotesk'] tracking-tight">
            CUSTOMER PROFILES
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            View buyer history, aggregate lifetime spends, and order track records.
          </p>
        </div>

        <div className="text-xs font-mono text-neutral-400">
          Total: <strong className="text-white">{customers.length}</strong> unique customers
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-[#0d0d12] border border-neutral-800/80 rounded-2xl p-4">
        <div className="relative max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone or email..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#13487E]"
          />
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-[#0d0d12] border border-neutral-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/60 text-neutral-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Phone Number</th>
                <th className="py-3.5 px-4">Email Address</th>
                <th className="py-3.5 px-4">Total Orders</th>
                <th className="py-3.5 px-4">Total Spent</th>
                <th className="py-3.5 px-4">Last Order</th>
                <th className="py-3.5 px-4 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    No customers found matching search query.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const lastDate = new Date(cust.last_order_date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={cust.id}
                      onClick={() => setSelectedCustomer(cust)}
                      className="hover:bg-neutral-900/50 transition-colors cursor-pointer group"
                    >
                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white font-bold text-xs uppercase">
                            {cust.name[0] || 'C'}
                          </div>
                          <div>
                            <span className="font-bold text-white group-hover:text-[#13487E] transition-colors">
                              {cust.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-mono text-neutral-300">
                        {cust.phone}
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 text-neutral-400">
                        {cust.email || <span className="text-neutral-600">—</span>}
                      </td>

                      {/* Total orders */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 font-mono font-bold text-neutral-200">
                          {cust.total_orders} {cust.total_orders === 1 ? 'order' : 'orders'}
                        </span>
                      </td>

                      {/* Total spent */}
                      <td className="py-3.5 px-4 font-mono font-black text-white">
                        {formatBDT(cust.total_spent)}
                      </td>

                      {/* Last order date */}
                      <td className="py-3.5 px-4 text-neutral-400 whitespace-nowrap">
                        {lastDate}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(cust);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-[#13487E] border border-neutral-800 text-xs font-semibold transition-colors"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Profile Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-2xl bg-[#0d0d12] border border-neutral-800 rounded-2xl p-6 space-y-6 shadow-2xl text-neutral-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#13487E]/10 border border-[#13487E]/30 text-[#13487E] flex items-center justify-center font-black text-lg">
                  {selectedCustomer.name[0]}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white font-['Space_Grotesk']">
                    {selectedCustomer.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-neutral-400 mt-0.5">
                    <span>{selectedCustomer.phone}</span>
                    {selectedCustomer.email && (
                      <>
                        <span>·</span>
                        <span>{selectedCustomer.email}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stat summaries */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
                <span className="text-[10px] uppercase font-bold text-neutral-400">
                  Total Orders
                </span>
                <div className="text-xl font-black text-white font-mono mt-1">
                  {selectedCustomer.total_orders}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
                <span className="text-[10px] uppercase font-bold text-neutral-400">
                  Lifetime Value
                </span>
                <div className="text-xl font-black text-[#13487E] font-mono mt-1">
                  {formatBDT(selectedCustomer.total_spent)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
                <span className="text-[10px] uppercase font-bold text-neutral-400">
                  Last Active
                </span>
                <div className="text-xs font-bold text-neutral-200 mt-2 truncate">
                  {new Date(selectedCustomer.last_order_date).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Address */}
            {selectedCustomer.address && (
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#13487E] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-neutral-300">Default Shipping Address:</span>
                  <div className="text-neutral-400 mt-0.5">{selectedCustomer.address}</div>
                </div>
              </div>
            )}

            {/* Previous Orders */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Order History ({customerOrders.length})
              </h4>

              <div className="space-y-2">
                {customerOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs hover:border-neutral-700 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#13487E]">{ord.id}</span>
                        <span className="text-neutral-400">·</span>
                        <span className="text-neutral-300">
                          {new Date(ord.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {ord.items.map((i) => `${i.product_name} (x${i.quantity})`).join(', ')}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-mono font-bold text-white">
                          {formatBDT(ord.total)}
                        </div>
                        <span className="text-[10px] font-bold text-neutral-400">
                          {ord.order_status}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedCustomer(null);
                          onNavigate(`/admin/orders/${ord.id}`);
                        }}
                        className="p-1 text-neutral-400 hover:text-white"
                        title="View Order Details"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-bold text-neutral-300 transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
