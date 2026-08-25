import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { roomsApi } from '../api/rooms';
import { useWebSocket, wsEvents } from '../context/WebSocketContext';
import { LAST_ROOM_STORAGE_KEY, useRooms } from '../context/RoomsContext';
import MessageBubble from '../components/chat/MessageBubble';
import ChatInput from '../components/chat/ChatInput';
import { Loader2, ArrowLeft, MoreVertical, User, X, Image as ImageIcon, Check, ChevronDown } from 'lucide-react';
import TypingIndicator from '../components/chat/TypingIndicator';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import ChatDetailsSidebar from '../components/chat/ChatDetailsSidebar';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://api.zquab.com';
const STORAGE_CDN_BASE_URL = import.meta.env.VITE_STORAGE_CDN_BASE_URL ?? 'https://lyglmrkcyybfqegeprlu.supabase.co/storage/v1/object/public/zquab-bucket/';
const OUTBOX_STORAGE_KEY = 'zquab_pending_outbox';

const isTrustedStorageImage = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  return value.startsWith('https://lyglmrkcyybfqegeprlu.supabase.co/') || 
         value.startsWith('https://cdn.zquab.com/') ||
         (STORAGE_CDN_BASE_URL.length > 0 && value.startsWith(STORAGE_CDN_BASE_URL));
};

const compressImageToWebP = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      const MAX_SIZE = 1200;
      if (width > MAX_SIZE || height > MAX_SIZE) {
        if (width > height) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Canvas context not supported');

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const newName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
            const webpFile = new File([blob], newName, { type: 'image/webp' });
            resolve(webpFile);
          } else {
            reject('Blob creation failed');
          }
        },
        'image/webp',
        0.8
      );
    };

    img.onerror = () => reject('Image load failed');
  });
};

