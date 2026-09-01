import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, MessageSquare, User, Menu, X, Search, Bell } from 'lucide-react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { totalUnread, friendRequests, setFriendRequests, loading: isLoadingRequests } = useRooms();
  
  const isFullUser = user && !user.is_guest;

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsNotificationsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
      setIsMobileMenuOpen(false);
      return;
    }

    setIsConnecting(true);
    try {
      await loginAsGuest();
      navigate('/chat');
      setIsMobileMenuOpen(false);
    } catch (err) {
      console.error('Failed to authenticate:', err);
      alert('Failed to connect. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const dismissedIds = getDismissedIds();
  const unreadRequestsCount = friendRequests.filter(req => !dismissedIds.includes(req.request_id)).length;

  return (
    <nav
      className={`sticky top-0 z-50 transition-transform duration-300 ease-in-out bg-transparent ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="w-full px-4 md:px-8 lg:px-12 xl:px-16 relative">
        <div className="relative flex justify-between items-center h-16 sm:h-20 pointer-events-none">
          
          {/* LEFT: Clean Logo */}
          <Link 
            to="/" 
            aria-label="Home" 
            className="pointer-events-auto flex items-center gap-3 py-2 z-10 group"
          >
            <img 
              src="/logo1.webp" 
              width="32"
              height="32"
              alt="zQuab Logo Icon" 
              className="h-12 sm:h-14 w-auto object-contain group-hover:scale-105 transition-transform" 
            />
            <span className="font-bold text-lg sm:text-xl tracking-tight text-[var(--text-main)] pr-2">
              zQuab
            </span>
          </Link>

          {/* CENTER PILL */}
          <div className="pointer-events-auto hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-1 bg-[var(--card)] border border-[var(--border-color)] px-2 py-1.5 rounded-full shadow-[4px_4px_10px_rgba(0,0,0,0.3),-2px_-2px_6px_rgba(255,255,255,0.03),inset_1px_1px_3px_rgba(255,255,255,0.1),inset_-1px_-1px_3px_rgba(0,0,0,0.2)] z-10">
            {/* 🚀 Updated Routing Here */}
            <Link to="/discover" className="px-5 py-2 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--text-main)]/5 rounded-full transition-all">
              Watch Live
            </Link>
            <Link to="/discover" className="px-5 py-2 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--text-main)]/5 rounded-full transition-all">
              1:1 Calls
            </Link>
            <Link to="/chat" className="px-5 py-2 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--text-main)]/5 rounded-full transition-all">
              Stranger Chat
            </Link>
            
            <div className="w-px h-4 bg-[var(--border-color)] mx-2"></div>
            
            <Link to="/about" className="px-5 py-2 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--text-main)]/5 rounded-full transition-all">
              About
            </Link>
            <Link to="/blog" className="px-5 py-2 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--text-main)]/5 rounded-full transition-all">
              Blog
            </Link>
          </div>

          {/* RIGHT PILL */}
          <div className="pointer-events-auto flex items-center gap-2 bg-[var(--card)] border border-[var(--border-color)] p-1 sm:p-1.5 pl-3 sm:pl-4 rounded-full shadow-[4px_4px_10px_rgba(0,0,0,0.3),-2px_-2px_6px_rgba(255,255,255,0.03),inset_1px_1px_3px_rgba(255,255,255,0.1),inset_-1px_-1px_3px_rgba(0,0,0,0.2)] z-10">
            
            <Link to="/search" className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--text-main)]/5 rounded-full transition-colors active:scale-95" aria-label="Search">
              <Search className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
            </Link>
            
            {isFullUser && (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className={`relative p-2 rounded-full transition-colors active:scale-95 ${
                    isNotificationsOpen ? 'bg-[var(--text-main)]/10 text-[var(--text-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--text-main)]/5'
                  }`}
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
                  {unreadRequestsCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-[var(--background)] rounded-full"></span>
                  )}
                </button>
                <NotificationsDropdown 
                  isOpen={isNotificationsOpen}
                  onClose={() => setIsNotificationsOpen(false)}
                  friendRequests={friendRequests}
                  setFriendRequests={setFriendRequests}
                  isLoadingRequests={isLoadingRequests}
                  isFullUser={isFullUser}
                />
              </div>
            )}

            <div className="w-px h-4 bg-[var(--border-color)] mx-1 hidden sm:block"></div>

            <div className="hidden sm:flex items-center gap-2">
              {isAuthLoading ? (
                <div className="w-24 h-9 bg-[var(--background)] border border-[var(--border-color)] animate-pulse rounded-full mx-2"></div>
              ) : isFullUser ? (
                <>
                  <Link to="/home" className="relative p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--text-main)]/5 rounded-full transition-colors" aria-label="Inbox">
                    <MessageSquare className="w-5 h-5" strokeWidth={2.5} />
                    {totalUnread > 0 && (
                      <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-[var(--background)]">
                        {totalUnread > 9 ? '9+' : totalUnread}
                      </span>
                    )}
                  </Link>
                  <Link to="/profile" className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--text-main)]/5 rounded-full transition-colors mr-2" aria-label="Profile">
                    <User className="w-5 h-5" strokeWidth={2.5} />
                  </Link>
                </>
              ) : (
                <Link to="/auth" className="px-4 py-2 text-sm font-bold text-[var(--text-main)] hover:bg-[var(--text-main)]/5 rounded-full transition-colors mr-1">
                  Log in
                </Link>
              )}

              {!isAuthLoading && (
                <button
                  aria-label="Stranger Chat"
                  onClick={handleStartChatting}
                  disabled={isConnecting}
                  className="flex items-center gap-2 bg-[#4F46E5] text-white px-5 py-2 sm:py-2.5 rounded-full font-bold transition-transform duration-200 active:scale-95 disabled:opacity-70 text-xs sm:text-sm whitespace-nowrap shadow-[4px_4px_8px_rgba(0,0,0,0.5),-2px_-2px_6px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(255,255,255,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.4)] hover:shadow-[2px_2px_6px_rgba(0,0,0,0.5),-1px_-1px_4px_rgba(255,255,255,0.05),inset_1px_1px_3px_rgba(255,255,255,0.3),inset_-1px_-1px_3px_rgba(0,0,0,0.4)]"
                >
                  {isConnecting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isFullUser ? 'Stranger Chat' : 'Start Chat'}
                </button>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button 
              aria-label="Mobile Menu"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="sm:hidden p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--text-main)]/5 rounded-full transition-colors active:scale-95"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-[100%] left-0 w-full bg-[var(--card)]/95 backdrop-blur-2xl border-t border-[var(--border-color)] shadow-2xl flex flex-col p-6 gap-8 z-40 max-h-[85vh] overflow-y-auto pointer-events-auto">
          
          <div className="flex flex-col gap-5">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Explore</span>
            {/* 🚀 Updated Mobile Routing Here */}
            <Link to="/discover" className="text-[var(--text-main)] font-medium text-lg hover:text-[#4F46E5] transition-colors">Watch Live</Link>
            <Link to="/discover" className="text-[var(--text-main)] font-medium text-lg hover:text-[#4F46E5] transition-colors">1:1 Calls</Link>
            <button onClick={handleStartChatting} disabled={isConnecting} className="text-left text-[var(--text-main)] font-medium text-lg hover:text-[#4F46E5] transition-colors disabled:opacity-50">
              {isConnecting ? 'Connecting...' : 'Stranger Chat'}
            </button>
          </div>

          <div className="flex flex-col gap-5">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">More</span>
            <Link to="/about" className="text-[var(--text-muted)] font-medium text-base hover:text-[var(--text-main)] transition-colors">About zQuab</Link>
            <Link to="/blog" className="text-[var(--text-muted)] font-medium text-base hover:text-[var(--text-main)] transition-colors">Read the Blog</Link>
          </div>

          <div className="flex flex-col pt-2 border-t border-[var(--border-color)]">
            {isAuthLoading ? (
               <div className="w-full h-10 bg-[var(--background)] animate-pulse rounded-xl mt-4"></div>
            ) : isFullUser ? (
              <div className="flex flex-col gap-5 mt-4">
                <Link to="/home" className="flex items-center justify-between text-[var(--text-main)] font-medium text-lg hover:text-[#4F46E5] transition-colors">
                  Inbox
                  {totalUnread > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{totalUnread} new</span>}
                </Link>
                <Link to="/profile" className="text-[var(--text-main)] font-medium text-lg hover:text-[#4F46E5] transition-colors">
                  Profile
                </Link>
              </div>
            ) : (
               <Link to="/auth" className="mt-4 flex justify-center items-center w-full py-3 bg-[var(--text-main)]/5 hover:bg-[var(--text-main)]/10 text-[var(--text-main)] font-medium text-base rounded-xl transition-colors border border-[var(--border-color)]">
                 Log In
               </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}