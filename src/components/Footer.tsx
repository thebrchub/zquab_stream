import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

export default function Footer() {
  const currentYear = new Date().getFullYear();
    const { theme } = useTheme();

  return (
    <footer className="w-full pb-8 pt-12 bg-transparent">
      {/* Fluid margins matching the Hero and CTA sections */}
      <div className="mx-4 md:mx-8 lg:mx-12">
        
        {/* Box Container */}
        <div className="relative overflow-hidden rounded-[2.5rem] md:rounded-[3rem] bg-[var(--card)] border border-[var(--border-color)] shadow-xl shadow-black/5 dark:shadow-black/20 pt-16 px-8 sm:px-12 lg:px-16 flex flex-col">
          
          {/* Top Content: Logo, Description, Links */}
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center lg:items-start gap-12 mb-8">
            
            {/* Left side: Brand Identity */}
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
  // 🛠️ Changed hover colors from Reddit Orange to a clean, neutral X theme
  className="p-2.5 bg-[var(--background)] border border-[var(--border-color)] rounded-full hover:border-gray-500/30 hover:bg-[var(--text-main)]/5 transition-all active:scale-95 flex items-center justify-center"
  aria-label="X (formerly Twitter)"
>
  <img 
    // 🛠️ Automatically switches: x-w.svg (White) for Dark Mode, x.svg (Dark) for Light Mode
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

            {/* Right side: Nav Links */}
            <div className="flex flex-wrap justify-center lg:justify-end gap-x-8 gap-y-4 text-sm font-bold tracking-wide uppercase text-[var(--text-muted)]">
              <Link to="/about" aria-label="About" className="hover:text-[#3B82F6] transition-colors">About</Link>
              <Link to="/safety" aria-label="Account Safety" className="hover:text-[#3B82F6] transition-colors">Safety</Link>
              <Link to="/privacy" aria-label="Privacy Policy" className="hover:text-[#3B82F6] transition-colors">Privacy</Link>
              <Link to="/terms" aria-label="Terms of Use" className="hover:text-[#3B82F6] transition-colors">Terms</Link>
              <Link to="/contact" aria-label="Contact Section" className="hover:text-[#3B82F6] transition-colors">Contact</Link>
            </div>
            
          </div>

          {/* Faded Giant Block Name at the Bottom */}
          <div className="w-full flex justify-center pointer-events-none select-none translate-y-[22%]">
            <span className="text-[22vw] font-black leading-none tracking-tighter text-[var(--text-main)] opacity-[0.03] dark:opacity-[0.02]">
              zQuab
            </span>
          </div>
          
        </div>
      </div>
    </footer>
  );
}