import React, { useState, useRef, useEffect } from 'react';
import {
  type ChatMessage,
  GIFT_TIERS,
  type GiftTier,
  MOCK_CHAT_MESSAGES,
} from '../../constants/streamMockData';

interface LiveChatProps {
  userBalance: number;
  onSpendCoins: (amount: number) => void;
  onTopUpClick?: () => void;
}

export const LiveChat: React.FC<LiveChatProps> = ({
  userBalance,
  onSpendCoins,
  onTopUpClick,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_CHAT_MESSAGES);
  const [inputText, setInputText] = useState<string>('');
  const [showGiftDrawer, setShowGiftDrawer] = useState<boolean>(false);
  const [insufficientFundsGift, setInsufficientFundsGift] = useState<string | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage: ChatMessage = {
      id: `chat-${Date.now()}`,
      userId: 'current-user',
      userName: 'You',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      message: inputText.trim(),
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
  };

  const handleSendGift = (gift: GiftTier) => {
    if (userBalance < gift.coins) {
      setInsufficientFundsGift(gift.name);
      setTimeout(() => setInsufficientFundsGift(null), 3000);
      return;
    }

    // Deduct coins
    onSpendCoins(gift.coins);

    // Append gift message to chat
    const giftMessage: ChatMessage = {
      id: `chat-gift-${Date.now()}`,
      userId: 'current-user',
      userName: 'You',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      gift: {
        name: gift.name,
        icon: gift.icon,
        coins: gift.coins,
      },
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, giftMessage]);
    setShowGiftDrawer(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0f12] text-white">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-800">
        {messages.map((item) => (
          <div key={item.id} className="text-xs leading-relaxed break-words">
            {/* Gift Announcement Layout */}
            {item.gift ? (
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-transparent border border-amber-500/20 flex items-center justify-between gap-2 shadow-sm my-1">
                <div className="flex items-center gap-2">
                  <img
                    src={item.avatar}
                    alt={item.userName}
                    className="w-6 h-6 rounded-full object-cover border border-amber-400/40"
                  />
                  <div>
                    <span className="font-semibold text-amber-300">
                      {item.userName}
                    </span>{' '}
                    <span className="text-gray-300">sent a</span>{' '}
                    <span className="font-semibold text-white">
                      {item.gift.name}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg border border-amber-500/20">
                  <span className="text-lg leading-none">{item.gift.icon}</span>
                  <span className="text-[11px] font-bold text-amber-400">
                    {item.gift.coins}
                  </span>
                </div>
              </div>
            ) : (
              /* Regular Text Message Layout */
              <div className="flex items-start gap-2.5">
                <img
                  src={item.avatar}
                  alt={item.userName}
                  className="w-5 h-5 rounded-full object-cover mt-0.5"
                />
                <div>
                  <span className="font-semibold text-gray-400 mr-2">
                    {item.userName}:
                  </span>
                  <span className="text-gray-100">{item.message}</span>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={chatBottomRef} />
      </div>

      {/* Insufficient Coins Warning Overlay */}
      {insufficientFundsGift && (
        <div className="mx-3 mb-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between text-xs">
          <span className="text-red-300">
            Need more coins for <strong>{insufficientFundsGift}</strong>
          </span>
          <button
            onClick={onTopUpClick}
            className="text-[11px] font-bold text-red-200 bg-red-600/60 hover:bg-red-600 px-2.5 py-1 rounded-md transition-colors"
          >
            Buy Coins
          </button>
        </div>
      )}

      {/* Gift Selection Tray */}
      {showGiftDrawer && (
        <div className="p-3 bg-[#13161c] border-t border-gray-800/80">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-gray-300">
              Send a Gift to Creator
            </span>
            <button
              onClick={() => setShowGiftDrawer(false)}
              className="text-xs text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {GIFT_TIERS.map((gift) => (
              <button
                key={gift.id}
                onClick={() => handleSendGift(gift)}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#1a1f29] hover:bg-[#232a38] border border-gray-800 hover:border-gray-600 transition-all duration-150 group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {gift.icon}
                </span>
                <span className="text-[10px] text-gray-400 mt-1 font-medium">
                  {gift.name}
                </span>
                <span className="text-[10px] text-amber-400 font-bold">
                  {gift.coins} 🪙
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Input Action Bar */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-[#12151a] border-t border-gray-800/60 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={() => setShowGiftDrawer((prev) => !prev)}
          className={`p-2 rounded-xl border transition-all ${
            showGiftDrawer
              ? 'bg-amber-500/20 border-amber-500 text-amber-400'
              : 'bg-[#1a1f29] border-gray-800 text-gray-400 hover:text-amber-400'
          }`}
          title="Send Gift"
        >
          🎁
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Send a message..."
          className="flex-1 bg-[#1a1f29] border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
};