import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiClient } from '../api/client';

interface AuthUser {
  user_id: string;
  is_guest: boolean;
  username?: string;
  name?: string;
  email?: string;
  avatar_url?: string;
  is_creator?: boolean;
  approval_status?: 'none' | 'pending' | 'approved' | 'rejected';
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  // True when the session check failed for a reason other than "not logged in" (network, server error).
  sessionError: boolean;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  devMockLogin: () => void; 
  refreshSession: () => Promise<void>; // 🛠️ NEW: Expose this to your apps
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState(false);

  // 🛠️ NEW: Extracted this so it can be called from anywhere
  const refreshSession = async () => {
    try {
      const response = await apiClient.get('/users/me');
      const userData = response.data;
      
      setUser({
        user_id: userData.id,
        is_guest: false,
        username: userData.username,
        name: userData.name,
        avatar_url: userData.avatar_url,
      
        is_creator: userData.is_creator || false,
        approval_status: userData.approval_status || 'none',
      });
      setSessionError(false);
    } catch (error: any) {
      const status = error?.status;
      if (status === 401 || status === 403) {
        // No session, or a guest cookie (guests can't load /users/me).
        console.log('No active full user session found on load.');
        setUser(null);
        setSessionError(false);
      } else {
        // Network or server trouble: keep whoever is logged in instead of dropping them.
        console.error('Session check failed:', error);
        setSessionError(true);
      }
    }
  };

  const loginAsGuest = async () => {
    try {
      const response = await apiClient.post('/auth/guest');
      setUser(response.data as AuthUser);
    } catch (error) {
      console.error('Guest login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
      setUser(null);
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

  useEffect(() => {
    refreshSession().finally(() => setIsLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, sessionError, loginAsGuest, logout, devMockLogin, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};