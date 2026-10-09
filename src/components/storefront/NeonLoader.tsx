import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface NeonLoaderProps {
  isLoading: boolean;
}

export const NeonLoader: React.FC<NeonLoaderProps> = ({ isLoading }) => {
  const [progress, setProgress] = useState(0);

  // Smoothly increment progress to 100% in 1.5 seconds
  useEffect(() => {
    if (!isLoading) return;
    const startTime = Date.now();
    const duration = 1450; // ms (1.5 seconds)

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);
      if (pct >= 100) clearInterval(interval);
    }, 25);

    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[9999] bg-[#070709] flex flex-col items-center justify-center overflow-hidden select-none"
        >
          {/* Subtle Cyber Grid Background & Radial Ambient Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(19,72,126,0.25)_0%,rgba(7,7,9,0.95)_70%)] pointer-events-none" />
          
          <div 
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #38bdf8 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Central Unique Animated Cyber Crest */}
          <div className="relative flex flex-col items-center justify-center z-10">
            {/* Outer Rotating Cyber Hexagonal Rings */}
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
              {/* Spinning gradient ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-3xl border-2 border-transparent border-t-[#38bdf8] border-r-[#13487E] shadow-[0_0_30px_rgba(56,189,248,0.3)]"
                style={{
                  borderRadius: '32%',
                }}
              />

              {/* Counter-rotating dashed geometric accent */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-2 rounded-2xl border border-dashed border-[#13487E]/60"
                style={{
                  borderRadius: '28%',
                }}
              />

              {/* Central Glowing Monogram Badge */}
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: [0.9, 1.05, 1], opacity: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[#13487E] via-[#0d3a66] to-[#0a192f] border border-[#38bdf8]/50 shadow-[0_0_35px_rgba(19,72,126,0.7)] flex items-center justify-center overflow-hidden group"
              >
                {/* Diagonal Laser Light Sweep */}
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                />

                {/* Iconic 'J' Brand Monogram */}
                <span className="text-4xl sm:text-5xl font-black text-white font-['Space_Grotesk'] tracking-tighter drop-shadow-[0_2px_15px_rgba(56,189,248,0.8)]">
                  J
                </span>
              </motion.div>
            </div>

            {/* Typography & Brand Reveal */}
            <div className="mt-6 flex flex-col items-center space-y-2">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#38bdf8] animate-pulse" />
                <h1 className="text-xl sm:text-2xl font-black tracking-[0.25em] text-white font-['Space_Grotesk'] uppercase drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                  Jakariya's Mart
                </h1>
                <Sparkles className="w-3.5 h-3.5 text-[#38bdf8] animate-pulse" />
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="text-[10px] sm:text-xs font-mono font-bold tracking-[0.3em] uppercase text-neutral-400"
              >
                Premium Official Store
              </motion.p>
            </div>

            {/* 1-Second Progress Meter & Telemetry HUD */}
            <div className="mt-5 w-48 sm:w-56 flex flex-col items-center space-y-1.5">
              <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800 p-[1px]">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#13487E] via-[#0284c7] to-[#38bdf8] rounded-full shadow-[0_0_12px_rgba(56,189,248,0.9)]"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: 'linear' }}
                />
              </div>

              <div className="w-full flex items-center justify-between text-[10px] font-mono font-bold text-neutral-500">
                <span className="tracking-widest">AUTHENTICATING</span>
                <span className="text-[#38bdf8] font-black">{progress}%</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
