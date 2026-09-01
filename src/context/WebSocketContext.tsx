import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react';
import protobuf from 'protobufjs';
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
const UnfriendedProto = safeLookup('eventspb.Unfriended', 'Unfriended');

// 🚀 NEW: Stream & Creator Event Protos
const GiftSentEventProto = safeLookup('eventspb.GiftSentEvent', 'GiftSentEvent');
const ViewerCountEventProto = safeLookup('eventspb.ViewerCountEvent', 'ViewerCountEvent');
const StreamEarningsEventProto = safeLookup('eventspb.StreamEarningsEvent', 'StreamEarningsEvent');
const StreamEndingSoonEventProto = safeLookup('eventspb.StreamEndingSoonEvent', 'StreamEndingSoonEvent');
const StreamAutoEndedEventProto = safeLookup('eventspb.StreamAutoEndedEvent', 'StreamAutoEndedEvent');
const GiftConfirmEventProto = safeLookup('eventspb.GiftConfirmEvent', 'GiftConfirmEvent');

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
    
    const WS_BASE = import.meta.env.VITE_WS_BASE_URL ?? 'wss://api.zquab.com';
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

        let decodedPayload: any = envelope.payload;

        if (envelope.payload && envelope.payload.length > 0) {
          try {
            const t: string = envelope.type || '';

            // Chat & System Events
            if (t === 'message_delivered' || t === 'message_sent_confirm' || t === 'chat_message') {
              decodedPayload = ChatMessageProto.decode(envelope.payload);
              if (decodedPayload.mediaUrl) decodedPayload.media_url = decodedPayload.mediaUrl;
              if (decodedPayload.mediaType) decodedPayload.media_type = decodedPayload.mediaType;
              if (decodedPayload.replyTo) decodedPayload.reply_to = decodedPayload.replyTo;
            } else if (t === 'photo_request' && PhotoRequestProto) {
              decodedPayload = PhotoRequestProto.decode(envelope.payload);
            } else if (t === 'photo_response' && PhotoResponseProto) {
              decodedPayload = PhotoResponseProto.decode(envelope.payload);
            } else if (t === 'photo_ready' && PhotoReadyProto) {
              decodedPayload = PhotoReadyProto.decode(envelope.payload);
            } else if (t === 'unfriend' && UnfriendedProto) {
              decodedPayload = UnfriendedProto.decode(envelope.payload);
            } else if (t === 'error' && SystemEventProto) {
              decodedPayload = SystemEventProto.decode(envelope.payload);
            } else if (t === 'message_read' || t === 'message_delivered_receipt' || t === 'message_receipt' || t === 'receipt') {
              if (ReceiptProto) {
                try {
                  decodedPayload = ReceiptProto.decode(envelope.payload);
                } catch (e) {
                  decodedPayload = envelope.payload;
                }
              }
            } 
            
            // 🚀 NEW: Stream Event Decoders
            else if (t === 'gift_sent' && GiftSentEventProto) {
              decodedPayload = GiftSentEventProto.decode(envelope.payload);
            } else if ((t === 'viewer_count' || t === 'viewer_count_updated') && ViewerCountEventProto) {
              decodedPayload = ViewerCountEventProto.decode(envelope.payload);
            } else if (t === 'stream_earnings' && StreamEarningsEventProto) {
              decodedPayload = StreamEarningsEventProto.decode(envelope.payload);
            } else if (t === 'stream_ending_soon' && StreamEndingSoonEventProto) {
              decodedPayload = StreamEndingSoonEventProto.decode(envelope.payload);
            } else if (t === 'stream_auto_ended' && StreamAutoEndedEventProto) {
              decodedPayload = StreamAutoEndedEventProto.decode(envelope.payload);
            } else if (t === 'gift_confirm' && GiftConfirmEventProto) {
              decodedPayload = GiftConfirmEventProto.decode(envelope.payload);
            } 
            
            // Fallbacks
            else {
              try {
                // First try standard chat message
                decodedPayload = ChatMessageProto.decode(envelope.payload);
              } catch (e) {
                try {
                  // 🚀 NEW: JSON Fallback! 
                  // If backend sends temporary JSON strings before updating protos
                  const text = new TextDecoder().decode(envelope.payload);
                  decodedPayload = JSON.parse(text);
                } catch (jsonErr) {
                  decodedPayload = envelope.payload;
                }
              }
            }
          } catch (e) {
            console.warn('Could not decode inner payload', e);
            decodedPayload = envelope.payload;
          }
        }

        const finalMessage = {
          ...envelope,
          payload: decodedPayload,
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