
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Users,
  UserRound,
  Radio,
} from 'lucide-react';

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const GlobeIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);


type AccountType = 'user' | 'creator';

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [accountType, setAccountType] = useState<AccountType | null>(null);

  const [links, setLinks] = useState({
    instagram: '',
    youtube: '',
    twitter: '',
    other: '',
  });

  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success'
  >('idle');

  const [error, setError] = useState('');

  const filledLinksCount = Object.values(links).filter(
    (link) => link.trim().length > 0
  ).length;

  const canSubmitCreator = filledLinksCount >= 2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) return;

    if (accountType === 'creator' && !canSubmitCreator) {
      setError('Please connect at least two social accounts.');
      return;
    }

    setStatus('loading');

    // Frontend demo only.
    // Replace this simulation with the waitlist API when available.
    setTimeout(() => {
      setStatus('success');
    }, 1500);
  };


  const updateLink = (
    platform: keyof typeof links,
    value: string
  ) => {
    setLinks((prev) => ({
      ...prev,
      [platform]: value,
    }));
    setError('');
  };

  const inputClass =
    'w-full bg-[#09090b] border border-white/5 rounded-2xl px-4 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-[inset_2px_2px_5px_rgba(0,0,0,0.4),inset_-1px_-1px_3px_rgba(255,255,255,0.02)]';

  const socialInputClass =
    'w-full bg-[#09090b] border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-[inset_2px_2px_5px_rgba(0,0,0,0.4),inset_-1px_-1px_3px_rgba(255,255,255,0.02)]';

  const socialFields = [
  {
    key: 'instagram' as const,
    placeholder: 'Instagram profile URL',
    icon: InstagramIcon,
    color: 'text-[#E1306C]',
  },
  {
    key: 'youtube' as const,
    placeholder: 'YouTube channel URL',
    icon: YoutubeIcon,
    color: 'text-[#FF0000]',
  },
  {
    key: 'twitter' as const,
    placeholder: 'X (Twitter) profile URL',
    icon: TwitterIcon,
    color: 'text-[#1DA1F2]',
  },
  {
    key: 'other' as const,
    placeholder: 'TikTok / Twitch / Other URL',
    icon: GlobeIcon,
    color: 'text-[#10B981]',
  },
];

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

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-[#0c0c0e] rounded-[1.25rem] border border-white/5 flex items-center justify-center shadow-[4px_4px_10px_rgba(0,0,0,0.4),-2px_-2px_6px_rgba(255,255,255,0.02),inset_1px_1px_2px_rgba(255,255,255,0.05),inset_-1px_-1px_2px_rgba(0,0,0,0.2)]">
            <img
              src="/logo.webp"
              alt="zQuab"
              className="w-10 h-10 object-contain opacity-90 drop-shadow-md"
            />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4 drop-shadow-sm">
            The next era of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">
              live connection.
            </span>
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-md mx-auto font-medium">
            zQuab is redefining stranger chat and creator streams.
            Join the waitlist for exclusive early access and a special
            Founder's badge.
          </p>
        </div>

        {/* Form container */}
        <div className="bg-[#0c0c0e] border border-white/[0.03] rounded-[2rem] p-6 sm:p-8 shadow-[8px_8px_20px_rgba(0,0,0,0.5),-4px_-4px_10px_rgba(255,255,255,0.02),inset_1px_1px_3px_rgba(255,255,255,0.05),inset_-1px_-1px_3px_rgba(0,0,0,0.3)]">

          {status === 'success' ? (

            /* SUCCESS SCREEN */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center py-4"
            >
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2)]">
                <CheckCircle2 className="w-8 h-8 drop-shadow-md" />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                You're on the list!
              </h3>

              <p className="text-zinc-400 text-sm leading-relaxed">
                {accountType === 'creator'
                  ? "Thanks for your interest in becoming a zQuab creator! We'll keep you updated about creator early access."
                  : "Keep an eye on your inbox. We'll notify you the moment a spot opens up."}
              </p>
            </motion.div>

          ) : (

            <AnimatePresence mode="wait">

              {/* STEP 1: ACCOUNT TYPE */}
              {!accountType && (

                
<motion.div
  key="account-type"
  initial={{ opacity: 0, x: 20 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: -20 }}
  className="flex flex-col gap-6"
>
  <div className="text-center mb-1">
    <h2 className="text-xl font-black text-white">
      How will you use zQuab?
    </h2>

    <p className="mt-2 text-sm text-zinc-500">
      Choose the account type that best describes you.
    </p>
  </div>

  {/* Account type options */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

    {/* Regular User */}
    <button
      type="button"
      onClick={() => setAccountType('user')}
      className="group relative min-h-[190px] flex flex-col items-start justify-between gap-5 p-5 rounded-2xl border border-white/[0.06] bg-[#09090b] hover:border-blue-500/40 hover:bg-blue-500/[0.04] transition-all text-left active:scale-[0.98]"
    >
      <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
        <UserRound className="w-6 h-6" />
      </div>

      <div className="w-full">
        <h3 className="text-white font-bold text-base">
          Regular User
        </h3>

        <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
          I want to chat, meet people and explore zQuab.
        </p>
      </div>

      <ArrowRight className="absolute top-5 right-5 w-5 h-5 text-zinc-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
    </button>

    {/* Creator */}
    <button
      type="button"
      onClick={() => setAccountType('creator')}
      className="group relative min-h-[190px] flex flex-col items-start justify-between gap-5 p-5 rounded-2xl border border-white/[0.06] bg-[#09090b] hover:border-fuchsia-500/40 hover:bg-fuchsia-500/[0.04] transition-all text-left active:scale-[0.98]"
    >
      <div className="w-12 h-12 rounded-xl bg-fuchsia-500/10 text-fuchsia-400 flex items-center justify-center">
        <Radio className="w-6 h-6" />
      </div>

      <div className="w-full">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-white font-bold text-base">
            Creator
          </h3>

          <span className="text-[9px] uppercase tracking-wider text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
            Early Access
          </span>
        </div>

        <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
          I want to stream, build an audience and connect with fans.
        </p>
      </div>

      <ArrowRight className="absolute top-5 right-5 w-5 h-5 text-zinc-600 group-hover:text-fuchsia-400 group-hover:translate-x-1 transition-all" />
    </button>

  </div>
</motion.div>

              )}

              {/* STEP 2: REGULAR USER FORM */}
              {accountType === 'user' && (

                <motion.form
                  key="user-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-4"
                >
                  <button
                    type="button"
                    onClick={() => setAccountType(null)}
                    className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors w-fit mb-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Change account type
                  </button>

                  <div className="mb-1">
                    <h2 className="text-xl font-black text-white">
                      Join the waitlist
                    </h2>
                    <p className="text-zinc-500 text-xs mt-1">
                      Get notified when zQuab is ready for you.
                    </p>
                  </div>

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
                      className={`${inputClass} pl-12`}
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
                        <Sparkles className="w-4 h-4" />
                        Secure My Spot
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </button>
                </motion.form>
              )}

              {/* STEP 2: CREATOR FORM */}
              {accountType === 'creator' && (

                <motion.form
                  key="creator-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-4"
                >
                  <button
                    type="button"
                    onClick={() => setAccountType(null)}
                    className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors w-fit"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Change account type
                  </button>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Radio className="w-5 h-5 text-indigo-400" />
                      <h2 className="text-xl font-black text-white">
                        Creator early access
                      </h2>
                    </div>

                    <p className="text-zinc-500 text-xs leading-relaxed">
                      Connect at least two of your established social
                      profiles so we can learn more about your creator presence.
                    </p>
                  </div>

                  {/* Email */}
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
                      className={`${inputClass} pl-12`}
                    />
                  </div>

                  {/* Social links */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Link your profiles
                      </h3>

                      <span className={`text-[10px] font-bold ${
                        canSubmitCreator ? 'text-emerald-400' : 'text-zinc-500'
                      }`}>
                        {filledLinksCount}/2 linked
                      </span>
                    </div>

                    <div className="space-y-3">
                      {socialFields.map((field) => {
                        const Icon = field.icon;

                        return (
                          <div
                            key={field.key}
                            className={`relative group ${field.color}`}
                          >
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-500">
                              <Icon className="w-5 h-5 transition-colors" />
                            </div>

                            <input
                              type="url"
                              value={links[field.key]}
                              onChange={(e) =>
                                updateLink(field.key, e.target.value)
                              }
                              placeholder={field.placeholder}
                              disabled={status === 'loading'}
                              className={socialInputClass}
                            />
                          </div>
                        );
                      })}
                    </div>

                    <p className="text-[10px] text-zinc-600 mt-3 leading-relaxed">
                      Connect at least two accounts. Make sure the links
                      lead directly to your public profiles.
                    </p>
                  </div>

                  {error && (
                    <p className="text-xs text-red-400">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'loading' || !canSubmitCreator}
                    className="w-full py-4 bg-[#4F46E5] text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95 shadow-[4px_4px_10px_rgba(0,0,0,0.4),-2px_-2px_6px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(255,255,255,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.4)] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed border-none"
                  >
                    {status === 'loading' ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Join Creator Waitlist
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </button>
                </motion.form>
              )}

            </AnimatePresence>
          )}
        </div>

        {/* Waitlist stats */}
        <div className="mt-8 flex items-center justify-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-widest">
          <Users className="w-4 h-4 text-zinc-400" />
          <span>
            <span className="text-indigo-400">12,409</span> people ahead of you
          </span>
        </div>

      </motion.div>
    </div>
  );
}
