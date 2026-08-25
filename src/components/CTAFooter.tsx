import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';

export default function CTAFooter() {
  const currentYear = new Date().getFullYear();
  const { theme } = useTheme();

  return (
    <section className="relative w-full overflow-hidden bg-[var(--background)] flex flex-col items-center pb-8 transition-colors duration-300">
      
      {/* =========================================
          1. MASSIVE PLANETARY BACKGROUND
          ========================================= */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[250vw] md:w-[150vw] min-w-[1200px] pointer-events-none z-0">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg viewBox="0 0 1600 2000" className="w-full h-auto">
            <defs>
              <linearGradient id="planet-fill" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.15" />
                <stop offset="15%" style={{ stopColor: 'var(--background)' }} stopOpacity="0.8" />
                <stop offset="30%" style={{ stopColor: 'var(--background)' }} stopOpacity="1" />
                <stop offset="100%" style={{ stopColor: 'var(--background)' }} stopOpacity="1" />
              </linearGradient>

              <linearGradient id="atmosphere-glow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="25%" stopColor="#3B82F6" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.9" />
                <stop offset="75%" stopColor="#3B82F6" stopOpacity="0.5" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>

              <linearGradient id="core-highlight" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="40%" stopColor="rgba(255,255,255,0.4)" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="60%" stopColor="rgba(255,255,255,0.4)" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>

            <path
              d="M -400,2000 L -400,400 Q 800,-200 2000,400 L 2000,2000 Z"
              fill="url(#planet-fill)"
            />
            
            <path
              d="M -400,400 Q 800,-200 2000,400"
              fill="none"
              stroke="url(#atmosphere-glow)"
              strokeWidth="24"
              className="blur-[12px]"
            />
            
            <path
              d="M -400,400 Q 800,-200 2000,400"
              fill="none"
              stroke="url(#atmosphere-glow)"
              strokeWidth="6"
              className="blur-[2px]"
            />
            
            <path
              d="M -400,400 Q 800,-200 2000,400"
              fill="none"
              stroke="url(#core-highlight)"
              strokeWidth="2"
            />
          </svg>
        </motion.div>
      </div>

      {/* =========================================
          2. FOREGROUND CONTENT
          ========================================= */}
      <div className="relative z-10 w-full px-4 md:px-8 lg:px-12 flex flex-col items-center pt-32 md:pt-48">
        
        <div className="w-full max-w-4xl mx-auto text-center flex flex-col items-center mb-24 md:mb-32">
          {/* 
            The updated, original zQuab copy.
            Removed the 'uppercase' class to allow natural sentence casing.
          */}
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-10 text-[var(--text-main)] tracking-tight leading-[1.1] drop-shadow-xl"
          >
            You found the bottom.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-indigo-500">
              Now find your crew.
            </span>
          </motion.h2>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            {/* Claymorphism Button */}
            <Link 
              to="/chat"
              aria-label="Chat"
              className="group relative inline-flex items-center gap-3 px-10 py-5 rounded-3xl font-bold text-white bg-[#4F46E5] text-lg md:text-xl transition-transform active:scale-95 shadow-[8px_8px_16px_rgba(0,0,0,0.5),-4px_-4px_12px_rgba(255,255,255,0.05),inset_4px_4px_8px_rgba(255,255,255,0.3),inset_-4px_-4px_8px_rgba(0,0,0,0.4)] hover:shadow-[6px_6px_12px_rgba(0,0,0,0.5),-3px_-3px_10px_rgba(255,255,255,0.05),inset_3px_3px_6px_rgba(255,255,255,0.3),inset_-3px_-3px_6px_rgba(0,0,0,0.4)]"
            >
              Start Chatting Now
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {/* =========================================
            3. THE BOXED FOOTER SECTION
            ========================================= */}
        <div className="relative w-full overflow-hidden rounded-[2.5rem] md:rounded-[3rem] bg-[var(--card)] border border-[var(--border-color)] shadow-xl shadow-black/5 dark:shadow-black/20 pt-16 px-8 sm:px-12 lg:px-16 flex flex-col backdrop-blur-xl mx-auto">
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center lg:items-start gap-12 mb-8">
            
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <Link to="/" aria-label="Home" className="flex items-center gap-3 mb-5 group">
                <img 
                  src="/logo1.webp" 
                  width="84"
                  height="84"
                  alt="zQuab Logo" 
                  className="h-20 w-auto object-contain group-hover:scale-105 transition-transform duration-300" 
                />
                <span className="font-bold text-4xl tracking-tight text-[var(--text-main)]">
                  zQuab
                </span>
              </Link>
              <p className="text-[var(--text-muted)] text-sm max-w-xs mb-6 leading-relaxed">
                Connect with random people worldwide in milliseconds. Pure, unfiltered conversation. No signup required.
              </p>

              {/* Social Links Section */}
              <div className="flex items-center gap-3 mb-6">
                <a 
                  href="https://www.instagram.com/zquab.app?igsh=a3BrNnFyZHJ5Yjkx" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2.5 bg-[var(--background)] border border-[var(--border-color)] rounded-full hover:border-[#E1306C]/30 hover:bg-[#E1306C]/10 transition-all active:scale-95 flex items-center justify-center"
                  aria-label="Instagram"
                >
                  <img 
                    src="/insta.svg" 
                    alt="Instagram" 
                    className="w-7 h-7 object-contain opacity-80 hover:opacity-100 transition-opacity" 
                  />
                </a>
                <a 
                  href="https://x.com/zquabapp" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2.5 bg-[var(--background)] border border-[var(--border-color)] rounded-full hover:border-gray-500/30 hover:bg-[var(--text-main)]/5 transition-all active:scale-95 flex items-center justify-center"
                  aria-label="X (formerly Twitter)"
                >
                  <img 
                    src={theme === 'dark' ? '/x-w.svg' : '/x.svg'} 
                    alt="X" 
                    className="w-7 h-7 object-contain opacity-80 hover:opacity-100 transition-opacity" 
                  />
                </a>
                <a 
                  href="https://www.reddit.com/r/zQuabChat/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2.5 bg-[var(--background)] border border-[var(--border-color)] rounded-full hover:border-[#FF4500]/30 hover:bg-[#FF4500]/10 transition-all active:scale-95 flex items-center justify-center"
                  aria-label="Reddit"
                >
                  <img 
                    src="/red.svg" 
                    alt="Reddit" 
                    className="w-7 h-7 object-contain opacity-80 hover:opacity-100 transition-opacity" 
                  />
                </a>
              </div>
              <p className="text-xs text-[var(--text-muted)]/60 font-bold uppercase tracking-widest">
                &copy; {currentYear} zQuab. All rights reserved.
              </p>
            </div>

            <div className="flex flex-wrap justify-center lg:justify-end gap-x-8 gap-y-4 text-sm font-bold tracking-wide uppercase text-[var(--text-muted)]">
              <Link to="/about" aria-label="About"className="hover:text-[#3B82F6] transition-colors">About</Link>
              <Link to="/safety" aria-label="User Safety" className="hover:text-[#3B82F6] transition-colors">Safety</Link>
              <Link to="/privacy" aria-label="Privacy Policy" className="hover:text-[#3B82F6] transition-colors">Privacy</Link>
              <Link to="/terms" aria-label="Terms of Use" className="hover:text-[#3B82F6] transition-colors">Terms</Link>
              <Link to="/contact" aria-label="Contact Section" className="hover:text-[#3B82F6] transition-colors">Contact</Link>
            </div>
            
          </div>

          <div className="w-full flex justify-center pointer-events-none select-none translate-y-[22%]">
            <span className="text-[22vw] font-black leading-none tracking-tighter text-[var(--text-main)] opacity-[0.03] dark:opacity-[0.02]">
              zQuab
            </span>
          </div>
          
        </div>

      </div>
    </section>
  );
}