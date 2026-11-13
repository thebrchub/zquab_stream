import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { ThemeProvider } from './hooks/useTheme';
import RootLayout from './layout/RootLayout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { RoomsProvider } from './context/RoomsContext';
import { NotificationPrefsProvider } from './context/NotificationPrefsContext';
import { CreatorLiveAlerts } from './components/stream/CreatorLiveAlerts';
import { Loader2 } from 'lucide-react';
import BlogPost from './pages/BlogPost';
import { CoinPurchaseModal } from './components/stream/CoinPurchaseModal'; 

import SocialPromoBanner from './components/SocialPromoBanner';
import DevMenu from './components/DevMenu';
import WaitlistPage from './pages/WaitlistPage';
 // <-- ADDED: Waitlist Page
// Route-level code splitting
const LandingPage = lazy(() => import('./pages/LandingPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const ChatSelectionPage = lazy(() => import('./pages/ChatSelectionPage'));
// Audio/video calls will be enabled in the next release.
// const VideoChatPage = lazy(() => import('./pages/VideoChatPage')); 
const AuthPage = lazy(() => import('./pages/AuthPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Safety = lazy(() => import('./pages/Safety'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Creators = lazy(() => import('./pages/Creators')); // <-- ADDED: Creators Page

// Protected App Pages
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const ChatRoom = lazy(() => import('./pages/ChatRoom'));
const Profile = lazy(() => import('./pages/Profile'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// --- NEW STREAM PIVOT PAGES (Named Exports via lazy) ---
const LiveDiscoveryPage = lazy(() => import('./pages/stream/LiveDiscoveryPage').then(m => ({ default: m.LiveDiscoveryPage })));
const LiveRoomPage = lazy(() => import('./pages/stream/LiveRoomPage').then(m => ({ default: m.LiveRoomPage })));
// 1:1 calls will be enabled in the next release.
// const OneOnOneRoomPage = lazy(() => import('./pages/stream/OneOnOneRoomPage').then(m => ({ default: m.OneOnOneRoomPage })));
const CreatorDashboardPage = lazy(() => import('./pages/stream/CreatorDashboardPage').then(m => ({ default: m.CreatorDashboardPage })));
const TransactionHistoryPage = lazy(() => import('./pages/wallet/TransactionHistoryPage'));

function RouteFallback() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[100dvh] bg-[var(--background)]">
      <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" />
    </div>
  );
}

// 1. Protected Route Wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, refreshSession } = useAuth();
  
  const isOnboardingDone = sessionStorage.getItem('zquab_onboarding_done') === 'true';

  useEffect(() => {
    let interval: number;
    if (!isLoading && user && !user.username && isOnboardingDone) {
      interval = window.setInterval(() => {
        refreshSession();
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading, user, isOnboardingDone, refreshSession]);
  
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[100dvh] bg-[var(--background)]">
        <Loader2 className="w-10 h-10 text-[#3B82F6] animate-spin mb-4" />
        <p className="text-[var(--text-muted)] font-medium animate-pulse">Syncing your identity...</p>
      </div>
    );
  }
  
  if (!user || user.is_guest) {
    return <Navigate to="/auth" replace />;
  }

  if (!user.username) {
    if (isOnboardingDone) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[100dvh] bg-[var(--background)]">
          <Loader2 className="w-10 h-10 text-[#3B82F6] animate-spin mb-4" />
          <p className="text-[var(--text-muted)] font-medium animate-pulse">Waiting for the network...</p>
        </div>
      );
    }
    return <Navigate to="/onboarding" replace />;
  }
  
  return <>{children}</>;
}

// 2. Auth Route Wrapper
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return null;
  
  if (user && !user.is_guest) {
    if (!user.username) return <Navigate to="/onboarding" replace />;
    // Same safe in-app check as AuthPage, so login can return to e.g. a live stream.
    const next = new URLSearchParams(window.location.search).get('next') || '';
    const isSafeNext = next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\');
    return <Navigate to={isSafeNext ? next : '/home'} replace />;
  }
  
  return <>{children}</>;
}

// 3. Onboarding Route Wrapper
function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return null;
  if (!user || user.is_guest) return <Navigate to="/auth" replace />;
  if (user.username) return <Navigate to="/home" replace />;
  
  return <>{children}</>;
}

