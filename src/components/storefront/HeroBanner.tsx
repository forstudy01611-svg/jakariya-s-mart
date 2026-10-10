import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useTheme } from '../../context/ThemeContext';

export const HeroBanner: React.FC = () => {
  const { banners } = useStore();
  const { isDark } = useTheme();

  const activeBanners = banners
    .filter((b) => b.is_active)
    .sort((a, b) => a.display_order - b.display_order);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeBanners.length, isPaused]);

  if (activeBanners.length === 0) return null;

  const currentBanner = activeBanners[currentIndex] || activeBanners[0];

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const handleBannerClick = () => {
    if (currentBanner.button_url) {
      if (currentBanner.button_url.startsWith('#')) {
        const target = document.querySelector(currentBanner.button_url);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }
      if (currentBanner.button_url.startsWith('http')) {
        window.location.href = currentBanner.button_url;
      } else {
        window.location.hash = currentBanner.button_url;
      }
    }
  };

  return (
    <div className={`w-full ${isDark ? 'bg-[#0a0a0c]' : 'bg-slate-50'} py-2 sm:py-4 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onClick={handleBannerClick}
          className={`relative w-full overflow-hidden rounded-xl sm:rounded-2xl shadow-sm transition-all duration-300 ${
            currentBanner.button_url ? 'cursor-pointer' : ''
          } ${
            isDark
              ? 'bg-neutral-900 border border-neutral-800/80 shadow-black/40'
              : 'bg-white border border-slate-200/90 shadow-slate-200/50'
          }`}
        >
          {/* Banner Image - Clean 3:1 presentation without text or headline overlays */}
          <div className="relative w-full aspect-[3/1] overflow-hidden">
            <img
              src={currentBanner.image_url}
              alt="Store Promotion Banner"
              className="w-full h-full object-cover object-center transition-all duration-700 ease-out select-none"
              loading="eager"
            />
          </div>

          {/* Slider Arrows (Only if multiple banners exist) */}
          {activeBanners.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className={`absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all z-10 backdrop-blur-md ${
                  isDark
                    ? 'bg-black/50 text-white hover:bg-black/80 border border-white/10'
                    : 'bg-white/80 text-slate-800 hover:bg-white border border-slate-300/80 shadow-sm'
                }`}
                aria-label="Previous Banner"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                className={`absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all z-10 backdrop-blur-md ${
                  isDark
                    ? 'bg-black/50 text-white hover:bg-black/80 border border-white/10'
                    : 'bg-white/80 text-slate-800 hover:bg-white border border-slate-300/80 shadow-sm'
                }`}
                aria-label="Next Banner"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </button>

              {/* Indicator Dots */}
              <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 z-10 px-2 py-1 rounded-full backdrop-blur-md bg-black/30">
                {activeBanners.map((b, idx) => (
                  <button
                    key={b.id || idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(idx);
                    }}
                    className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                      currentIndex === idx
                        ? 'w-6 sm:w-8 bg-white'
                        : 'w-1.5 sm:w-2 bg-white/50 hover:bg-white/80'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
