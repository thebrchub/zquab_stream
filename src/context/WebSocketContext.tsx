import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react';
import protobuf from 'protobufjs';
import { useAuth } from './AuthContext';
import chatProtoSrc from '../proto/chat.proto?raw';
import eventsProtoSrc from '../proto/events.proto?raw';

const root = new protobuf.Root();
protobuf.parse(chatProtoSrc, root);
protobuf.parse(eventsProtoSrc, root);

const safeLookup = (name: string, fallbackName: string) => {
  try { return root.lookupType(name); } 
  catch { 
    try { return root.lookupType(fallbackName); } 
    catch { return null; }
  }
};

const Envelope = root.lookupType('chatpb.Envelope');
const ChatMessageProto = root.lookupType('chatpb.ChatMessage');
const ReceiptProto = safeLookup('chatpb.Receipt', 'Receipt');
const SystemEventProto = safeLookup('chatpb.SystemEvent', 'SystemEvent');
const PhotoRequestProto = safeLookup('eventspb.PhotoRequest', 'PhotoRequest');
const PhotoResponseProto = safeLookup('eventspb.PhotoResponse', 'PhotoResponse');
const PhotoReadyProto = safeLookup('eventspb.PhotoReady', 'PhotoReady');

// 🚀 NEW: Stream & Creator Event Protos
const GiftSentEventProto = safeLookup('eventspb.GiftSentEvent', 'GiftSentEvent');
const ViewerCountEventProto = safeLookup('eventspb.ViewerCountEvent', 'ViewerCountEvent');
const StreamEarningsEventProto = safeLookup('eventspb.StreamEarningsEvent', 'StreamEarningsEvent');
const StreamEndingSoonEventProto = safeLookup('eventspb.StreamEndingSoonEvent', 'StreamEndingSoonEvent');
const StreamAutoEndedEventProto = safeLookup('eventspb.StreamAutoEndedEvent', 'StreamAutoEndedEvent');
const StreamLiveEventProto = safeLookup('eventspb.StreamLive', 'StreamLive');
const GiftRequestProto = safeLookup('eventspb.GiftRequest', 'GiftRequest');
const GiftConfirmProto = safeLookup('eventspb.GiftConfirm', 'GiftConfirm');
const StreamEndedProto = safeLookup('eventspb.StreamEnded', 'StreamEnded');
const RetractMessageRequestProto = safeLookup('eventspb.RetractMessageRequest', 'RetractMessageRequest');
const MessageRetractedProto = safeLookup('eventspb.MessageRetracted', 'MessageRetracted');
const MuteUserRequestProto = safeLookup('eventspb.MuteUserRequest', 'MuteUserRequest');
const RecentMessagesProto = safeLookup('chatpb.RecentMessages', 'RecentMessages');
const StreamPausedProto = safeLookup('eventspb.StreamPaused', 'StreamPaused');
const StreamResumedProto = safeLookup('eventspb.StreamResumed', 'StreamResumed');

// These events are read with snake_case keys (e.g. avatar_url), so they get both spellings.
const plainEventProtos: Record<string, protobuf.Type | null> = {
  creator_live: safeLookup('eventspb.CreatorLive', 'CreatorLive'),
  friend_request: safeLookup('eventspb.FriendRequest', 'FriendRequest'),
  friend_accepted: safeLookup('eventspb.FriendAccepted', 'FriendAccepted'),
  friend_request_withdrawn: safeLookup('eventspb.FriendRequestWithdrawn', 'FriendRequestWithdrawn'),
  friend_request_rejected: safeLookup('eventspb.FriendRequestRejected', 'FriendRequestRejected'),
  room_closed: safeLookup('eventspb.RoomClosed', 'RoomClosed'),
  unfriend: safeLookup('eventspb.Unfriended', 'Unfriended'),
};

const toSnake = (key: string) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

const withSnakeKeys = (obj: Record<string, any>) => {
  const out: Record<string, any> = { ...obj };
  for (const [key, value] of Object.entries(obj)) out[toSnake(key)] = value;
  return out;
};

