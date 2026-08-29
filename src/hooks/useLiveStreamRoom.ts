import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../context/WalletContext';
import { useWebSocket } from '../context/WebSocketContext';
import type { GiftSentEvent } from '../types/streamEvents'; 

export const useLiveStreamRoom = (roomId: string | undefined) => {
  const [viewerCount, setViewerCount] = useState<number>(0);
  const [recentGifts, setRecentGifts] = useState<GiftSentEvent[]>([]);
  
  const { updateBalanceLocally } = useWallet();
  const { isConnected, sendMessage, lastMessage } = useWebSocket();

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
    if (msgRoomId !== roomId) return;

    switch (lastMessage.type) {
      case 'viewer_count':
      case 'viewer_count_updated': { 
        // Handles both the API spec ('viewer_count') and the proto lookup string
        const count = lastMessage.payload?.viewer_count || lastMessage.payload?.viewerCount || 0;
        setViewerCount(Number(count));
        break;
      }

      case 'gift_sent': {
        const newGift = lastMessage.payload as GiftSentEvent;
        setRecentGifts(prev => [...prev, newGift]);
        
        // 🚀 Fix: Rely purely on object reference equality since there is no unique event ID
        setTimeout(() => {
          setRecentGifts(prev => prev.filter(g => g !== newGift));
        }, 5000);
        break;
      }

      case 'gift_confirm': {
        // Private ack just for the sender
        const confirm = lastMessage.payload;
        const newBalance = confirm?.balance_coins || confirm?.balanceCoins;
        if (newBalance !== undefined) {
          updateBalanceLocally(Number(newBalance));
        }
        break;
      }
    }
  }, [lastMessage, roomId, updateBalanceLocally]);

  // 3. Send a gift
  const sendGift = useCallback((giftId: number, message: string = "") => {
    if (!roomId) return;

    // Truncate message defensively as per backend spec (max 200 chars)
    const safeMessage = message.substring(0, 200);

    const payload = {
      gift_id: giftId,
      message: safeMessage
    };

    // The WebSocketContext handles JSON encoding automatically if it's an object
    sendMessage('gift', payload, roomId);
    
  }, [roomId, sendMessage]);

  return {
    viewerCount,
    recentGifts,
    sendGift
  };
};