import { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from '../context/WalletContext';
import { useWebSocket } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import { streamService } from '../services/streamService';
import type { LiveChatMessage } from '../types/streamEvents';

export const useLiveStreamRoom = (roomId: string | undefined, streamId: string, creatorUsername?: string) => {
  const [viewerCount, setViewerCount] = useState<number>(0);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [isGiftPending, setIsGiftPending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isStreamEnded, setIsStreamEnded] = useState(false);
  const hasConnectedRef = useRef(false);
  const pendingChatRef = useRef(new Map<string, string>());
  
  const { updateBalanceLocally, refreshBalance } = useWallet();
  const { user } = useAuth();
  const { isConnected, sendMessage, lastMessage } = useWebSocket();
  const ownUserID = user?.user_id;
  const ownUsername = user?.username;
  const ownAvatarURL = user?.avatar_url || '';

  useEffect(() => {
    if (!isConnected) return;
    if (!hasConnectedRef.current) {
      hasConnectedRef.current = true;
      return;
    }

    let isCurrent = true;
    streamService.getStreamMetadata(streamId)
      .then((stream) => {
        if (isCurrent && stream.status !== 'live') {
          setIsStreamEnded(true);
          setIsGiftPending(false);
        }
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

  // 2. Listen for incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    // Protobufjs might expose this as camelCase or snake_case depending on your options
    const msgRoomId = lastMessage.room_id || lastMessage.roomId;
    if (lastMessage.type === 'error') {
      if (isGiftPending) setIsGiftPending(false);
      pendingChatRef.current.clear();
      setSendError(lastMessage.payload?.message || 'Unable to send message.');
      return;
    }
    if (lastMessage.type === 'send_confirm') {
      const messageId = String(lastMessage.id || '');
      const text = pendingChatRef.current.get(messageId);
      if (!text) return;
      pendingChatRef.current.delete(messageId);
      setMessages((current) => current.some((message) => message.id === messageId)
        ? current
        : [...current, {
            id: messageId,
            senderId: '',
            senderName: 'You',
            avatarUrl: ownAvatarURL,
            isCreator: ownUsername !== undefined && creatorUsername !== undefined && ownUsername === creatorUsername,
            text,
          }]);
      return;
    }
    if (lastMessage.type === 'gift_confirm') {
      const confirm = lastMessage.payload;
      const newBalance = confirm?.balance_coins ?? confirm?.balanceCoins;
      if (newBalance !== undefined) {
        updateBalanceLocally(Number(newBalance));
      }
      setIsGiftPending(false);
      return;
    }
    if (lastMessage.type === 'stream_earnings') {
      void refreshBalance();
      return;
    }
    if (msgRoomId !== roomId) return;
  	const metaData = lastMessage.meta_data || lastMessage.metaData;

    switch (lastMessage.type) {
      case 'viewer_count':
      case 'viewer_count_updated': { 
        // Handles both the API spec ('viewer_count') and the proto lookup string
        const count = lastMessage.payload?.viewer_count || lastMessage.payload?.viewerCount || 0;
        setViewerCount(Number(count));
        break;
      }

      case 'chat_message': {
        const messageId = String(lastMessage.id || '');
        if (!messageId) break;
		const senderName = metaData?.from_name || metaData?.fromName || 'guest';
        setMessages((current) => current.some((message) => message.id === messageId)
          ? current
          : [...current, {
              id: messageId,
			  senderId: metaData?.from || '',
              senderName,
			  avatarUrl: metaData?.from_avatar_url || metaData?.fromAvatarUrl || '',
              isCreator: senderName === creatorUsername,
              text: lastMessage.payload?.text || '',
            }]);
        break;
      }

      case 'gift_sent': {
        const gift = lastMessage.payload;
        const messageId = String(lastMessage.id || `${gift?.sender_id || gift?.senderId}-${Date.now()}`);
        const senderID = gift?.sender_id || gift?.senderId || '';
        const isOwnGift = senderID === ownUserID;
        const senderUsername = gift?.sender_username || gift?.senderUsername || '';
        setMessages((current) => current.some((message) => message.id === messageId)
          ? current
          : [...current, {
              id: messageId,
              senderId: senderID,
              senderName: isOwnGift ? 'You' : gift?.sender_name || gift?.senderName || senderUsername || 'Viewer',
              avatarUrl: isOwnGift ? ownAvatarURL : gift?.sender_avatar_url || gift?.senderAvatarUrl || '',
              isCreator: senderUsername === creatorUsername,
              text: gift?.message || '',
              gift: {
                name: gift?.gift_name || gift?.giftName || 'Gift',
                icon: gift?.gift_icon || gift?.giftIcon || '',
                coins: Number(gift?.coins || 0),
              },
            }]);
        break;
      }

      case 'message_retracted': {
        const messageId = lastMessage.payload?.message_id || lastMessage.payload?.messageId;
        if (messageId) setMessages((current) => current.filter((message) => message.id !== messageId));
        break;
      }

      case 'stream_ended': {
        setIsStreamEnded(true);
        setIsGiftPending(false);
        break;
      }
    }
  }, [lastMessage, roomId, creatorUsername, ownAvatarURL, ownUserID, ownUsername, refreshBalance, updateBalanceLocally]);

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

  return {
    viewerCount,
    messages,
    isGiftPending,
    sendError,
    isStreamEnded,
    sendChat,
    sendGift,
    retractMessage,
  };
};