import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import { apiClient } from '../api/client';
import { useAuth } from './AuthContext';

type Prefs = Record<string, boolean>;

interface NotificationPrefsContextType {
  // Missing key means "on" (older accounts don't have it saved yet).
  creatorLiveAlerts: boolean;
  setCreatorLiveAlerts: (enabled: boolean) => Promise<void>;
}

const NotificationPrefsContext = createContext<NotificationPrefsContextType | null>(null);

export function NotificationPrefsProvider({ children }: { children: ReactNode }) {
  const { bootstrap } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>(() => bootstrap?.notification_prefs || {});

  // Loaded with the bootstrap (taken again whenever it reloads); the PATCH below returns the saved prefs.
  const [seenBootstrap, setSeenBootstrap] = useState(bootstrap);
  if (seenBootstrap !== bootstrap) {
    setSeenBootstrap(bootstrap);
    setPrefs(bootstrap?.notification_prefs || {});
  }

  const setCreatorLiveAlerts = useCallback(async (enabled: boolean) => {
    const before = prefs;
    setPrefs((p) => ({ ...p, creator_live: enabled }));
    try {
      const res = await apiClient.patch('/users/me/notification-preferences', { creator_live: enabled });
      if (res.data) setPrefs(res.data);
    } catch {
      setPrefs(before);
      toast.error('Could not save. Try again.');
    }
  }, [prefs]);

  return (
    <NotificationPrefsContext.Provider value={{ creatorLiveAlerts: prefs.creator_live !== false, setCreatorLiveAlerts }}>
      {children}
    </NotificationPrefsContext.Provider>
  );
}

export const useNotificationPrefs = () => {
  const context = useContext(NotificationPrefsContext);
  if (!context) throw new Error('useNotificationPrefs must be used within a NotificationPrefsProvider');
  return context;
};
