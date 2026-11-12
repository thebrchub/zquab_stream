import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { wsEvents } from '../../context/WebSocketContext';
import { useAuth } from '../../context/AuthContext';
import { useNotificationPrefs } from '../../context/NotificationPrefsContext';

const ALERT_MS = 8000;

// Shows a "{name} is live" toast with a Watch button when a followed creator goes live.
export function CreatorLiveAlerts() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { creatorLiveAlerts } = useNotificationPrefs();

  useEffect(() => {
    if (!creatorLiveAlerts) return;

    return wsEvents.subscribe((msg: any) => {
      if (msg.type !== 'creator_live') return;
      const ev = msg.payload || {};
      const streamId: string = ev.stream_id || '';
      if (!streamId) return;
      if (user?.user_id && ev.creator_id === user.user_id) return;
      if (location.pathname === `/live/${streamId}`) return;

      toast.custom((t) => (
        <div className="flex items-center gap-3 w-[340px] max-w-[92vw] rounded-2xl bg-zinc-900 border border-white/10 p-3 shadow-2xl">
          <div className="relative shrink-0">
            <img src={ev.avatar_url || '/logo.webp'} alt={ev.name} className="w-11 h-11 rounded-full object-cover border border-white/10" />
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[8px] font-bold px-1 rounded uppercase">Live</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white truncate">{ev.name || ev.username} is live</p>
            {ev.title && <p className="text-xs text-zinc-400 truncate">{ev.title}</p>}
          </div>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              navigate(`/live/${streamId}`);
            }}
            className="shrink-0 px-3 py-1.5 rounded-full bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-colors"
          >
            Watch
          </button>
          <button onClick={() => toast.dismiss(t.id)} className="shrink-0 p-1 text-zinc-500 hover:text-white transition-colors" title="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
      ), { id: `creator-live-${streamId}`, duration: ALERT_MS });
    });
  }, [creatorLiveAlerts, user?.user_id, location.pathname, navigate]);

  return null;
}
