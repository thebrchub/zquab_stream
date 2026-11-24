import { createContext, useCallback, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiClient } from '../api/client';
import type { Room, RoomUser } from './RoomsContext';

export interface AuthUser {
  user_id: string;
  is_guest: boolean;
  username?: string;
  name?: string;
  email?: string;
  avatar_url?: string;
  gender?: string;
  bio?: string;
  country?: string;
  doj?: string;
  is_creator?: boolean;
  approval_status?: 'none' | 'pending' | 'approved' | 'rejected';
}

// A received friend request, as the bootstrap lists them.
export interface FriendRequestItem {
  request_id: number | string;
  user_id: string;
  username: string;
  name?: string;
  avatar_url?: string;
  is_premium?: boolean;
  status?: string;
  created_at?: string;
  donor_total?: number;
}

// The user's own profile, as the bootstrap sends it.
export interface MeResponse {
  id: string;
  name?: string;
  username?: string;
  avatar_url?: string;
  gender?: string;
  bio?: string;
  country?: string;
  doj?: string;
  is_creator?: boolean;
  approval_status?: AuthUser['approval_status'] | null;
}

// GET /users/me/bootstrap: everything the app needs when it opens, in one call.
export interface Bootstrap {
  me: MeResponse;
  wallet: { balance_coins: number };
  notification_prefs: Record<string, boolean>;
  friend_requests: FriendRequestItem[];
  rooms: { rooms: Room[]; users: Record<string, RoomUser> };
  gifts_ver: string;
}

interface AuthContextType {
  user: AuthUser | null;
  // The last bootstrap (null for guests and logged-out visitors). Contexts take their start-up data from it.
  bootstrap: Bootstrap | null;
  isLoading: boolean;
  // True when the session check failed for a reason other than "not logged in" (network, server error).
  sessionError: boolean;
  loginAsGuest: () => Promise<AuthUser>;
  logout: () => Promise<void>;
  devMockLogin: () => void;
  // Loads the bootstrap again (after login, profile changes, or to refresh lists).
  refreshSession: () => Promise<void>;
  // Applies a change the server already confirmed (e.g. a profile save) without asking again.
  updateUser: (patch: Partial<AuthUser>) => void;
  // Forget the login without calling the server (it already said the session is gone).
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// zq_in is a readable hint the backend sets: "1" logged in, "0" logged out.
// Missing (first visit, or local dev) means unknown: ask the server.
const readSessionHint = (): string | null => {
  const match = /(?:^|;\s*)zq_in=([^;]*)/.exec(document.cookie);
  return match ? match[1] : null;
};

type Preloaded = Promise<{ status: number; data: Bootstrap | null }>;

// index.html starts the bootstrap request before the app's code loads (when
// zq_in=1); the first load uses that answer instead of asking again.
const takePreloaded = (): Preloaded | undefined => {
  const w = window as Window & { __zqBoot?: Preloaded };
  const preloaded = w.__zqBoot;
  w.__zqBoot = undefined;
  return preloaded;
};

const fetchBootstrap = async (): Promise<Bootstrap> => {
  const preloaded = takePreloaded();
  if (preloaded) {
    const res = await preloaded.catch(() => null);
    if (res && res.status === 200 && res.data) return res.data;
    if (res && (res.status === 401 || res.status === 403)) {
      throw Object.assign(new Error('No session'), { status: res.status });
    }
    // Network or server trouble on the early request: ask normally below.
  }
  const { data } = await apiClient.get('/users/me/bootstrap');
  return data as Bootstrap;
};

const toAuthUser = (me: MeResponse): AuthUser => ({
  ...me,
  user_id: me.id,
  is_guest: false,
  is_creator: me.is_creator || false,
  approval_status: me.approval_status || 'none',
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  // A known logged-out visitor (zq_in=0) needs no session check at all.
  const [isLoading, setIsLoading] = useState(() => readSessionHint() !== '0');
  const [sessionError, setSessionError] = useState(false);

  const refreshSession = useCallback(async () => {
    try {
      const data = await fetchBootstrap();
      setUser(toAuthUser(data.me));
      setBootstrap(data);
      setSessionError(false);
    } catch (error) {
      const status = (error as { status?: number } | null)?.status;
      if (status === 401 || status === 403) {
        // No session, or a guest cookie (guests have no bootstrap).
        setUser(null);
        setBootstrap(null);
        setSessionError(false);
      } else {
        // Network or server trouble: keep whoever is logged in instead of dropping them.
        console.error('Session check failed:', error);
        setSessionError(true);
      }
    }
  }, []);

  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setUser((current) => (current ? { ...current, ...patch, user_id: current.user_id, is_guest: current.is_guest } : current));
  }, []);

  const loginAsGuest = async () => {
    try {
      const response = await apiClient.post('/auth/guest');
      const guest = response.data as AuthUser;
      setUser(guest);
      setBootstrap(null);
      return guest;
    } catch (error) {
      console.error('Guest login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
      setUser(null);
      setBootstrap(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const devMockLogin = () => {
    setUser({
      user_id: 'dev_mock_999',
      is_guest: false,
      username: 'dev_ninja',
      name: 'Dev Ninja',
      avatar_url: ''
    });
  };

  const clearSession = useCallback(() => {
    setUser(null);
    setBootstrap(null);
  }, []);

  useEffect(() => {
    if (readSessionHint() === '0') return; // Known logged out: no request at all.
    refreshSession().finally(() => setIsLoading(false));
  }, [refreshSession]);

  return (
    <AuthContext.Provider value={{ user, bootstrap, isLoading, sessionError, loginAsGuest, logout, devMockLogin, refreshSession, updateUser, clearSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