// Turns one envelope payload into a JS object based on the envelope type.
const decodePayload = (t: string, payload: Uint8Array): any => {
  if (!payload || payload.length === 0) return payload;
  try {
    // Chat & System Events
    if (t === 'message_delivered' || t === 'message_sent_confirm' || t === 'chat_message') {
      const decoded: any = ChatMessageProto.decode(payload);
      if (decoded.mediaUrl) decoded.media_url = decoded.mediaUrl;
      if (decoded.mediaType) decoded.media_type = decoded.mediaType;
      if (decoded.replyTo) decoded.reply_to = decoded.replyTo;
      return decoded;
    }
    if (t === 'photo_request' && PhotoRequestProto) return PhotoRequestProto.decode(payload);
    if (t === 'photo_response' && PhotoResponseProto) return PhotoResponseProto.decode(payload);
    if (t === 'photo_ready' && PhotoReadyProto) return PhotoReadyProto.decode(payload);
    if (t === 'error' && SystemEventProto) return SystemEventProto.decode(payload);
    if (t === 'message_read' || t === 'message_delivered_receipt' || t === 'message_receipt' || t === 'receipt') {
      if (!ReceiptProto) return payload;
      try {
        return ReceiptProto.decode(payload);
      } catch {
        return payload;
      }
    }

    // Stream events
    if (t === 'gift_sent' && GiftSentEventProto) return GiftSentEventProto.decode(payload);
    if ((t === 'viewer_count' || t === 'viewer_count_updated') && ViewerCountEventProto) return ViewerCountEventProto.decode(payload);
    if (t === 'stream_earnings' && StreamEarningsEventProto) return StreamEarningsEventProto.decode(payload);
    if (t === 'stream_ending_soon' && StreamEndingSoonEventProto) return StreamEndingSoonEventProto.decode(payload);
    if (t === 'stream_auto_ended' && StreamAutoEndedEventProto) return StreamAutoEndedEventProto.decode(payload);
    if (t === 'stream_live' && StreamLiveEventProto) return StreamLiveEventProto.decode(payload);
    if (t === 'gift_confirm' && GiftConfirmProto) return GiftConfirmProto.decode(payload);
    if (t === 'stream_ended' && StreamEndedProto) return StreamEndedProto.decode(payload);
    if (t === 'message_retracted' && MessageRetractedProto) return MessageRetractedProto.decode(payload);
    if (t === 'stream_paused' && StreamPausedProto) return StreamPausedProto.decode(payload);
    if (t === 'stream_resumed' && StreamResumedProto) return StreamResumedProto.decode(payload);
    if (t === 'recent_messages' && RecentMessagesProto) {
      const history: any = RecentMessagesProto.decode(payload);
      const messages = (history.envelopes || []).map((raw: Uint8Array) => {
        const inner = Envelope.decode(raw) as any;
        return { ...inner, payload: decodePayload(inner.type || '', inner.payload) };
      });
      return { messages };
    }

    const plainProto = plainEventProtos[t];
    if (plainProto) {
      return withSnakeKeys(plainProto.toObject(plainProto.decode(payload), { longs: Number, defaults: true }));
    }
  } catch (e) {
    console.warn('Could not decode inner payload', e);
    return payload;
  }

  // Fallbacks
  try {
    // First try standard chat message
    return ChatMessageProto.decode(payload);
  } catch {
    try {
      // JSON fallback, in case the backend sends temporary JSON payloads
      return JSON.parse(new TextDecoder().decode(payload));
    } catch {
      return payload;
    }
  }
};

type WSListener = (message: any) => void;
class WSEmitter {
  private listeners = new Set<WSListener>();
  
