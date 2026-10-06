import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NeonLoaderProps {
  isLoading: boolean;
}

export const NeonLoader: React.FC<NeonLoaderProps> = ({ isLoading }) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] bg-[#000000] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Particles Background */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * window.innerWidth, 
                  y: Math.random() * window.innerHeight,
                  opacity: 0 
                }}
                animate={{ 
                  y: [null, Math.random() * -100 - 50],
                  opacity: [0, 0.4, 0],
                  scale: [0, 1, 0]
                }}
                transition={{ 
                  duration: Math.random() * 2 + 2, 
                  repeat: Infinity,
                  ease: "linear",
                  delay: Math.random() * 2
                }}
                className="absolute w-1 h-1 bg-[#f97316] rounded-full blur-[1px]"
              />
            ))}
          </div>

          {/* Glowing Ring */}
          <div className="relative flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-48 h-48 sm:w-64 sm:h-64 rounded-full border-2 border-[#f97316]/20 border-t-[#f97316] shadow-[0_0_15px_rgba(249,115,22,0.3),inset_0_0_15px_rgba(249,115,22,0.3)] relative"
            >
              {/* Extra glow layer */}
              <div className="absolute -inset-1 rounded-full border border-[#f97316]/40 blur-sm" />
            </motion.div>

            {/* Logo in Middle */}
            <div className="absolute flex flex-col items-center justify-center gap-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#13487E] to-[#0d3a66] flex items-center justify-center shadow-[0_0_30px_rgba(19,72,126,0.5)] font-black text-white text-3xl sm:text-4xl tracking-tighter">
                  J
                </div>
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="text-xl sm:text-2xl font-black tracking-tight text-white font-['Space_Grotesk'] text-center whitespace-nowrap drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                >
                  Jakariya's Mart
                </motion.span>
              </motion.div>
            </div>
          </div>

          {/* Bottom Bar Decoration */}
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100px" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute bottom-12 h-[2px] bg-gradient-to-r from-transparent via-[#f97316] to-transparent shadow-[0_0_10px_#f97316]"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
