import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://api.zquab.com';

export default function OnlineCounter() {
  const [count, setCount] = useState<number | null>(null);
  const [status, setStatus] = useState<'loading' | 'online' | 'error'>('loading');

  useEffect(() => {
    let isMounted = true;

    const fetchOnlineCount = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/v1/online`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        if (isMounted) {
          const onlineCount = data.count ?? data.online ?? data; 
          setCount(Number(onlineCount));
          setStatus('online');
        }
      } catch (error) {
        if (isMounted) {
          setStatus('error');
        }
      }
    };

    fetchOnlineCount();
    const intervalId = setInterval(fetchOnlineCount, 30_000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-[var(--card)]/80 backdrop-blur-md border border-[var(--border-color)] shadow-sm inline-flex"
    >
      <div className="relative flex items-center justify-center w-3 h-3">
        {status === 'online' ? (
          <>
            <div className="absolute w-full h-full bg-[#22C55E] rounded-full animate-ping opacity-75" />
            <div className="relative w-2 h-2 bg-[#22C55E] rounded-full shadow-[0_0_8px_#22C55E]" />
          </>
        ) : status === 'error' ? (
          <div className="relative w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_#EF4444]" />
        ) : (
          <div className="relative w-2 h-2 bg-[var(--text-muted)] rounded-full animate-pulse" />
        )}
      </div>

      <div className="text-sm font-medium text-[var(--text-muted)] flex items-center">
        {/* 🛠️ THE MERGE: Static branding part */}
        <strong className="text-[var(--text-main)] font-bold tracking-wide mr-2">zQuab</strong>
        <span className="opacity-30 mr-2">•</span>
        
        {/* Dynamic status part */}
        <AnimatePresence mode="wait">
          {status === 'loading' && (
            <motion.span 
              key="loading" 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              Connecting...
            </motion.span>
          )}
          
          {status === 'error' && (
            <motion.span 
              key="error" 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-red-500/90"
            >
              Offline
            </motion.span>
          )}
          
          {status === 'online' && count !== null && (
            <motion.span 
              key="online" 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <strong className="text-[var(--text-main)] font-bold tracking-wide">
                {new Intl.NumberFormat('en-US').format(count)}
              </strong> online
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}