import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useTheme } from '../../context/ThemeContext';
import { Banner } from '../../types';

export const HeroBanner: React.FC = () => {
  const { banners } = useStore();
  const { isDark } = useTheme();

  const activeBanners = banners
    .filter((b) => b.is_active)
    .sort((a, b) => a.display_order - b.display_order);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const hasMovedRef = useRef<boolean>(false);

  const handleNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    },
    [activeBanners.length]
  );

  const handlePrev = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
    },
    [activeBanners.length]
  );

  // Auto-play slideshow timer (slides every 4.5s unless hovered or dragging)
  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused || isDragging) return;
    const interval = setInterval(() => {
      handleNext();
    }, 4500);
    return () => clearInterval(interval);
  }, [activeBanners.length, isPaused, isDragging, handleNext]);

  if (activeBanners.length === 0) return null;

  const currentBanner = activeBanners[currentIndex] || activeBanners[0];

  const handleBannerClick = (banner: Banner) => {
    // Prevent accidental click during drag gesture
    if (hasMovedRef.current) return;

    if (banner.button_url) {
      if (banner.button_url.startsWith('#')) {
        const target = document.querySelector(banner.button_url);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }
      if (banner.button_url.startsWith('http')) {
        window.location.href = banner.button_url;
      } else {
        window.location.hash = banner.button_url;
      }
    }
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (activeBanners.length <= 1) return;
    setIsDragging(true);
    hasMovedRef.current = false;
    startXRef.current = e.touches[0].clientX;
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || activeBanners.length <= 1) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    if (Math.abs(diff) > 5) {
      hasMovedRef.current = true;
    }
    // Dampen drag at boundaries if needed or allow responsive shift
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const threshold = 40; // minimum swipe distance in px
    if (dragOffset < -threshold) {
      handleNext();
    } else if (dragOffset > threshold) {
      handlePrev();
    }
    setDragOffset(0);
    setTimeout(() => {
      hasMovedRef.current = false;
    }, 50);
  };

  // Mouse drag handlers for desktop smooth dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeBanners.length <= 1) return;
    setIsDragging(true);
    hasMovedRef.current = false;
    startXRef.current = e.clientX;
    setDragOffset(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || activeBanners.length <= 1) return;
    const diff = e.clientX - startXRef.current;
    if (Math.abs(diff) > 5) {
      hasMovedRef.current = true;
    }
    setDragOffset(diff);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const threshold = 40;
    if (dragOffset < -threshold) {
      handleNext();
    } else if (dragOffset > threshold) {
      handlePrev();
    }
    setDragOffset(0);
    setTimeout(() => {
      hasMovedRef.current = false;
    }, 50);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragOffset(0);
    }
    setIsPaused(false);
  };

  return (
    <div className={`w-full ${isDark ? 'bg-[#0a0a0c]' : 'bg-slate-50'} py-2 sm:py-4 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div
          ref={containerRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`relative w-full overflow-hidden rounded-xl sm:rounded-2xl shadow-sm transition-all duration-300 select-none ${
            currentBanner.button_url ? 'cursor-pointer' : 'cursor-grab'
          } ${isDragging ? 'cursor-grabbing' : ''} ${
            isDark
              ? 'bg-neutral-900 border border-neutral-800/80 shadow-black/40'
              : 'bg-white border border-slate-200/90 shadow-slate-200/50'
          }`}
        >
          {/* Sliding Slideshow Track: ultra-smooth horizontal translation */}
          <div className="relative w-full aspect-[2.4/1] sm:aspect-[3/1] overflow-hidden bg-neutral-900">
            <div
              className={`flex w-full h-full ${
                isDragging
                  ? 'transition-none'
                  : 'transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]'
              }`}
              style={{
                transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
              }}
            >
              {activeBanners.map((banner, idx) => (
                <div
                  key={banner.id || idx}
                  onClick={() => handleBannerClick(banner)}
                  className="min-w-full w-full h-full flex-shrink-0 relative select-none overflow-hidden"
                >
                  <img
                    src={banner.image_url || 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=1920&h=640&auto=format&fit=crop&q=80'}
                    alt={banner.title || `Promotion Banner ${idx + 1}`}
                    className="w-full h-full object-cover object-center select-none pointer-events-none transition-transform duration-700"
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    draggable={false}
                  />
                  {/* Subtle dark gradient overlay on bottom for dot indicator readability */}
                  <div className="absolute inset-x-0 bottom-0 h-16 sm:h-20 bg-gradient-to-t from-black/50 via-black/20 to-transparent pointer-events-none" />
                </div>
              ))}
            </div>
          </div>

          {/* Slider Arrows (Only if multiple banners exist) */}
          {activeBanners.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className={`absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all z-20 backdrop-blur-md active:scale-95 ${
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
                className={`absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all z-20 backdrop-blur-md active:scale-95 ${
                  isDark
                    ? 'bg-black/50 text-white hover:bg-black/80 border border-white/10'
                    : 'bg-white/80 text-slate-800 hover:bg-white border border-slate-300/80 shadow-sm'
                }`}
                aria-label="Next Banner"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </button>

              {/* Indicator Dots */}
              <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 z-20 px-3 py-1.5 rounded-full backdrop-blur-md bg-black/40 border border-white/10 shadow-lg">
                {activeBanners.map((b, idx) => (
                  <button
                    key={b.id || idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(idx);
                    }}
                    className={`h-1.5 sm:h-2 rounded-full transition-all duration-500 ${
                      currentIndex === idx
                        ? 'w-6 sm:w-8 bg-blue-500 shadow-sm shadow-blue-500/50'
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
