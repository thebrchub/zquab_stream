import React, { useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { creatorService } from '../../services/creatorService';

export interface FollowState {
  isFollowing: boolean;
  liveAlerts: boolean;
}

interface FollowButtonProps {
  username: string;
  creatorName: string;
  state: FollowState;
  onChange: (next: FollowState) => void;
  isGuest?: boolean;
  onLoginClick?: () => void;
  size?: 'sm' | 'md';
}

// YouTube-style Follow / Following pill, plus a bell for "go live" alerts.
export const FollowButton: React.FC<FollowButtonProps> = ({
  username,
  creatorName,
  state,
  onChange,
  isGuest = false,
  onLoginClick,
  size = 'sm',
}) => {
  const [isBusy, setIsBusy] = useState(false);
  const [isBellBusy, setIsBellBusy] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const pad = size === 'md' ? 'px-6 py-2.5 text-sm' : 'px-4 py-1.5 text-xs';

  const setFollowing = async (following: boolean) => {
    const before = state;
    // Show the new state right away; switch back if the request fails.
    onChange({ isFollowing: following, liveAlerts: true });
    setIsBusy(true);
    try {
      if (following) await creatorService.followCreator(username);
      else await creatorService.unfollowCreator(username);
    } catch {
      onChange(before);
      toast.error(following ? 'Could not follow. Try again.' : 'Could not unfollow. Try again.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleMainClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isBusy) return;
    if (isGuest) {
      onLoginClick?.();
      return;
    }
    if (state.isFollowing) setShowConfirm(true);
    else void setFollowing(true);
  };

  const handleBellClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isBellBusy) return;
    const before = state;
    onChange({ ...state, liveAlerts: !state.liveAlerts });
    setIsBellBusy(true);
    try {
      await creatorService.setLiveAlerts(username, !before.liveAlerts);
    } catch {
      onChange(before);
      toast.error('Could not update alerts. Try again.');
    } finally {
      setIsBellBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={handleMainClick}
        disabled={isBusy}
        className={`${pad} rounded-full font-bold transition-all disabled:opacity-60 active:scale-95 ${
          state.isFollowing
            ? 'bg-white/10 text-white hover:bg-white/20'
            : 'bg-white text-black hover:bg-zinc-200'
        }`}
      >
        {state.isFollowing ? 'Following' : 'Follow'}
      </button>

      {state.isFollowing && !isGuest && (
        <button
          onClick={handleBellClick}
          disabled={isBellBusy}
          title={state.liveAlerts ? 'Live alerts on' : 'Live alerts off'}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-60 active:scale-95"
        >
          {state.liveAlerts ? <Bell className="w-3.5 h-3.5 fill-current" /> : <BellOff className="w-3.5 h-3.5" />}
        </button>
      )}

      {showConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-full max-w-xs rounded-2xl bg-zinc-900 border border-white/10 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-white mb-5">Unfollow {creatorName}?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-full text-sm font-semibold text-zinc-300 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  void setFollowing(false);
                }}
                className="px-4 py-2 rounded-full text-sm font-bold bg-white text-black hover:bg-zinc-200 transition-colors"
              >
                Unfollow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
