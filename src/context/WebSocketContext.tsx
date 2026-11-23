import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react';
import protobuf from 'protobufjs';
import { useAuth } from './AuthContext';
import { apiClient, API_HOST } from '../api/client';
import { wsConnection } from '../utils/wsConnection';
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
const PresenceListProto = safeLookup('chatpb.PresenceList', 'PresenceList');
const StreamPausedProto = safeLookup('eventspb.StreamPaused', 'StreamPaused');
const StreamResumedProto = safeLookup('eventspb.StreamResumed', 'StreamResumed');
const StreamEnterRequestProto = safeLookup('eventspb.StreamEnterRequest', 'StreamEnterRequest');

// These events are read with snake_case keys (e.g. avatar_url), so they get both spellings.
const plainEventProtos: Record<string, protobuf.Type | null> = {
  creator_live: safeLookup('eventspb.CreatorLive', 'CreatorLive'),
  friend_request: safeLookup('eventspb.FriendRequest', 'FriendRequest'),
  friend_accepted: safeLookup('eventspb.FriendAccepted', 'FriendAccepted'),
  friend_request_withdrawn: safeLookup('eventspb.FriendRequestWithdrawn', 'FriendRequestWithdrawn'),
  friend_request_rejected: safeLookup('eventspb.FriendRequestRejected', 'FriendRequestRejected'),
  room_closed: safeLookup('eventspb.RoomClosed', 'RoomClosed'),
  unfriend: safeLookup('eventspb.Unfriended', 'Unfriended'),
  stream_enter_ok: safeLookup('eventspb.StreamEnterOk', 'StreamEnterOk'),
  stream_confirm_required: safeLookup('eventspb.StreamConfirmRequired', 'StreamConfirmRequired'),
  stream_enter_error: safeLookup('eventspb.StreamEnterError', 'StreamEnterError'),
  stream_expired: safeLookup('eventspb.StreamExpired', 'StreamExpired'),
  purchase_completed: safeLookup('eventspb.PurchaseCompleted', 'PurchaseCompleted'),
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
    // The /discover list changed: JSON { added: [card], updated: [card], removed: [stream_id] }.
    if (t === 'discover_streams_changed') return JSON.parse(new TextDecoder().decode(payload));
    // Friends' online status: { online: string[], offline: string[], complete: boolean }.
    if ((t === 'presence_snapshot' || t === 'presence_batch') && PresenceListProto) {
      return PresenceListProto.toObject(PresenceListProto.decode(payload), { arrays: true, defaults: true });
    }
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



// Reconnect timing. After a server restart every open tab reconnects; a random
// wait spreads them out instead of all arriving in the same second (the server
// also turns away connects above its per-second limit). The wait doubles after
// each failed try, up to RECONNECT_MAX_MS.
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30_000;
const RECONNECT_MIN_MS = 500;
// A connection that stayed open this long counts as healthy: the next drop
// starts again from the shortest wait.
const CONNECTION_STABLE_MS = 10_000;
// The browser hides why a connect failed (a 401 just looks like a close). After
// this many connects in a row that never opened, ask the API whether the login
// still works: if it doesn't, stop instead of retrying forever.
const FAILED_OPENS_BEFORE_CHECK = 3;
// Still failing after this many (the login is fine but the server keeps
// refusing this tab — longer than any restart takes): wait up to 5 minutes.
const FAILED_OPENS_BEFORE_SLOW = 10;
const RECONNECT_SLOW_MAX_MS = 5 * 60_000;

const reconnectDelay = (attempt: number, slow: boolean) =>
  RECONNECT_MIN_MS + Math.random() * Math.min(slow ? RECONNECT_SLOW_MAX_MS : RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** attempt);

// The socket talks to the same server as the API (so it carries the same login
// cookie): VITE_WS_BASE_URL if set, else the API host with http(s) -> ws(s),
// else the production API.
const wsBase = () => {
  if (import.meta.env.VITE_WS_BASE_URL) return import.meta.env.VITE_WS_BASE_URL;
  if (API_HOST) return API_HOST.replace(/^http/, 'ws');
  return 'wss://aarpaar-api.brchub.tech';
};

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (type: string, payload?: any, roomId?: string, to?: string, id?: string) => string | undefined;
  lastMessage: any | null; 
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any | null>(null);

  // Connect only while someone is logged in (a full account or a guest): the
  // server refuses /ws without a login, so trying would just fail forever. The
  // socket is logged in as whoever the cookie was for when it opened, so a
  // login switch closes it and opens a new one.
  const { user, isLoading: isAuthLoading, clearSession } = useAuth();
  const userKey = user ? `${user.user_id}:${user.is_guest}` : '';
  const clearSessionRef = useRef(clearSession);
  useLayoutEffect(() => {
    clearSessionRef.current = clearSession;
  });

  useEffect(() => {
    if (isAuthLoading || !userKey) return;

    const wsUrl = `${wsBase()}/ws`;
    let stopped = false;
    let attempt = 0;
    let failedOpens = 0;
    let openedAt = 0;
    let timer: number | null = null;
    let current: WebSocket | null = null;

    const open = () => {
      timer = null;
      const ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';
      current = ws;

      ws.onopen = () => {
        if (stopped || current !== ws) {
          ws.close();
          return;
        }
        openedAt = Date.now();
        wsConnection.attach(ws);
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          if (!(event.data instanceof ArrayBuffer)) return;

          const bytes = new Uint8Array(event.data);
          const envelope = Envelope.decode(bytes) as any;

          const finalMessage = {
            ...envelope,
            payload: decodePayload(envelope.type || '', envelope.payload),
            // The undecoded payload bytes, for code that decodes them itself (stranger chat).
            rawPayload: envelope.payload,
          };

          wsEvents.emit(finalMessage);
          setLastMessage(finalMessage);
        } catch (err) {
          console.error('Failed to decode WS message:', err);
        }
      };

      ws.onclose = () => {
        if (current !== ws) return;
        current = null;
        wsConnection.detach(ws);
        setIsConnected(false);
        if (stopped) return;
        failedOpens = openedAt ? 0 : failedOpens + 1;
        if (openedAt && Date.now() - openedAt >= CONNECTION_STABLE_MS) attempt = 0;
        openedAt = 0;
        const delay = reconnectDelay(attempt, failedOpens >= FAILED_OPENS_BEFORE_SLOW);
        attempt += 1;
        const retry = () => {
          if (stopped) return;
          console.log(`WebSocket disconnected. Reconnecting in ${Math.round(delay / 100) / 10}s...`);
          timer = window.setTimeout(open, delay);
        };
        if (failedOpens !== FAILED_OPENS_BEFORE_CHECK) {
          retry();
          return;
        }
        // 401 = the login is gone (expired or missing): stop and log out
        // locally. 200 / 403 (a guest) = the login works; a network error =
        // the server is down. Either way keep retrying.
        apiClient.get('/users/me/bootstrap')
          .then(retry)
          .catch((err: { status?: number }) => {
            if (stopped) return;
            if (err?.status === 401) {
              stopped = true;
              console.log('WebSocket: login expired, not reconnecting.');
              clearSessionRef.current();
              return;
            }
            retry();
          });
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    open();

    return () => {
      stopped = true;
      if (timer !== null) window.clearTimeout(timer);
      const ws = current;
      current = null;
      if (ws) {
        wsConnection.detach(ws);
        ws.close();
      }
      setIsConnected(false);
    };
  }, [userKey, isAuthLoading]);

  const sendMessage = useCallback((type: string, payload?: any, roomId?: string, to?: string, id?: string) => {
    if (!wsConnection.isOpen()) {
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
      } else if (type === 'stream_enter' && payload && StreamEnterRequestProto) {
        payloadBytes = StreamEnterRequestProto.encode(StreamEnterRequestProto.create({
          streamId: payload.stream_id || payload.streamId,
          confirm: !!payload.confirm,
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
      if (!wsConnection.sendBytes(bytes)) return undefined;
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