import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useWallet, type GiftItem } from '../../context/WalletContext'; 
import { Send, Gift, X, Trash2, Ban, ArrowDown, LogIn, BadgeCheck } from 'lucide-react';
import { SponsoredChatDrop } from '../../components/SponsoredChatDrop';
import type { LiveChatMessage } from '../../types/streamEvents';

interface LiveChatProps {
  role: 'viewer' | 'creator';
  userBalance: number;
  messages: LiveChatMessage[];
  onSendChat: (text: string) => void;
  onSendGift: (giftId: number, message?: string) => void;
  onRetractMessage: (messageId: string) => void;
  onMuteUser: (userId: string, minutes: number) => void;
  isGiftPending: boolean;
  sendError: string | null;
  isStreamEnded: boolean;
  onTopUpClick?: () => void;
  isGuest?: boolean;
  onLoginClick?: () => void;
}

interface PinnedAd {
  brandName: string;
  brandIcon: string;
  message: string;
  rewardCoins: number;
  linkUrl: string;
}

const PINNED_AD_MS = 8000;

// Mute choices; 0 means the rest of the stream.
const MUTE_OPTIONS: { label: string; minutes: number }[] = [
  { label: '10 min', minutes: 10 },
  { label: '30 min', minutes: 30 },
  { label: '60 min', minutes: 60 },
  { label: 'Rest of stream', minutes: 0 },
];
// How close to the bottom (px) still counts as "reading the latest messages".
const NEAR_BOTTOM_PX = 80;

// The gift catalog stores icon names like "heart_icon"; show them as emoji.
const GIFT_ICON_EMOJI: Record<string, string> = {
  heart: '❤️',
  fire: '🔥',
  rocket: '🚀',
  crown: '👑',
  diamond: '💎',
};

const GiftIcon: React.FC<{ icon: string; className?: string }> = ({ icon, className }) => {
  const value = (icon || '').trim();
  if (/^https?:\/\//i.test(value)) {
    return <img src={value} alt="" className={`inline-block w-[1em] h-[1em] object-contain ${className ?? ''}`} />;
  }
  const key = value.toLowerCase().replace(/_icon$/, '');
  // Names we don't know, or plain words, fall back to a gift box; real emoji pass through.
  const emoji = GIFT_ICON_EMOJI[key] ?? (value && !/^[\w\s-]+$/.test(value) ? value : '🎁');
  return <span className={className}>{emoji}</span>;
};

