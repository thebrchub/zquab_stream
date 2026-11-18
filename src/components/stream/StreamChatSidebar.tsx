import React from 'react';
import { Eye, PanelRightClose, Pin } from 'lucide-react';
import { LiveChat } from './LiveChat';
import type { LiveChatMessage } from '../../types/streamEvents';

interface StreamChatSidebarProps {
  role: 'viewer' | 'creator';
  balanceCoins: number;
  viewerCount: number;
  messages: LiveChatMessage[];
  onSendChat: (text: string) => void;
  onSendGift: (giftId: number, message?: string) => void;
  onRetractMessage: (messageId: string) => void;
  onMuteUser: (userId: string, minutes: number) => void;
  isGiftPending: boolean;
  sendError: string | null;
  isStreamEnded: boolean;
  onOpenPurchase?: () => void;
  onToggleCollapse: () => void;
  isGuest?: boolean;
  onLoginClick?: () => void;
}

export const StreamChatSidebar: React.FC<StreamChatSidebarProps> = ({
  role,
  balanceCoins,
  viewerCount,
  messages,
  onSendChat,
  onSendGift,
  onRetractMessage,
  onMuteUser,
  isGiftPending,
  sendError,
  isStreamEnded,
  onOpenPurchase,
  onToggleCollapse,
  isGuest,
  onLoginClick,
}) => {
  return (
    <div className="w-full h-full flex flex-col bg-[#09090b] relative">
      {/* Compact header: only the collapse icon is restyled; dimensions remain unchanged. */}
      <div className="px-4 py-3.5 flex items-center justify-between shrink-0 bg-[#09090b] z-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="group -ml-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition-colors duration-200 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70"
            title="Collapse chat"
            aria-label="Collapse chat"
          >
            <PanelRightClose className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
          </button>
          <h2 className="text-[11px] font-bold text-zinc-200 uppercase tracking-widest">
            Stream Chat
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
          <Eye className="w-3.5 h-3.5" />
          {viewerCount.toLocaleString()}
        </div>
      </div>

      {/* Existing pinned message strip retained exactly in its compact layout. */}
      <div className="px-4 py-2.5 bg-indigo-500/[0.03] backdrop-blur-md border-b border-white/[0.02] flex items-start gap-3 relative overflow-hidden shrink-0">
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-500/50" />
        <Pin className="w-3.5 h-3.5 text-indigo-400/80 mt-0.5 shrink-0" />
        <p className="text-xs text-zinc-400 font-medium leading-relaxed pr-2">
          <span className="text-zinc-200 font-semibold">Welcome!</span> Keep it positive, no spamming.
        </p>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <LiveChat
          role={role}
          userBalance={balanceCoins}
          messages={messages}
          onSendChat={onSendChat}
          onSendGift={onSendGift}
          onRetractMessage={onRetractMessage}
          onMuteUser={onMuteUser}
          isGiftPending={isGiftPending}
          sendError={sendError}
          isStreamEnded={isStreamEnded}
          onTopUpClick={onOpenPurchase}
          isGuest={isGuest}
          onLoginClick={onLoginClick}
        />
      </div>
    </div>
  );
};
