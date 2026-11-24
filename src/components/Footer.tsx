import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { theme } = useTheme();

  return (
    <footer className="hidden sm:block w-full pb-6 pt-8 lg:pb-6 lg:pt-10 bg-transparent">
      <div className="mx-4 md:mx-8 lg:mx-12">
        <div className="relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] bg-[var(--card)] border border-[var(--border-color)] shadow-xl shadow-black/5 dark:shadow-black/20 pt-10 lg:pt-12 px-8 sm:px-10 lg:px-14 flex flex-col">
          {/* Top content */}
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center lg:items-start gap-8 lg:gap-10 mb-6 lg:mb-5">
            {/* Brand */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <Link to="/" aria-label="Home" className="flex items-center gap-3 mb-4 group">
                <img
                  src="/logo1.webp"
                  width="72"
                  height="72"
                  alt="zQuab Logo"
                  className="h-16 lg:h-[4.5rem] w-auto object-contain group-hover:scale-105 transition-transform duration-300"
                />
                <span className="font-bold text-3xl lg:text-[2.15rem] tracking-tight text-[var(--text-main)]">
                  zQuab
                </span>
              </Link>

              <p className="text-[var(--text-muted)] text-sm max-w-xs mb-5 leading-relaxed">
                Connect with random people worldwide in milliseconds. Pure, unfiltered conversation. No signup required.
              </p>

              {/* Social links */}
              <div className="flex items-center gap-3 mb-5">
                <a
                  href="https://www.instagram.com/zquab.app?igsh=a3BrNnFyZHJ5Yjkx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-[var(--background)] border border-[var(--border-color)] rounded-full hover:border-[#E1306C]/30 hover:bg-[#E1306C]/10 transition-all active:scale-95 flex items-center justify-center"
                  aria-label="Instagram"
                >
                  <img src="/insta.svg" alt="Instagram" className="w-6 h-6 object-contain opacity-80 hover:opacity-100 transition-opacity" />
                </a>
                <a
                  href="https://x.com/zquabapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-[var(--background)] border border-[var(--border-color)] rounded-full hover:border-gray-500/30 hover:bg-[var(--text-main)]/5 transition-all active:scale-95 flex items-center justify-center"
                  aria-label="X (formerly Twitter)"
                >
                  <img
                    src={theme === 'dark' ? '/x-w.svg' : '/x.svg'}
                    alt="X"
                    className="w-6 h-6 object-contain opacity-80 hover:opacity-100 transition-opacity"
                  />
                </a>
                <a
                  href="https://www.reddit.com/r/zQuabChat/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-[var(--background)] border border-[var(--border-color)] rounded-full hover:border-[#FF4500]/30 hover:bg-[#FF4500]/10 transition-all active:scale-95 flex items-center justify-center"
                  aria-label="Reddit"
                >
                  <img src="/red.svg" alt="Reddit" className="w-6 h-6 object-contain opacity-80 hover:opacity-100 transition-opacity" />
                </a>
              </div>

              <p className="text-[11px] lg:text-xs text-[var(--text-muted)]/60 font-bold uppercase tracking-widest">
                &copy; {currentYear} zQuab. All rights reserved.
              </p>
            </div>

            {/* Footer navigation */}
            <div className="flex flex-wrap justify-center lg:justify-end gap-x-7 gap-y-3 text-xs lg:text-sm font-bold tracking-wide uppercase text-[var(--text-muted)]">
              <Link to="/about" aria-label="About" className="hover:text-[#3B82F6] transition-colors">About</Link>
              <Link to="/safety" aria-label="Account Safety" className="hover:text-[#3B82F6] transition-colors">Safety</Link>
              <Link to="/privacy" aria-label="Privacy Policy" className="hover:text-[#3B82F6] transition-colors">Privacy</Link>
              <Link to="/terms" aria-label="Terms of Use" className="hover:text-[#3B82F6] transition-colors">Terms</Link>
              <Link to="/contact" aria-label="Contact Section" className="hover:text-[#3B82F6] transition-colors">Contact</Link>
            </div>
          </div>

          {/* Decorative watermark: constrained so it doesn't dictate the footer height */}
          <div className="h-28 lg:h-36 w-full flex justify-center items-end overflow-hidden pointer-events-none select-none">
            <span className="translate-y-[20%] text-[clamp(8rem,17vw,15rem)] font-black leading-[0.72] tracking-tighter text-[var(--text-main)] opacity-[0.055] dark:opacity-[0.045]">
              zQuab
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