export const LiveChat: React.FC<LiveChatProps> = ({
  role,
  userBalance,
  messages,
  onSendChat,
  onSendGift,
  onRetractMessage,
  onMuteUser,
  isGiftPending,
  sendError,
  isStreamEnded,
  onTopUpClick,
  isGuest = false,
  onLoginClick,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [showGiftDrawer, setShowGiftDrawer] = useState<boolean>(false);
  const [insufficientFundsGift, setInsufficientFundsGift] = useState<string | null>(null);
  const [pinnedAd, setPinnedAd] = useState<PinnedAd | null>(null);
  const [hasNewBelow, setHasNewBelow] = useState(false);
  const [muteTarget, setMuteTarget] = useState<{ userId: string; name: string } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const prevLastIdRef = useRef<string | null>(null);
  const { gifts } = useWallet();

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    isNearBottomRef.current = true;
    setHasNewBelow(false);
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    if (isNearBottomRef.current) setHasNewBelow(false);
  };

  // Jump (no animation) to the newest message, unless the user scrolled up to read.
  // Uses the last message id, not the count: the list is capped, so its length stops growing.
  useLayoutEffect(() => {
    const lastId = messages.length > 0 ? messages[messages.length - 1].id : null;
    const prevLastId = prevLastIdRef.current;
    prevLastIdRef.current = lastId;
    if (!lastId || lastId === prevLastId) return;

    // Something was added below the old last message (a retract of the last one doesn't count).
    let appended = prevLastId === null;
    for (let i = messages.length - 2; !appended && i >= 0; i--) {
      if (messages[i].id === prevLastId) appended = true;
    }
    if (!appended) return;

    if (prevLastId === null || isNearBottomRef.current) {
      scrollToBottom();
    } else {
      setHasNewBelow(true);
    }
  }, [messages]);

  // Ads from the Dev Menu show as one pinned card that hides itself after a few seconds.
  useEffect(() => {
    const handleAdTrigger = (e: Event) => setPinnedAd((e as CustomEvent<PinnedAd>).detail);
    window.addEventListener('dev_ad_triggered', handleAdTrigger);
    return () => window.removeEventListener('dev_ad_triggered', handleAdTrigger);
  }, []);

  useEffect(() => {
    if (!pinnedAd) return;
    const timer = window.setTimeout(() => setPinnedAd(null), PINNED_AD_MS);
    return () => window.clearTimeout(timer);
  }, [pinnedAd]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || isGuest || isStreamEnded) return;
    onSendChat(text);
    setInputText('');
    scrollToBottom();
  };

  const handleSendGift = (gift: GiftItem) => {
    if (isGuest || isGiftPending || isStreamEnded) return;
    if (userBalance < gift.cost_coins) {
      setInsufficientFundsGift(gift.name);
      setTimeout(() => setInsufficientFundsGift(null), 3000);
      return;
    }

    onSendGift(gift.id, inputText.trim());
    setInputText('');
    setShowGiftDrawer(false);
  };

  const handleMute = (minutes: number) => {
    if (!muteTarget) return;
    onMuteUser(muteTarget.userId, minutes);
    setMuteTarget(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#09090b] relative">

      {/* --- Pinned sponsored card (stays put while chat scrolls) --- */}
      {pinnedAd && (
        <div className="relative shrink-0 border-b border-white/[0.03]">
          <SponsoredChatDrop
            brandName={pinnedAd.brandName}
            brandIcon={pinnedAd.brandIcon}
            message={pinnedAd.message}
            rewardCoins={pinnedAd.rewardCoins}
            linkUrl={pinnedAd.linkUrl}
          />
          <button
            onClick={() => setPinnedAd(null)}
            className="absolute top-3 right-5 p-1 text-zinc-500 hover:text-white transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      
      {/* --- Chat Scroll Area --- */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto pt-2 pb-24 space-y-1.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      >
        {messages.map((item) => {
          return (
            <div key={item.id} className="relative group px-4 py-1 hover:bg-white/[0.02] transition-colors">
              
              {/* Creator Mod Tools */}
              {role === 'creator' && !isStreamEnded && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-[#09090b]/90 backdrop-blur-sm p-1 rounded-md border border-white/5 shadow-lg z-10">
                  <button onClick={() => onRetractMessage(item.id)} className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors rounded hover:bg-white/5" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {!item.isCreator && item.senderId && (
                    <button onClick={() => setMuteTarget({ userId: item.senderId, name: item.senderName })} className="p-1.5 text-zinc-500 hover:text-orange-400 transition-colors rounded hover:bg-white/5" title="Mute">
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Layout Grid */}
              <div className="grid grid-cols-[24px_1fr] gap-3 items-start">
                <img src={item.avatarUrl || '/logo.webp'} alt={item.senderName} className="w-6 h-6 rounded-full object-cover mt-0.5 opacity-90 border border-zinc-800" />
                
                <div className="min-w-0">
                  {item.gift ? (
                    /* Claymorphic High-End Gift Card */
                    <div className="relative bg-[#0c0c0e] border border-zinc-800/50 rounded-xl p-2.5 mt-0.5 shadow-[4px_4px_10px_rgba(0,0,0,0.5),-2px_-2px_6px_rgba(255,255,255,0.02),inset_1px_1px_2px_rgba(255,255,255,0.05),inset_-1px_-1px_2px_rgba(0,0,0,0.3)] overflow-hidden group-hover:border-amber-500/30 transition-colors">
                      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-amber-500/0 via-amber-500/40 to-amber-500/0" />
                      
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-1.5">
                        <span className="inline-flex items-center gap-1 text-[13px] font-extrabold text-amber-500 drop-shadow-sm">
                          {item.senderName}
                          {item.isCreator && <span title="Stream creator"><BadgeCheck className="w-3.5 h-3.5" /></span>}
                        </span>
                        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Sent</span>
                        <span className="text-[13px] font-bold text-zinc-200">{item.gift.name}</span>
                        
                        <div className="ml-auto flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]">
                          <GiftIcon icon={item.gift.icon} className="text-sm leading-none drop-shadow-md" />
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
                      <span className={`inline-flex items-center gap-1 text-[13px] font-bold mr-2.5 align-baseline ${item.isCreator ? 'text-indigo-400' : 'text-zinc-400'}`}>
                        {item.senderName}
                        {item.isCreator && <span title="Stream creator"><BadgeCheck className="w-3.5 h-3.5 text-amber-400" /></span>}
                      </span>
                      <span className="text-[13px] text-zinc-200 break-words break-all whitespace-pre-wrap align-baseline">{item.text}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hasNewBelow && (
        <button
          onClick={scrollToBottom}
          className="absolute left-1/2 -translate-x-1/2 bottom-24 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg transition-colors"
        >
          New messages <ArrowDown className="w-3.5 h-3.5" />
        </button>
      )}

      {/* --- Unified Input Action Bar --- */}
      <div className="absolute bottom-0 w-full bg-gradient-to-t from-[#09090b] via-[#09090b] to-transparent pt-8 pb-4 px-4 z-30 pointer-events-none">

        {sendError && !isGuest && (
          <p className="mb-2 text-xs text-red-400 font-medium pointer-events-auto">{sendError}</p>
        )}
        
        {role === 'creator' && muteTarget && !isStreamEnded && (
          <div className="mb-3 bg-zinc-900 border border-white/5 rounded-2xl p-3 animate-in slide-in-from-bottom-2 fade-in duration-200 shadow-[0_-8px_20px_rgba(0,0,0,0.5),inset_1px_1px_3px_rgba(255,255,255,0.1),inset_-1px_-1px_3px_rgba(0,0,0,0.4)] pointer-events-auto">
            <div className="flex items-center justify-between mb-1 px-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest drop-shadow-sm truncate">Mute {muteTarget.name}</span>
              <button onClick={() => setMuteTarget(null)} className="text-zinc-500 hover:text-white transition-colors active:scale-95" title="Cancel">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="mb-3 px-1 text-[11px] text-zinc-500">They can't chat or send gifts. This can't be undone early.</p>

            <div className="grid grid-cols-2 gap-2">
              {MUTE_OPTIONS.map((opt) => (
                <button
                  key={opt.minutes}
                  onClick={() => handleMute(opt.minutes)}
                  className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.02] hover:bg-white/[0.04] hover:text-orange-400 text-[12px] font-semibold text-zinc-300 transition-all duration-200 shadow-[2px_2px_6px_rgba(0,0,0,0.4),-1px_-1px_4px_rgba(255,255,255,0.02)] hover:shadow-[4px_4px_8px_rgba(0,0,0,0.5),-2px_-2px_6px_rgba(255,255,255,0.04)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {showGiftDrawer && (
          <div className="mb-3 bg-zinc-900 border border-white/5 rounded-2xl p-3 animate-in slide-in-from-bottom-2 fade-in duration-200 shadow-[0_-8px_20px_rgba(0,0,0,0.5),inset_1px_1px_3px_rgba(255,255,255,0.1),inset_-1px_-1px_3px_rgba(0,0,0,0.4)] pointer-events-auto">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest drop-shadow-sm">Select Gift</span>
              <button onClick={() => setShowGiftDrawer(false)} className="text-zinc-500 hover:text-white transition-colors active:scale-95">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {insufficientFundsGift && (
              <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-between shadow-[inset_1px_1px_3px_rgba(0,0,0,0.3)]">
                <span className="text-xs text-red-400 font-medium drop-shadow-sm">Need coins for {insufficientFundsGift}</span>
                <button onClick={onTopUpClick} className="text-[10px] font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-500 px-2 py-1 rounded shadow-md active:scale-95 transition-all">Top Up</button>
              </div>
            )}

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {gifts.map((gift) => (
                <button
                  key={gift.id}
                  onClick={() => handleSendGift(gift)}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.02] hover:bg-white/[0.04] transition-all duration-200 group shadow-[2px_2px_6px_rgba(0,0,0,0.4),-1px_-1px_4px_rgba(255,255,255,0.02)] hover:shadow-[4px_4px_8px_rgba(0,0,0,0.5),-2px_-2px_6px_rgba(255,255,255,0.04)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]"
                >
                  <GiftIcon icon={gift.icon} className="text-2xl mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] text-zinc-400 font-medium truncate w-full text-center drop-shadow-sm">{gift.name}</span>
                  <span className="text-[10px] text-amber-400 font-bold mt-0.5 drop-shadow-sm">{gift.cost_coins}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {role === 'viewer' && isGuest && (
          <div className="flex items-center gap-2 p-1.5 bg-white/[0.02] border border-white/5 rounded-2xl pointer-events-auto">
            <input
              type="text"
              disabled
              placeholder="Log in to chat"
              className="flex-1 bg-transparent py-1.5 px-2 text-sm text-zinc-500 placeholder-zinc-500 cursor-not-allowed focus:outline-none"
            />
            <button
              type="button"
              onClick={onLoginClick}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#4F46E5] hover:brightness-110 text-white text-xs font-bold transition-all shrink-0 active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" /> Log in
            </button>
          </div>
        )}

        {!isGuest && isStreamEnded && (
          <p className="text-center text-xs text-zinc-500 font-medium py-2 pointer-events-auto">Chat is closed — the stream has ended.</p>
        )}

        {!isGuest && !isStreamEnded && (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 p-1.5 bg-white/[0.02] border border-white/5 hover:border-white/10 focus-within:border-indigo-500/30 focus-within:bg-white/[0.04] rounded-2xl transition-all pointer-events-auto shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3),inset_-1px_-1px_3px_rgba(255,255,255,0.03)]">
            {/* A creator can't gift their own stream. */}
            {role === 'viewer' && (
            <button
              type="button"
              onClick={() => setShowGiftDrawer((prev) => !prev)}
              className={`p-2 rounded-xl transition-all shrink-0 active:scale-95 ${
                showGiftDrawer 
                  ? 'bg-amber-500/20 text-amber-400 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.2)]' 
                  : 'text-zinc-400 hover:text-amber-400 hover:bg-white/5 shadow-[2px_2px_4px_rgba(0,0,0,0.2),-1px_-1px_2px_rgba(255,255,255,0.02)] hover:shadow-[3px_3px_6px_rgba(0,0,0,0.3),-1px_-1px_3px_rgba(255,255,255,0.03)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]'
              }`}
            >
              <Gift className="w-4 h-4" />
            </button>
            )}

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Send a message..."
              className="flex-1 bg-transparent py-1.5 px-1 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none drop-shadow-sm"
            />
            
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 rounded-xl bg-[#4F46E5] hover:brightness-110 disabled:bg-white/5 disabled:text-zinc-600 text-white transition-all shrink-0 active:scale-95 disabled:shadow-none shadow-[2px_2px_5px_rgba(0,0,0,0.4),-1px_-1px_3px_rgba(255,255,255,0.05),inset_1px_1px_2px_rgba(255,255,255,0.2),inset_-1px_-1px_2px_rgba(0,0,0,0.3)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)] border-none"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};