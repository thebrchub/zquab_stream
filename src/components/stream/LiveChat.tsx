import React, { useState, useRef } from 'react';
import type { LiveChatMessage } from '../../types/streamEvents';
import { useWallet, type GiftItem } from '../../context/WalletContext'; 
import { Send, Gift, X, Trash2, Ban, BadgeCheck, Crown, Flame, Heart, Rocket } from 'lucide-react';

const giftIcons = {
  heart_icon: Heart,
  fire_icon: Flame,
  rocket_icon: Rocket,
  crown_icon: Crown,
};

const GiftCatalogIcon: React.FC<{ icon: string; className: string }> = ({ icon, className }) => {
  const Icon = giftIcons[icon as keyof typeof giftIcons] || Gift;
  return <Icon aria-hidden="true" className={className} />;
};

interface LiveChatProps {
  userBalance: number;
  messages: LiveChatMessage[];
  onSendChat: (text: string) => void;
  onSendGift: (giftId: number, message?: string) => void;
  onRetractMessage: (messageId: string) => void;
  isGiftPending: boolean;
  sendError: string | null;
  isStreamEnded: boolean;
  onTopUpClick?: () => void;
  role: 'viewer' | 'creator';
}

export const LiveChat: React.FC<LiveChatProps> = ({
  userBalance,
  messages,
  onSendChat,
  onSendGift,
  onRetractMessage,
  isGiftPending,
  sendError,
  isStreamEnded,
  onTopUpClick,
  role,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [showGiftDrawer, setShowGiftDrawer] = useState<boolean>(false);
  const [insufficientFundsGift, setInsufficientFundsGift] = useState<string | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const { gifts } = useWallet();

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendChat(inputText.trim());
    setInputText('');
  };

  const handleSendGift = (gift: GiftItem) => {
    if (userBalance < gift.cost_coins) {
      setInsufficientFundsGift(gift.name);
      setTimeout(() => setInsufficientFundsGift(null), 3000);
      return;
    }

    const attachedMessage = inputText.trim();
    onSendGift(gift.id, attachedMessage);
    setInputText('');
    setShowGiftDrawer(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#09090b] relative">
      
      {/* --- Chat Scroll Area --- */}
      <div className="flex-1 overflow-y-auto pt-2 pb-24 space-y-1.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {messages.map((item) => (
          <div key={item.id} className="relative group px-4 py-1 hover:bg-white/[0.02] transition-colors">
            
            {/* Creator Mod Tools */}
            {role === 'creator' && !item.gift && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-[#09090b]/90 backdrop-blur-sm p-1 rounded-md border border-white/5 shadow-lg z-10">
                <button onClick={() => onRetractMessage(item.id)} className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors rounded hover:bg-white/5" title="Retract message">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 text-zinc-500 hover:text-orange-400 transition-colors rounded hover:bg-white/5" title="Timeout">
                  <Ban className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Layout Grid */}
            <div className="grid grid-cols-[24px_1fr] gap-3 items-start">
              {item.avatarUrl ? (
                <img src={item.avatarUrl} alt={item.senderName} className="w-6 h-6 rounded-full object-cover mt-0.5 opacity-90 border border-zinc-800" />
              ) : (
                <div className="w-6 h-6 rounded-full mt-0.5 bg-zinc-800 text-zinc-300 text-[10px] flex items-center justify-center">{item.senderName.slice(0, 1).toUpperCase()}</div>
              )}
              
              <div className="min-w-0">
                {item.gift ? (
                  /* Bespoke, High-End Gift Card */
                  <div className="relative bg-[#0c0c0e] border border-zinc-800/80 rounded-lg p-2.5 mt-0.5 shadow-sm ring-1 ring-amber-500/10 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-amber-500/0 via-amber-500/40 to-amber-500/0" />
                    
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-1.5">
                      <span className="inline-flex items-center gap-1 text-[13px] font-extrabold text-amber-500 drop-shadow-sm">
                        {item.senderName}
                        {item.isCreator && <span title="Stream creator"><BadgeCheck className="w-3.5 h-3.5" /></span>}
                      </span>
                      <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Sent</span>
                      <span className="text-[13px] font-bold text-zinc-200">{item.gift.name}</span>
                      <div className="ml-auto flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                        <GiftCatalogIcon icon={item.gift.icon} className="w-4 h-4 text-amber-400" />
                        <span className="text-[11px] font-black text-amber-400">{item.gift.coins}</span>
                      </div>
                    </div>
                    {item.text && (
                      <p className="text-[13px] text-zinc-300 font-medium break-words break-all whitespace-pre-wrap leading-snug">
                        {item.text}
                      </p>
                    )}
                  </div>
                ) : (
                  /* Standard Text Layout */
                  <div className="leading-snug mt-1">
                    <span className="inline-flex items-center gap-1 text-[13px] font-bold text-zinc-400 mr-2.5 align-baseline">
                      {item.senderName}
                      {item.isCreator && <span title="Stream creator"><BadgeCheck className="w-3.5 h-3.5 text-amber-400" /></span>}
                    </span>
                    <span className="text-[13px] text-zinc-200 break-words break-all whitespace-pre-wrap align-baseline">{item.text}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={chatBottomRef} className="h-4" />
      </div>

      {/* --- Unified Input Action Bar --- */}
      <div className="absolute bottom-0 w-full bg-gradient-to-t from-[#09090b] via-[#09090b] to-transparent pt-8 pb-4 px-4 z-30">
        {sendError && <p className="mb-2 text-xs text-red-400">{sendError}</p>}
        {isStreamEnded && <p className="mb-2 text-xs text-zinc-400">This stream has ended.</p>}
        
        {showGiftDrawer && (
          <div className="mb-3 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-3 animate-in slide-in-from-bottom-2 fade-in duration-200">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Select Gift</span>
              <button onClick={() => setShowGiftDrawer(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {insufficientFundsGift && (
              <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-between">
                <span className="text-xs text-red-400 font-medium">Need coins for {insufficientFundsGift}</span>
                <button onClick={onTopUpClick} className="text-[10px] font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-500 px-2 py-1 rounded">Top Up</button>
              </div>
            )}

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {gifts.map((gift) => (
                <button
                  key={gift.id}
                  onClick={() => handleSendGift(gift)}
                  disabled={isGiftPending || isStreamEnded}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] disabled:opacity-50 transition-colors group"
                >
                  <GiftCatalogIcon icon={gift.icon} className="w-6 h-6 mb-1 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] text-zinc-400 font-medium truncate w-full text-center">{gift.name}</span>
                  <span className="text-[10px] text-amber-400 font-bold mt-0.5">{gift.cost_coins}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {role === 'viewer' && (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 p-1.5 bg-white/[0.03] border border-white/10 hover:border-white/20 focus-within:border-indigo-500/50 focus-within:bg-white/[0.05] rounded-2xl transition-all shadow-lg">
            <button
              type="button"
              onClick={() => setShowGiftDrawer((prev) => !prev)}
              disabled={isStreamEnded}
              className={`p-2 rounded-xl transition-all shrink-0 ${
                showGiftDrawer ? 'bg-amber-500/20 text-amber-400' : 'text-zinc-400 hover:text-amber-400 hover:bg-white/5'
              }`}
            >
              <Gift className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Send a message..."
              disabled={isStreamEnded}
              className="flex-1 bg-transparent py-1.5 px-1 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
            />
            
            <button
              type="submit"
              disabled={!inputText.trim() || isStreamEnded}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-transparent disabled:text-zinc-600 text-white transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};