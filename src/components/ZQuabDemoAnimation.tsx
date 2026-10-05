import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Compass, Gift, Users, ChevronRight, User } from 'lucide-react';

const MOCK_CHAT = [
  { user: 'SarahD', text: 'This looks amazing!', color: 'text-blue-400' },
  { user: 'AlexC', text: 'How do I join the queue?', color: 'text-purple-400' },
  { user: 'Ninja22', text: '🔥 🔥 🔥', color: 'text-orange-400' },
];

export default function ZQuabDemoAnimation() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const cycle = setInterval(() => {
      setStep((prev) => (prev >= 5 ? 0 : prev + 1));
    }, 2500); 
    
    return () => clearInterval(cycle);
  }, []);

  return (
    // 🛠️ FIX: Removed outer borders, shadows, and rounded corners. Made it 100% width/height.
    <div className="w-full h-full flex flex-col select-none bg-[var(--background)] relative">
      
      {/* MOCK NAVBAR - Height slightly reduced to fit preview windows better */}
      <div className="h-10 sm:h-12 border-b border-[var(--border-color)] flex items-center justify-between px-4 sm:px-6 bg-[var(--card)]/80 backdrop-blur-md relative z-20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-[#3B82F6] to-cyan-400 flex items-center justify-center text-white font-bold text-[10px] sm:text-xs">zQ</div>
          <span className="font-bold text-sm sm:text-base tracking-tight text-[var(--text-main)]">zQuab</span>
        </div>

        {/* Center Pill */}
        <div className="hidden md:flex items-center bg-[var(--background)] border border-[var(--border-color)] px-1 py-1 rounded-full shadow-[inset_1px_1px_3px_rgba(0,0,0,0.1)] scale-90">
          <div className="relative px-4 py-1 rounded-full text-xs font-bold text-[var(--text-main)] overflow-hidden">
            <motion.div 
              animate={{ opacity: step === 1 ? 1 : 0 }}
              className="absolute inset-0 bg-[#3B82F6]/20 z-0"
            />
            <span className="relative z-10 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#3B82F6]" /> Watch Live
            </span>
          </div>
          <div className="px-4 py-1 text-xs font-bold text-[var(--text-muted)]">Creators</div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[var(--background)] flex items-center justify-center border border-[var(--border-color)] text-[var(--text-muted)]"><Search className="w-3 h-3" /></div>
          <div className="h-6 sm:h-7 px-3 sm:px-4 rounded-full bg-[#3B82F6] flex items-center justify-center text-white font-bold text-[10px] sm:text-xs shadow-sm">Start Chat</div>
        </div>
      </div>

      {/* DYNAMIC CONTENT AREA */}
      <div className="flex-1 relative overflow-hidden bg-[var(--background)]">
        <AnimatePresence mode="wait">
          
          {/* STEP 0-1: Empty/Idle State */}
          {step <= 1 && (
            <motion.div 
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center px-4"
            >
              <motion.div 
                animate={{ scale: step === 1 ? 1.05 : 1 }}
                transition={{ duration: 1, ease: "easeInOut" }}
                className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4"
              >
                <Compass className="w-8 h-8 text-[#3B82F6]" />
              </motion.div>
              <h2 className="text-xl font-black text-[var(--text-main)] mb-1">Discover Live Rooms</h2>
              <p className="text-[var(--text-muted)] text-xs max-w-xs">Join real-time conversations, watch creators, and request 1-on-1 sessions instantly.</p>
            </motion.div>
          )}

          {/* STEP 2-5: Live Stream Interface */}
          {step >= 2 && step <= 5 && (
            <motion.div 
              key="stream"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute inset-0 flex p-2 sm:p-4 gap-2 sm:gap-4"
            >
              {/* Left: Video Area */}
              <div className="flex-1 rounded-xl sm:rounded-[1.5rem] bg-[var(--card)] border border-[var(--border-color)] overflow-hidden relative shadow-[inset_1px_1px_4px_rgba(0,0,0,0.1)] flex items-center justify-center">
                
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 to-black z-0" />
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-[#3B82F6] to-purple-500 p-1 shadow-2xl relative z-10"
                >
                  <div className="w-full h-full bg-[var(--card)] rounded-full flex items-center justify-center border-2 border-transparent">
                    <User className="w-6 h-6 sm:w-8 sm:h-8 text-white/50" />
                  </div>
                </motion.div>

                {/* Live Indicator */}
                <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-20 flex items-center gap-1.5 bg-red-500/20 backdrop-blur-md px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-red-500/30">
                  <motion.div 
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" 
                  />
                  <span className="text-[8px] sm:text-[10px] font-black text-red-500 uppercase tracking-widest">Live</span>
                </div>

                {/* Viewer Count */}
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-white/10">
                  <Users className="w-3 h-3 text-white/70" />
                  <span className="text-[10px] sm:text-xs font-bold text-white/90">1,204</span>
                </div>

                {/* 1-on-1 Highlight */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: step >= 4 ? 0 : 20, opacity: step >= 4 ? 1 : 0 }}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-[#3B82F6] text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-full font-bold text-[10px] sm:text-xs shadow-[0_4px_12px_rgba(59,130,246,0.4)] flex items-center gap-1.5 whitespace-nowrap"
                >
                  Request 1-on-1 <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </motion.div>

                {/* Gift Overlay */}
                <AnimatePresence>
                  {step === 4 && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0, y: 30, x: '-50%' }}
                      animate={{ scale: [0, 1.2, 1], opacity: 1, y: 0, x: '-50%' }}
                      exit={{ scale: 0, opacity: 0, y: -30, x: '-50%' }}
                      transition={{ duration: 0.5, type: "spring" }}
                      className="absolute top-1/4 left-1/2 flex flex-col items-center gap-1.5 z-30 pointer-events-none"
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-500/20 backdrop-blur-xl border border-amber-500/50 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                        <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                      </div>
                      <span className="text-amber-400 font-black text-[10px] sm:text-xs drop-shadow-md whitespace-nowrap">Ninja22 sent a Gift!</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right: Chat Sidebar */}
              <div className="w-40 sm:w-56 rounded-xl sm:rounded-[1.5rem] bg-[var(--card)] border border-[var(--border-color)] flex flex-col shadow-[inset_1px_1px_4px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="p-2 sm:p-3 border-b border-[var(--border-color)]">
                  <h3 className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Live Chat</h3>
                </div>
                
                <div className="flex-1 p-2 sm:p-3 flex flex-col justify-end gap-2 overflow-hidden">
                  <AnimatePresence>
                    {step >= 3 && MOCK_CHAT.slice(0, step - 1).map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.15 }}
                        className="bg-[var(--background)] px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg border border-[var(--border-color)] text-[10px] sm:text-xs leading-tight"
                      >
                        <span className={`font-bold ${msg.color} mr-1.5`}>{msg.user}</span>
                        <span className="text-[var(--text-main)]">{msg.text}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="p-2 border-t border-[var(--border-color)] hidden sm:block">
                  <div className="bg-[var(--background)] rounded-full h-8 border border-[var(--border-color)] px-3 flex items-center shadow-[inset_1px_1px_3px_rgba(0,0,0,0.05)]">
                    <span className="text-[var(--text-muted)] text-[10px] font-medium">Say something...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Simulated Animated Cursor */}
      <motion.div
        initial={{ x: '50%', y: '80%', opacity: 0 }}
        animate={{
          x: step === 0 ? '50%' : step === 1 ? '50%' : step === 3 ? '85%' : '50%',
          y: step === 0 ? '80%' : step === 1 ? '10%' : step === 3 ? '60%' : '80%',
          opacity: 1
        }}
        transition={{ duration: 1, ease: "easeInOut" }}
        className="absolute w-4 h-4 sm:w-5 sm:h-5 z-50 pointer-events-none drop-shadow-xl"
        style={{ left: 0, top: 0 }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="drop-shadow-md">
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" fill="black" />
        </svg>
      </motion.div>
    </div>
  );
}