const getDateHeader = (isoString: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

export default function ChatRoom({ 
  inlineRoomId, 
  inlineFriendName, 
  inlineFriendAvatar,
  inlineFriendUsername,
  inlineIsOnline
}: { 
  inlineRoomId?: string, 
  inlineFriendName?: string, 
  inlineFriendAvatar?: string,
  inlineFriendUsername?: string,
  inlineIsOnline?: boolean
} = {}) {
  const navigate = useNavigate();
  const location = useLocation();

  const routerParams = useParams<{ roomId: string }>();
  const roomId = inlineRoomId || routerParams.roomId;
  
  const friendName = inlineFriendName || location.state?.friendName || 'Chat Room';
  const friendAvatar = inlineFriendAvatar || location.state?.friendAvatar || null;
  const friendUsername = inlineFriendUsername || location.state?.friendUsername || ''; 
  const isOnline = inlineIsOnline ?? location.state?.isOnline ?? false;
  
  const isDevMode = location.pathname === '/dev/chat';
  
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const topObserverRef = useRef<HTMLDivElement>(null);
  
  const { isConnected, sendMessage } = useWebSocket();
  const { user } = useAuth();
  const { bumpOwnMessage } = useRooms();

  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const [incomingPhotoRequest, setIncomingPhotoRequest] = useState(false);
  const [photoRequestBusy, setPhotoRequestBusy] = useState(false);
  const photoRequestTimeoutRef = useRef<number | null>(null);

  const [showSidebar, setShowSidebar] = useState(false); 

  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const partnerTypingTimeoutRef = useRef<number | null>(null);
  const myTypingTimeoutRef = useRef<number | null>(null);
  const isMyTypingStateRef = useRef(false);

  const sentMessageIdsRef = useRef<Set<string>>(new Set());
  const outboxAttemptedRef = useRef<Set<string>>(new Set()); 
  const activeRoomIdRef = useRef(roomId);
  const roomGenerationRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const initialScrollComplete = useRef(false);

  // 🛠️ SMART SCROLL FAB STATES
  const [showScrollFab, setShowScrollFab] = useState(false);
  const lastScrollTopRef = useRef(0);
  const scrollTimeoutRef = useRef<number | null>(null);

  const isUserScrolledUp = useRef(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; text: string; isOwn: boolean } | null>(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);

  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // 🛠️ FIX 1: Strict Chronological Sorting
  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [messages]);

  useEffect(() => {
    if (isConnected && !isDevMode) {
      try {
        const pendingRaw = localStorage.getItem(OUTBOX_STORAGE_KEY);
        if (pendingRaw) {
          const pending = JSON.parse(pendingRaw);
          pending.forEach((msg: any) => {
            if (!outboxAttemptedRef.current.has(msg.id)) {
              // Note: Retrying pending outbox messages uses the local frontend `replyTo` format
              sendMessage('chat_message', { text: msg.content, reply_to_id: msg.replyTo?.id }, msg.roomId, undefined, msg.id);
              sentMessageIdsRef.current.add(msg.id);
              outboxAttemptedRef.current.add(msg.id);
            }
          });
        }
      } catch (err) {
        console.error("Failed to sync outbox", err);
      }
    }
  }, [isConnected, isDevMode, sendMessage]);

  useEffect(() => {
    activeRoomIdRef.current = roomId;
    roomGenerationRef.current += 1;
    sentMessageIdsRef.current.clear();
    outboxAttemptedRef.current.clear();
    loadingMoreRef.current = false;
    initialScrollComplete.current = false; 
    
    setMessages([]);
    setLoading(!isDevMode);
    setLoadingMore(false);
    setHasMore(true);
    setError('');
  }, [roomId, isDevMode]);

  const handleImageClick = useCallback((url: string) => setViewingImage(url), []);

  useEffect(() => {
    if (!window.location.hash.includes('active')) {
      window.history.pushState({ isChat: true }, '', window.location.pathname + '#active');
    }

    const handleNativeBack = () => {
      sessionStorage.removeItem(LAST_ROOM_STORAGE_KEY);
      navigate('/home', { replace: true });
    };

    window.addEventListener('popstate', handleNativeBack);
    return () => {
      window.removeEventListener('popstate', handleNativeBack);
    };
  }, [navigate]);

  const clearPhotoRequestTimeout = useCallback(() => {
    if (photoRequestTimeoutRef.current !== null) {
      window.clearTimeout(photoRequestTimeoutRef.current);
      photoRequestTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearPhotoRequestTimeout();
      if (partnerTypingTimeoutRef.current) window.clearTimeout(partnerTypingTimeoutRef.current);
      if (myTypingTimeoutRef.current) window.clearTimeout(myTypingTimeoutRef.current);
      if (scrollTimeoutRef.current) window.clearTimeout(scrollTimeoutRef.current);
    };
  }, [clearPhotoRequestTimeout]);

  const sharePhoto = useCallback(async (file: File) => {
    if (!roomId) throw new Error('No room selected');

    const respondResponse = await fetch(`${API_BASE}/api/v1/match/photo/respond`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_id: roomId, accept: true, content_type: file.type }),
    });

    if (!respondResponse.ok) {
      throw new Error('Network timeout: Unable to authorize photo upload.');
    }

    const respondData = await respondResponse.json().catch(() => null) as { url?: string; object_key?: string } | null;
    if (!respondData?.url || !respondData.object_key) {
      throw new Error('Upload configuration failed.');
    }

    const uploadResponse = await fetch(respondData.url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error('File transfer failed. Please check your connection.');
    }

    const uploadedResponse = await fetch(`${API_BASE}/api/v1/match/photo/uploaded`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_id: roomId, object_key: respondData.object_key }),
    });

    if (!uploadedResponse.ok) {
       throw new Error('Upload verification failed.');
    }

    return uploadedResponse.json().catch(() => null) as Promise<{
      message_id?: string | number;
      url?: string;
      created_at?: string;
    } | null>;
  }, [roomId]);

  useEffect(() => {
    if (isDevMode) {
      setMessages([
        { id: '1', content: 'Hey there!', created_at: new Date(Date.now() - 3600000).toISOString(), isOwn: false, status: 'delivered' },
        { id: '2', content: 'Hi! How are you doing?', created_at: new Date(Date.now() - 3500000).toISOString(), isOwn: true, status: 'read' },
      ]);
      setLoading(false);
      return;
    }

    if (!roomId) return;
    
    const generation = roomGenerationRef.current;
    let cancelled = false;

    const fetchHistory = async () => {
      try {
        const history = await roomsApi.getMessages(roomId);
        if (cancelled || generation !== roomGenerationRef.current || activeRoomIdRef.current !== roomId) return;
        const myId = (user as any)?.user_id || (user as any)?.id;

        const formattedHistory = history.map((msg: any) => {
          const msgSender = msg.sender_id; 
          const content = msg.content || msg.text || '';
          const imageUrl = isTrustedStorageImage(content) ? content : undefined;
          
          return {
            id: msg.id,
            content: imageUrl ? '' : content,
            created_at: msg.created_at || msg.ts || new Date().toISOString(),
            isOwn: Boolean(msgSender && myId && msgSender === myId),
            status: msg.status || 'sent', 
            imageUrl,
            // 🛠️ THE FIX: Maps the backend's JSON object perfectly to your UI component
            replyTo: msg.reply_to ? {
              id: String(msg.reply_to.id),
              text: msg.reply_to.content || '',
              isOwn: Boolean(myId && msg.reply_to.sender_id === myId)
            } : undefined
          };
        });

        setMessages(previousMessages => {
          const newHistory = formattedHistory.reverse();
          const knownIds = new Set(newHistory.map((message: any) => message.id));

          let pendingFormatted: any[] = [];
          try {
            const pendingRaw = localStorage.getItem(OUTBOX_STORAGE_KEY);
            if (pendingRaw) {
              const pendingMessages = JSON.parse(pendingRaw).filter((m: any) => m.roomId === roomId);
              pendingFormatted = pendingMessages.map((m: any) => ({
                id: m.id,
                content: m.content,
                created_at: m.created_at,
                isOwn: true,
                status: 'sending',
                replyTo: m.replyTo || undefined
              }));
            }
          } catch(e) {}

          const existingIds = new Set([...newHistory.map((m: any) => m.id), ...previousMessages.map((m: any) => m.id)]);
          const pendingToInject = pendingFormatted.filter(p => !existingIds.has(p.id));

          return [...newHistory, ...previousMessages.filter((message: any) => !knownIds.has(message.id)), ...pendingToInject];
        });
        
        setHasMore(history.length >= 50);
        
        window.requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
          setTimeout(() => {
            initialScrollComplete.current = true;
          }, 50);
        });
      } catch (err: any) {
        if (!cancelled && generation === roomGenerationRef.current && activeRoomIdRef.current === roomId) {
          setError('Network issue: Failed to load chat history.');
        }
      } finally {
        if (!cancelled && generation === roomGenerationRef.current && activeRoomIdRef.current === roomId) {
          setLoading(false);
        }
      }
    };

    fetchHistory();
    return () => { cancelled = true; };
  }, [roomId, isDevMode, user]);

  useEffect(() => {
    if (!isDevMode && roomId && isConnected) {
      sendMessage('join_room', undefined, roomId);
    }
  }, [roomId, isConnected, isDevMode, sendMessage]);


  useEffect(() => {
    if (isDevMode) return;

    const unsubscribe = wsEvents.subscribe((msg: any) => {
      if (!msg) return;

      if (msg.type === 'send_confirm' || msg.type === 'message_sent_confirm') {
        const confirmedId = msg.id || msg.payload?.messageId || msg.payload?.message_id;
        if (confirmedId) {
          setMessages(prev => prev.map((message: any) => message.id === String(confirmedId) ? { ...message, status: 'sent' } : message));
          
          try {
            const pendingRaw = localStorage.getItem(OUTBOX_STORAGE_KEY);
            if (pendingRaw) {
              const pending = JSON.parse(pendingRaw).filter((m: any) => m.id !== String(confirmedId));
              if (pending.length > 0) {
                localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(pending));
              } else {
                localStorage.removeItem(OUTBOX_STORAGE_KEY);
              }
            }
          } catch (e) {}
        }
        return;
      }

      if (msg.type === 'error') {
        setMessages(prev => [...prev, {
          id: `sys-err-${Date.now()}`,
          content: 'Connection issue: Message delivery failed.', 
          isSystem: true,
          isOwn: false,
        }]);
        return;
      }

      if (!roomId) return;

      const eventRoomId = msg.payload?.roomId || msg.payload?.room_id;
      const belongsToRoom = msg.room_id === roomId || msg.roomId === roomId || eventRoomId === roomId;

      if (belongsToRoom) {
        if (msg.type === 'photo_request') {
          setIncomingPhotoRequest(true);
          return;
        }

        if (msg.type === 'photo_response') {
          clearPhotoRequestTimeout();
          setPhotoRequestBusy(false);
          const accepted = typeof msg.accepted === 'boolean' ? msg.accepted : Boolean(msg.payload?.accepted);
          
          setMessages(prev => [...prev, { 
            id: `sys-prr-${Date.now()}`, 
            content: accepted ? `${friendName.toUpperCase()} ACCEPTED — WAITING FOR THE PHOTO...` : `${friendName.toUpperCase()} DECLINED THE PHOTO REQUEST.`, 
            isSystem: true, 
            isOwn: false 
          }]);
          return;
        }

        if (msg.type === 'photo_ready') {
          const photoUrl = msg.payload?.url || msg.url || '';
          if (photoUrl) {
            const expiresAt = Number(msg.payload?.expiresAt ?? msg.payload?.expires_at);
            const photoId = `msg-photo-${Date.now()}`;
            setMessages(prev => [...prev, { id: photoId, content: '', isOwn: false, imageUrl: photoUrl }]);
            if (Number.isFinite(expiresAt)) {
              const delay = expiresAt - Date.now();
              if (delay <= 0) {
                setMessages(prev => prev.filter((message: any) => message.id !== photoId));
              } else {
                window.setTimeout(() => {
                  setMessages(prev => prev.filter((message: any) => message.id !== photoId));
                }, delay);
              }
            }
          }
          return;
        }

        if (msg.type === 'chat_message' || msg.type === 'delivered' || msg.type === 'message_delivered') {
          
          const confirmedId = msg.id || msg.payload?.id || msg.payload?.messageId || msg.payload?.message_id;

          if (confirmedId && sentMessageIdsRef.current.has(confirmedId)) {
             if (msg.type === 'delivered' || msg.type === 'message_delivered') {
                setMessages(prev => prev.map((message: any) => message.id === confirmedId ? { ...message, status: 'delivered' } : message));
                return;
             }
             setMessages(prev => prev.map((message: any) => message.id === confirmedId ? { ...message, status: 'sent' } : message));
             return;
          }

          const parsedTs = Number(msg.ts);
          const tsMs = Number.isFinite(parsedTs) ? parsedTs : Date.now();
          const myId = (user as any)?.user_id || (user as any)?.id;
          const msgSender = msg.sender_id || msg.from; 
          const isOwn = Boolean(msgSender && myId && msgSender === myId);
          
          const messageText = msg.payload?.text || '';
          const mediaUrl = msg.payload?.mediaUrl || msg.payload?.media_url;
          
          const imageUrl = isTrustedStorageImage(mediaUrl)
            ? mediaUrl
            : isTrustedStorageImage(messageText)
              ? messageText
              : undefined;
              
          const newMsg = {
            id: confirmedId || `ws-${Date.now()}`,
            content: imageUrl ? '' : messageText,
            created_at: new Date(tsMs).toISOString(),
            isOwn,
            status: 'delivered', 
            imageUrl,
            // 🛠️ THE FIX: Maps the live WebSocket JSON payload perfectly
            replyTo: msg.payload?.reply_to ? {
              id: String(msg.payload.reply_to.id),
              text: msg.payload.reply_to.content || '',
              isOwn: Boolean(myId && msg.payload.reply_to.sender_id === myId)
            } : undefined
          };
          
          setMessages(prev => {
            if (prev.some((message: any) => message.id === newMsg.id)) return prev;

            const pendingPhoto = isOwn && newMsg.imageUrl
              ? prev.find((message: any) => message.isUploading)
              : undefined;
            if (pendingPhoto) {
              return prev.map((message: any) => message.id === pendingPhoto.id ? newMsg : message);
            }
            return [...prev, newMsg];
          });
          setIsPartnerTyping(false);
          
          if (!isOwn && isConnected) {
            sendMessage('read', undefined, roomId);
          }

          window.requestAnimationFrame(() => {
            if (scrollRef.current) {
              const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
              if (scrollHeight - scrollTop - clientHeight < 200) {
                 scrollRef.current.style.scrollBehavior = 'smooth';
                 scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                 setTimeout(() => {
                   if (scrollRef.current) scrollRef.current.style.scrollBehavior = 'auto';
                 }, 300);
              }
            }
          });
        }
        else if (msg.type === 'typing_start' || msg.type === 'typing_status') {
          setIsPartnerTyping(true);
          setTimeout(() => {
            if (scrollRef.current) {
              const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
              if (scrollHeight - scrollTop - clientHeight < 100) {
                 scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
              }
            }
          }, 50);

          if (partnerTypingTimeoutRef.current) clearTimeout(partnerTypingTimeoutRef.current);
          partnerTypingTimeoutRef.current = window.setTimeout(() => setIsPartnerTyping(false), 4000);
        } 
        else if (msg.type === 'typing_end') {
          setIsPartnerTyping(false);
          if (partnerTypingTimeoutRef.current) clearTimeout(partnerTypingTimeoutRef.current);
        }
        else if (msg.type === 'read' || msg.type === 'message_read') {
          const myId = (user as any)?.user_id || (user as any)?.id;
          const readerId = msg.sender_id || msg.from || msg.payload?.userId || msg.payload?.user_id;
          if (readerId && myId && readerId !== myId) {
            const readMessageId = msg.payload?.messageId || msg.payload?.message_id;
            setMessages(prev => prev.map((m: any) => (m.isOwn && m.status !== 'read' && (!readMessageId || m.id === readMessageId)) ? { ...m, status: 'read' } : m));
          }
        }
      }
    });

    return () => unsubscribe();
  }, [roomId, isDevMode, user, isConnected, sendMessage, clearPhotoRequestTimeout, friendName]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 150;
    const isScrollingDown = scrollTop > lastScrollTopRef.current;
    lastScrollTopRef.current = scrollTop;

    if (scrollTimeoutRef.current) window.clearTimeout(scrollTimeoutRef.current);

    if (!isAtBottom && isScrollingDown) {
      setShowScrollFab(true);
      scrollTimeoutRef.current = window.setTimeout(() => setShowScrollFab(false), 1500);
    } else if (isAtBottom || !isScrollingDown) {
      setShowScrollFab(false);
    }

    isUserScrolledUp.current = !isAtBottom;
  }, []);

  useEffect(() => {
    if (isDevMode) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        const currentMessages = messagesRef.current;
        
        if (entries[0].isIntersecting && hasMore && !loadingMoreRef.current && !loading && currentMessages.length > 0 && roomId && initialScrollComplete.current) {
          
          loadingMoreRef.current = true;
          setLoadingMore(true);
          try {
            const oldestMsg = currentMessages[0];
            const cursor = `${new Date(oldestMsg.created_at).getTime()}_${oldestMsg.id}`;
            const previousScrollHeight = scrollRef.current?.scrollHeight ?? 0;
            const previousScrollTop = scrollRef.current?.scrollTop ?? 0;
            const generation = roomGenerationRef.current;
            const olderMessages = await roomsApi.getMessages(roomId!, cursor);
            if (generation !== roomGenerationRef.current || activeRoomIdRef.current !== roomId) return;
            if (olderMessages.length < 50) setHasMore(false);
            
            const myId = (user as any)?.user_id || (user as any)?.id;
            const formattedOlder = olderMessages.map((msg: any) => {
              const msgSender = msg.sender_id; 
              const content = msg.content || msg.text || '';
              const imageUrl = isTrustedStorageImage(content) ? content : undefined;
              return {
                id: msg.id,
                content: imageUrl ? '' : content,
                created_at: msg.created_at || msg.ts || new Date().toISOString(),
                isOwn: Boolean(msgSender && myId && msgSender === myId),
                status: msg.status || 'sent',
                imageUrl,
                // 🛠️ THE FIX: Mapping for older messages loaded during scrolling
                replyTo: msg.reply_to ? {
                  id: String(msg.reply_to.id),
                  text: msg.reply_to.content || '',
                  isOwn: Boolean(myId && msg.reply_to.sender_id === myId)
                } : undefined
              };
            });

            setMessages(prev => {
              const existingIds = new Set(prev.map((message: any) => message.id));
              const uniqueOlder = formattedOlder.reverse().filter((message: any) => !existingIds.has(message.id));
              return [...uniqueOlder, ...prev];
            });
            window.requestAnimationFrame(() => {
              if (scrollRef.current) {
                scrollRef.current.scrollTop = previousScrollTop + (scrollRef.current.scrollHeight - previousScrollHeight);
              }
            });
          } catch (err) {
            console.error('Failed to load older messages');
          } finally {
            loadingMoreRef.current = false;
            setLoadingMore(false);
          }
        }
      },
      { threshold: 0.1 }
    );

    if (topObserverRef.current) observer.observe(topObserverRef.current);
    return () => {
      if (topObserverRef.current) observer.unobserve(topObserverRef.current);
    };
  }, [hasMore, loadingMore, loading, roomId, isDevMode, user]);

  const handleTyping = () => {
    if (isDevMode || !isConnected) return;
    
    if (!isMyTypingStateRef.current) {
      isMyTypingStateRef.current = true;
      sendMessage('typing_start', undefined, roomId);
    }

    if (myTypingTimeoutRef.current) window.clearTimeout(myTypingTimeoutRef.current);
    
    myTypingTimeoutRef.current = window.setTimeout(() => {
      isMyTypingStateRef.current = false;
      sendMessage('typing_end', undefined, roomId);
    }, 2000);
  };

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      isUserScrolledUp.current = false;
      setShowScrollFab(false);
    }
  }, []);

  const handleScrollToMessage = useCallback((messageId: string) => {
    const element = document.getElementById(`msg-${messageId}`);
    if (element) {
      isUserScrolledUp.current = true;
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      setHighlightedMsgId(messageId);
      setTimeout(() => setHighlightedMsgId(null), 1500);
    }
  }, []);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    
    const localId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`;
    const nowIso = new Date().toISOString();

    if (!isDevMode) {
      try {
        const pendingRaw = localStorage.getItem(OUTBOX_STORAGE_KEY);
        const pending = pendingRaw ? JSON.parse(pendingRaw) : [];
        pending.push({ id: localId, content: text, roomId, created_at: nowIso, replyTo: replyingTo || undefined });
        localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(pending));
      } catch (err) {
        console.error("Failed to save to outbox", err);
      }

      if (isConnected) {
        // 🛠️ THE FIX: We send the specific ID over the socket just like the backend asked for!
        sendMessage('chat_message', { text, reply_to_id: replyingTo ? replyingTo.id : undefined }, roomId, undefined, localId);
        sentMessageIdsRef.current.add(localId);
        outboxAttemptedRef.current.add(localId);

        if (myTypingTimeoutRef.current) window.clearTimeout(myTypingTimeoutRef.current);
        isMyTypingStateRef.current = false;
        sendMessage('typing_end', undefined, roomId);
      }
    }
    
    const optimisticMsg = {
      id: localId,
      content: text,
      created_at: nowIso,
      isOwn: true,
      status: 'sending' as const,
      replyTo: replyingTo || undefined
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    
    if (roomId) bumpOwnMessage(roomId, text);
    
    setReplyingTo(null);
    setTimeout(scrollToBottom, 50);
  };

  const handleRequestPhoto = async () => {
    if (!roomId || isDevMode) return;

    setPhotoRequestBusy(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/match/photo/request`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId }),
      });

      if (!response.ok) {
         throw new Error('Connection timeout: Unable to initiate photo request.');
      }

      clearPhotoRequestTimeout();
      photoRequestTimeoutRef.current = window.setTimeout(() => {
        clearPhotoRequestTimeout();
        setPhotoRequestBusy(false);
        setMessages(prev => [...prev, { id: `sys-pr-timeout-${Date.now()}`, content: `${friendName.toUpperCase()} DIDN'T RESPOND.`, isSystem: true, isOwn: false }]);
      }, 30_000); 
    } catch (error) {
      setPhotoRequestBusy(false);
      setMessages(prev => [...prev, { id: `sys-pr-error-${Date.now()}`, content: 'Request failed. Please check your connection.', isSystem: true, isOwn: false }]);
    }
  };

  const handleDeclinePhotoRequest = async () => {
    if (!roomId) return;
    try {
      const response = await fetch(`${API_BASE}/api/v1/match/photo/respond`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId, accept: false }),
      });
      if (!response.ok) throw new Error('Response failed');
      setIncomingPhotoRequest(false);
    } catch (error) {
      setMessages(prev => [...prev, { id: `sys-pr-error-${Date.now()}`, content: 'Action failed. Please try again.', isSystem: true, isOwn: false }]);
    }
  };

  const handleAcceptPhotoRequest = () => {
    photoFileInputRef.current?.click();
  };

  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    
    if (!file) return;

    if (!isConnected || !navigator.onLine) {
      setMessages(prev => [...prev, {
        id: `sys-offline-img-${Date.now()}`,
        content: 'Dude, the internet is disconnected or too slow. Please try sending the photo when the network is back.',
        isSystem: true,
        isOwn: false
      }]);
      return;
    }
    
    setIncomingPhotoRequest(false);

    const localPreviewUrl = URL.createObjectURL(file);
    const tempId = `msg-img-${Date.now()}`;

    const optimisticMsg = {
      id: tempId,
      content: '',
      created_at: new Date().toISOString(),
      isOwn: true,
      status: 'sending', 
      imageUrl: localPreviewUrl,
      isUploading: true,
    };

    setMessages((prev) => [...prev, optimisticMsg as any]);
    try {
      const webpFile = await compressImageToWebP(file);
      if (webpFile.size > 1_000_000) {
        throw new Error('Photo must be 1MB or smaller. Please choose a smaller image.');
      }
      const uploaded = await sharePhoto(webpFile);
      URL.revokeObjectURL(localPreviewUrl);

      if (uploaded?.message_id && isTrustedStorageImage(uploaded.url)) {
        const messageId = String(uploaded.message_id);
        sentMessageIdsRef.current.add(messageId);
        setMessages((prev) => prev.map((msg: any) => msg.id === tempId ? {
          ...msg,
          id: messageId,
          imageUrl: uploaded.url,
          isUploading: false,
          created_at: uploaded.created_at || msg.created_at,
          status: 'sent', 
        } : msg));
      } else {
        setMessages((prev) => prev.map((msg: any) => msg.id === tempId ? { ...msg, isUploading: false } : msg));
      }
      if (roomId) bumpOwnMessage(roomId, 'Photo');
    } catch (error) {
      URL.revokeObjectURL(localPreviewUrl);
      setMessages((prev) => prev.filter((msg: any) => msg.id !== tempId));
      setMessages((prev) => [...prev, { id: `sys-pr-error-${Date.now()}`, content: 'Photo transfer failed. Please try again.', isSystem: true, isOwn: false }]);
    }

    setTimeout(scrollToBottom, 50);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[var(--background)]">
        <p className="text-red-500 font-bold mb-4">{error}</p>
        <button aria-label="Back" onClick={() => navigate('/home')} className="px-6 py-2 bg-[var(--card)] border border-[var(--border-color)] rounded-full text-[var(--text-main)] active:scale-95">
          Go Back
        </button>
      </div>
    );
  }

 return (
    <div className="flex flex-col bg-[var(--background)] fixed top-[64px] inset-x-0 bottom-0 z-30 overflow-hidden min-h-0 min-w-0 md:relative md:top-auto md:inset-auto md:z-auto md:h-full md:w-full">
      
      <ChatDetailsSidebar 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        friendName={friendName}
        friendAvatar={friendAvatar}
        friendUsername={friendUsername}
      />

      <AnimatePresence>
        {viewingImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewingImage(null)}
            className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          >
            <button aria-label="Close Image"
              onClick={() => setViewingImage(null)}
              className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              src={viewingImage}
              alt="Fullscreen view"
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={photoFileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoSelected}
        className="hidden"
      />
      
      <div className="flex-shrink-0 flex items-center justify-between px-2 sm:px-4 py-2.5 sm:py-3 bg-[var(--card)]/90 backdrop-blur-md border-b border-[var(--border-color)] pt-safe gap-2 z-10 w-full min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <button aria-label="Back"
            onClick={() => {
              window.history.back();
            }} 
            className="p-2 -ml-1 sm:-ml-2 text-[var(--text-muted)] active:bg-[var(--background)] rounded-full transition-colors flex-shrink-0 md:hidden"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[var(--border-color)] overflow-hidden flex-shrink-0 flex items-center justify-center">
              {friendAvatar ? (
                <img src={friendAvatar} alt={friendName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--text-muted)]" />
              )}
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <h2 className="font-bold text-[var(--text-main)] leading-tight text-sm sm:text-lg truncate">
                {isDevMode ? 'UI Testing Room' : friendName}
              </h2>
              {isOnline ? (
                <p className="text-xs text-green-500 font-medium">Online</p>
              ) : (
                <p className="text-xs text-[var(--text-muted)] font-medium">Offline</p>
              )}
            </div>
          </div>
        </div>
        
        <button aria-label="Hamburger Menu"
          onClick={() => setShowSidebar(true)} 
          className="p-2 text-[var(--text-muted)] active:bg-[var(--background)] rounded-full transition-colors flex-shrink-0"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 sm:px-4 py-3 sm:py-4 pb-2 custom-scrollbar bg-[var(--background)] min-h-0 min-w-0 w-full flex flex-col relative"
      >
        <div ref={topObserverRef} className="h-4 w-full flex justify-center py-2 mb-2 flex-shrink-0">
          {loadingMore && <Loader2 className="w-5 h-5 text-[#3B82F6] animate-spin" />}
        </div>
        
        {sortedMessages.length === 0 && !isPartnerTyping ? (
          <div className="text-center text-[var(--text-muted)] font-medium mt-8 sm:mt-10 bg-[var(--card)] border border-[var(--border-color)] p-3 sm:p-4 rounded-xl mx-auto max-w-xs text-sm sm:text-base">
            No messages yet. Say hello!
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3 min-w-0 w-full flex flex-col">
            {sortedMessages.map((msg: any, index) => {
              const currentDateHeader = getDateHeader(msg.created_at);
              const prevMessage = sortedMessages[index - 1];
              const prevDateHeader = prevMessage ? getDateHeader(prevMessage.created_at) : null;
              
              const showDateDivider = currentDateHeader !== prevDateHeader;

              return (
                <div key={msg.id || index} className="flex flex-col">
                  {showDateDivider && (
                    <div className="flex justify-center my-4">
                      <span className="px-3 py-1 bg-[var(--card)] border border-[var(--border-color)] rounded-full text-xs font-bold text-[var(--text-muted)] shadow-sm">
                        {currentDateHeader}
                      </span>
                    </div>
                  )}
                  
                  <MessageBubble 
                    id={msg.id}
                    key={msg.id || index} 
                    content={msg.content}
                    isOwn={msg.isOwn}
                    status={msg.status}
                    time={msg.created_at}
                    imageUrl={(msg as any).imageUrl}
                    onImageClick={handleImageClick}
                    isUploading={msg.isUploading}
                    isSystem={(msg as any).isSystem}
                    replyTo={msg.replyTo}
                    onSwipeToReply={() => setReplyingTo({ id: msg.id, text: msg.content || "Photo", isOwn: msg.isOwn })}
                    onReplyClick={handleScrollToMessage}
                    isHighlighted={highlightedMsgId === msg.id}
                    partnerName={friendName} 
                  />
                </div>
              );
            })}
            
            {isPartnerTyping && (
              <TypingIndicator />
            )}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 bg-[var(--card)] border-t border-[var(--border-color)] z-10 w-full min-w-0 relative">
        <AnimatePresence>
          {showScrollFab && (
            <motion.button
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              onClick={scrollToBottom}
              className="absolute -top-14 right-4 z-40 p-2.5 rounded-full bg-[var(--card)]/60 backdrop-blur-md border border-[var(--border-color)] shadow-lg text-[var(--text-main)] transition-colors hover:bg-[var(--card)]/80"
            >
              <ChevronDown className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {incomingPhotoRequest && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm rounded-2xl border border-[var(--border-color)] bg-[var(--card)]/95 p-4 shadow-2xl backdrop-blur-md z-30"
            >
              <p className="text-sm font-medium text-[var(--text-main)] mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#3B82F6]" /> {friendName} requested a photo.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button aria-label="Decline" onClick={handleDeclinePhotoRequest} className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--background)] py-2.5 font-medium text-[var(--text-muted)] transition-all hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30">
                  <X className="w-4 h-4" /> Decline
                </button>
                <button aria-label="Accept" onClick={handleAcceptPhotoRequest} className="flex items-center justify-center gap-2 rounded-xl bg-[#3B82F6] py-2.5 font-medium text-white transition-all hover:bg-blue-600">
                  <Check className="w-4 h-4" /> Accept
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <ChatInput 
          onSend={handleSend}
          disabled={false}
          onTyping={handleTyping}
          onRequestPhoto={handleRequestPhoto}
          photoRequestDisabled={photoRequestBusy}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          partnerName={friendName} 
        />
      </div>
      
    </div>
  );
}