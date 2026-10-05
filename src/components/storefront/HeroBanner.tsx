import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const HeroBanner: React.FC = () => {
  const { banners } = useStore();
  const activeBanners = banners
    .filter((b) => b.is_active)
    .sort((a, b) => a.display_order - b.display_order);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  if (activeBanners.length === 0) return null;

  const currentBanner = activeBanners[currentIndex] || activeBanners[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  return (
    <div className="relative w-full overflow-hidden bg-neutral-950 border-b border-neutral-800">
      <div className="relative max-w-7xl mx-auto min-h-[380px] sm:min-h-[460px] lg:min-h-[520px] flex items-center">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={currentBanner.image_url}
            alt={currentBanner.title}
            className="w-full h-full object-cover object-center brightness-50 contrast-125 transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-[#0a0a0c]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-2xl px-6 py-16 sm:px-12 sm:py-24 space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-[#13487E]">
            <span className="w-2 h-2 rounded-full bg-[#13487E] animate-ping" />
            <span>Featured Release</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase font-['Space_Grotesk'] leading-[1.05]">
            {currentBanner.title}
          </h1>

          <p className="text-neutral-300 text-sm sm:text-base max-w-lg leading-relaxed">
            {currentBanner.subtitle}
          </p>

          <div className="pt-2 flex items-center gap-4">
            <a
              href={currentBanner.button_url || '#catalog'}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#13487E] hover:bg-[#0d3a66] text-white font-extrabold text-sm uppercase tracking-wider transition-all shadow-lg shadow-[#13487E]/25 transform hover:-translate-y-0.5"
            >
              <span>{currentBanner.button_text || 'Shop Now'}</span>
              <ArrowUpRight className="w-4 h-4 text-black stroke-[2.5]" />
            </a>
          </div>
        </div>

        {/* Slider Controls */}
        {activeBanners.length > 1 && (
          <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="w-10 h-10 rounded-lg bg-neutral-900/80 backdrop-blur border border-neutral-700 flex items-center justify-center text-white hover:text-[#13487E] hover:border-[#13487E] transition-colors"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-neutral-900/80 backdrop-blur rounded-lg border border-neutral-700 text-xs font-mono text-neutral-300">
              <span className="text-[#13487E] font-bold">{currentIndex + 1}</span>
              <span>/</span>
              <span>{activeBanners.length}</span>
            </div>
            <button
              onClick={handleNext}
              className="w-10 h-10 rounded-lg bg-neutral-900/80 backdrop-blur border border-neutral-700 flex items-center justify-center text-white hover:text-[#13487E] hover:border-[#13487E] transition-colors"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
