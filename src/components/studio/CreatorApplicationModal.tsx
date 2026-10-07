import { useState } from 'react';
import { Loader2, X, CheckCircle2, Copy, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

// --- Custom SVG Brand Icons ---
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
  </svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
  </svg>
);

const GlobeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
);
// -------------------------------------------------------

interface CreatorApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

export function CreatorApplicationModal({ isOpen, onClose, username }: CreatorApplicationModalProps) {
  const { refreshSession } = useAuth();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [direction, setDirection] = useState(0); // 1 for forward, -1 for backward

  const [links, setLinks] = useState({
    instagram: '',
    youtube: '',
    twitter: '',
    other: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const verificationCode = `zQuab-${username}`;

  if (!isOpen) return null;

  const filledLinksCount = Object.values(links).filter(link => link.trim().length > 0).length;
  const canSubmit = filledLinksCount >= 2;

  const handleNext = () => {
    setDirection(1);
    setStep(2);
  };

  const handleBack = () => {
    setDirection(-1);
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    
    setIsSubmitting(true);
    try {
      await apiClient.post('/users/me/creator', {
        social_links: Object.values(links).filter(link => link.trim().length > 0),
        category: 'other',
        headline: 'zQuab Creator', 
        one_on_one_enabled: false,
        one_on_one_price_coins: 0,
        one_on_one_duration_mins: 0
      });
      
      await refreshSession();
      setDirection(1);
      setStep(3); // Success Step
    } catch (err: any) {
      alert(err?.response?.data?.error || err.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(verificationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetAndClose = () => {
    onClose();
    setTimeout(() => {
      setStep(1);
      setDirection(0);
      setLinks({ instagram: '', youtube: '', twitter: '', other: '' });
    }, 300);
  };

  // Framer Motion variants for sliding
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0
    })
  };

  return (
    // Solid background overlay, completely removing glassmorphism
    <div className="fixed inset-0 z-[99] flex items-center justify-center p-4 bg-black/90">
      
      {/* Wizard Container - Locks max height so it fits on mobile */}
      <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-[2rem] max-w-md w-full shadow-2xl flex flex-col relative max-h-[95dvh] overflow-hidden">
        
        {/* Persistent Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)] bg-[var(--card)] shrink-0 z-10">
          <div className="flex gap-2 items-center">
            {step < 3 && (
              <>
                <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${step >= 1 ? 'bg-[#3B82F6]' : 'bg-[var(--border-color)]'}`} />
                <div className={`w-8 h-1 rounded-full transition-colors duration-300 ${step >= 2 ? 'bg-[#3B82F6]' : 'bg-[var(--border-color)]'}`} />
                <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${step >= 2 ? 'bg-[#3B82F6]' : 'bg-[var(--border-color)]'}`} />
              </>
            )}
            {step === 3 && (
              <span className="text-sm font-bold text-emerald-500 uppercase tracking-widest">Complete</span>
            )}
          </div>
          <button 
            onClick={resetAndClose} 
            className="p-2 -mr-2 bg-[var(--background)] rounded-full hover:bg-[var(--border-color)] transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-muted)] hover:text-[var(--text-main)]" />
          </button>
        </div>

        {/* Dynamic Wizard Body */}
        <div className="flex-1 overflow-y-auto hide-scrollbar relative bg-[var(--background)]">
          <AnimatePresence custom={direction} mode="wait">
            
            {/* STEP 1: INFO */}
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="flex flex-col p-6 sm:p-8"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-[#3B82F6]/10 text-[#3B82F6] rounded-full flex items-center justify-center mb-6 border border-[#3B82F6]/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                    <ShieldCheck className="w-10 h-10" />
                  </div>
                  
                  <h3 className="text-2xl font-black text-[var(--text-main)] mb-3">Protect Your Identity</h3>
                  
                  <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-8">
                    To keep zQuab safe and prevent impersonators from claiming your brand, we require creators to securely link their established social profiles.
                    <br/><br/>
                    In the next step, we will ask you to link your accounts so we can verify you are the real owner.
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP 2: LINKING PROFILES */}
            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="flex flex-col p-6 sm:p-8"
              >
                <h3 className="text-xl font-black text-[var(--text-main)] mb-1">Link Profiles</h3>
                <p className="text-[var(--text-muted)] text-xs font-medium mb-6">
                  Connect at least <strong className="text-[var(--text-main)]">two</strong> accounts below.
                </p>

                {/* Verification Code Block */}
                <div className="flex items-center justify-between bg-[var(--card)] border border-[#3B82F6]/30 rounded-[1rem] p-3 mb-4 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05)] w-full overflow-hidden">
                  <div className="flex flex-col gap-0.5 pl-2 truncate pr-3">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Verification Code</span>
                    <span className="font-mono font-bold text-[#3B82F6] text-sm truncate">{verificationCode}</span>
                  </div>
                  <button 
                    onClick={copyCode}
                    className="shrink-0 p-2.5 bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 text-[#3B82F6] rounded-xl transition-colors flex items-center gap-2 active:scale-95"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span className="text-xs font-bold hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                
                <p className="text-[var(--text-muted)] text-[11px] leading-relaxed mb-6 px-1 font-medium">
                  * Paste the code above into the bios of the accounts you link below. You can remove it after approval.
                </p>

                <div className="space-y-3 pb-2">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <InstagramIcon className={`h-5 w-5 transition-colors duration-300 ${links.instagram ? 'text-[#E1306C]' : 'text-[var(--text-muted)] group-focus-within:text-[#E1306C]'}`} />
                    </div>
                    <input 
                      type="url" 
                      value={links.instagram} 
                      onChange={(e) => setLinks({...links, instagram: e.target.value})} 
                      className="w-full bg-[var(--card)] border border-[var(--border-color)] rounded-[1rem] pl-12 pr-4 py-3.5 text-sm text-[var(--text-main)] outline-none focus:border-[#E1306C] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.02)] transition-all" 
                      placeholder="Instagram profile URL" 
                    />
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <YoutubeIcon className={`h-5 w-5 transition-colors duration-300 ${links.youtube ? 'text-[#FF0000]' : 'text-[var(--text-muted)] group-focus-within:text-[#FF0000]'}`} />
                    </div>
                    <input 
                      type="url" 
                      value={links.youtube} 
                      onChange={(e) => setLinks({...links, youtube: e.target.value})} 
                      className="w-full bg-[var(--card)] border border-[var(--border-color)] rounded-[1rem] pl-12 pr-4 py-3.5 text-sm text-[var(--text-main)] outline-none focus:border-[#FF0000] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.02)] transition-all" 
                      placeholder="YouTube channel URL" 
                    />
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <TwitterIcon className={`h-5 w-5 transition-colors duration-300 ${links.twitter ? 'text-[#1DA1F2]' : 'text-[var(--text-muted)] group-focus-within:text-[#1DA1F2]'}`} />
                    </div>
                    <input 
                      type="url" 
                      value={links.twitter} 
                      onChange={(e) => setLinks({...links, twitter: e.target.value})} 
                      className="w-full bg-[var(--card)] border border-[var(--border-color)] rounded-[1rem] pl-12 pr-4 py-3.5 text-sm text-[var(--text-main)] outline-none focus:border-[#1DA1F2] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.02)] transition-all" 
                      placeholder="X (Twitter) profile URL" 
                    />
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <GlobeIcon className={`h-5 w-5 transition-colors duration-300 ${links.other ? 'text-[#10B981]' : 'text-[var(--text-muted)] group-focus-within:text-[#10B981]'}`} />
                    </div>
                    <input 
                      type="url" 
                      value={links.other} 
                      onChange={(e) => setLinks({...links, other: e.target.value})} 
                      className="w-full bg-[var(--card)] border border-[var(--border-color)] rounded-[1rem] pl-12 pr-4 py-3.5 text-sm text-[var(--text-main)] outline-none focus:border-[#10B981] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.02)] transition-all" 
                      placeholder="TikTok / Twitch / Other URL" 
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: SUCCESS */}
            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="flex flex-col p-6 sm:p-8 items-center text-center"
              >
                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="text-2xl font-black text-[var(--text-main)] mb-3">Verification Pending</h4>
                <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-8 max-w-[280px]">
                  Our team is reviewing your connected profiles. <br/><br/>
                  <span className="text-[var(--text-main)] font-bold">Do not remove the code from your bios</span> until you are officially approved.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Persistent Footer Actions */}
        <div className="p-6 border-t border-[var(--border-color)] bg-[var(--card)] shrink-0 z-10 flex gap-3">
          
          {step === 1 && (
            <button 
              onClick={handleNext} 
              className="w-full py-4 bg-[#4F46E5] text-white rounded-[1.25rem] font-bold flex items-center justify-center gap-2 transition-all shadow-[6px_6px_12px_rgba(0,0,0,0.4),-4px_-4px_10px_rgba(255,255,255,0.03),inset_2px_2px_6px_rgba(255,255,255,0.25),inset_-3px_-3px_6px_rgba(0,0,0,0.2)] hover:brightness-110 active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-2px_-2px_6px_rgba(255,255,255,0.1)]"
            >
              Begin Setup <ArrowRight className="w-5 h-5 ml-1" />
            </button>
          )}

          {step === 2 && (
            <>
              <button 
                onClick={handleBack}
                className="py-4 px-5 bg-[var(--background)] text-[var(--text-main)] border border-[var(--border-color)] rounded-[1.25rem] transition-colors hover:bg-[var(--border-color)] active:scale-95 flex items-center justify-center shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !canSubmit} 
                className="flex-1 py-4 bg-[#4F46E5] text-white rounded-[1.25rem] font-bold flex items-center justify-center gap-2 transition-all shadow-[6px_6px_12px_rgba(0,0,0,0.4),-4px_-4px_10px_rgba(255,255,255,0.03),inset_2px_2px_6px_rgba(255,255,255,0.25),inset_-3px_-3px_6px_rgba(0,0,0,0.2)] hover:brightness-110 active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-2px_-2px_6px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  canSubmit ? 'Submit Application' : `${filledLinksCount}/2 Linked`
                )}
              </button>
            </>
          )}

          {step === 3 && (
            <button 
              onClick={resetAndClose}
              className="w-full py-4 bg-[#4F46E5] text-white rounded-[1.25rem] font-bold transition-all shadow-[6px_6px_12px_rgba(0,0,0,0.4),-4px_-4px_10px_rgba(255,255,255,0.03),inset_2px_2px_6px_rgba(255,255,255,0.25),inset_-3px_-3px_6px_rgba(0,0,0,0.2)] hover:brightness-110 active:scale-[0.98]"
            >
              Done
            </button>
          )}
        </div>

      </div>
    </div>
  );
}