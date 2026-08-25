import { motion, AnimatePresence } from 'framer-motion';
import { Video, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function EarlyAccessModal({ isOpen, onClose }: Props) {
  const navigate = useNavigate();

  const handleGoToWaitlist = () => {
    onClose();
    navigate('/early-access');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6">
          
          {/* Deep Cinematic Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl"
          />

          {/* Premium Modal Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] bg-[#09090b] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] z-10"
          >
            {/* Atmospheric Glow Effects */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-600/30 blur-[80px] pointer-events-none rounded-full" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-600/20 blur-[80px] pointer-events-none rounded-full" />

            <button
              aria-label="Close"
              onClick={onClose}
              className="absolute top-5 right-5 z-20 rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative pt-12 pb-8 px-8 flex flex-col items-center z-10">
              
              {/* Stand-alone Glowing Icon */}
              <div className="relative mb-8 group cursor-default">
                <div className="absolute inset-0 bg-blue-500 blur-xl opacity-40 animate-pulse rounded-full" />
                <div className="relative w-20 h-20 bg-black border border-white/10 rounded-[1.5rem] flex items-center justify-center shadow-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                  <Video className="w-9 h-9 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                </div>
              </div>

              {/* Minimalist Badge */}
              <div className="mb-5 rounded-full border border-blue-500/40 bg-blue-500/10 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                Early Access Initiated
              </div>

              <h2 className="text-center text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40 mb-3 leading-none">
                Video Chat is Here.
              </h2>

              <p className="text-center text-[15px] text-white/60 font-medium leading-relaxed mb-10 px-2">
                Spots are strictly limited. Claim your rank in the queue, or <span className="text-white font-bold drop-shadow-md">jump the line entirely</span> by inviting a friend.
              </p>

              <div className="w-full flex flex-col gap-4">
                {/* Premium CTA Button */}
                <button
                  onClick={handleGoToWaitlist}
                  className="relative w-full overflow-hidden rounded-2xl bg-white text-black font-black text-[17px] py-4 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] active:scale-95 transition-all group"
                >
                  {/* Subtle shine sweep effect on hover */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                  <span className="relative z-10 flex items-center justify-center gap-2 tracking-tight">
                    Secure My VIP Pass <span className="text-xl leading-none relative -top-[1px]">➔</span>
                  </span>
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-2 text-xs font-bold text-white/30 hover:text-white/80 transition-colors tracking-wide"
                >
                  I'll wait for the public release
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}