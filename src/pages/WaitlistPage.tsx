import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Video, Users, Copy, Check, Share2, Sparkles, Trophy, 
  ArrowLeft, Flame, ShieldCheck, Globe, Zap, Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';

export default function WaitlistPage() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  // Mock initial state
  const [waitlistData] = useState({
    rank: 1248,
    totalWaitlist: 15420,
    referralCount: 2,
    referralCode: 'VIP789',
    inviteLink: 'https://zquab.com/join?ref=VIP789',
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(waitlistData.inviteLink);
      setCopied(true);
      if (navigator.vibrate) navigator.vibrate(40);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Join me on zQuab for instant anonymous 1-on-1 video chats! Use my early access link to skip the queue: ${waitlistData.inviteLink}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(
      `Get early access to 1-on-1 random video chat on @zquab! Skip the waitlist entirely using my VIP invite link: ${waitlistData.inviteLink}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  return (
    <>
      <SEO 
        title="Video Chat Early Access & Priority Pass - zQuab" 
        description="Join the priority line for 1-on-1 anonymous video chat on zQuab. Invite friends to jump the queue."
        path="/early-access"
      />

      <div className="relative min-h-[calc(100dvh-82px)] w-full overflow-y-auto bg-[var(--background)] px-4 py-6 md:p-8 custom-scrollbar">
        
        {/* Subtle Theme-Aware Ambient Background Glows */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-600/10 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-purple-500/5 dark:bg-purple-600/5 blur-[120px] pointer-events-none rounded-full" />

        <div className="relative z-10 w-full max-w-6xl mx-auto space-y-6">
          
          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => navigate('/chat')}
              className="group flex items-center gap-3 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors py-2 rounded-xl"
            >
              <div className="p-2 rounded-lg bg-[var(--card)] border border-[var(--border-color)] group-hover:bg-[var(--border-color)] transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span>Return to Chat</span>
            </button>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#3B82F6] shadow-sm">
              <Sparkles className="w-3.5 h-3.5" /> Early Access
            </div>
          </div>

          {/* Row 1: Action Center (Bento Split 7/5) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* The VIP Ticket (7 Columns) */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-7 flex flex-col justify-between rounded-[2rem] border border-[var(--border-color)] bg-[var(--card)] p-8 shadow-xl relative overflow-hidden group"
            >
              {/* Card internal glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 h-full">
                <div className="space-y-3 flex-1">
                  <p className="text-[10px] uppercase font-black tracking-[0.3em] text-[var(--text-muted)]">
                    Queue Status
                  </p>
                  <h1 className="text-5xl lg:text-6xl font-black text-[var(--text-main)] tracking-tighter leading-none">
                    #{waitlistData.rank.toLocaleString()}
                  </h1>
                  <p className="text-sm font-medium text-[var(--text-muted)]">
                    of <span className="text-[var(--text-main)]">{waitlistData.totalWaitlist.toLocaleString()}</span> waiting in line.
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center bg-[var(--background)] border border-[var(--border-color)] rounded-2xl p-6 min-w-[140px] shadow-sm">
                  <Flame className="w-8 h-8 text-orange-500 mb-2 drop-shadow-sm" />
                  <span className="text-3xl font-black text-[var(--text-main)] leading-none mb-1">
                    {waitlistData.referralCount}
                  </span>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest text-center">
                    Verified<br/>Invites
                  </span>
                </div>
              </div>
            </motion.div>

            {/* The Sharing Engine (5 Columns) */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-5 flex flex-col justify-between rounded-[2rem] border border-[var(--border-color)] bg-[var(--card)] p-8 shadow-xl"
            >
              <div className="mb-6">
                <h3 className="text-xl font-black text-[var(--text-main)] mb-2 tracking-tight">Boost Your Rank</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Share your exclusive link. Every friend who joins skips you both ahead in the line.
                </p>
              </div>

              <div className="space-y-3 mt-auto">
                <div className="flex items-center gap-2 p-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--background)]">
                  <div className="flex-1 px-3 py-2 text-sm font-mono text-[var(--text-main)] opacity-80 truncate select-all">
                    {waitlistData.inviteLink}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--border-color)] text-[var(--text-main)] hover:bg-[#3B82F6] hover:text-white transition-all active:scale-95"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleShareWhatsApp}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 text-[#25D366] py-3.5 font-bold transition-all active:scale-[0.98] text-sm"
                  >
                    <Share2 className="w-4 h-4" /> WhatsApp
                  </button>
                  <button
                    onClick={handleShareTwitter}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[var(--background)] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black border border-[var(--border-color)] text-[var(--text-main)] py-3.5 font-bold transition-all active:scale-[0.98] text-sm"
                  >
                    <Share2 className="w-4 h-4" /> X (Twitter)
                  </button>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Row 2: Gamification Tiers (Full Width, 3 Columns) */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="rounded-[1.5rem] border border-[var(--border-color)] bg-[var(--card)] p-6 flex flex-col items-start gap-4 hover:bg-[var(--background)] transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-[#3B82F6]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-[var(--text-main)] text-lg mb-1">1 Friend</h4>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">Priority Queue status. Jump ahead of thousands of standard waitlist users.</p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-blue-500/30 bg-blue-500/5 p-6 flex flex-col items-start gap-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-2xl pointer-events-none" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-[#3B82F6] text-white shadow-lg shadow-blue-500/20 z-10">
                <Video className="w-5 h-5" />
              </div>
              <div className="relative z-10">
                <h4 className="font-bold text-[#3B82F6] text-lg mb-1">3 Friends</h4>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed font-medium">Phase 1 Access. Guaranteed invite to the Day-1 closed video beta.</p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[var(--border-color)] bg-[var(--card)] p-6 flex flex-col items-start gap-4 hover:bg-[var(--background)] transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-[var(--text-main)] text-lg mb-1">Top 100</h4>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">Permanent Early Adopter profile badge and unfiltered premium matching.</p>
              </div>
            </div>
          </motion.div>

          {/* Row 3: Product Specs & Rules (Bento Split 7/5) */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Features Pitch (7 Columns) */}
            <div className="lg:col-span-7 rounded-[2rem] border border-[var(--border-color)] bg-[var(--card)] p-8 shadow-sm">
              <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight mb-2">The Next Evolution.</h3>
              <p className="text-sm text-[var(--text-muted)] mb-8 leading-relaxed max-w-lg">
                We are bringing the speed and privacy of zQuab to live video. No sign-ups required to chat, lightning-fast connections, and total anonymity until you decide otherwise.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[var(--background)] border border-[var(--border-color)]">
                  <Zap className="w-5 h-5 text-yellow-500 mb-3" />
                  <h4 className="font-bold text-[var(--text-main)] mb-1.5 text-sm">Instant WebRTC</h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">Peer-to-peer technology optimized for ultra-low latency.</p>
                </div>
                <div className="p-5 rounded-2xl bg-[var(--background)] border border-[var(--border-color)]">
                  <Globe className="w-5 h-5 text-[#3B82F6] mb-3" />
                  <h4 className="font-bold text-[var(--text-main)] mb-1.5 text-sm">Global Matching</h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">Meet people from around the world based on regional tags.</p>
                </div>
                <div className="p-5 rounded-2xl bg-[var(--background)] border border-[var(--border-color)]">
                  <Lock className="w-5 h-5 text-green-500 mb-3" />
                  <h4 className="font-bold text-[var(--text-main)] mb-1.5 text-sm">Masked IPs</h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">Traffic is routed through secure TURN servers to protect your location.</p>
                </div>
                <div className="p-5 rounded-2xl bg-[var(--background)] border border-[var(--border-color)]">
                  <ShieldCheck className="w-5 h-5 text-purple-500 mb-3" />
                  <h4 className="font-bold text-[var(--text-main)] mb-1.5 text-sm">Strict Moderation</h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">Community-driven reporting and instant connection termination.</p>
                </div>
              </div>
            </div>

            {/* Community Rules (5 Columns) */}
            <div className="lg:col-span-5 rounded-[2rem] border border-[var(--border-color)] bg-[var(--card)] p-8 flex flex-col shadow-sm">
              <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight mb-6 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-green-500" /> Community Rules
              </h3>
              
              <div className="flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-[var(--text-main)]">Fair Play Verification</h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Referrals must be real people. Disposable emails or duplicate accounts created from the same IP will be automatically purged before Phase 1 begins.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-[var(--text-main)]">Age Requirement</h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Video chat will be strictly restricted to users aged 18 and older. Standard text chat remains open.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-red-500 dark:text-red-400">Zero Tolerance</h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Nudity, harassment, or illegal behavior on video chat will result in an immediate, permanent device and IP ban from the entire platform.
                  </p>
                </div>
              </div>
            </div>

          </motion.div>

        </div>
      </div>
    </>
  );
}