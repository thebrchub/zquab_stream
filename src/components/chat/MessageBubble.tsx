import { Loader2, Check, CheckCheck, Clock, Reply } from 'lucide-react';
import { memo } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

export interface ReplyData {
  id: string; // 🛠️ NEW: Needed to target the scroll
  text: string;
  isOwn: boolean;
}

interface Props {
  id: string; // 🛠️ NEW: Unique ID for the DOM element
  message?: string;
  content?: string; 
  isOwn: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  time?: string;
  imageUrl?: string;
  onImageClick?: (url: string) => void; 
  isUploading?: boolean;
  isSystem?: boolean;
  replyTo?: ReplyData;
  onSwipeToReply?: () => void;
  onReplyClick?: (id: string) => void; // 🛠️ NEW: Click handler
  isHighlighted?: boolean; // 🛠️ NEW: Controls the temporary glow
  partnerName?: string; // 🛠️ ADD THIS
}

const isOnlyEmojis = (str: string) => {
  if (!str.trim()) return false;
  const emojiRegex = /^[\p{Extended_Pictographic}\s]+$/u;
  return emojiRegex.test(str);
};

function MessageBubble({ id, message, content, isOwn, status, time, imageUrl, onImageClick, isUploading, isSystem, replyTo, onSwipeToReply, onReplyClick, isHighlighted, partnerName }: Props) {
  const displayText = content || message || '';
  
  const x = useMotionValue(0);
  const iconOpacity = useTransform(x, [-60, -30, 0, 30, 60], [1, 0, 0, 0, 1]);
  const iconScale = useTransform(x, [-60, -30, 0, 30, 60], [1, 0.5, 0.5, 0.5, 1]);

  if (isSystem) {
    return (
      <div className="flex justify-center my-4 sm:my-6 w-full select-none">
        <span className="text-[11px] sm:text-xs font-black text-[var(--text-muted)] uppercase tracking-widest text-center px-4">
          {displayText}
        </span>
      </div>
    );
  }

  const formattedTime = time ? new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
  const emojiOnly = isOnlyEmojis(displayText);

  const renderStatusIcon = () => {
    if (!isOwn || !status) return null;
    switch (status) {
      case 'sending': return <Clock className="w-3 h-3 text-white/70" />;
      case 'sent': return <Check className="w-3.5 h-3.5 text-white/70" />;
      case 'delivered': return <CheckCheck className="w-3.5 h-3.5 text-white/70" />;
      case 'read': return <CheckCheck className="w-3.5 h-3.5 text-[#4ade80]" />; 
      default: return null;
    }
  };

  const handleDragEnd = (_event: any, info: any) => {
    if (Math.abs(info.offset.x) > 50) {
      if (navigator.vibrate) navigator.vibrate(30); 
      onSwipeToReply?.();
    }
  };

  return (
    // 🛠️ THE FIX: Attached the DOM ID here
    <div id={`msg-${id}`} className={`relative flex flex-col w-full mb-4 ${isOwn ? 'items-end' : 'items-start'} group overflow-visible`}>
      
      {/* 🛠️ THE FIX: The Temporary Highlight Overlay */}
      <div 
        className={`absolute -inset-y-1 -inset-x-2 md:-inset-x-4 rounded-xl pointer-events-none transition-all duration-700 z-0 ${
          isHighlighted 
            ? (isOwn ? 'bg-[#3B82F6]/20' : 'bg-white/10 dark:bg-white/10') 
            : 'bg-transparent'
        }`} 
      />

      {onSwipeToReply && (
        <motion.div 
          style={{ opacity: iconOpacity, scale: iconScale }}
          className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-main)] shadow-sm ${isOwn ? 'left-4' : 'right-4'}`}
        >
          <Reply className="w-4 h-4" />
        </motion.div>
      )}

      <motion.div
        drag={onSwipeToReply ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        style={{ x, alignItems: isOwn ? 'flex-end' : 'flex-start' }}
        className="relative z-10 w-full flex flex-col"
      >
        {imageUrl && (
          <div className={`max-w-[75%] md:max-w-[65%] min-w-0 mb-1 relative rounded-2xl overflow-hidden`}>
            <img 
              src={imageUrl} 
              alt="Shared photo" 
              draggable={false} 
              onDragStart={(e) => e.preventDefault()} 
              onClick={!isUploading ? () => onImageClick?.(imageUrl) : undefined}
              className={`w-full h-auto object-cover shadow-sm border border-[var(--border-color)] transition-all duration-300 ${
                isUploading ? 'opacity-60 blur-sm grayscale-[30%]' : 'cursor-zoom-in hover:opacity-90 active:scale-[0.98]'
              }`} 
            />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/60 p-3 sm:p-4 rounded-full backdrop-blur-md flex flex-col items-center justify-center shadow-2xl">
                  <Loader2 className="w-6 h-6 text-white animate-spin mb-1" />
                  <span className="text-[10px] text-white font-bold tracking-widest uppercase">Sending</span>
                </div>
              </div>
            )}
          </div>
        )}
        
        {displayText && (
          <div 
            className={`max-w-[75%] md:max-w-[65%] min-w-0 flex flex-col relative transition-all duration-200 ease-out
              ${emojiOnly 
                ? 'bg-transparent text-4xl leading-tight'
                : `rounded-2xl px-4 py-2.5 shadow-sm text-base md:text-[17px] leading-relaxed
                   ${isOwn 
                     ? 'bg-[#3B82F6] text-white rounded-tr-sm' 
                     : 'bg-[var(--card)] border border-[var(--border-color)] text-[var(--text-main)] rounded-tl-sm'
                   }`
              }`}
          >
            
            {/* 🛠️ THE FIX: Made the inline reply block clickable */}
            {replyTo && (
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  if (replyTo.id && onReplyClick) onReplyClick(replyTo.id);
                }}
                className={`cursor-pointer active:scale-[0.98] transition-all mb-2 pl-3 py-1.5 border-l-[3px] rounded-r-md text-sm ${
                  isOwn 
                    ? 'border-white/50 bg-black/10 hover:bg-black/20' 
                    : 'border-[#3B82F6] bg-[var(--background)] hover:bg-[var(--border-color)]'
                }`}
              >
                <p className={`font-bold text-[11px] uppercase tracking-wider mb-0.5 ${isOwn ? 'text-blue-100' : 'text-[#3B82F6]'}`}>
    {replyTo.isOwn ? 'You' : (partnerName || 'Stranger')}
  </p>
                <p className={`line-clamp-2 leading-snug ${isOwn ? 'text-white/90' : 'text-[var(--text-muted)]'}`}>
                  {replyTo.text}
                </p>
              </div>
            )}

            <p className="break-words whitespace-pre-wrap">{displayText}</p>
            
            {formattedTime && !emojiOnly && (
              <div className={`flex items-center gap-1 mt-1 text-[10px] uppercase font-bold self-end ${isOwn ? 'text-blue-100' : 'text-[var(--text-muted)]'}`}>
                <span>{formattedTime}</span>
                <div className="flex items-center ml-0.5">
                  {renderStatusIcon()}
                </div>
              </div>
            )}
          </div>
        )}

        {formattedTime && emojiOnly && (
          <div className={`flex items-center gap-1 mt-1 text-[10px] uppercase font-bold text-[var(--text-muted)]`}>
            <span>{formattedTime}</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default memo(MessageBubble);