  subscribe(listener: WSListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener); 
    };
  }
  
  emit(message: any) {
    this.listeners.forEach(l => l(message));
  }
}
export const wsEvents = new WSEmitter();

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (type: string, payload?: any, roomId?: string, to?: string, id?: string) => string | undefined;
  lastMessage: any | null; 
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isProviderMountedRef = useRef(false);

  const connect = () => {
    if (import.meta.env.DEV || window.location.hostname === 'localhost') {
      console.info('🛠️ DEV MODE: Connecting to WebSocket for local testing.');
    }
    
    const WS_BASE = import.meta.env.VITE_WS_BASE_URL ?? 'wss://aarpaar-api.brchub.tech';
    const wsUrl = `${WS_BASE}/ws`;
    
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer'; 

    ws.onopen = () => {
      if (!isProviderMountedRef.current || wsRef.current !== ws) {
        ws.close();
        return;
      }
      console.log('WebSocket connected');
      setIsConnected(true);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        if (!(event.data instanceof ArrayBuffer)) return;

        const bytes = new Uint8Array(event.data);
        const envelope = Envelope.decode(bytes) as any;

        const finalMessage = {
          ...envelope,
          payload: decodePayload(envelope.type || '', envelope.payload),
        };

        wsEvents.emit(finalMessage);
        setLastMessage(finalMessage);

      } catch (err) {
        console.error('Failed to decode WS message:', err);
      }
    };

    ws.onclose = () => {
      if (!isProviderMountedRef.current || wsRef.current !== ws) return;
      console.log('WebSocket disconnected. Reconnecting in 3s...');
      setIsConnected(false);
      reconnectTimeoutRef.current = window.setTimeout(connect, 3000);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      ws.close(); 
    };

    wsRef.current = ws;
  };

  useEffect(() => {
    isProviderMountedRef.current = true;
    connect();
    return () => {
      isProviderMountedRef.current = false;
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, []);

  // The socket is logged in as whoever the cookie was for when it opened, so reopen it after a login switch.
  const { user, isLoading: isAuthLoading } = useAuth();
  const userKey = user ? `${user.user_id}:${user.is_guest}` : '';
  const prevUserKeyRef = useRef(userKey);
  useEffect(() => {
    if (isAuthLoading || prevUserKeyRef.current === userKey) {
      prevUserKeyRef.current = userKey;
      return;
    }
    prevUserKeyRef.current = userKey;
    wsRef.current?.close();
  }, [userKey, isAuthLoading]);

  const sendMessage = useCallback((type: string, payload?: any, roomId?: string, to?: string, id?: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message: WebSocket is not open');
      return undefined;
    }

    try {
      let payloadBytes: any = new Uint8Array();
      
      if (type === 'chat_message' && payload) {
        const chatMsg = ChatMessageProto.create({ 
          text: payload.text || '',
          mediaUrl: payload.media_url || payload.mediaUrl || '',
          mediaType: payload.media_type || payload.mediaType || '',
          replyTo: payload.reply_to || payload.replyTo || ''
        });
        payloadBytes = ChatMessageProto.encode(chatMsg).finish();
      } else if (type === 'gift' && payload && GiftRequestProto) {
        payloadBytes = GiftRequestProto.encode(GiftRequestProto.create({
          giftId: payload.gift_id || payload.giftId,
          message: payload.message || '',
        })).finish();
      } else if (type === 'retract_message' && payload && RetractMessageRequestProto) {
        payloadBytes = RetractMessageRequestProto.encode(RetractMessageRequestProto.create({
          messageId: payload.message_id || payload.messageId,
        })).finish();
      } else if (type === 'mute_user' && payload && MuteUserRequestProto) {
        payloadBytes = MuteUserRequestProto.encode(MuteUserRequestProto.create({
          userId: payload.user_id || payload.userId,
          minutes: payload.minutes || 0,
        })).finish();
      }
      // Handle raw JSON payloads sent from the client just in case
      else if (payload && typeof payload === 'object') {
        const jsonString = JSON.stringify(payload);
        payloadBytes = new TextEncoder().encode(jsonString);
      }

      const msgId = id || globalThis.crypto?.randomUUID?.() || `${Date.now()}`;
      const envelope = Envelope.create({
        type,
        roomId, 
        to,
        payload: payloadBytes,
        ts: Date.now(),
        id: msgId
      });
      
      const bytes = Envelope.encode(envelope).finish();
      const buffer = bytes.buffer instanceof ArrayBuffer
        ? bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
        : new Uint8Array(bytes).slice().buffer;
        
      wsRef.current.send(buffer);
      return msgId;
    } catch (err) {
      console.error('Failed to encode/send message:', err);
      return undefined;
    }
  }, []);

  const value = useMemo(
    () => ({ isConnected, sendMessage, lastMessage }),
    [isConnected, sendMessage, lastMessage]
  );

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error('useWebSocket must be used within a WebSocketProvider');
  return context;
};