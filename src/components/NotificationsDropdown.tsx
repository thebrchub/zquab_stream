import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, X, Loader2, Bell } from 'lucide-react';
import { friendsApi } from '../api/friends';
import ThemeToggle from './ThemeToggle';

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  friendRequests: any[];
  setFriendRequests: React.Dispatch<React.SetStateAction<any[]>>;
  isLoadingRequests: boolean;
  isFullUser: boolean | null;
}

const DISMISSED_IDS_KEY = 'zquab_dismissed_request_ids';

const getDismissedIds = (): number[] => {
  try {
    const stored = localStorage.getItem(DISMISSED_IDS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveDismissedIds = (ids: number[]) => {
  try {
    localStorage.setItem(DISMISSED_IDS_KEY, JSON.stringify(ids));
  } catch (e) {
    console.error('Failed to save dismissed requests', e);
  }
};

export default function NotificationsDropdown({
  isOpen,
  onClose,
  friendRequests,
  setFriendRequests,
  isLoadingRequests,
  isFullUser
}: NotificationsDropdownProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [processedUsers, setProcessedUsers] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<number[]>(getDismissedIds);
  const [showMarkedNote, setShowMarkedNote] = useState(false);

  // 🛠️ THE FIX: The useEffect MUST be above the early return!
  useEffect(() => {
    if (!isOpen) {
      setShowMarkedNote(false);
    }
  }, [isOpen]);

  // NOW it is safe to return early
  if (!isOpen) return null;

  const visibleRequests = friendRequests.filter(
    req => !dismissedIds.includes(req.request_id) && !processedUsers.has(req.username)
  );

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIds = friendRequests.map(req => req.request_id);
    const updatedDismissed = Array.from(new Set([...dismissedIds, ...currentIds]));
    setDismissedIds(updatedDismissed);
    saveDismissedIds(updatedDismissed);
    
    setShowMarkedNote(true);
  };

  const handleAcceptRequest = async (e: React.MouseEvent, username: string, requestId: number) => {
    e.preventDefault();
    e.stopPropagation(); 
    
    setProcessedUsers(prev => new Set(prev).add(username));
    
    try {
      await friendsApi.acceptRequest(username);
      setFriendRequests((prev) => prev.filter(req => req.username !== username));
      
      const updatedDismissed = Array.from(new Set([...dismissedIds, requestId]));
      setDismissedIds(updatedDismissed);
      saveDismissedIds(updatedDismissed);
    } catch (error) {
      console.error('Failed to accept request:', error);
      setProcessedUsers(prev => {
        const next = new Set(prev);
        next.delete(username);
        return next;
      });
    }
  };

  const handleRejectRequest = async (e: React.MouseEvent, username: string, requestId: number) => {
    e.preventDefault();
    e.stopPropagation(); 
    
    setProcessedUsers(prev => new Set(prev).add(username));

    try {
      await friendsApi.rejectRequest(username);
      setFriendRequests((prev) => prev.filter(req => req.username !== username));
      
      const updatedDismissed = Array.from(new Set([...dismissedIds, requestId]));
      setDismissedIds(updatedDismissed);
      saveDismissedIds(updatedDismissed);
    } catch (error) {
      console.error('Failed to reject request:', error);
      setProcessedUsers(prev => {
        const next = new Set(prev);
        next.delete(username);
        return next;
      });
    }
  };

  const handleRowClick = () => {
    onClose();
    if (location.pathname === '/chat') return;
    navigate('/home');
  };

  return (
    <div className="fixed top-[72px] left-4 right-4 sm:absolute sm:top-auto sm:left-auto sm:right-0 sm:mt-3 sm:w-80 bg-[var(--card)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50">
      
      <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--background)]">
        <h3 className="font-bold text-[var(--text-main)] text-sm uppercase tracking-wider">Notifications</h3>
      
        {isFullUser && visibleRequests.length > 0 && !showMarkedNote && (
          <div className="flex items-center gap-3">
            <button 
            aria-label="Read"
              onClick={handleMarkAllAsRead}
              className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors active:scale-95"
            >
              Mark as read
            </button>
            <span className="bg-[#3B82F6] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {visibleRequests.length} New
            </span>
          </div>
        )}
      </div>
      
      <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
        {!isFullUser ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-[var(--text-muted)]">Log in to view notifications</p>
          </div>
        ) : isLoadingRequests ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-6 h-6 text-[#3B82F6] animate-spin" />
          </div>
        ) : showMarkedNote ? (
          <div className="p-8 text-center flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-1">
              <div className="border-[2.5px] border-green-500 rounded-full p-0.5">
                <Check className="w-4 h-4" strokeWidth={3} />
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-main)] mb-1.5">Marked as read</p>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Your pending requests are safe. You can view and manage them anytime in your Profile page.
              </p>
            </div>
          </div>
        ) : visibleRequests.length === 0 ? (  
          <div className="p-8 text-center flex flex-col items-center gap-2">
            <Bell className="w-6 h-6 text-[var(--text-muted)] opacity-40 mb-1" />
            <p className="text-sm font-medium text-[var(--text-muted)]">No new notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-color)]">
            {visibleRequests.map((req) => (
              <div 
                key={req.request_id || req.username}
                onClick={handleRowClick}
                className="p-4 hover:bg-[var(--background)] transition-colors cursor-pointer flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--border-color)] overflow-hidden flex-shrink-0">
                    {req.avatar_url ? (
                      <img src={req.avatar_url} alt={req.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-[var(--text-muted)]">
                        {req.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-main)] leading-tight">
                      <span className="font-bold truncate block">{req.name}</span>
                      <span className="text-[var(--text-muted)]">sent you a friend request.</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 ml-13">
                  <button 
                  aria-label="Accept"
                    onClick={(e) => handleAcceptRequest(e, req.username, req.request_id)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[#3B82F6] text-white rounded-lg text-xs font-bold hover:bg-blue-600 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" /> Accept
                  </button>
                  <button 
                  aria-label="Decline"
                    onClick={(e) => handleRejectRequest(e, req.username, req.request_id)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[var(--card)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg text-xs font-bold hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 bg-[var(--background)] border-t border-[var(--border-color)] flex justify-between items-center">
        <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Theme</span>
        <ThemeToggle />
      </div>
    </div>
  );
}