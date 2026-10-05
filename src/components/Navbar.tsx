import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, MessageSquare, User, Search, Bell, Compass, LayoutDashboard, Menu, Info, FileText, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useRooms } from '../context/RoomsContext';
import NotificationsDropdown from './NotificationsDropdown';
import { trackChatClick } from '../utils/analytics';

const DISMISSED_IDS_KEY = 'zquab_dismissed_request_ids';

const getDismissedIds = (): number[] => {
  try {
    const stored = localStorage.getItem(DISMISSED_IDS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export default function Navbar() {
  const location = useLocation();
  const isChatPage = location.pathname === '/chat';
  const isHomePage = location.pathname === '/home';
  const isStaticPage = isChatPage || isHomePage;
  
  const { user, loginAsGuest, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const { totalUnread, friendRequests, setFriendRequests, loading: isLoadingRequests } = useRooms();
  
  const isFullUser = user && !user.is_guest;

  useEffect(() => {
    setIsMenuOpen(false);
    setIsNotificationsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isStaticPage) {
      setIsVisible(true);
      return;
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsVisible(false);
        setIsMenuOpen(false);
        setIsNotificationsOpen(false); 
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isStaticPage]);

  const handleStartChatting = async () => {
    trackChatClick('Navbar Start Button');
    if (user) {
      navigate('/chat');
      return;
    }
    setIsConnecting(true);
    try {
      await loginAsGuest();
      navigate('/chat');
    } catch (err) {
      console.error('Failed to authenticate:', err);
      alert('Failed to connect. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const dismissedIds = getDismissedIds();
  const unreadRequestsCount = friendRequests.filter(req => !dismissedIds.includes(req.request_id)).length;
  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav
        className={`sticky top-0 z-50 transition-transform duration-300 ease-in-out bg-transparent ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="w-full px-4 md:px-8 lg:px-12 xl:px-16 relative">
          <div className="relative flex justify-between items-center h-16 sm:h-20 pointer-events-none">
            
            <Link to="/" aria-label="Home" className="pointer-events-auto flex items-center gap-3 py-2 z-10 group">
              <img src="/logo1.webp" width="32" height="32" alt="zQuab Logo" className="h-10 sm:h-14 w-auto object-contain group-hover:scale-105 transition-transform" />
              <span className="font-bold text-lg sm:text-xl tracking-tight text-[var(--text-main)] pr-2">zQuab</span>
            </Link>

            {/* Desktop Center Pill */}
            <div className="pointer-events-auto hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-1 bg-[var(--card)] border border-[var(--border-color)] px-2 py-1.5 rounded-full shadow-[4px_4px_10px_rgba(0,0,0,0.3),-2px_-2px_6px_rgba(255,255,255,0.03),inset_1px_1px_3px_rgba(255,255,255,0.1),inset_-1px_-1px_3px_rgba(0,0,0,0.2)] z-10">
              <Link to="/discover" className="px-5 py-2 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--text-main)]/5 rounded-full transition-all">Watch Live</Link>
              <Link to="/creators" className="px-5 py-2 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--text-main)]/5 rounded-full transition-all">
  Creators
</Link>
              <div className="w-px h-4 bg-[var(--border-color)] mx-2"></div>
              <Link to="/about" className="px-5 py-2 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--text-main)]/5 rounded-full transition-all">About</Link>
              <Link to="/blog" className="px-5 py-2 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--text-main)]/5 rounded-full transition-all">Blog</Link>
            </div>

            {/* RIGHT UI ELEMENTS */}
            <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 z-10">
              
              {/* PILL 1: Search & Stranger Chat (Hidden on Mobile Phones, Visible on Tablets/Desktop) */}
              <div className="hidden sm:flex items-center gap-1 sm:gap-2 bg-[var(--card)] border border-[var(--border-color)] p-1 sm:p-1.5 pl-2 sm:pl-3 rounded-full shadow-[4px_4px_10px_rgba(0,0,0,0.3),-2px_-2px_6px_rgba(255,255,255,0.03),inset_1px_1px_3px_rgba(255,255,255,0.1),inset_-1px_-1px_3px_rgba(0,0,0,0.2)]">
                <Link to="/search" className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--text-main)]/5 rounded-full transition-colors active:scale-95" aria-label="Search">
                  <Search className="w-5 h-5 sm:w-5 sm:h-5" strokeWidth={2.5} />
                </Link>
                {!isAuthLoading && (
                  <button
                    onClick={handleStartChatting}
                    disabled={isConnecting}
                    className="flex items-center gap-2 bg-[#4F46E5] text-white px-5 py-2.5 rounded-full font-bold transition-transform duration-200 active:scale-95 disabled:opacity-70 text-sm shadow-[4px_4px_8px_rgba(0,0,0,0.5),-2px_-2px_6px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(255,255,255,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.4)]"
                  >
                    {isConnecting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isFullUser ? 'Stranger Chat' : 'Start Chat'}
                  </button>
                )}
              </div>

              {/* PILL 2: Dynamic Shape-Shifting Menu */}
              {/* PILL 2: Dynamic Shape-Shifting Menu */}
              {isAuthLoading ? (
                <div className="w-[48px] h-[48px] sm:w-[54px] sm:h-[54px] bg-[var(--card)] border border-[var(--border-color)] animate-pulse rounded-full"></div>
              ) : (
                <>
                  {!isFullUser && (
                    <Link to="/auth" className="px-5 py-2.5 text-sm font-bold text-[var(--text-main)] hover:bg-[var(--text-main)]/5 rounded-full transition-colors mr-1 sm:mr-2 bg-[var(--card)] border border-[var(--border-color)] shadow-[4px_4px_10px_rgba(0,0,0,0.3),-2px_-2px_6px_rgba(255,255,255,0.03),inset_1px_1px_3px_rgba(255,255,255,0.1),inset_-1px_-1px_3px_rgba(0,0,0,0.2)] active:scale-95 flex items-center justify-center">
                      Log in
                    </Link>
                  )}

                  {/* INVISIBLE Wrapper: Holds exact layout space without duplicating visuals */}
                  {/* INVISIBLE Wrapper: Holds exact layout space without duplicating visuals */}
                  <div className={`relative ${!isFullUser ? 'lg:hidden' : 'flex'} items-center w-[48px] h-[48px] sm:w-[54px] sm:h-[54px] z-20`} ref={menuRef}>
                    
                    {/* Shape-Shifting Capsule: The ONLY visible element */}
                    <motion.div 
                      layout
                      initial={false}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className={`absolute top-0 right-0 bg-[var(--card)] border border-[var(--border-color)] shadow-[4px_4px_10px_rgba(0,0,0,0.3),-2px_-2px_6px_rgba(255,255,255,0.03),inset_1px_1px_3px_rgba(255,255,255,0.1),inset_-1px_-1px_3px_rgba(0,0,0,0.2)] overflow-hidden z-50 flex flex-col items-center ${
                        isMenuOpen 
                          ? 'w-56 lg:w-[48px] sm:lg:w-[54px] rounded-[1.5rem] lg:rounded-full' 
                          : 'w-[48px] sm:w-[54px] rounded-full'
                      }`}
                    >
                      {/* Hamburger Button */}
                      <button 
                        onClick={() => {
                          if (isNotificationsOpen) setIsNotificationsOpen(false);
                          setIsMenuOpen(!isMenuOpen);
                        }}
                        className="w-[48px] h-[48px] sm:w-[54px] sm:h-[54px] flex items-center justify-center shrink-0 transition-colors relative text-[var(--text-muted)] hover:text-[var(--text-main)]"
                        aria-label="Menu"
                      >
                        <Menu className="w-5 h-5 sm:w-5 sm:h-5" strokeWidth={2.5} />
                        {isFullUser && (totalUnread > 0 || unreadRequestsCount > 0) && (
                          <span className="absolute top-[12px] right-[12px] w-2.5 h-2.5 bg-red-500 border-2 border-[var(--card)] rounded-full"></span>
                        )}
                      </button>

                      <AnimatePresence>
                        {isMenuOpen && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col w-full"
                          >
                            <div className="w-full flex flex-col pb-3 gap-1 px-2 lg:px-0 lg:items-center">
                              <div className="w-5 h-px bg-[var(--border-color)] opacity-50 mb-1 mx-auto lg:mx-0"></div>
                              
                              {/* Tablet/Mobile specific links (hidden on desktop because center pill has them) */}
                              <Link to="/discover" onClick={()=>setIsMenuOpen(false)} className="flex lg:hidden items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--text-main)] hover:bg-[var(--text-main)]/5">
                                <span className="font-bold text-sm">Watch Live</span>
                              </Link>
                              <Link to="/about" onClick={()=>setIsMenuOpen(false)} className="flex lg:hidden items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--text-main)] hover:bg-[var(--text-main)]/5">
                                <span className="font-bold text-sm">About</span>
                              </Link>
                              <Link to="/blog" onClick={()=>setIsMenuOpen(false)} className="flex lg:hidden items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--text-main)] hover:bg-[var(--text-main)]/5">
                                <span className="font-bold text-sm">Blog</span>
                              </Link>
                              
                              {isFullUser && <div className="h-px bg-[var(--border-color)] opacity-50 my-1 block lg:hidden"></div>}

                              {/* Auth-only Links: Icon+Text on Tablet, Icon-only on Desktop */}
                              {isFullUser && (
                                <>
                                  <Link to="/home" onClick={() => setIsMenuOpen(false)} className="relative flex lg:justify-center items-center gap-3 px-3 lg:px-0 lg:w-10 h-10 rounded-xl lg:rounded-full lg:hover:bg-[#4F46E5]/10 text-[var(--text-main)] lg:text-[var(--text-muted)] hover:bg-[var(--background)] hover:text-[#4F46E5]">
                                    <MessageSquare className="w-[18px] h-[18px]" strokeWidth={2.5} />
                                    <span className="font-bold text-sm block lg:hidden">Inbox</span>
                                    {totalUnread > 0 && <span className="absolute top-2 right-2 lg:top-1.5 lg:right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-[var(--card)]"></span>}
                                  </Link>
                                  
                                  <button onClick={() => { setIsMenuOpen(false); setIsNotificationsOpen(true); }} className="relative flex lg:justify-center items-center gap-3 px-3 lg:px-0 lg:w-10 h-10 rounded-xl lg:rounded-full lg:hover:bg-amber-500/10 text-[var(--text-main)] lg:text-[var(--text-muted)] hover:bg-[var(--background)] hover:text-amber-500">
                                    <Bell className="w-[18px] h-[18px]" strokeWidth={2.5} />
                                    <span className="font-bold text-sm block lg:hidden">Notifications</span>
                                    {unreadRequestsCount > 0 && <span className="absolute top-2 right-2 lg:top-1.5 lg:right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-[var(--card)]"></span>}
                                  </button>
                                  
                                  <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="relative flex lg:justify-center items-center gap-3 px-3 lg:px-0 lg:w-10 h-10 rounded-xl lg:rounded-full lg:hover:bg-[#3B82F6]/10 text-[var(--text-main)] lg:text-[var(--text-muted)] hover:bg-[var(--background)] hover:text-[#3B82F6]">
                                    <User className="w-[18px] h-[18px]" strokeWidth={2.5} />
                                    <span className="font-bold text-sm block lg:hidden">Profile</span>
                                  </Link>
                                </>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    <NotificationsDropdown 
                      isOpen={isNotificationsOpen}
                      onClose={() => setIsNotificationsOpen(false)}
                      friendRequests={friendRequests}
                      setFriendRequests={setFriendRequests}
                      isLoadingRequests={isLoadingRequests}
                      isFullUser={isFullUser}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* --- EXTENDED NATIVE APP BOTTOM BAR (Visible <1024px) --- */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full z-50 bg-[var(--card)]/90 backdrop-blur-xl border-t border-[var(--border-color)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around px-2 py-2 relative">
          
          <Link to="/discover" className={`flex flex-col items-center gap-1 p-2 transition-colors ${isActive('/discover') ? 'text-[#4F46E5]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
            <Compass className="w-6 h-6" strokeWidth={isActive('/discover') ? 2.5 : 2} />
            <span className="text-[9px] font-bold tracking-wide">Live</span>
          </Link>
          
          <Link to="/search" className={`flex flex-col items-center gap-1 p-2 transition-colors ${isActive('/search') ? 'text-[#4F46E5]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
            <Search className="w-6 h-6" strokeWidth={isActive('/search') ? 2.5 : 2} />
            <span className="text-[9px] font-bold tracking-wide">Search</span>
          </Link>

          <div className="relative -top-5 px-2">
            <button
              onClick={handleStartChatting}
              disabled={isConnecting}
              className="flex items-center justify-center w-14 h-14 bg-[#4F46E5] text-white rounded-full shadow-[0_8px_16px_rgba(79,70,229,0.4)] border-4 border-[var(--background)] transition-transform active:scale-95 disabled:opacity-70"
            >
              {isConnecting ? <Loader2 className="w-6 h-6 animate-spin" /> : <MessageSquare className="w-6 h-6" fill="currentColor" />}
            </button>
          </div>

          <Link to="/home" className={`relative flex flex-col items-center gap-1 p-2 transition-colors ${isActive('/home') ? 'text-[#4F46E5]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
            <LayoutDashboard className="w-6 h-6" strokeWidth={isActive('/home') ? 2.5 : 2} />
            <span className="text-[9px] font-bold tracking-wide">Inbox</span>
            {totalUnread > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[var(--card)]"></span>}
          </Link>

          {isFullUser ? (
             <Link to="/profile" className={`flex flex-col items-center gap-1 p-2 transition-colors ${isActive('/profile') ? 'text-[#4F46E5]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
               <User className="w-6 h-6" strokeWidth={isActive('/profile') ? 2.5 : 2} />
               <span className="text-[9px] font-bold tracking-wide">Profile</span>
             </Link>
          ) : (
             <Link to="/auth" className={`flex flex-col items-center gap-1 p-2 transition-colors ${isActive('/auth') ? 'text-[#4F46E5]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
               <User className="w-6 h-6" strokeWidth={2} />
               <span className="text-[9px] font-bold tracking-wide">Log In</span>
             </Link>
          )}

        </div>
      </div>
    </>
  );
}