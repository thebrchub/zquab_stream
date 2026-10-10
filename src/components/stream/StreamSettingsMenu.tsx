import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Monitor, Zap, PictureInPicture, Flag, 
  ChevronRight, ArrowLeft, Check 
} from 'lucide-react';

interface StreamSettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  quality: string;
  setQuality: (quality: string) => void;
  isLowLatency: boolean;
  setIsLowLatency: (val: boolean) => void;
  onPiP: () => void;
  onReport: () => void;
//   onBlock: () => void;
}

const QUALITIES = ['Auto', '1080p', '720p', '480p', '360p'];

export const StreamSettingsMenu: React.FC<StreamSettingsMenuProps> = ({
  isOpen,
  onClose,
  quality,
  setQuality,
  isLowLatency,
  setIsLowLatency,
  onPiP,
  onReport,
//   onBlock
}) => {
  const [activeMenu, setActiveMenu] = useState<'main' | 'quality'>('main');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
        setTimeout(() => setActiveMenu('main'), 300); // Reset after closing animation
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Reset to main menu when reopened
  useEffect(() => {
    if (isOpen) setActiveMenu('main');
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="absolute bottom-[calc(100%+12px)] right-0 w-64 bg-zinc-950/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto z-50 origin-bottom-right"
          onClick={(e) => e.stopPropagation()} // Prevent triggering video play/pause
        >
          {activeMenu === 'main' ? (
            <div className="flex flex-col py-2">
              {/* Playback Settings */}
              <div className="px-3 pb-2 mb-2 border-b border-white/10">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2">Playback</span>
                
                <button 
                  onClick={() => setActiveMenu('quality')}
                  className="w-full mt-1 flex items-center justify-between px-2 py-2 rounded-lg hover:bg-white/10 transition-colors text-zinc-200"
                >
                  <div className="flex items-center gap-2.5">
                    <Monitor className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm font-semibold">Quality</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-zinc-400 font-medium">{quality}</span>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </div>
                </button>

                <button 
                  onClick={() => setIsLowLatency(!isLowLatency)}
                  className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-white/10 transition-colors text-zinc-200"
                >
                  <div className="flex items-center gap-2.5">
                    <Zap className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm font-semibold">Low Latency</span>
                  </div>
                  {/* Toggle Switch UI */}
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${isLowLatency ? 'bg-emerald-500' : 'bg-zinc-600'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${isLowLatency ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </button>

                <button 
                  onClick={() => { onPiP(); onClose(); }}
                  className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/10 transition-colors text-zinc-200"
                >
                  <PictureInPicture className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm font-semibold">Picture-in-Picture</span>
                </button>
              </div>

              {/* Trust & Safety Settings */}
              <div className="px-3 pb-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2">Safety</span>
                
                <button 
                  onClick={() => { onReport(); onClose(); }}
                  className="w-full mt-1 flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors text-zinc-300"
                >
                  <Flag className="w-4 h-4" />
                  <span className="text-sm font-semibold">Report Stream</span>
                </button>

                {/* <button 
                  onClick={() => { onBlock(); onClose(); }}
                  className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors text-zinc-300"
                >
                  <Ban className="w-4 h-4" />
                  <span className="text-sm font-semibold">Block Creator</span>
                </button> */}
              </div>
            </div>
          ) : (
            <div className="flex flex-col py-2">
              <div className="flex items-center gap-2 px-3 pb-2 mb-2 border-b border-white/10">
                <button 
                  onClick={() => setActiveMenu('main')}
                  className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-zinc-400 hover:text-zinc-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold text-zinc-200">Video Quality</span>
              </div>
              
              <div className="px-2">
                {QUALITIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => { setQuality(q); onClose(); }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-zinc-200"
                  >
                    <span className={`text-sm ${quality === q ? 'font-bold text-indigo-400' : 'font-medium'}`}>
                      {q}
                    </span>
                    {quality === q && <Check className="w-4 h-4 text-indigo-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};