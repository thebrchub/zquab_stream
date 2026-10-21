import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

interface StreamOverlayAdProps {
  brandName: string;
  message: string;
  linkUrl: string;
  duration?: number; // Duration in seconds
  onComplete: () => void;
}

export const StreamOverlayAd: React.FC<StreamOverlayAdProps> = ({
  brandName,
  message,
  linkUrl,
  duration = 5,
  onComplete
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute bottom-24 right-4 lg:right-6 w-72 bg-[#0c0c0e]/95 backdrop-blur-xl border border-indigo-500/30 rounded-2xl shadow-[8px_8px_20px_rgba(0,0,0,0.6),-2px_-2px_8px_rgba(255,255,255,0.02),inset_1px_1px_2px_rgba(255,255,255,0.05),inset_-1px_-1px_2px_rgba(0,0,0,0.3)] overflow-hidden z-40 pointer-events-auto flex flex-col"
    >
      <div className="p-3.5 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-300 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-indigo-500/20 drop-shadow-sm">Sponsored</span>
            <span className="text-sm font-black text-white drop-shadow-sm">{brandName}</span>
          </div>
          {/* Numeric Timer */}
          <span className="text-[10px] font-mono font-bold text-zinc-400 bg-black/40 px-1.5 py-0.5 rounded border border-white/5">
            0:0{timeLeft}
          </span>
        </div>
        
        <p className="text-xs text-zinc-300 leading-snug mb-3 font-medium">
          {message}
        </p>
        
        <a 
          href={linkUrl} 
          target="_blank" 
          rel="noreferrer" 
          className="flex items-center justify-center gap-1.5 w-full py-2 bg-[#4F46E5] hover:brightness-110 text-white text-xs font-bold rounded-xl transition-all shadow-[2px_2px_5px_rgba(0,0,0,0.4),inset_1px_1px_2px_rgba(255,255,255,0.2),inset_-1px_-1px_2px_rgba(0,0,0,0.3)] active:scale-[0.98] border-none"
        >
          View Offer <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
      
      {/* Animated Progress Bar */}
      <div className="w-full h-1 bg-black/40">
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: duration, ease: 'linear' }}
          className="h-full bg-gradient-to-r from-indigo-400 to-blue-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"
        />
      </div>
    </motion.div>
  );
};