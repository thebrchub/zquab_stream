import React from 'react';
import { ExternalLink, Sparkles, Megaphone } from 'lucide-react';

interface SponsoredChatDropProps {
  brandName: string;
  brandIcon: string;
  message: string;
  rewardCoins: number;
  linkUrl: string;
}

export const SponsoredChatDrop: React.FC<SponsoredChatDropProps> = ({
  brandName,
  brandIcon,
  message,
  rewardCoins,
  linkUrl
}) => {
  return (
    <div className="relative group px-4 py-2 my-2">
      <div className="relative bg-gradient-to-br from-[#0c0c0e] to-[#121215] border border-indigo-500/30 rounded-xl p-3 shadow-[4px_4px_10px_rgba(0,0,0,0.5),-2px_-2px_6px_rgba(255,255,255,0.02),inset_1px_1px_2px_rgba(255,255,255,0.05),inset_-1px_-1px_2px_rgba(0,0,0,0.3)] overflow-hidden transition-all hover:border-indigo-400/50">
        
        {/* Subtle animated gradient sweep */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-indigo-500/0" />
        
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="text-lg drop-shadow-md">{brandIcon}</span>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-extrabold text-indigo-400 drop-shadow-sm">{brandName}</span>
                <span className="bg-indigo-500/20 text-indigo-300 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-indigo-500/20">Sponsored</span>
              </div>
            </div>
          </div>
          
          {/* Reward Badge */}
          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)]">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] font-black text-amber-400">+{rewardCoins} zCoins</span>
          </div>
        </div>

        <p className="text-[13px] text-zinc-300 font-medium leading-snug mb-3">
          {message}
        </p>

        <a 
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-2 bg-white/[0.03] hover:bg-indigo-500/20 border border-white/5 hover:border-indigo-500/30 rounded-lg transition-all text-xs font-bold text-zinc-300 hover:text-white active:scale-[0.98] shadow-[2px_2px_4px_rgba(0,0,0,0.2),-1px_-1px_2px_rgba(255,255,255,0.01)]"
        >
          Claim Reward & Visit <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};