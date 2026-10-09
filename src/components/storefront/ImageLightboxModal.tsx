import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, ShoppingBag, Eye, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../../types';
import { formatBDT } from '../../utils/bangladesh';
import { useLanguage } from '../../context/LanguageContext';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  product?: Product;
  onNavigateProduct?: (productId: string) => void;
  onBuyNow?: (product: Product, quantity: number) => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  product,
  onNavigateProduct,
  onBuyNow,
}) => {
  const { t, language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Sync initialIndex whenever opened
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, images.length - 1)));
      setZoomLevel(1);
    }
  }, [isOpen, initialIndex, images.length]);

  // Handle keyboard shortcuts (Esc to close, Left/Right arrows to navigate)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
        setZoomLevel(1);
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
        setZoomLevel(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images.length, onClose]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setZoomLevel(1);
  }, [images.length]);

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setZoomLevel(1);
  }, [images.length]);

  const toggleZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => {
      if (prev === 1) return 1.6;
      if (prev === 1.6) return 2.2;
      return 1;
    });
  };

  if (!isOpen || images.length === 0) return null;

  const currentImageUrl = images[currentIndex] || images[0];
  const displayPrice = product ? (product.discount_price ?? product.price) : null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/95 backdrop-blur-md select-none touch-none"
        onClick={onClose}
      >
        {/* Top Control Bar */}
        <div 
          className="w-full max-w-7xl px-4 py-3 sm:py-4 flex items-center justify-between z-20 text-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Image Counter & Product Name */}
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-mono font-bold text-neutral-300">
              {currentIndex + 1} / {images.length}
            </span>
            {product && (
              <span className="hidden sm:inline-block text-sm font-bold text-neutral-200 line-clamp-1 max-w-md">
                {product.name}
              </span>
            )}
          </div>

          {/* Action Tools: Zoom & Close */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleZoom}
              className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 text-neutral-300 hover:text-white hover:border-[#13487E] transition-all flex items-center gap-1.5 text-xs font-bold"
              title={zoomLevel > 1 ? t('zoom_out') : t('zoom_in')}
              aria-label="Toggle Zoom"
            >
              {zoomLevel > 1 ? <ZoomOut className="w-4 h-4 text-[#13487E]" /> : <ZoomIn className="w-4 h-4" />}
              <span className="hidden sm:inline">{zoomLevel > 1 ? `${zoomLevel}x` : t('zoom_in')}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-red-500/20 hover:border-red-500/40 transition-all"
              title={t('close')}
              aria-label="Close image modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Central Image Viewport (Responsive PC & Mobile) */}
        <div 
          className="relative flex-1 w-full max-w-6xl flex items-center justify-center p-2 sm:p-6 overflow-hidden"
          onClick={onClose}
        >
          {/* Previous Arrow */}
          {images.length > 1 && (
            <button
              onClick={handlePrev}
              className="absolute left-2 sm:left-6 z-20 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-black/60 hover:bg-[#13487E] text-white border border-neutral-700/80 flex items-center justify-center transition-all backdrop-blur-sm shadow-xl hover:scale-105 active:scale-95"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
            </button>
          )}

          {/* Main Image Container */}
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => {
              e.stopPropagation();
              toggleZoom(e);
            }}
            className="relative flex items-center justify-center max-w-full max-h-full cursor-zoom-in"
            style={{
              cursor: zoomLevel > 1 ? 'zoom-out' : 'zoom-in',
            }}
          >
            <img
              src={currentImageUrl}
              alt={product?.name || 'Product Image Preview'}
              className="max-h-[70vh] sm:max-h-[76vh] w-auto max-w-[95vw] sm:max-w-[85vw] object-contain rounded-xl shadow-2xl transition-transform duration-300"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center center',
              }}
              draggable={false}
            />
          </motion.div>

          {/* Next Arrow */}
          {images.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-2 sm:right-6 z-20 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-black/60 hover:bg-[#13487E] text-white border border-neutral-700/80 flex items-center justify-center transition-all backdrop-blur-sm shadow-xl hover:scale-105 active:scale-95"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
            </button>
          )}
        </div>

        {/* Bottom Bar: Thumbnails & Product Quick Action */}
        <div 
          className="w-full max-w-5xl px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Thumbnails Row if multiple */}
          {images.length > 1 ? (
            <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1 px-2 scrollbar-hide">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setZoomLevel(1);
                  }}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                    currentIndex === idx
                      ? 'border-[#13487E] scale-105 shadow-md shadow-[#13487E]/30'
                      : 'border-neutral-800 opacity-50 hover:opacity-100 hover:border-neutral-600'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <div className="hidden sm:block text-xs text-neutral-500 font-mono">
              {product?.sku ? `SKU: ${product.sku}` : "Jakariya's Mart"}
            </div>
          )}

          {/* Bottom Action for Product (Quick buy / View details) */}
          {product && (
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {displayPrice !== null && (
                <div className="text-right mr-1">
                  <div className="text-sm sm:text-base font-black text-white font-['Space_Grotesk']">
                    {formatBDT(displayPrice)}
                  </div>
                  {product.discount_price && product.discount_price < product.price && (
                    <div className="text-[10px] text-neutral-500 line-through">
                      {formatBDT(product.price)}
                    </div>
                  )}
                </div>
              )}

              {onNavigateProduct && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateProduct(product.id);
                  }}
                  className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-neutral-200 hover:text-white transition-all flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{t('view_details')}</span>
                </button>
              )}

              {onBuyNow && product.stock > 0 && (
                <button
                  onClick={() => {
                    onClose();
                    onBuyNow(product, 1);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#13487E] hover:bg-[#0d3a66] text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-[#13487E]/30 flex items-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{t('buy_now')}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </AnimatePresence>
  );
};
