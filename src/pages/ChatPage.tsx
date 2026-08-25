import { useState, useEffect, useRef, useMemo } from 'react';
import MessageBubble from '../components/chat/MessageBubble';
import ChatInput from '../components/chat/ChatInput';
import ConnectionCard from '../components/chat/ConnectionCard';
import TypingIndicator from '../components/chat/TypingIndicator';
import { Loader2, UserPlus, MoreVertical, LogOut, Image, Check, X, ShieldAlert, AlertTriangle, ShieldCheck, Users, Star, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatClient, type ChatMessage } from '../utils/chatClient';
import { useAuth } from '../context/AuthContext';
import { createPortal } from 'react-dom';
import SEO from '../components/SEO';

type Status = 'idle' | 'searching' | 'connected' | 'disconnected';

type UIMessage = ChatMessage & { 
  isSystem?: boolean; 
  isUploading?: boolean;
  replyTo?: { id: string; text: string; isOwn: boolean };
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
            const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
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

export default function ChatPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>('idle');
  const [messages, setMessages] = useState<UIMessage[]>([]);
  
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  
  const [showMobileNextConfirm, setShowMobileNextConfirm] = useState(false); 
  const [pendingRoute, setPendingRoute] = useState<string | null>(null); 
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [rulesAgreed, setRulesAgreed] = useState(false);
  const [userCountry, setUserCountry] = useState<{ name: string; code: string } | null>(null);
  const [partnerCountry, setPartnerCountry] = useState<{ name: string; code: string } | null>(null);
  const [incomingPhotoRequest, setIncomingPhotoRequest] = useState(false);
  const [photoRequestBusy, setPhotoRequestBusy] = useState(false);
  const [photoRequestTimer, setPhotoRequestTimer] = useState(30); 
  const [partnerUsername, setPartnerUsername] = useState<string | undefined>(undefined);
  const [partnerAvatar, setPartnerAvatar] = useState<string | undefined>(undefined); 
  const [isMatchWithFriend, setIsMatchWithFriend] = useState(false);
  const [partnerGender, setPartnerGender] = useState<string | undefined>(undefined);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [showAuthWarning, setShowAuthWarning] = useState(false);

  const [replyingTo, setReplyingTo] = useState<{ id: string; text: string; isOwn: boolean } | null>(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  
  const [showScrollDown, setShowScrollDown] = useState(false);
  const isUserScrolledUp = useRef(false);

  const lastScrollTopRef = useRef(0);
  const scrollTimeoutRef = useRef<number | null>(null);

  const typingTimeoutRef = useRef<number | null>(null);
  const isTypingStateRef = useRef(false);
  const isSkippingRef = useRef(false); 

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const photoRequestTimeoutRef = useRef<number | null>(null);
  const navigate = useNavigate();

  const isDev = import.meta.env.DEV;
  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none'; 
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
    };
  }, []);

  const handleMockConnect = (type: 'guest' | 'registered') => {
    setStatus('searching');
    setTimeout(() => {
      setStatus('connected');
      setPartnerCountry({ name: 'United States', code: 'US' });
      setPartnerUsername(type === 'registered' ? 'shadow_ninja' : undefined);
      setPartnerGender(type === 'registered' ? 'Male' : undefined);
      setPartnerAvatar(undefined);
      setFriendRequestSent(false);
    }, 1500);
  };

  const handleMockReceiveMessage = () => {
    if (status !== 'connected') return;
    setIsPartnerTyping(true);
    setTimeout(() => {
      setIsPartnerTyping(false);
      setMessages(prev => [...prev, { id: `msg-${Date.now()}`, text: 'Hey! This is a mock message from the frontend.', isOwn: false }]);
      
      if (document.visibilityState === 'hidden') {
        try {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(() => {});
        } catch (err) {}
      }
    }, 1500);
  };

  useEffect(() => {
    const hasAcceptedRules = sessionStorage.getItem('zquab_rules_accepted');
    if (!hasAcceptedRules) {
      setShowRulesModal(true);
    }
  }, []);

  useEffect(() => {
    if (!isDev) return;
    const handleMockDisconnect = () => {
      if (statusRef.current === 'connected') {
        setStatus('disconnected');
        setMessages(prev => [...prev, { 
          id: `sys-dev-${Date.now()}`, 
          text: 'Stranger disconnected (Mocked)', 
          isSystem: true, 
          isOwn: false 
        }]);
      }
    };
    window.addEventListener('dev_mock_disconnect', handleMockDisconnect);
    return () => window.removeEventListener('dev_mock_disconnect', handleMockDisconnect);
  }, [isDev]);

  const handleAcceptRules = () => {
    if (!rulesAgreed) return;
    sessionStorage.setItem('zquab_rules_accepted', 'true');
    setShowRulesModal(false);
  };

  const clearPhotoRequestTimeout = () => {
    if (photoRequestTimeoutRef.current !== null) {
      window.clearTimeout(photoRequestTimeoutRef.current);
      photoRequestTimeoutRef.current = null;
    }
  };

  const chatClient = useMemo(() => {
    if (isDev) return null; 
    
    return new ChatClient({
      onStatusChange: (newStatus) => {
        if (isSkippingRef.current && newStatus === 'disconnected') return;
        setStatus(newStatus);
      },
      onIncomingMessage: (message) => {
        setMessages((prev) => [...prev, message]);
        
        if (!message.isOwn && document.visibilityState === 'hidden') {
          try {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(() => {});
          } catch (err) {}
        }
      },
      onSystemMessage: (text) => {
        console.log('[Chat System]:', text);
        setMessages((prev) => [...prev, { id: `sys-${Date.now()}-${Math.random()}`, text, isSystem: true, isOwn: false }]);
      },
      onMatchFound: (_roomId, _partnerId, partnerLocation, partnerUsername, isFriend, partnerAvatar) => {
        setMessages([]); 
        
        setPartnerUsername(partnerUsername);
        setIsMatchWithFriend(Boolean(isFriend));
        setPartnerAvatar(partnerAvatar);

        if (!partnerLocation) {
          setPartnerCountry({ name: 'Unknown location', code: '' });
          return;
        }
        const normalized = partnerLocation.trim().replace(/^"|"$/g, '');
        if (/^[A-Za-z]{2}$/.test(normalized)) {
          setPartnerCountry({ name: normalized.toUpperCase(), code: normalized.toUpperCase() });
        } else {
          setPartnerCountry({ name: normalized, code: '' });
        }
      },
      onFriendAccepted: (dmRoomId) => {
        setFriendRequestSent(false);
        navigate(`/chat/${dmRoomId}`);
      },
      onLocationDetected: (country) => setUserCountry(country),
      onPartnerTyping: (isTyping) => setIsPartnerTyping(isTyping),
      onDisconnected: () => {
        if (isSkippingRef.current) return;
        setStatus('disconnected');
        setIsPartnerTyping(false); 
        setIncomingPhotoRequest(false);
        setPhotoRequestBusy(false);
        clearPhotoRequestTimeout();
      },
      onSocketOpen: () => console.log('WebSocket Connected'),
      onSocketClose: () => console.log('WebSocket Closed'),
      onError: (error) => console.error('WebSocket Error:', error),
      onPhotoRequest: () => {
        setIncomingPhotoRequest(true);
        setMessages((prev) => [...prev, { id: `sys-pr-${Date.now()}`, text: 'Stranger wants to see a photo of you.', isSystem: true, isOwn: false }]);
      },
      onPhotoResponse: (_roomId, _from, accepted) => {
        if (!accepted) {
          clearPhotoRequestTimeout();
          setPhotoRequestBusy(false);
          setMessages((prev) => [...prev, { id: `sys-prr-${Date.now()}`, text: 'Stranger declined your photo request.', isSystem: true, isOwn: false }]);
        } else {
          setMessages((prev) => [...prev, { id: `sys-prr-${Date.now()}`, text: 'Stranger accepted — waiting for the photo...', isSystem: true, isOwn: false }]);
        }
      },
      onPhotoReady: (_roomId, _from, url) => {
        clearPhotoRequestTimeout();
        setPhotoRequestBusy(false);
        setMessages((prev) => [...prev, { id: `msg-photo-${Date.now()}`, text: '', isOwn: false, imageUrl: url }]);
      },
    });
  }, [isDev]);

 useEffect(() => {
    const handleBeforeUnload = (_e: BeforeUnloadEvent) => {
      if (statusRef.current === 'connected') {
        _e.preventDefault();
        _e.returnValue = ''; 
      } else {
        chatClient?.leaveQueueSilently(true);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      chatClient?.leaveQueueSilently();
      chatClient?.shutdown();
      clearPhotoRequestTimeout();
      if (scrollTimeoutRef.current) window.clearTimeout(scrollTimeoutRef.current);
    };
  }, [chatClient]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (status !== 'connected') return;
      const target = (e.target as HTMLElement).closest('a');
      if (target) {
        if (target.target === '_blank') return; 
        e.preventDefault();
        e.stopPropagation(); 
        const href = target.getAttribute('href');
        if (href) {
          if (href.startsWith('/auth') && status === 'connected') {
            setShowAuthWarning(true);
            setShowMobileMenu(false); 
          } else {
            setPendingRoute(href);
            setShowLeaveConfirm(true); 
            setShowMobileMenu(false); 
          }
        }
      }
    };
    document.addEventListener('click', handleGlobalClick, { capture: true });
    return () => document.removeEventListener('click', handleGlobalClick, { capture: true });
  }, [status]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 150;
    const isScrollingDown = scrollTop > lastScrollTopRef.current;
    lastScrollTopRef.current = scrollTop;

    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }

    if (!isAtBottom && isScrollingDown) {
      setShowScrollDown(true);
      scrollTimeoutRef.current = window.setTimeout(() => {
        setShowScrollDown(false);
      }, 1500);
    } else if (isAtBottom || !isScrollingDown) {
      setShowScrollDown(false);
    }

    isUserScrolledUp.current = !isAtBottom;
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
      isUserScrolledUp.current = false;
      setShowScrollDown(false);
    }
  };

  useEffect(() => {
    if (scrollContainerRef.current && !isUserScrolledUp.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, status, isPartnerTyping]);

  const handleStartChat = () => {
    if (isDev) {
      handleMockConnect('guest');
      return;
    }
    
    setMessages([]); 
    setStatus('searching');
    chatClient?.start().catch((error) => console.error(error));
  };

  const handleSend = (text: string) => {
    if (status !== 'connected') return;
    
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    isTypingStateRef.current = false;
    chatClient?.sendTypingEnd();

    const newId = `msg-${Date.now()}-${Math.random()}`;
    
    setMessages((prev) => [...prev, { 
      id: newId, 
      text, 
      isOwn: true, 
      replyTo: replyingTo || undefined 
    }]);

    if (!isDev) {
      // 🛠️ THE FIX: Added replyingTo?.id to pass to your ChatClient
      (chatClient as any)?.sendChatMessage(text, replyingTo?.id);
    }
    
    setReplyingTo(null);
    setTimeout(scrollToBottom, 50); 
  };

  const handleTyping = () => {
    if (status !== 'connected' || isDev) return; 
    
    if (!isTypingStateRef.current) {
      isTypingStateRef.current = true;
      chatClient?.sendTypingStart();
    }
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = window.setTimeout(() => {
      isTypingStateRef.current = false;
      chatClient?.sendTypingEnd();
    }, 2000); 
  };

  const handleNext = () => {
    if (isDev) {
      setMessages([]);
      handleMockConnect(Math.random() > 0.5 ? 'guest' : 'registered');
      setShowMobileMenu(false); 
      return;
    }
    
    isSkippingRef.current = true;
    setStatus('searching');
    
    chatClient?.nextStranger().finally(() => {
      setTimeout(() => { isSkippingRef.current = false; }, 1000);
    });
    
    setMessages([]);
    setShowMobileMenu(false);
    setIncomingPhotoRequest(false);
    setPhotoRequestBusy(false);
    setIsPartnerTyping(false);
    setIsMatchWithFriend(false);
    setPartnerAvatar(undefined); 
    clearPhotoRequestTimeout();
    setReplyingTo(null); 
    setShowScrollDown(false);
    isUserScrolledUp.current = false;
  };

  const handleMobileNextClick = () => {
    if (status === 'connected') {
      setShowMobileNextConfirm(true);
    } else {
      handleNext();
    }
  };

  const handleScrollToMessage = (messageId: string) => {
    const element = document.getElementById(`msg-${messageId}`);
    if (element) {
      isUserScrolledUp.current = true; 
      
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      setHighlightedMsgId(messageId);
      setTimeout(() => {
        setHighlightedMsgId(null);
      }, 1500);
    }
  };

  const handleRequestPhoto = () => {
    if (isDev) {
      setMessages(prev => [...prev, { id: `sys-${Date.now()}`, text: 'Mock: Photo request sent.', isOwn: false, isSystem: true }]);
      return;
    }
    
    setPhotoRequestBusy(true);
    chatClient?.requestPhoto()
      .then(() => {
        clearPhotoRequestTimeout();
        photoRequestTimeoutRef.current = window.setTimeout(() => {
          photoRequestTimeoutRef.current = null;
          setPhotoRequestBusy(false);
          setMessages((prev) => [...prev, { id: `sys-${Date.now()}`, text: "Stranger didn't respond.", isSystem: true, isOwn: false }]);
        }, 30_000);
      })
      .catch(() => setPhotoRequestBusy(false));
  };

  const handleDeclinePhotoRequest = () => {
    setIncomingPhotoRequest(false);
    chatClient?.declinePhotoRequest().catch(() => {});
  };

  const handleAcceptPhotoRequest = () => {
    setIncomingPhotoRequest(false);
    if ((chatClient as any)?.acceptPhotoRequest) {
      (chatClient as any).acceptPhotoRequest();
    }
    photoFileInputRef.current?.click();
  };

  useEffect(() => {
    let interval: number;
    if (incomingPhotoRequest) {
      setPhotoRequestTimer(30); 
      interval = window.setInterval(() => {
        setPhotoRequestTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleDeclinePhotoRequest(); 
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [incomingPhotoRequest]);

  const handlePhotoFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; 
    if (!file) return;

    const tempId = `msg-upload-${Date.now()}`;
    const localPreviewUrl = URL.createObjectURL(file);

    setMessages((prev) => [
      ...prev, 
      { id: tempId, text: '', isOwn: true, imageUrl: localPreviewUrl, isUploading: true }
    ]);

    try {
      const webpFile = await compressImageToWebP(file);
      if (!isDev) await chatClient?.sharePhoto(webpFile);
      setMessages((prev) => prev.map(msg => 
        msg.id === tempId ? { ...msg, isUploading: false } : msg
      ));
      
      setTimeout(scrollToBottom, 50); 
    } catch (error) {
      console.error(error);
      setMessages((prev) => prev.filter(msg => msg.id !== tempId));
      setMessages((prev) => [
        ...prev, 
        { id: `sys-err-${Date.now()}`, text: 'Failed to upload photo.', isSystem: true, isOwn: false }
      ]);
    }
  };

  const handleAddFriend = () => {
    if (!user || user.is_guest) {
      setShowLoginPrompt(true); 
      setShowMobileMenu(false);
      return;
    }
    if (isDev) {
      setFriendRequestSent(true);
      return;
    }
    setFriendRequestSent(true);
    chatClient?.addCurrentPartnerAsFriend().catch((error) => {
      console.error(error);
      setFriendRequestSent(false);
    });
  };

  const handleLeaveConfirm = () => {
    if (pendingRoute) {
      navigate(pendingRoute);
    } else {
      navigate('/');
    }
  };

  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    const shouldShowWelcome = sessionStorage.getItem('zquab_show_welcome');
    if (shouldShowWelcome) {
      setShowWelcomeModal(true);
      sessionStorage.removeItem('zquab_show_welcome');
    }
  }, []);

  useEffect(() => {
    if (!isDev) return;
    const handleMockWelcome = () => {
      setShowWelcomeModal(true);
    };
    window.addEventListener('dev_mock_welcome', handleMockWelcome);
    return () => window.removeEventListener('dev_mock_welcome', handleMockWelcome);
  }, [isDev]);

  return (
    <>
    <SEO 
      title="Live Anonymous Chat | Talk to Strangers Instantly - zQuab"
      description="Start chatting with strangers around the world instantly. No sign-ups, no downloads, 100% anonymous and free. Meet new people on zQuab today."
      path="/chat"
    />
        
    <div className="w-full flex flex-col overflow-hidden fixed top-[64px] inset-x-0 bottom-0 z-40 md:relative md:top-auto md:inset-auto md:z-auto md:max-w-7xl md:mx-auto md:flex-row md:gap-6 md:p-6 md:h-[calc(100dvh-82px)]">
      
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
              className="absolute top-4 right-4 md:top-8 md:right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-colors"
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

      {isDev && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 backdrop-blur-md px-4 py-2 rounded-full shadow-lg">
          <span className="text-xs font-bold text-purple-400 uppercase tracking-wider mr-2">Dev</span>
          <button aria-label="Mock Connect Guest" onClick={() => handleMockConnect('guest')} className="text-xs bg-purple-500 text-white px-2 py-1 rounded">Guest</button>
          <button aria-label="Register " onClick={() => handleMockConnect('registered')} className="text-xs bg-indigo-500 text-white px-2 py-1 rounded">User</button>
          <button aria-label="Recieve Message" onClick={handleMockReceiveMessage} disabled={status !== 'connected'} className="text-xs bg-green-500 text-white px-2 py-1 rounded disabled:opacity-50">Msg</button>
        </div>
      )}

      <AnimatePresence>
        {showAuthWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--card)] border border-[var(--border-color)] rounded-2xl p-6 max-w-sm w-full shadow-2xl relative"
            >
              <button aria-label="Close"
                onClick={() => setShowAuthWarning(false)}
                className="absolute top-4 right-4 p-1.5 text-[var(--text-muted)] hover:bg-[var(--background)] rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
              </div>
              
              <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">Wait! Don't lose your match.</h3>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-6">
                Navigating to the login screen will immediately disconnect your current stranger chat. 
                <br/><br/>
                <strong>Pro tip:</strong> Ask for their zQuab username before you leave so you can add them as a friend and continue in DMs later!
              </p>
              
              <div className="flex flex-col gap-3">
                <button aria-label="Stay in chat"
                  onClick={() => setShowAuthWarning(false)}
                  className="w-full py-3 bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-main)] font-bold rounded-xl hover:border-[var(--text-main)] transition-colors"
                >
                  Stay in Chat
                </button>
                <button aria-label="Leave and Login"
                  onClick={() => {
                    setShowAuthWarning(false);
                    navigate('/auth');
                  }}
                  className="w-full py-3 bg-[#3B82F6] text-white font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-sm"
                >
                  Leave & Log In
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {createPortal(
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              onClick={() => setShowMobileMenu(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]" 
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.35 }}
              className="fixed top-0 right-0 h-full w-[85vw] max-w-[340px] bg-[var(--background)] z-[9999] shadow-2xl flex flex-col border-l border-[var(--border-color)]" 
            >
              <div className="p-4 flex justify-between items-center border-b border-[var(--border-color)]">
                <h3 className="font-bold text-[var(--text-main)]">Match Info</h3>
                <button aria-label="Close" onClick={() => setShowMobileMenu(false)} className="p-2 bg-[var(--card)] rounded-full border border-[var(--border-color)] text-[var(--text-main)] active:scale-95 transition-transform">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 pb-8">
                <ConnectionCard 
                  status={status} 
                  onNext={handleNext} 
                  userCountry={userCountry} 
                  partnerCountry={partnerCountry} 
                  partnerUsername={partnerUsername}
                  partnerGender={partnerGender}
                  partnerAvatar={partnerAvatar} 
                  onAddFriend={handleAddFriend}
                  friendRequestStatus={friendRequestSent ? 'sent' : 'none'}
                  isAlreadyFriend={isMatchWithFriend}
                  onLeaveConfirm={() => {
                    setShowLeaveConfirm(true);
                    setShowMobileMenu(false);
                  }}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
      )}

      <AnimatePresence>
        {showMobileNextConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[102] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[var(--card)] p-6 md:p-8 rounded-[2rem] w-full max-w-sm border border-[var(--border-color)] shadow-2xl text-center">
              <div className="w-16 h-16 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto mb-6 ring-1 ring-inset ring-orange-500/20">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--text-main)] mb-3">Skip to Next?</h3>
              <p className="text-[var(--text-muted)] mb-8 leading-relaxed">
                This conversation will be lost forever. Are you sure you want to skip?
              </p>
              <div className="flex flex-col gap-3">
                <button aria-label="Skip" onClick={() => { setShowMobileNextConfirm(false); handleNext(); }} className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-colors">
                  Yes, Skip
                </button>
                <button aria-label="Cancel" onClick={() => setShowMobileNextConfirm(false)} className="w-full py-4 bg-[var(--background)] hover:bg-[var(--border-color)] text-[var(--text-main)] border border-[var(--border-color)] rounded-xl font-bold transition-colors">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLeaveConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[102] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[var(--card)] p-6 md:p-8 rounded-[2rem] w-full max-w-sm border border-[var(--border-color)] shadow-2xl text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-6 ring-1 ring-inset ring-red-500/20">
                <LogOut className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--text-main)] mb-3">Leave Chat?</h3>
              <p className="text-[var(--text-muted)] mb-8 leading-relaxed">
                Are you sure you want to leave? This chat will be gone forever and cannot be recovered.
              </p>
              <div className="flex flex-col gap-3">
                <button aria-label="Leave Chat" onClick={handleLeaveConfirm} className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors">
                  Yes, Leave Chat
                </button>
                <button aria-label="Cancel" onClick={() => { setShowLeaveConfirm(false); setPendingRoute(null); }} className="w-full py-4 bg-[var(--background)] hover:bg-[var(--border-color)] text-[var(--text-main)] border border-[var(--border-color)] rounded-xl font-bold transition-colors">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {createPortal(
      <AnimatePresence>
        {showWelcomeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-[var(--card)] p-6 md:p-8 rounded-[2rem] w-full max-w-md border border-[var(--border-color)] shadow-2xl text-center relative overflow-hidden"
            >
              <h3 className="text-3xl font-black text-[var(--text-main)] mb-2 tracking-tight mt-2">
                Welcome to zQuab!
              </h3>
              <p className="text-[var(--text-muted)] mb-8 text-sm px-4 leading-relaxed">
                Your identity is set. You're officially ready to dive into the anonymous world.
              </p>

              <div className="space-y-4 text-left mb-6">
                <div className="flex items-start gap-4 p-4 bg-[var(--background)] rounded-xl border border-[var(--border-color)]">
                  <div className="bg-green-500/10 p-2.5 rounded-lg mt-0.5">
                    <Users className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--text-main)]">Connect Instantly</h4>
                    <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">Match with strangers globally in seconds. No waiting, just real conversations.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-[var(--background)] rounded-xl border border-[var(--border-color)]">
                  <div className="bg-purple-500/10 p-2.5 rounded-lg mt-0.5">
                    <Star className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--text-main)]">Build Reputation</h4>
                    <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">Be respectful, have great chats, add friends, and level up your profile.</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 mb-6">
                <ShieldCheck className="w-4 h-4 text-[var(--text-muted)]" />
                <span className="text-xs font-semibold text-[var(--text-muted)]">
                  Your privacy matters to us. Chats remain completely anonymous.
                </span>
              </div>

              <button aria-label="Start Chat"
                onClick={() => setShowWelcomeModal(false)}
                className="w-full py-4 bg-[#3B82F6] hover:bg-blue-600 active:scale-95 text-white rounded-xl font-bold transition-all"
              >
                Let's Start Chatting
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
)}

      {createPortal(
      <AnimatePresence>
        {showRulesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-[var(--card)] p-6 md:p-8 rounded-[2rem] w-full max-w-xl border border-[var(--border-color)] shadow-2xl flex flex-col max-h-[90vh]"
            >
              <h3 className="text-3xl font-bold text-[var(--text-main)] text-center tracking-tight">
                Community Guidelines
              </h3>

              <p className="text-sm text-[var(--text-muted)] text-center mt-3 mb-6 leading-relaxed">
                Welcome to <strong>zQuab</strong>. Our goal is to help people have
                genuine conversations in a respectful environment. Please read these
                guidelines before starting your first chat.
              </p>

              <div className="flex-1 overflow-y-auto space-y-3 mb-6 pr-2 custom-scrollbar">

                <div className="bg-[var(--background)] p-4 rounded-xl border border-[var(--border-color)]">
                  <h4 className="font-semibold text-[var(--text-main)] mb-2">
                    Be Respectful
                  </h4>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    Treat everyone with respect. Harassment, bullying, hate speech,
                    discrimination, threats, or intentionally abusive behavior are
                    not allowed.
                  </p>
                </div>

                <div className="bg-[var(--background)] p-4 rounded-xl border border-[var(--border-color)]">
                  <h4 className="font-semibold text-[var(--text-main)] mb-2">
                    Protect Your Privacy
                  </h4>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    Never share sensitive personal information such as your address,
                    passwords, financial information, government IDs, or anything
                    that could put you or someone else at risk.
                  </p>
                </div>

                <div className="bg-[var(--background)] p-4 rounded-xl border border-[var(--border-color)]">
                  <h4 className="font-semibold text-[var(--text-main)] mb-2">
                    Image Sharing
                  </h4>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    Photos cannot be sent directly. The other person must explicitly
                    request an image before one can be shared. Never pressure anyone
                    into sharing photos.
                  </p>
                </div>

                <div className="bg-[var(--background)] p-4 rounded-xl border border-[var(--border-color)]">
                  <h4 className="font-semibold text-[var(--text-main)] mb-2">
                    Illegal or Harmful Content
                  </h4>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    Do not use zQuab to promote illegal activities, exploit others,
                    distribute malicious content, engage in scams, impersonation,
                    fraud, or any activity that violates applicable laws.
                  </p>
                </div>

                <div className="bg-[var(--background)] p-4 rounded-xl border border-[var(--border-color)]">
                  <h4 className="font-semibold text-[var(--text-main)] mb-2">
                    Anonymous, Not Unaccountable
                  </h4>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    zQuab is built for anonymous conversations, but violating these
                    guidelines may result in connection termination, temporary
                    restrictions, or permanent account action where applicable.
                  </p>
                </div>

                <div className="bg-[var(--background)] p-4 rounded-xl border border-[var(--border-color)]">
                  <h4 className="font-semibold text-[var(--text-main)] mb-2">
                    Your Responsibility
                  </h4>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    You are responsible for your own conversations and the
                    information you choose to share. If someone makes you
                    uncomfortable, leave the conversation immediately.
                  </p>
                </div>

                <div className=" rounded-xl p-4">
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    By continuing, you confirm that you have read these Community
                    Guidelines and agree to follow them while using zQuab. You also
                    acknowledge that zQuab is intended for users who are at least
                    <strong> 18 years of age</strong>.
                  </p>
                </div>

              </div>

              <label
                onClick={() => setRulesAgreed(!rulesAgreed)}
                className="flex items-center gap-3 cursor-pointer mb-6 group"
              >
                <div
                  className={`w-6 h-6 rounded-md border flex items-center justify-center ${
                    rulesAgreed
                      ? "bg-[#3B82F6] border-[#3B82F6]"
                      : "border-[var(--text-muted)]"
                  }`}
                >
                  {rulesAgreed && <Check className="w-4 h-4 text-white" />}
                </div>

                <span className="text-sm text-[var(--text-muted)] select-none">
                  I have read and agree to follow the Community Guidelines and Terms
                  of Service.
                </span>
              </label>

              <button aria-label="Confirmation"
                onClick={handleAcceptRules}
                disabled={!rulesAgreed}
                className="w-full py-4 bg-[#3B82F6] text-white rounded-xl font-bold disabled:opacity-50 transition-opacity"
              >
                I Understand & Agree
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
      )}

      <AnimatePresence>
        {showLoginPrompt && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[var(--card)] p-6 md:p-8 rounded-[2rem] w-full max-w-sm border border-[var(--border-color)] shadow-2xl text-center">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 text-[#3B82F6] flex items-center justify-center mx-auto mb-6">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--text-main)] mb-3">Create an Account</h3>
              <p className="text-[var(--text-muted)] mb-8 text-sm">You are browsing as a guest. Create an account to add friends and save connections.</p>
              <div className="flex flex-col gap-3">
                <button aria-label="Show Login" onClick={() => {
                  setShowLoginPrompt(false);
                  if (status === 'connected') {
                    setShowAuthWarning(true);
                  } else {
                    navigate('/auth');
                  }
                }} className="w-full py-4 bg-[#3B82F6] text-white rounded-xl font-bold">Log In / Sign Up</button>
                <button aria-label="Show Login" onClick={() => setShowLoginPrompt(false)} className="w-full py-4 bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl font-bold">Maybe Later</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col bg-[var(--background)] md:bg-[var(--card)] md:rounded-2xl md:border md:border-[var(--border-color)] overflow-hidden relative">
        <div className="p-3 md:p-4 border-b border-[var(--border-color)] bg-[var(--card)]/80 backdrop-blur-md flex-shrink-0 flex justify-between items-center z-20">
          
          <div className="flex items-center gap-3">
            <h2 className="hidden md:block font-bold text-lg text-[var(--text-main)]">Anonymous Chat</h2>
            
            <div className="md:hidden flex items-center gap-2">
              {status === 'idle' && <><div className="w-2.5 h-2.5 rounded-full bg-zinc-400" /> <span className="text-sm font-semibold text-zinc-400">Waiting</span></>}
              {status === 'searching' && <><div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] animate-ping" /> <span className="text-sm font-semibold text-[#3B82F6]">Searching</span></>}
              {status === 'connected' && <><div className="w-2.5 h-2.5 rounded-full bg-green-500" /> <span className="text-sm font-semibold text-green-500">Connected</span></>}
            </div>
          </div>

          <div className="flex md:hidden items-center gap-1.5">
            {status !== 'idle' && (
              <button aria-label="Mobile Next" onClick={handleMobileNextClick} className="bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-main)] px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5">
                <UserPlus className="w-4 h-4" /> Next
              </button>
            )}
            <button aria-label="Mobile Menu" onClick={() => setShowMobileMenu(true)} className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--border-color)] rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-[var(--background)]/30 min-h-0 relative">
          {status === 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button aria-label="Search" onClick={handleStartChat} className="bg-[#3B82F6] text-white px-10 py-4 rounded-full font-bold text-lg shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all">Start Chatting</button>
            </div>
          )}
          {status === 'searching' && (
            <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] gap-4">
              <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" />
              <p className="font-medium animate-pulse">Looking for someone interesting...</p>
            </div>
          )}
          
          {status !== 'idle' && messages.map(msg => (
            msg.isSystem 
              ? <div key={msg.id} className="text-center text-xs tracking-wide uppercase text-[var(--text-muted)] font-bold my-6">{msg.text}</div>
              : <MessageBubble 
                  id={msg.id}
                  key={msg.id} 
                  message={msg.text} 
                  isOwn={msg.isOwn} 
                  imageUrl={msg.imageUrl} 
                  isUploading={msg.isUploading}
                  replyTo={msg.replyTo}
                  onSwipeToReply={() => setReplyingTo({ id: msg.id, text: msg.text || "Photo", isOwn: msg.isOwn })}
                  onReplyClick={handleScrollToMessage}
                  isHighlighted={highlightedMsgId === msg.id}
                  onImageClick={msg.imageUrl && !msg.isUploading ? () => setViewingImage(msg.imageUrl!) : undefined}
                />
          ))}
          
          {isPartnerTyping && <TypingIndicator />}
          
          {status === 'disconnected' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center my-6 w-full select-none"
            >
              <span className="text-[11px] sm:text-xs font-black text-[var(--text-muted)] uppercase tracking-widest text-center px-4 mb-2">
                The stranger disconnected
              </span>
              <button aria-label="Next Stranger"
                onClick={handleNext} 
                className="text-[#3B82F6] hover:text-blue-400 text-sm font-bold transition-colors py-1.5 px-4 rounded-full bg-blue-500/10 hover:bg-blue-500/20 active:scale-95"
              >
                Talk to next stranger ➔
              </button>
            </motion.div>
          )}

        </div>

        <AnimatePresence>
          {showScrollDown && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="absolute bottom-[72px] right-4 z-[45]" 
            >
              <button 
                aria-label="Scroll to bottom" 
                onClick={scrollToBottom} 
                className="w-10 h-10 bg-[var(--card)]/90 backdrop-blur-md border border-[var(--border-color)] rounded-full flex items-center justify-center shadow-xl text-[var(--text-muted)] hover:text-[#3B82F6] transition-all active:scale-95"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <input ref={photoFileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoFileSelected} />

        <AnimatePresence>
          {incomingPhotoRequest && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-20 md:bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm glass rounded-xl border border-[var(--border-color)] shadow-xl p-4 z-30"
            >
              <p className="text-sm font-medium text-[var(--text-main)] mb-3 flex items-center gap-2">
                <Image className="w-4 h-4 text-[#3B82F6]" /> Stranger wants to see a photo of you.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button aria-label="Decline" onClick={handleDeclinePhotoRequest} className="flex items-center justify-center gap-2 glass hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 text-[var(--text-muted)] py-2.5 rounded-xl font-medium transition-all">
                  <X className="w-4 h-4" /> Decline
                </button>
                <button aria-label="Accept" onClick={handleAcceptPhotoRequest} className="flex items-center justify-center gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white py-2.5 rounded-xl font-medium transition-all">
                  <Check className="w-4 h-4" /> Accept ({photoRequestTimer}s)
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-shrink-0 z-20 w-full">
          <ChatInput 
            onSend={handleSend} 
            disabled={status !== 'connected'} 
            onRequestPhoto={handleRequestPhoto} 
            photoRequestDisabled={photoRequestBusy || status === 'idle'} 
            onTyping={handleTyping} 
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
          />
        </div>
      </div>

      <div className="hidden md:block w-80 h-full flex-shrink-0">
        <ConnectionCard 
          status={status} 
          onNext={handleNext} 
          userCountry={userCountry} 
          partnerCountry={partnerCountry} 
          partnerUsername={partnerUsername}
          partnerGender={partnerGender}
          partnerAvatar={partnerAvatar} 
          onAddFriend={handleAddFriend}
          friendRequestStatus={friendRequestSent ? 'sent' : 'none'}
          isAlreadyFriend={isMatchWithFriend}
          onLeaveConfirm={() => setShowLeaveConfirm(true)}
        />
      </div>
    </div>
    </>
  );
}