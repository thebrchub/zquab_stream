import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X as CloseIcon, Check } from 'lucide-react'; // 🛠️ Aliased to CloseIcon to avoid confusion with X
import { useTheme } from '../hooks/useTheme'; // 🛠️ Added theme hook

const COOLDOWN_DAYS = 3;
const LOCAL_STORAGE_KEY = 'zquab_social_last_shown';
const SESSION_STORAGE_KEY = 'zquab_social_prompt_shown';

export default function SocialPromoBanner() {
  const { theme } = useTheme(); // 🛠️ Get current theme
  const [isVisible, setIsVisible] = useState(false);
  
  const [clickedInsta, setClickedInsta] = useState(false);
  const [clickedReddit, setClickedReddit] = useState(false);
  const [clickedX, setClickedX] = useState(false); // 🛠️ Added X state

  useEffect(() => {
    const handleMockBanner = () => setIsVisible(true);
    window.addEventListener('dev_mock_social_banner', handleMockBanner);

    let timer: number;
    if (!sessionStorage.getItem(SESSION_STORAGE_KEY)) {
      const lastShownStr = localStorage.getItem(LOCAL_STORAGE_KEY);
      let shouldShow = true;
      
      if (lastShownStr) {
        const lastShownMs = parseInt(lastShownStr, 10);
        const daysSince = (Date.now() - lastShownMs) / (1000 * 60 * 60 * 24);
        if (daysSince < COOLDOWN_DAYS) shouldShow = false;
      }

      if (shouldShow) {
        timer = window.setTimeout(() => setIsVisible(true), 5000);
      }
    }

    return () => {
      window.removeEventListener('dev_mock_social_banner', handleMockBanner);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
    localStorage.setItem(LOCAL_STORAGE_KEY, Date.now().toString());
  };

  // 🛠️ Updated link handler to track all 3 platforms
  const handleLinkClick = (platform: 'insta' | 'reddit' | 'x') => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
    localStorage.setItem(LOCAL_STORAGE_KEY, Date.now().toString());

    if (platform === 'insta') {
      setClickedInsta(true);
      if (clickedReddit && clickedX) setIsVisible(false);
    } else if (platform === 'reddit') {
      setClickedReddit(true); // 🛠️ THE FIX IS HERE
      if (clickedInsta && clickedX) setIsVisible(false);
    } else {
      setClickedX(true);
      if (clickedInsta && clickedReddit) setIsVisible(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-[100] w-[calc(100vw-32px)] md:w-80 bg-[var(--card)] border border-[var(--border-color)] shadow-2xl rounded-2xl p-4 flex flex-col gap-3"
        >
          <button 
            aria-label="Dismiss"
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1.5 text-[var(--text-muted)] hover:bg-[var(--background)] rounded-full transition-colors"
          >
            <CloseIcon className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 pr-6">
            
            {/* 🛠️ Added the 3rd overlapping avatar for X */}
            <div className="flex -space-x-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md overflow-hidden border-2 border-[var(--card)] z-30">
                <img src="/insta.svg" alt="Instagram" className="w-5 h-5 object-contain" />
              </div>
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md overflow-hidden border-2 border-[var(--card)] z-20">
                <img src="/red.svg" alt="Reddit" className="w-5 h-5 object-contain" />
              </div>
              <div className="w-8 h-8 rounded-full bg-[var(--background)] flex items-center justify-center shadow-md overflow-hidden border-2 border-[var(--card)] z-10">
                <img src={theme === 'dark' ? '/x-w.svg' : '/x.svg'} alt="X" className="w-4 h-4 object-contain opacity-90" />
              </div>
            </div>

            <div>
              {/* 🛠️ Accessibility Fix: Changed h4 to p */}
              <p className="font-bold text-[var(--text-main)] text-sm">Join the zQuab Army!</p>
              <p className="text-[11px] text-[var(--text-muted)] leading-tight mt-0.5">
                Follow us for wild updates, features, and sneak peeks.
              </p>
            </div>
          </div>

          {/* 🛠️ Changed to a 3-column grid */}
          <div className="grid grid-cols-3 gap-1.5 mt-1">
            <a 
              href="https://instagram.com/zquab.app" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => handleLinkClick('insta')}
              className={`flex items-center justify-center gap-1 py-2 text-white rounded-xl text-xs font-bold transition-all shadow-sm ${
                clickedInsta 
                  ? 'bg-zinc-500/50 opacity-50 cursor-default' 
                  : 'bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 hover:opacity-90'
              }`}
            >
              {clickedInsta ? <Check className="w-3.5 h-3.5" /> : null}
              {clickedInsta ? 'Visited' : 'Insta'} {/* Shortened to fit 3 cols */}
            </a>
            
            <a 
              href="https://reddit.com/r/zquabchat" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => handleLinkClick('reddit')}
              className={`flex items-center justify-center gap-1 py-2 text-white rounded-xl text-xs font-bold transition-all shadow-sm ${
                clickedReddit 
                  ? 'bg-zinc-500/50 opacity-50 cursor-default' 
                  : 'bg-[#FF4500] hover:opacity-90'
              }`}
            >
              {clickedReddit ? <Check className="w-3.5 h-3.5" /> : null}
              {clickedReddit ? 'Visited' : 'Reddit'}
            </a>

            {/* 🛠️ New X Button */}
            <a 
              href="https://x.com/zquabapp" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => handleLinkClick('x')}
              className={`flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                clickedX 
                  ? 'bg-zinc-500/50 text-white opacity-50 cursor-default' 
                  : 'bg-[#14171A] text-white dark:bg-white dark:text-black hover:opacity-90'
              }`}
            >
              {clickedX ? <Check className="w-3.5 h-3.5" /> : null}
              {clickedX ? 'Visited' : 'X (Twitter)'}
            </a>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}