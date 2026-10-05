import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Users, Video,  RefreshCw, Lock, Zap } from 'lucide-react';

export default function EcosystemAnimation({ id }: { id: number }) {
  const [step, setStep] = useState(0);

  // Infinite loop timing (Loops every 4 seconds)
  useEffect(() => {
    const cycle = setInterval(() => {
      setStep((prev) => (prev >= 4 ? 0 : prev + 1));
    }, 1500); 
    return () => clearInterval(cycle);
  }, []);

  // ----------------------------------------------------
  // ANIMATION 1: LIVE STREAMS
  // ----------------------------------------------------
  if (id === 1) {
    return (
      <div className="w-full h-full flex p-3 sm:p-4 gap-3 sm:gap-4 bg-[var(--background)]">
        {/* Abstract Video Box */}
        <div className="flex-1 rounded-[1.25rem] bg-gradient-to-br from-indigo-900/40 to-black relative overflow-hidden border border-[var(--border-color)]">
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500/20 backdrop-blur-md px-2 py-1 rounded-full border border-red-500/30">
            <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Live</span>
          </div>
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full border border-white/10">
            <Users className="w-3 h-3 text-white/70" />
            <span className="text-[10px] font-bold text-white/90">1.2k</span>
          </div>

          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#3B82F6] to-purple-500 p-0.5 opacity-50">
              <div className="w-full h-full bg-[var(--card)] rounded-full flex items-center justify-center"><Video className="w-6 h-6 text-white/30" /></div>
            </div>
          </motion.div>

          <AnimatePresence>
            {step === 3 && (
              <motion.div
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: [0, 1.2, 1], opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30"
              >
                <div className="w-12 h-12 bg-amber-500/20 backdrop-blur-md border border-amber-500/50 rounded-full flex items-center justify-center">
                  <Gift className="w-6 h-6 text-amber-400" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Abstract Chat Box */}
        <div className="w-1/3 rounded-[1.25rem] bg-[var(--card)] border border-[var(--border-color)] flex flex-col p-2 gap-2 overflow-hidden shadow-[inset_1px_1px_4px_rgba(0,0,0,0.05)]">
          <div className="flex-1 flex flex-col justify-end gap-2 overflow-hidden pb-1">
            <AnimatePresence>
              {step >= 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-6 w-3/4 bg-[var(--background)] rounded-md border border-[var(--border-color)]" />
              )}
              {step >= 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-6 w-full bg-[#3B82F6]/10 rounded-md border border-[#3B82F6]/20" />
              )}
              {step >= 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-6 w-5/6 bg-[var(--background)] rounded-md border border-[var(--border-color)]" />
              )}
            </AnimatePresence>
          </div>
          <div className="h-6 rounded-full bg-[var(--background)] border border-[var(--border-color)] opacity-50" />
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ANIMATION 2: 1-ON-1 INTERACTION
  // ----------------------------------------------------
  if (id === 2) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-[var(--background)] relative">
        <AnimatePresence mode="wait">
          {step <= 1 ? (
             <motion.div key="searching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3">
               <RefreshCw className="w-8 h-8 text-[#3B82F6] animate-spin" />
               <div className="h-2 w-24 bg-[var(--border-color)] rounded-full" />
             </motion.div>
          ) : (
            <motion.div key="connected" className="flex items-center gap-2 sm:gap-4 w-full h-full">
              {/* Caller */}
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-1 h-full rounded-[1.25rem] bg-[var(--card)] border border-[var(--border-color)] flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
                <div className="w-10 h-10 rounded-full bg-[#3B82F6]/20 flex items-center justify-center mb-2"><User className="w-5 h-5 text-[#3B82F6]" /></div>
                <div className="h-1.5 w-12 bg-[var(--border-color)] rounded-full" />
              </motion.div>
              
              {/* Lock/Timer Center */}
              <div className="w-8 h-8 rounded-full bg-[#4ade80]/10 border border-[#4ade80]/30 flex items-center justify-center z-10 shrink-0">
                <Lock className="w-4 h-4 text-[#4ade80]" />
              </div>

              {/* Receiver */}
              <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-1 h-full rounded-[1.25rem] bg-[var(--card)] border border-[var(--border-color)] flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mb-2"><User className="w-5 h-5 text-purple-500" /></div>
                <div className="h-1.5 w-12 bg-[var(--border-color)] rounded-full" />
                
                {/* zCoin Transfer Animation */}
                <AnimatePresence>
                  {step === 3 && (
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: -20, opacity: 1 }} exit={{ opacity: 0 }} className="absolute top-1/2 flex items-center gap-1 bg-amber-500/20 px-2 py-0.5 rounded-full">
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span className="text-[10px] font-bold text-amber-500">+150</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ----------------------------------------------------
  // ANIMATION 3: STRANGER CHAT
  // ----------------------------------------------------
  return (
    <div className="w-full h-full flex flex-col p-4 bg-[var(--background)] overflow-hidden">
      <div className="flex justify-center mb-4">
        <motion.div 
          animate={{ opacity: step === 0 ? 1 : 0 }} 
          className="h-2 w-32 bg-[var(--border-color)] rounded-full" 
        />
        <motion.div 
          animate={{ opacity: step > 0 ? 1 : 0 }} 
          className="absolute h-2 w-24 bg-[#4ade80]/20 rounded-full" 
        />
      </div>

      <div className="flex-1 flex flex-col gap-3 justify-end pb-4">
        <AnimatePresence>
          {step >= 1 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
              className="self-start bg-[var(--card)] border border-[var(--border-color)] h-8 w-2/3 rounded-[1rem] rounded-bl-sm"
            />
          )}
          {step >= 2 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
              className="self-end bg-gradient-to-b from-[#3B82F6] to-[#2563EB] h-12 w-3/4 rounded-[1rem] rounded-br-sm shadow-[inset_0px_1px_2px_rgba(255,255,255,0.3)]"
            />
          )}
          {step >= 3 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
              className="self-start bg-[var(--card)] border border-[var(--border-color)] h-8 w-1/2 rounded-[1rem] rounded-bl-sm"
            />
          )}
        </AnimatePresence>
      </div>
      
      {/* Input / Next Button Area */}
      <div className="flex gap-2">
        <div className="flex-1 h-8 rounded-full bg-[var(--card)] border border-[var(--border-color)]" />
        <motion.div 
          animate={{ rotate: step === 4 ? 360 : 0, scale: step === 4 ? 0.9 : 1 }}
          transition={{ duration: 0.5 }}
          className="w-8 h-8 rounded-full bg-[var(--card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </motion.div>
      </div>
    </div>
  );
}

function User(props: any) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}