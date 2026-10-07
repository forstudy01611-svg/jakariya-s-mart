import React from 'react';
import { X } from 'lucide-react';
import { Order, StoreSettings } from '../../types';
import { InvoiceDocument } from './InvoiceDocument';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  settings: StoreSettings;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  order,
  settings,
}) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#0a0a0d] border border-neutral-800 rounded-3xl p-4 sm:p-6 shadow-2xl my-auto max-h-[95vh] overflow-y-auto">
        {/* Modal Close Button */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800">
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <span>Customer Invoice Receipt</span>
            <span className="font-mono text-xs text-[#13487E] bg-[#13487E]/10 px-2 py-0.5 rounded">#{order.id}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Document Component */}
        <InvoiceDocument order={order} settings={settings} showActions={true} />
      </div>
    </div>
  );
};
