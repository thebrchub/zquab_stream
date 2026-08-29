import React from 'react';
import { Users, PanelRightClose, Pin } from 'lucide-react';
import { LiveChat } from './LiveChat';

interface StreamChatSidebarProps {
  role: 'viewer' | 'creator';
  balanceCoins: number;
  viewerCount: number;
  onSpendCoins: (amount: number, giftId?: number, message?: string) => void;
  onOpenPurchase?: () => void;
  onToggleCollapse: () => void;
}

export const StreamChatSidebar: React.FC<StreamChatSidebarProps> = ({
  role,
  balanceCoins,
  viewerCount,
  onSpendCoins,
  onOpenPurchase,
  onToggleCollapse,
}) => {
  return (
    <div className="w-full h-full flex flex-col bg-[#09090b] relative">
      
      {/* Sleek, Minimalist Header */}
      <div className="px-4 py-3.5 flex items-center justify-between shrink-0 bg-[#09090b] z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={onToggleCollapse}
            className="p-1 -ml-1 text-zinc-500 hover:text-zinc-200 transition-colors"
            title="Collapse Chat"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
          <h2 className="text-[11px] font-bold text-zinc-200 uppercase tracking-widest">Stream Chat</h2>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
          <Users className="w-3.5 h-3.5" />
          {viewerCount > 0 ? viewerCount.toLocaleString() : '1,204'}
        </div>
      </div>
      
      {/* Modern Pinned Message Strip */}
      <div className="px-4 py-2.5 bg-indigo-500/[0.03] backdrop-blur-md border-b border-white/[0.02] flex items-start gap-3 relative overflow-hidden shrink-0">
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-500/50" />
        <Pin className="w-3.5 h-3.5 text-indigo-400/80 mt-0.5 shrink-0" />
        <p className="text-xs text-zinc-400 font-medium leading-relaxed pr-2">
          <span className="text-zinc-200 font-semibold">Welcome!</span> Keep it positive, no spamming. 1:1 consultations open after the match!
        </p>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <LiveChat 
          role={role}
          userBalance={balanceCoins} 
          onSpendCoins={onSpendCoins} 
          onTopUpClick={onOpenPurchase}
        />
      </div>
    </div>
  );
};