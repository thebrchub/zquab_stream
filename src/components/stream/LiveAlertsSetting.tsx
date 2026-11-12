import { Bell } from 'lucide-react';
import { useNotificationPrefs } from '../../context/NotificationPrefsContext';

// On/off switch for "creator went live" alerts (saved to the account, so it applies on every device).
export function LiveAlertsSetting() {
  const { creatorLiveAlerts, setCreatorLiveAlerts } = useNotificationPrefs();

  return (
    <section className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-white/[0.09] bg-[#101115] p-5">
      <div className="flex items-start gap-3 min-w-0">
        <Bell className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-white">Live alerts</p>
          <p className="text-xs text-zinc-400 leading-5">Show a pop-up when a creator you follow goes live.</p>
        </div>
      </div>
      <button
        role="switch"
        aria-checked={creatorLiveAlerts}
        aria-label="Live alerts"
        onClick={() => void setCreatorLiveAlerts(!creatorLiveAlerts)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${creatorLiveAlerts ? 'bg-blue-500' : 'bg-zinc-700'}`}
      >
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${creatorLiveAlerts ? 'translate-x-5' : ''}`} />
      </button>
    </section>
  );
}