// 4. Live Stream Route Wrapper: anyone can watch; logged-out visitors get a silent guest login.
function LiveRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, sessionError, loginAsGuest, refreshSession } = useAuth();
  const [hasFailed, setHasFailed] = useState(false);
  const [attemptKey, setAttemptKey] = useState(0);
  const startedRef = useRef(-1);

  useEffect(() => {
    // sessionError: we don't know yet if they're logged in, so never fall back to guest.
    if (isLoading || user || sessionError || startedRef.current === attemptKey) return;
    startedRef.current = attemptKey;
    let cancelled = false;

    (async () => {
      // Retry a few times: guest login is rate-limited per network.
      for (let attempt = 0; attempt < 3 && !cancelled; attempt++) {
        try {
          await loginAsGuest();
          return;
        } catch {
          await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        }
      }
      if (!cancelled) setHasFailed(true);
    })();

    return () => { cancelled = true; };
  }, [isLoading, user, sessionError, loginAsGuest, attemptKey]);

  if (user) return <>{children}</>;

  if (hasFailed || (!isLoading && sessionError)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-[100dvh] bg-[#0e0e10] text-center px-6">
        <p className="text-white font-semibold">Couldn't open the stream right now.</p>
        <button
          onClick={() => {
            if (sessionError) {
              void refreshSession();
              return;
            }
            setHasFailed(false);
            setAttemptKey((k) => k + 1);
          }}
          className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-bold hover:bg-zinc-200 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center min-h-[100dvh] bg-[#0e0e10]">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
    </div>
  );
}

// Global Tab Blinker Hook
function useTabBlinker() {
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const originalTitle = document.title;
    let isBlinking = false;

    const startBlinking = (e: any) => {
      if (document.hidden && !isBlinking) {
        isBlinking = true;
        const message = e.detail?.message || 'New Message! ';
        let toggle = false;
        
        interval = setInterval(() => {
          document.title = toggle ? message : originalTitle;
          toggle = !toggle;
        }, 1000);
      }
    };

    const stopBlinking = () => {
      if (isBlinking) {
        isBlinking = false;
        if (interval) clearInterval(interval);
        document.title = originalTitle;
      }
    };

    window.addEventListener('zquab_notification', startBlinking);
    
    window.addEventListener('visibilitychange', () => {
      if (!document.hidden) stopBlinking();
    });
    window.addEventListener('focus', stopBlinking);

    return () => {
      window.removeEventListener('zquab_notification', startBlinking);
      window.removeEventListener('visibilitychange', stopBlinking);
      window.removeEventListener('focus', stopBlinking);
      if (interval) clearInterval(interval);
      document.title = originalTitle;
    };
  }, []);
}

function App() {
  useTabBlinker();

  return (
    <ThemeProvider>
      <AuthProvider>
        <WalletProvider>
        <WebSocketProvider>
          <NotificationPrefsProvider>
          <RoomsProvider>
          <BrowserRouter>
            <CreatorLiveAlerts />
            <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route element={<RootLayout />}>
                
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                
                {/* 🚀 NEW CHAT ROUTING HUB */}
                <Route path="/chat" element={<ChatSelectionPage />} />
                <Route path="/chat/text" element={<ChatPage />} />
                {/* Audio/video calls will be enabled in the next release.
                <Route path="/chat/video" element={<VideoChatPage />} /> */}
                
                <Route path="/about" element={<About />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route element={<BlogPost />} path="/blog/:slug" />
                <Route path="/creators" element={<Creators />} /> {/* <-- ADDED: Creators Route */}
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/safety" element={<Safety />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/user/:username" element={<UserProfile />} />

                {/* Auth & Onboarding */}
                <Route path="/auth" element={<AuthRoute><AuthPage /></AuthRoute>} />
                <Route path="/onboarding" element={<OnboardingRoute><OnboardingPage /></OnboardingRoute>} />

                {/* Protected Dashboard & Social Routes */}
                <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                <Route path="/chat/:roomId" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                
                {/* GRADUATED STREAM ROUTES (Inside RootLayout = Gets Navbar) */}
                <Route path="/discover" element={<LiveDiscoveryPage />} />
                <Route path="/creator/dashboard" element={<ProtectedRoute><CreatorDashboardPage /></ProtectedRoute>} />
                <Route path="/wallet/history" element={<ProtectedRoute><TransactionHistoryPage /></ProtectedRoute>} />
                
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              {/* EDGE-TO-EDGE STREAM ROUTES (Outside RootLayout = No Navbar) */}
              <Route path="/live/:streamId" element={<LiveRoute><LiveRoomPage /></LiveRoute>} />
              {/* 1:1 calls will be enabled in the next release.
              <Route path="/stream/1on1/:creatorId" element={<ProtectedRoute><OneOnOneRoomPage /></ProtectedRoute>} /> */}

              {/* 🚀 RESTORED DEV UI TESTING ROUTES */}
              <Route path="/dev/onboarding" element={<OnboardingPage />} />
              <Route path="/dev/auth" element={<AuthPage />} />
              <Route path="/dev/home" element={<HomePage />} />
              <Route path="/dev/chat" element={<ChatRoom />} />
              <Route path="/dev/profile" element={<Profile />} />
              <Route path="/dev/waitlist" element={<WaitlistPage />} />
              <Route path="/dev/stream/discovery" element={<LiveDiscoveryPage />} />
              <Route path="/dev/stream/live" element={<LiveRoomPage />} />
              {/* 1:1 calls will be enabled in the next release.
              <Route path="/dev/stream/1on1" element={<OneOnOneRoomPage />} /> */}
              <Route path="/dev/stream/dashboard" element={<CreatorDashboardPage />} />

            </Routes>
            </Suspense>

            <SocialPromoBanner />
            <DevMenu />
            <CoinPurchaseModal />

          </BrowserRouter>
          </RoomsProvider>
          </NotificationPrefsProvider>
        </WebSocketProvider>
        </WalletProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;