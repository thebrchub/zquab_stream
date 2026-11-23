import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { roomsApi } from '../api/rooms';
import { useAuth, type FriendRequestItem } from './AuthContext';
import { useWebSocket, wsEvents } from './WebSocketContext';

export interface RoomUser {
  username: string;
  name: string;
  avatar_url?: string;
  last_seen_at?: string;
  is_online?: boolean;
}

export interface Room {
  room_id: string;
  name: string | null;
  type: string;
  group_avatar?: string;
  created_by?: string;
  last_message_preview: string;
  last_message_at: string;
  unread_count: number;
  member_count?: number;
  member_ids: string[];
}

interface RoomsContextType {
  rooms: Room[];
  usersMap: Record<string, RoomUser>;
  totalUnread: number;
  loading: boolean;
  
  friendRequests: any[];
  setFriendRequests: React.Dispatch<React.SetStateAction<any[]>>;
  
  refreshRooms: () => Promise<void>;
  setActiveRoomId: (roomId: string | null) => void;
  bumpOwnMessage: (roomId: string, preview: string) => void;
}

const RoomsContext = createContext<RoomsContextType | null>(null);

export const LAST_ROOM_STORAGE_KEY = 'zquab_last_active_room';

const LIVE_REQUEST_KEEP_MS = 60_000;

// How long friends' online dots stay as last known after our own socket drops.
// Short drops (a network blip) don't flicker; after this every dot goes grey
// until the snapshot sent on reconnect says who is online.
const PRESENCE_GRACE_MS = 10_000;

