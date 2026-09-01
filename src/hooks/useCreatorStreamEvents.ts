import { useState, useEffect } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import type {
  StreamEarningsEvent,
  StreamEndingSoonEvent,
  StreamAutoEndedEvent,
} from '../types/streamEvents';

export const useCreatorStreamEvents = (roomId: string | undefined) => {
  const [streamEarnings, setStreamEarnings] = useState<StreamEarningsEvent | null>(null);
  const [streamEndingSoon, setStreamEndingSoon] = useState<StreamEndingSoonEvent | null>(null);
  const [streamAutoEnded, setStreamAutoEnded] = useState<StreamAutoEndedEvent | null>(null);

  const { lastMessage } = useWebSocket();

  useEffect(() => {
    if (!lastMessage) return;

    // Match the room ID from the message (handle both camelCase and snake_case)
    const msgRoomId = lastMessage.room_id || lastMessage.roomId;
    if (msgRoomId !== roomId) return;

    switch (lastMessage.type) {
      case 'stream_earnings': {
        const earnings = lastMessage.payload as StreamEarningsEvent;
        setStreamEarnings(earnings);
        break;
      }

      case 'stream_ending_soon': {
        const endingSoon = lastMessage.payload as StreamEndingSoonEvent;
        setStreamEndingSoon(endingSoon);
        break;
      }

      case 'stream_auto_ended': {
        const autoEnded = lastMessage.payload as StreamAutoEndedEvent;
        setStreamAutoEnded(autoEnded);
        break;
      }
    }
  }, [lastMessage, roomId]);

  return {
    streamEarnings,
    streamEndingSoon,
    streamAutoEnded,
  };
};
