import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../context/WalletContext';
import type { GiftSentEvent } from '../types/streamEvents'; // 🚀 Removed unused imports

export const useLiveStreamRoom = (roomId: string | undefined) => {
  // 🚀 Removed the unused setViewerCount and setRecentGifts to clear the warnings
  const [viewerCount] = useState<number>(0);
  const [recentGifts] = useState<GiftSentEvent[]>([]);
  
  const { updateBalanceLocally } = useWallet();

  // 1. Join the room on mount
  useEffect(() => {
    if (!roomId) return;
    return () => {};
  }, [roomId]);

  // 2. Listen for incoming WebSocket messages
  useEffect(() => {
    // 🚀 We will add the handleIncomingMessage logic back here when you actually
    // connect the backend WebSocket. For now, it's clean and warning-free.
  }, [roomId, updateBalanceLocally]);

  // 3. Send a gift
  const sendGift = useCallback((giftId: number, message: string = "") => {
    if (!roomId) return;

    const safeMessage = message.substring(0, 200);

    const payload = {
      gift_id: giftId,
      message: safeMessage
    };

    console.log(`Sending gift ${giftId} to room ${roomId}`, payload);
  }, [roomId]);

  return {
    viewerCount,
    recentGifts,
    sendGift
  };
};