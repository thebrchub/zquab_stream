import { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from '../context/WalletContext';
import { useWebSocket, wsEvents } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import { streamService } from '../services/streamService';
import type { LiveChatMessage } from '../types/streamEvents';

interface MessageContext {
  ownUserID?: string;
  ownAvatarURL: string;
  creatorUsername?: string;
}

// Long busy streams would otherwise keep every message in memory and on screen.
const MAX_CHAT_MESSAGES = 500;

const keepLatest = (list: LiveChatMessage[]) =>
  list.length > MAX_CHAT_MESSAGES ? list.slice(-MAX_CHAT_MESSAGES) : list;

// Turns a chat_message or gift_sent envelope (live or from history) into a chat row.
const toLiveChatMessage = (env: any, ctx: MessageContext): LiveChatMessage | null => {
  const messageId = String(env?.id || '');
  if (!messageId) return null;

  if (env.type === 'chat_message') {
    const metaData = env.meta_data || env.metaData;
    const senderID = metaData?.from || '';
    const isOwn = !!ctx.ownUserID && senderID === ctx.ownUserID;
    const senderName = metaData?.from_name || metaData?.fromName || 'guest';
    return {
      id: messageId,
      senderId: senderID,
      senderName: isOwn ? 'You' : senderName,
      avatarUrl: isOwn ? ctx.ownAvatarURL : metaData?.from_avatar_url || metaData?.fromAvatarUrl || '',
      isCreator: senderName === ctx.creatorUsername,
      isOwn,
      text: env.payload?.text || '',
    };
  }

  if (env.type === 'gift_sent') {
    const gift = env.payload;
    const senderID = gift?.sender_id || gift?.senderId || '';
    const isOwn = !!ctx.ownUserID && senderID === ctx.ownUserID;
    const senderUsername = gift?.sender_username || gift?.senderUsername || '';
    return {
      id: messageId,
      senderId: senderID,
      senderName: isOwn ? 'You' : gift?.sender_name || gift?.senderName || senderUsername || 'Viewer',
      avatarUrl: isOwn ? ctx.ownAvatarURL : gift?.sender_avatar_url || gift?.senderAvatarUrl || '',
      isCreator: senderUsername === ctx.creatorUsername,
      isOwn,
      text: gift?.message || '',
      gift: {
        name: gift?.gift_name || gift?.giftName || 'Gift',
        icon: gift?.gift_icon || gift?.giftIcon || '',
        coins: Number(gift?.coins || 0),
      },
    };
  }
  return null;
};

export const useLiveStreamRoom = (
  roomId: string | undefined,
  streamId: string,
  creatorUsername?: string,
  initialPaused = false,
) => {
  const [viewerCount, setViewerCount] = useState<number>(0);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [isGiftPending, setIsGiftPending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isStreamEnded, setIsStreamEnded] = useState(false);
  const [isPaused, setIsPaused] = useState(initialPaused);
  // Coins earned this stream so far (streamer only; null until the first update).
  const [streamEarnings, setStreamEarnings] = useState<number | null>(null);
  const hasConnectedRef = useRef(false);
  const pendingChatRef = useRef(new Map<string, string>());
  
  const { updateBalanceLocally } = useWallet();
  const { user } = useAuth();
  const { isConnected, sendMessage } = useWebSocket();
  const ownUserID = user?.user_id;
  const ownUsername = user?.username;
  const ownAvatarURL = user?.avatar_url || '';

  useEffect(() => {
    setIsPaused(initialPaused);
  }, [initialPaused]);

  // Latest values for the socket listener, which is subscribed once per room.
  const latestRef = useRef({ ownUserID, ownUsername, ownAvatarURL, creatorUsername, updateBalanceLocally });
  latestRef.current = { ownUserID, ownUsername, ownAvatarURL, creatorUsername, updateBalanceLocally };

  useEffect(() => {
    if (!isConnected) return;
    if (!hasConnectedRef.current) {
      hasConnectedRef.current = true;
      return;
    }

    let isCurrent = true;
    streamService.getStreamMetadata(streamId)
      .then((stream) => {
        if (!isCurrent) return;
        if (stream.status !== 'live') {
          setIsStreamEnded(true);
          setIsGiftPending(false);
        }
        // Pause/resume events may have been missed while the socket was down.
        setIsPaused(stream.status === 'live' && !!stream.is_paused);
      })
      .catch(() => undefined);

    return () => { isCurrent = false; };
  }, [isConnected, streamId]);

  // 1. Join the room on mount or reconnect
  useEffect(() => {
    if (!roomId || !isConnected) return;
    
    // Sends the standard join_room envelope so the backend registers the viewer
    sendMessage('join_room', undefined, roomId);
    
    return () => {
      // Optional: Explicitly leave room on unmount if your backend requires it
      if (isConnected) sendMessage('leave_room', undefined, roomId);
    };
  }, [roomId, isConnected, sendMessage]);

  // 2. Listen to every socket message (not just the latest one, which can skip messages in busy chats)
  useEffect(() => {
    if (!roomId) return;

    return wsEvents.subscribe((msg: any) => {
      const latest = latestRef.current;
      const msgRoomId = msg.room_id || msg.roomId;

      if (msg.type === 'error') {
        setIsGiftPending(false);
        pendingChatRef.current.clear();
        setSendError(msg.payload?.message || 'Unable to send message.');
        return;
      }
      if (msg.type === 'send_confirm') {
        const messageId = String(msg.id || '');
        const text = pendingChatRef.current.get(messageId);
        if (!text) return;
        pendingChatRef.current.delete(messageId);
        setMessages((current) => current.some((message) => message.id === messageId)
          ? current
          : keepLatest([...current, {
              id: messageId,
              senderId: latest.ownUserID || '',
              senderName: 'You',
              avatarUrl: latest.ownAvatarURL,
              isCreator: latest.ownUsername !== undefined && latest.creatorUsername !== undefined && latest.ownUsername === latest.creatorUsername,
              isOwn: true,
              text,
            }]));
        return;
      }
      if (msg.type === 'gift_confirm') {
        const confirm = msg.payload;
        const newBalance = confirm?.balance_coins ?? confirm?.balanceCoins;
        if (newBalance !== undefined) {
          latest.updateBalanceLocally(Number(newBalance));
        }
        setIsGiftPending(false);
        return;
      }
      if (msg.type === 'stream_earnings') {
        const earnings = msg.payload?.earnings_coins ?? msg.payload?.earningsCoins;
        if (earnings !== undefined) setStreamEarnings(Number(earnings));
        return;
      }
      if (msgRoomId !== roomId) return;

      const ctx: MessageContext = {
        ownUserID: latest.ownUserID,
        ownAvatarURL: latest.ownAvatarURL,
        creatorUsername: latest.creatorUsername,
      };

      switch (msg.type) {
        case 'viewer_count':
        case 'viewer_count_updated': {
          const count = msg.payload?.viewer_count || msg.payload?.viewerCount || 0;
          setViewerCount(Number(count));
          break;
        }

        case 'recent_messages': {
          const history = ((msg.payload?.messages || []) as any[])
            .map((env) => toLiveChatMessage(env, ctx))
            .filter((m): m is LiveChatMessage => m !== null);
          if (history.length === 0) break;
          const historyIds = new Set(history.map((m) => m.id));
          // Rows not in history are older than it (or local-only), so they stay on top.
          setMessages((current) => keepLatest([...current.filter((m) => !historyIds.has(m.id)), ...history]));
          break;
        }

        case 'chat_message':
        case 'gift_sent': {
          const row = toLiveChatMessage(msg, ctx);
          if (!row) break;
          setMessages((current) => current.some((message) => message.id === row.id) ? current : keepLatest([...current, row]));
          break;
        }

        case 'message_retracted': {
          const messageId = msg.payload?.message_id || msg.payload?.messageId;
          if (messageId) setMessages((current) => current.filter((message) => message.id !== messageId));
          break;
        }

        case 'stream_paused': {
          setIsPaused(true);
          break;
        }

        case 'stream_resumed': {
          setIsPaused(false);
          break;
        }

        case 'stream_ended': {
          setIsStreamEnded(true);
          setIsPaused(false);
          setIsGiftPending(false);
          break;
        }
      }
    });
  }, [roomId]);

  // 3. Send a gift
  const sendGift = useCallback((giftId: number, message: string = "") => {
    if (!roomId || isGiftPending || isStreamEnded) return;

    // Truncate message defensively as per backend spec (max 200 chars)
    const safeMessage = message.substring(0, 200);

    const payload = {
      gift_id: giftId,
      message: safeMessage
    };

    setSendError(null);
    setIsGiftPending(true);
    if (!sendMessage('gift', payload, roomId)) {
      setIsGiftPending(false);
      setSendError('Unable to send gift.');
    }
  }, [roomId, sendMessage, isGiftPending, isStreamEnded]);

  const sendChat = useCallback((text: string) => {
    const safeText = text.trim();
    if (!roomId || !safeText || isStreamEnded) return;

    setSendError(null);
    const messageId = sendMessage('chat_message', { text: safeText }, roomId);
    if (!messageId) {
      setSendError('Unable to send message.');
      return;
    }
    pendingChatRef.current.set(messageId, safeText);
  }, [roomId, sendMessage, isStreamEnded]);

  const retractMessage = useCallback((messageId: string) => {
    if (!roomId || !messageId || isStreamEnded) return;
    if (!sendMessage('retract_message', { message_id: messageId }, roomId)) {
      setSendError('Unable to retract message.');
    }
  }, [roomId, sendMessage, isStreamEnded]);

  // minutes: 10, 30, 60, or 0 for the rest of the stream.
  const muteUser = useCallback((userId: string, minutes: number) => {
    if (!roomId || !userId || isStreamEnded) return;
    if (!sendMessage('mute_user', { user_id: userId, minutes }, roomId)) {
      setSendError('Unable to mute viewer.');
    }
  }, [roomId, sendMessage, isStreamEnded]);

  return {
    viewerCount,
    messages,
    isGiftPending,
    sendError,
    isStreamEnded,
    isPaused,
    streamEarnings,
    sendChat,
    sendGift,
    retractMessage,
    muteUser,
  };
};