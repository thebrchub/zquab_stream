// src/components/ComparisonSection.tsx

import { 
  CheckCircle2, 
  XCircle, 
  Flame 
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function ComparisonSection() {
  return (
    <section className="w-full max-w-6xl mx-auto py-24 px-4 md:px-8 z-20 relative bg-[var(--background)]">
      <div className="text-center mb-16">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-[var(--text-main)] tracking-tight"
        >
          Built different. <span className="text-[#3B82F6]">Built for humans.</span>
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-[var(--text-muted)] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
        >
          Most random chat platforms haven't evolved in a decade. Here is how zQuab is redefining the stranger chat experience.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-stretch">
        
        {/* The Competitors (Outdated Stranger Chat Apps) */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="bg-[var(--card)] border border-[var(--border-color)] rounded-[2rem] p-8 md:p-10 opacity-80 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-3 mb-8 text-[var(--text-muted)]">
              <div className="p-3  text-red-500 border-red-500/20">
                <Flame className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--text-main)]">Outdated Chat Platforms</h3>
            </div>
            
            <ul className="space-y-5">
              {[
                "Flooded with intrusive popup ads, paywalls, and coin schemes",
                "Rampant bot traffic and malicious spam links",
                "Disposable chats—if you disconnect, you lose the person forever",
                "Abandoned, buggy codebases with zero support or safety updates",
                "Sluggish connection latency and constant server drops"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4 text-[var(--text-muted)]">
                  <XCircle className="w-5 h-5 text-red-500/80 shrink-0 mt-0.5" />
                  <span className="leading-relaxed text-sm md:text-base font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="mt-8 pt-6 border-t border-[var(--border-color)] text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">
            The standard legacy experience
          </div>
        </motion.div>

        {/* The zQuab Platform */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="group bg-[var(--card)] rounded-[2rem] p-8 md:p-10 relative overflow-hidden flex flex-col justify-between transition-all duration-500 hover:-translate-y-1"
          style={{
            // The secret to dark mode lifting: ambient colored shadow + inner top highlight
            boxShadow: "0 20px 40px -15px rgba(0,0,0,0.5), inset 0 1px 0 0 rgba(255,255,255,0.1), inset 0 0 0 1px rgba(255,255,255,0.02), 0 0 50px -10px rgba(59,130,246,0.15)"
          }}
        >
          {/* Smoother, wider background ambient glow */}
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#3B82F6]/15 blur-[80px] rounded-full pointer-events-none transition-opacity duration-500 group-hover:bg-[#3B82F6]/25" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8 text-[var(--text-main)]">
              {/* zQuab Logo Wrapper with premium glassmorphism feel */}
              <div className=" shadow-inner">
                <img 
                  src="/logo1.webp" 
                  width="84"
                  height="84"
                  alt="zQuab Logo" 
                  className="w-12 h-12 object-contain drop-shadow-md" 
                  onError={(e) => {
                    // Fallback to apple-touch-icon if favicon.svg isn't the right logo format
                    e.currentTarget.src = "/apple-touch-icon.webp";
                  }}
                />
              </div>
              <h3 className="text-2xl font-bold tracking-tight">The zQuab Advantage</h3>
            </div>
            
            <ul className="space-y-5">
              {[
                "100% free with zero annoying ads or aggressive popups",
                "Active automated spam mitigation and bot detection",
                "Save meaningful connections and keep chatting via built-in DMs",
                "Constantly updated codebase driven directly by user feedback",
                "Lightning-fast matching and encrypted real-time messaging"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4 text-[var(--text-main)]">
                  {/* Added a subtle glow drop-shadow to the checkmarks */}
                  <CheckCircle2 className="w-5 h-5 text-[#3B82F6] shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  <span className="leading-relaxed text-sm md:text-base font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 text-xs text-[#3B82F6] uppercase tracking-widest font-bold relative z-10">
            Modern, secure & developer-maintained
          </div>
        </motion.div>

      </div>
    </section>
  );
}