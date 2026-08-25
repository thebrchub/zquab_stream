import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { roomsApi } from '../api/rooms';
import { friendsApi } from '../api/friends'; 
import { useAuth } from './AuthContext';
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

export function RoomsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { sendMessage, isConnected } = useWebSocket(); 
  const isFullUser = Boolean(user && !user.is_guest);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, RoomUser>>({});
  const [loading, setLoading] = useState(true);
  
  const [activeRoomId, setActiveRoomIdState] = useState<string | null>(null);
  const activeRoomIdRef = useRef<string | null>(null);
  
  const [friendRequests, setFriendRequests] = useState<any[]>([]);

  const setActiveRoomId = useCallback((roomId: string | null) => {
    setActiveRoomIdState(roomId);
    activeRoomIdRef.current = roomId; 
    if (roomId) sessionStorage.setItem(LAST_ROOM_STORAGE_KEY, roomId);
  }, []);

  const roomsRef = useRef(rooms);
  useEffect(() => { roomsRef.current = rooms; }, [rooms]);

  const refreshRooms = useCallback(async () => {
    try {
      const data = await roomsApi.getRooms();
      setRooms(data.rooms || []);
      setUsersMap(prev => ({ ...prev, ...(data.users || {}) }));
    } catch (err) {
      console.error('Failed to refresh rooms:', err);
    }
  }, []);

  const refreshFriendRequests = useCallback(async () => {
    try {
      const data = await friendsApi.getRequests('received', 50, 0);
      setFriendRequests(data || []);
    } catch (err) {
      console.error('Failed to refresh friend requests:', err);
    }
  }, []);

  useEffect(() => {
    if (!isFullUser) {
      setRooms([]);
      setUsersMap({});
      setFriendRequests([]); 
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      await Promise.all([refreshRooms(), refreshFriendRequests()]);
      setLoading(false);
    })();
  }, [isFullUser, refreshRooms, refreshFriendRequests]);

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
          setFriendRequests(prev => {
            if (prev.some(r => r.username === newReq.username || r.request_id === newReq.request_id)) return prev;
            return [newReq, ...prev];
          });
        }
        
        // 🛠️ THE FIX: 1-second delay beats the Protobuf database race condition
        setTimeout(() => {
          refreshFriendRequests();
        }, 1000);
      }

      // 2. WebSocket-First: Handle Accepted Friend Requests
      if (type === 'friend_accepted') {
        const otherUserId = payload.user_id || payload.from;
        const otherUsername = payload.username;
        const dmRoomId = payload.dm_room_id || payload.room_id || payload.roomId;

        if (otherUsername || otherUserId) {
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
              is_online: true,
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

        // 🛠️ THE FIX: Give the DB time to lock in the new room
        setTimeout(() => {
          refreshFriendRequests();
          refreshRooms();
        }, 1000);
      }

      // 3. WebSocket-First: Handle Withdrawals & Rejections
      if (type === 'friend_request_rejected' || type === 'friend_request_withdrawn') {
        const targetId = payload.from || payload.user_id;
        const targetUsername = payload.username;
        const reqId = payload.request_id || payload.requestId;

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
          refreshRooms();
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

      // 6. Presence Events
      if (type === 'presence_online' || type === 'presence_offline') {
        const presenceUserId = msg.from || msg.sender_id;
        if (presenceUserId) {
          setUsersMap(prev => {
            if (!prev[presenceUserId]) return prev;
            return {
              ...prev,
              [presenceUserId]: { ...prev[presenceUserId], is_online: type === 'presence_online' },
            };
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
  }, [user, refreshFriendRequests, refreshRooms]);

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