export function RoomsProvider({ children }: { children: ReactNode }) {
  const { user, bootstrap, refreshSession } = useAuth();
  const { sendMessage, isConnected } = useWebSocket(); 
  const isFullUser = Boolean(user && !user.is_guest);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, RoomUser>>({});
  const [loading, setLoading] = useState(true);
  
  const [activeRoomId, setActiveRoomIdState] = useState<string | null>(null);
  const activeRoomIdRef = useRef<string | null>(null);
  
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  // Requests that arrived live, kept on reloads until the server list includes them.
  const liveRequestsRef = useRef<Map<string, { req: any; at: number }>>(new Map());
  const friendRequestsRef = useRef<any[]>([]);
  useEffect(() => { friendRequestsRef.current = friendRequests; }, [friendRequests]);

  const setActiveRoomId = useCallback((roomId: string | null) => {
    setActiveRoomIdState(roomId);
    activeRoomIdRef.current = roomId; 
    if (roomId) sessionStorage.setItem(LAST_ROOM_STORAGE_KEY, roomId);
  }, []);

  const roomsRef = useRef(rooms);
  useEffect(() => { roomsRef.current = rooms; }, [rooms]);

  // Friends online right now, as the socket last told us: the snapshot sent on
  // every connect, then live presence_batch changes. presenceKnownRef is true
  // once this connection's full snapshot has arrived; until then dots stay grey
  // (the rooms list carries no online status).
  const onlineRef = useRef<Set<string>>(new Set());
  const presenceKnownRef = useRef(false);
  // Snapshot parts collected so far (a big snapshot comes in parts of 1000).
  const snapshotPartsRef = useRef<string[] | null>(null);

  // While our socket is down nothing tells us who comes and goes. The next
  // connection sends a fresh snapshot, so forget this one's; and if the drop
  // lasts longer than PRESENCE_GRACE_MS, grey every dot rather than show stale ones.
  useEffect(() => {
    if (isConnected) return;
    presenceKnownRef.current = false;
    snapshotPartsRef.current = null;
    const timer = window.setTimeout(() => {
      onlineRef.current = new Set();
      setUsersMap(prev => {
        let changed = false;
        const next = { ...prev };
        for (const id of Object.keys(next)) {
          if (next[id].is_online) {
            next[id] = { ...next[id], is_online: false };
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, PRESENCE_GRACE_MS);
    return () => window.clearTimeout(timer);
  }, [isConnected]);

  const applyRooms = useCallback((data: { rooms?: Room[]; users?: Record<string, RoomUser> }) => {
    setRooms(data.rooms || []);
    const users: Record<string, RoomUser> = data.users || {};
    const known = presenceKnownRef.current;
    setUsersMap(prev => {
      const next = { ...prev };
      for (const [id, u] of Object.entries(users)) {
        next[id] = { ...u, is_online: known ? onlineRef.current.has(id) : Boolean(prev[id]?.is_online) };
      }
      return next;
    });
  }, []);

  const refreshRooms = useCallback(async () => {
    try {
      applyRooms(await roomsApi.getRooms());
    } catch (err) {
      console.error('Failed to refresh rooms:', err);
    }
  }, [applyRooms]);

  // data: the received requests from the bootstrap (first 100, the server's order).
  const applyFriendRequests = useCallback((data: FriendRequestItem[]) => {
    const onServer = new Set(data.map((r) => r.username));
    // Gone from the list means the user already accepted, rejected or it was withdrawn.
    const stillShown = new Set(friendRequestsRef.current.map((r) => r.username));
    const kept: FriendRequestItem[] = [];
    const now = Date.now();
    liveRequestsRef.current.forEach((entry, username) => {
      // The server saves new requests within seconds; after a minute trust the server list.
      if (onServer.has(username) || !stillShown.has(username) || now - entry.at > LIVE_REQUEST_KEEP_MS) {
        liveRequestsRef.current.delete(username);
      } else {
        kept.push(entry.req);
      }
    });
    setFriendRequests([...kept, ...data]);
  }, []);

  // Rooms and friend requests come with the bootstrap (app start, and every
  // reload of it, e.g. the reconciliations after friend events below).
  useEffect(() => {
    if (!isFullUser) {
      setRooms([]);
      setUsersMap({});
      setFriendRequests([]); 
      setLoading(false);
      return;
    }
    if (bootstrap) {
      applyRooms(bootstrap.rooms || {});
      applyFriendRequests(bootstrap.friend_requests || []);
    }
    setLoading(false);
  }, [isFullUser, bootstrap, applyRooms, applyFriendRequests]);

  // Re-reads the friend requests (and everything else in the bootstrap).
  const refreshFriendRequests = useCallback(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    const unsubscribe = wsEvents.subscribe((msg: any) => {
      if (!msg) return;
      const type = msg.type;
      const payload = msg.payload || msg;

      // 1. WebSocket-First: Handle New Friend Requests
      if (type === 'friend_request') {
        const newReq = {
          request_id: payload.request_id || payload.requestId || `req-${Date.now()}`,
          user_id: payload.from || payload.user_id,
          username: payload.username,
          name: payload.name || payload.username,
          avatar_url: payload.avatar_url
        };

        if (newReq.username) {
          liveRequestsRef.current.set(newReq.username, { req: newReq, at: Date.now() });
          setFriendRequests(prev => {
            if (prev.some(r => r.username === newReq.username || r.request_id === newReq.request_id)) return prev;
            return [newReq, ...prev];
          });
        }
      }

      // 2. WebSocket-First: Handle Accepted Friend Requests
      if (type === 'friend_accepted') {
        const otherUserId = payload.user_id || payload.from;
        const otherUsername = payload.username;
        const dmRoomId = payload.dm_room_id || payload.room_id || payload.roomId;

        if (otherUsername || otherUserId) {
          if (otherUsername) liveRequestsRef.current.delete(otherUsername);
          setFriendRequests(prev => prev.filter(r => 
            (otherUsername && r.username !== otherUsername) && 
            (otherUserId && r.user_id !== otherUserId && r.from !== otherUserId)
          ));
        }

        if (otherUserId && otherUsername) {
          setUsersMap(prev => ({
            ...prev,
            [otherUserId]: {
              ...prev[otherUserId], 
              username: otherUsername, 
              name: payload.name || otherUsername,
              avatar_url: payload.avatar_url,
              // The DM's presence_batch arrives just before this event.
              is_online: onlineRef.current.has(otherUserId),
            }
          }));
        }

        if (dmRoomId) {
          const myId = (user as any)?.user_id || (user as any)?.id;
          setRooms(prev => {
            if (prev.some(r => r.room_id === dmRoomId)) return prev;
            const newRoom: Room = {
              room_id: dmRoomId,
              name: payload.name || otherUsername || 'Friend',
              type: 'direct',
              last_message_preview: 'Connected as friends! Say hi 👋',
              last_message_at: new Date().toISOString(),
              unread_count: 0,
              member_ids: [myId, otherUserId].filter(Boolean)
            };
            return [newRoom, ...prev];
          });
        }

        // Give the server a moment to save the new room, then reload (the
        // bootstrap carries both the rooms and the friend requests).
        setTimeout(() => {
          refreshFriendRequests();
        }, 1000);
      }

      // 3. WebSocket-First: Handle Withdrawals & Rejections
      if (type === 'friend_request_rejected' || type === 'friend_request_withdrawn') {
        const targetId = payload.from || payload.user_id;
        const targetUsername = payload.username;
        const reqId = payload.request_id || payload.requestId;

        if (targetUsername) liveRequestsRef.current.delete(targetUsername);
        liveRequestsRef.current.forEach((entry, username) => {
          if (targetId && entry.req.user_id === targetId) liveRequestsRef.current.delete(username);
        });
        setFriendRequests(prev => prev.filter(r => {
          if (reqId && r.request_id === reqId) return false;
          if (targetUsername && r.username === targetUsername) return false;
          if (targetId && (r.user_id === targetId || r.from === targetId)) return false;
          return true;
        }));

        setTimeout(() => {
          refreshFriendRequests();
        }, 1000);
      }

      // 4. Handle Unfriend Event
      if (type === 'unfriend') {
        const deletedRoomId = payload.roomId || payload.room_id;
        const targetUsername = payload.username;
        const targetUserId = payload.from || payload.user_id;

        if (deletedRoomId) {
          setRooms(prev => prev.filter(r => r.room_id !== deletedRoomId));
          
          if (activeRoomIdRef.current === deletedRoomId) {
            setActiveRoomIdState(null);
            activeRoomIdRef.current = null;
            sessionStorage.removeItem(LAST_ROOM_STORAGE_KEY);
            if (window.location.search.includes(deletedRoomId)) {
               window.location.assign('/home');
            }
          }
        }

        if (targetUsername || targetUserId) {
          setFriendRequests(prev => prev.filter(r => 
            (targetUsername && r.username !== targetUsername) && 
            (targetUserId && r.user_id !== targetUserId)
          ));
        }

        setTimeout(() => {
          refreshFriendRequests();
        }, 1000);
      }

      // 5. Chat Message Events
      if (type === 'chat_message') {
        const msgRoomId = msg.room_id || msg.roomId;
        if (msgRoomId) {
          const isKnownRoom = roomsRef.current.some(r => r.room_id === msgRoomId);
          if (!isKnownRoom) return; 

          const myId = (user as any)?.user_id || (user as any)?.id;
          const msgSender = msg.sender_id || msg.from;
          const isOwn = Boolean(msgSender && myId && msgSender === myId);
          const isOpenRoom = activeRoomIdRef.current === msgRoomId;
          const parsedTs = Number(msg.ts);
          const tsMs = Number.isFinite(parsedTs) ? parsedTs : Date.now();

          if (!isOwn) {
            if (document.visibilityState === 'hidden' || !isOpenRoom) {
              try {
                const audio = new Audio('/notification.mp3');
                audio.play().catch(() => {});
              } catch (err) {}
            }
          }

          setRooms(prevRooms => {
            const idx = prevRooms.findIndex(r => r.room_id === msgRoomId);
            if (idx === -1) return prevRooms; 

            const updatedRoom = {
              ...prevRooms[idx],
              last_message_preview: msg.payload?.text ?? prevRooms[idx].last_message_preview,
              last_message_at: new Date(tsMs).toISOString(),
              unread_count: isOwn ? 0 : (!isOpenRoom ? prevRooms[idx].unread_count + 1 : prevRooms[idx].unread_count),
            };

            const rest = prevRooms.filter((_, i) => i !== idx);
            return [updatedRoom, ...rest];
          });
        }
      }

      // 6. Presence: friends' online status (DMs only)
      if (type === 'presence_snapshot' && Array.isArray(payload?.online)) {
        // Sent once per connection, in parts; the last part has complete=true.
        const parts = snapshotPartsRef.current ?? [];
        parts.push(...payload.online);
        if (!payload.complete) {
          snapshotPartsRef.current = parts;
        } else {
          snapshotPartsRef.current = null;
          const myId = user?.user_id;
          const online = new Set(parts);
          if (myId) online.delete(myId);
          onlineRef.current = online;
          presenceKnownRef.current = true;
          setUsersMap(prev => {
            let changed = false;
            const next = { ...prev };
            for (const id of Object.keys(next)) {
              const isOnline = online.has(id);
              if (Boolean(next[id].is_online) !== isOnline) {
                next[id] = { ...next[id], is_online: isOnline };
                changed = true;
              }
            }
            return changed ? next : prev;
          });
        }
      }

      if (type === 'presence_batch' && payload && (Array.isArray(payload.online) || Array.isArray(payload.offline))) {
        // One DM's changes since the last batch. Our own ID shows up when our
        // other devices connect or leave; it says nothing about friends.
        const myId = user?.user_id;
        const changes: Array<[string, boolean]> = [
          ...(payload.online || []).map((id: string): [string, boolean] => [id, true]),
          ...(payload.offline || []).map((id: string): [string, boolean] => [id, false]),
        ].filter(([id]) => id && id !== myId);
        for (const [id, isOnline] of changes) {
          if (isOnline) onlineRef.current.add(id);
          else onlineRef.current.delete(id);
        }
        if (changes.length > 0) {
          setUsersMap(prev => {
            let changed = false;
            const next = { ...prev };
            for (const [id, isOnline] of changes) {
              if (next[id] && Boolean(next[id].is_online) !== isOnline) {
                next[id] = { ...next[id], is_online: isOnline };
                changed = true;
              }
            }
            return changed ? next : prev;
          });
        }
      }

      // 7. Read Receipts
      if (type === 'read') {
        const msgRoomId = msg.room_id || msg.roomId;
        if (msgRoomId) {
          const myId = (user as any)?.user_id || (user as any)?.id;
          const readerId = msg.sender_id || msg.from;
          if (readerId && myId && readerId !== myId) {
            setRooms(prev => {
              const idx = prev.findIndex(r => r.room_id === msgRoomId);
              if (idx === -1 || prev[idx].unread_count === 0) return prev;
              const updated = [...prev];
              updated[idx] = { ...updated[idx], unread_count: 0 };
              return updated;
            });
          }
        }
      }
    });

    return () => unsubscribe();
  }, [user, refreshFriendRequests]);

  const markRoomRead = useCallback((roomId: string) => {
    if (!isConnected || document.visibilityState !== 'visible') return;
    const idx = roomsRef.current.findIndex(r => r.room_id === roomId);
    if (idx === -1 || roomsRef.current[idx].unread_count === 0) return;

    sendMessage('read', undefined, roomId);
    setRooms(prev => {
      const i = prev.findIndex(r => r.room_id === roomId);
      if (i === -1) return prev;
      const updated = [...prev];
      updated[i] = { ...updated[i], unread_count: 0 };
      return updated;
    });
  }, [isConnected, sendMessage]);

  const bumpOwnMessage = useCallback((roomId: string, preview: string) => {
    setRooms(prevRooms => {
      const idx = prevRooms.findIndex(r => r.room_id === roomId);
      if (idx === -1) return prevRooms;
      const updatedRoom = {
        ...prevRooms[idx],
        last_message_preview: preview,
        last_message_at: new Date().toISOString(),
        unread_count: 0,
      };
      const rest = prevRooms.filter((_, i) => i !== idx);
      return [updatedRoom, ...rest];
    });
  }, []);

  useEffect(() => {
    if (!activeRoomId) return;
    markRoomRead(activeRoomId);
  }, [activeRoomId, markRoomRead]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && activeRoomId) markRoomRead(activeRoomId);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [activeRoomId, markRoomRead]);

  const totalUnread = useMemo(() => rooms.reduce((acc, r) => acc + (r.unread_count || 0), 0), [rooms]);

  const value = useMemo(
    () => ({ rooms, usersMap, totalUnread, loading, friendRequests, setFriendRequests, refreshRooms, setActiveRoomId, bumpOwnMessage }),
    [rooms, usersMap, totalUnread, loading, friendRequests, setFriendRequests, refreshRooms, setActiveRoomId, bumpOwnMessage]
  );

  return <RoomsContext.Provider value={value}>{children}</RoomsContext.Provider>;
}

export const useRooms = () => {
  const context = useContext(RoomsContext);
  if (!context) throw new Error('useRooms must be used within a RoomsProvider');
  return context;
};