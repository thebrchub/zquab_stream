import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle2, Sparkles, Users } from 'lucide-react';

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus('loading');
    // Simulate API call
    setTimeout(() => {
      setStatus('success');
    }, 1500);
  };

  return (
    <div className="min-h-[100dvh] bg-[#09090b] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Logo or Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-[#0c0c0e] rounded-[1.25rem] border border-white/5 flex items-center justify-center shadow-[4px_4px_10px_rgba(0,0,0,0.4),-2px_-2px_6px_rgba(255,255,255,0.02),inset_1px_1px_2px_rgba(255,255,255,0.05),inset_-1px_-1px_2px_rgba(0,0,0,0.2)]">
            <img src="/logo.webp" alt="zQuab" className="w-10 h-10 object-contain opacity-90 drop-shadow-md" />
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4 drop-shadow-sm">
            The next era of <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">
              live connection.
            </span>
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-md mx-auto font-medium">
            zQuab is redefining stranger chat and creator streams. Join the waitlist for exclusive early access and a special Founder's badge.
          </p>
        </div>

        {/* Claymorphic Form Container */}
        <div className="bg-[#0c0c0e] border border-white/[0.03] rounded-[2rem] p-6 sm:p-8 shadow-[8px_8px_20px_rgba(0,0,0,0.5),-4px_-4px_10px_rgba(255,255,255,0.02),inset_1px_1px_3px_rgba(255,255,255,0.05),inset_-1px_-1px_3px_rgba(0,0,0,0.3)]">
          
          {status === 'success' ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center py-4"
            >
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2)]">
                <CheckCircle2 className="w-8 h-8 drop-shadow-md" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">You're on the list!</h3>
              <p className="text-zinc-400 text-sm">Keep an eye on your inbox. We'll notify you the moment a spot opens up.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-zinc-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  disabled={status === 'loading'}
                  className="w-full bg-[#09090b] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-[inset_2px_2px_5px_rgba(0,0,0,0.4),inset_-1px_-1px_3px_rgba(255,255,255,0.02)]"
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-4 bg-[#4F46E5] text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95 shadow-[4px_4px_10px_rgba(0,0,0,0.4),-2px_-2px_6px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(255,255,255,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.4)] hover:brightness-110 disabled:opacity-70 border-none"
              >
                {status === 'loading' ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Secure My Spot <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Mock Live Stats */}
        <div className="mt-8 flex items-center justify-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-widest">
          <Users className="w-4 h-4 text-zinc-400" />
          <span><span className="text-indigo-400">12,409</span> people ahead of you</span>
        </div>
      </motion.div>
    </div>
  );
}