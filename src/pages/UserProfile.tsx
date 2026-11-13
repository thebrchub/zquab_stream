import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usersApi } from '../api/users';
import { friendsApi } from '../api/friends';
import { roomsApi } from '../api/rooms';
import { useAuth } from '../context/AuthContext';
import { creatorService, type CreatorProfile, type UpcomingStream } from '../services/creatorService';
import { FollowButton, type FollowState } from '../components/stream/FollowButton';
import PaginationLoader from '../components/PaginationLoader';
import {
  Loader2,
  UserPlus,
  Clock,
  MessageSquare,
  UserX,
  LogIn,
  Users,
  MapPin,
  Calendar,
  Activity,
  User,
  AlertTriangle,
  X,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  MoreHorizontal,
  ChevronRight,
  UserRound,
  Check,
  Zap,
  Radio,
  CalendarClock,
  BadgeCheck,
} from 'lucide-react';

const UPCOMING_PAGE = 10;

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showUnfriendConfirm, setShowUnfriendConfirm] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Creator-only: channel info, follow state, and live/upcoming streams.
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [followState, setFollowState] = useState<FollowState>({ isFollowing: false, liveAlerts: true });
  const [activeTab, setActiveTab] = useState<'streams' | 'friends'>('streams');
  const [upcoming, setUpcoming] = useState<UpcomingStream[]>([]);
  const [upcomingHasMore, setUpcomingHasMore] = useState(true);
  const [isLoadingUpcoming, setIsLoadingUpcoming] = useState(false);
  const upcomingRequestRef = useRef(0);
  const upcomingLoadingRef = useRef(false);
  const upcomingOffsetRef = useRef(0);
  const isCreator = Boolean(profile?.is_creator);

  useEffect(() => {
    setCreatorProfile(null);
    if (!isCreator || !username) return;
    let active = true;
    creatorService.getProfile(username)
      .then((cp) => {
        if (!active) return;
        setCreatorProfile(cp);
        setFollowState({ isFollowing: cp.is_following, liveAlerts: cp.live_alerts ?? true });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isCreator, username]);

  const loadUpcoming = useCallback(async (reset: boolean) => {
    if (!username || (upcomingLoadingRef.current && !reset)) return;
    const requestId = ++upcomingRequestRef.current;
    upcomingLoadingRef.current = true;
    setIsLoadingUpcoming(true);
    const offset = reset ? 0 : upcomingOffsetRef.current;
    try {
      const page = (await creatorService.getUpcomingStreams(username, UPCOMING_PAGE, offset)) || [];
      if (requestId !== upcomingRequestRef.current) return;
      upcomingOffsetRef.current = offset + page.length;
      setUpcoming((prev) => (reset ? page : [...prev, ...page]));
      setUpcomingHasMore(page.length === UPCOMING_PAGE);
    } catch {
      if (requestId !== upcomingRequestRef.current) return;
      setUpcomingHasMore(false);
    } finally {
      if (requestId === upcomingRequestRef.current) {
        upcomingLoadingRef.current = false;
        setIsLoadingUpcoming(false);
      }
    }
  }, [username]);

  useEffect(() => {
    setUpcoming([]);
    setUpcomingHasMore(true);
    upcomingOffsetRef.current = 0;
    if (isCreator) void loadUpcoming(true);
  }, [isCreator, loadUpcoming]);

  const loadMoreUpcoming = useCallback(() => void loadUpcoming(false), [loadUpcoming]);

  const handleFollowChange = (next: FollowState) => {
    if (next.isFollowing !== followState.isFollowing) {
      setCreatorProfile((p) => p ? { ...p, follower_count: Math.max(0, p.follower_count + (next.isFollowing ? 1 : -1)) } : p);
    }
    setFollowState(next);
  };

  useEffect(() => {
    if (user && user.username === username) {
      navigate('/profile', { replace: true });
    }
  }, [user, username, navigate]);

  useEffect(() => {
    let active = true;

    const fetchProfileData = async () => {
      if (!username) {
        setError('User not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [profileData, friendsData] = await Promise.all([
          usersApi.getUserProfile(username),
          usersApi.getUserFriends(username).catch(() => []),
        ]);

        if (!active) return;

        setProfile(profileData);
        setFriendsList(friendsData);
      } catch (err: any) {
        if (active) {
          setError(err?.message || 'User not found');
          setProfile(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchProfileData();

    return () => {
      active = false;
    };
  }, [username]);

  const handleFriendAction = async () => {
    if (!profile || !username) return;

    setActionLoading(true);
    setActionError(null);

    try {
      if (profile.friend_request_status === 'none') {
        await friendsApi.sendRequest(username);
        setProfile((prev: any) => ({
          ...prev,
          friend_request_status: 'pending_sent',
        }));
      } else if (profile.friend_request_status === 'pending_sent') {
        await friendsApi.withdrawRequest(username);
        setProfile((prev: any) => ({
          ...prev,
          friend_request_status: 'none',
        }));
      } else if (profile.friend_request_status === 'pending_received') {
        await friendsApi.acceptRequest(username);
        setProfile((prev: any) => ({
          ...prev,
          friend_request_status: 'friends',
          friend_count: (prev.friend_count || 0) + 1,
        }));
      }
    } catch (err: any) {
      console.error(err);
      if (err?.message?.toLowerCase().includes('no pending')) {
        setProfile((prev: any) => ({
          ...prev,
          friend_request_status: 'none',
        }));
      } else {
        setActionError(err?.message || 'Could not complete this action.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfriend = async () => {
    if (!username) return;
    setActionLoading(true);
    setActionError(null);

    try {
      await friendsApi.removeFriend(username);
      setProfile((prev: any) => ({
        ...prev,
        friend_request_status: 'none',
        friend_count: Math.max(0, (prev.friend_count || 0) - 1),
      }));
      setShowUnfriendConfirm(false);
    } catch (err: any) {
      console.error(err);
      setActionError(err?.message || 'Failed to remove friend.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!username) return;
    setActionLoading(true);
    setActionError(null);

    try {
      await friendsApi.rejectRequest(username);
      setProfile((prev: any) => ({
        ...prev,
        friend_request_status: 'none',
      }));
    } catch (err: any) {
      setActionError(err?.message || 'Failed to reject request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!username) return;
    setActionLoading(true);
    setActionError(null);

    try {
      const room = await roomsApi.createRoom(username);
      navigate(`/home?room=${room.room_id}`, {
        state: { activeRoomId: room.room_id },
      });
    } catch (err: any) {
      const message = err?.message || 'Failed to start conversation';
      setActionError(
        message.toLowerCase().includes('friends')
          ? 'You can only message friends. Send a friend request first.'
          : message
      );
    } finally {
      setActionLoading(false);
    }
  };

  const renderActionButton = () => {
    if (!user || user.is_guest || profile.friend_request_status === undefined) {
      return (
        <button
          onClick={() => navigate('/auth')}
          className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-white/[0.04] px-5 py-3.5 text-sm font-black text-white/90 transition-all hover:bg-white/[0.08] active:scale-[0.98] sm:w-auto border border-white/10 shadow-[4px_4px_10px_rgba(0,0,0,0.3),-2px_-2px_6px_rgba(255,255,255,0.02),inset_1px_1px_2px_rgba(255,255,255,0.1),inset_-1px_-1px_2px_rgba(0,0,0,0.2)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]"
        >
          <LogIn className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          Log in to connect
        </button>
      );
    }

    if (profile.friend_request_status === 'friends') {
      return (
        <div className="flex w-full gap-2 sm:w-auto">
          <button
            onClick={handleMessage}
            disabled={actionLoading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-3.5 text-sm font-black text-white transition-all hover:bg-blue-400 active:scale-[0.98] disabled:opacity-50 sm:flex-none shadow-[4px_4px_10px_rgba(0,0,0,0.4),-2px_-2px_6px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(255,255,255,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.4)] active:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.4)] border-none"
          >
            {actionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}
            Message
          </button>

          <button
            onClick={() => setShowUnfriendConfirm(true)}
            disabled={actionLoading}
            title="Remove friend"
            aria-label="Remove friend"
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 transition-all hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50 shadow-[2px_2px_6px_rgba(0,0,0,0.3),-1px_-1px_4px_rgba(255,255,255,0.02)] active:scale-95 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]"
          >
            <UserX className="h-4 w-4" />
          </button>
        </div>
      );
    }

    if (profile.friend_request_status === 'pending_received') {
      return (
        <div className="flex w-full gap-2 sm:w-auto">
          <button
            onClick={handleFriendAction}
            disabled={actionLoading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-3.5 text-sm font-black text-white transition-all hover:bg-blue-400 active:scale-[0.98] disabled:opacity-50 sm:flex-none shadow-[4px_4px_10px_rgba(0,0,0,0.4),-2px_-2px_6px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(255,255,255,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.4)] active:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.4)] border-none"
          >
            {actionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Accept Request
          </button>

          <button
            onClick={handleRejectRequest}
            disabled={actionLoading}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/60 transition-all hover:border-red-400/30 hover:text-red-400 disabled:opacity-50 shadow-[2px_2px_6px_rgba(0,0,0,0.3),-1px_-1px_4px_rgba(255,255,255,0.02)] active:scale-95 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]"
          >
            Reject
          </button>
        </div>
      );
    }

    const pending = profile.friend_request_status === 'pending_sent';

    return (
      <button
        onClick={handleFriendAction}
        disabled={actionLoading}
        className={`flex w-full items-center justify-center gap-2.5 rounded-xl px-5 py-3.5 text-sm font-black transition-all active:scale-[0.98] disabled:opacity-50 sm:w-auto ${
          pending
            ? 'border border-white/10 bg-white/[0.04] text-white/70 hover:border-red-400/30 hover:text-red-400 shadow-[2px_2px_6px_rgba(0,0,0,0.3),-1px_-1px_4px_rgba(255,255,255,0.02)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]'
            : 'bg-blue-500 text-white hover:bg-blue-400 border-none shadow-[4px_4px_10px_rgba(0,0,0,0.4),-2px_-2px_6px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(255,255,255,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.4)] active:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.4)]'
        }`}
      >
        {actionLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : pending ? (
          <Clock className="h-4 w-4" />
        ) : (
          <UserPlus className="h-4 w-4" />
        )}
        {pending ? 'Request Sent · Cancel' : 'Add Friend'}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10">
            <Loader2 className="h-7 w-7 animate-spin text-blue-400" />
            <div className="absolute -inset-2 rounded-3xl border border-blue-400/10" />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-white/40">
            Loading profile
          </p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-red-400/15 bg-red-500/[0.06]">
          <UserX className="h-9 w-9 text-red-400/70" />
        </div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-red-400">
          Profile unavailable
        </p>
        <h2 className="text-2xl font-black tracking-tight text-white">
          User not found
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-white/45">
          This account may not exist anymore, or it may be temporarily unavailable.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.08]"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back
        </button>
      </div>
    );
  }

  const joinedDate = profile.doj
    ? new Date(profile.doj).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : 'Unknown';

  const genderLower = profile.gender?.toLowerCase() || '';
  const isMale = genderLower === 'male';
  const isFemale = genderLower === 'female';

  const displayName = profile.name || profile.username || 'User';
  const initials = displayName.charAt(0).toUpperCase();
  const friendCount = profile.friend_count || 0;

  return (
    <main className="relative mx-auto w-full max-w-6xl overflow-hidden px-4 pb-20 pt-5 sm:px-6 sm:pt-8 lg:px-8">
      {/* Background decoration */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-80 w-[90%] -translate-x-1/2 rounded-full bg-blue-500/[0.07] blur-[100px]" />
      <div className="pointer-events-none absolute right-[-150px] top-72 -z-10 h-72 w-72 rounded-full bg-indigo-500/[0.06] blur-[100px]" />

      {/* Top navigation */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="group inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3.5 py-2.5 text-xs font-bold text-white/60 transition hover:border-white/15 hover:bg-white/[0.05] hover:text-white shadow-[2px_2px_4px_rgba(0,0,0,0.3),-1px_-1px_2px_rgba(255,255,255,0.02)] active:scale-95 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back
        </button>

        <div className="flex items-center gap-2 rounded-full border border-blue-400/15 bg-blue-400/[0.06] px-3 py-1.5 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.2)]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-300">
            zQuab profile
          </span>
        </div>
      </div>

      {/* 🛠️ Claymorphic Main Profile Card */}
      <section className="relative mb-8 overflow-hidden rounded-[28px] border border-white/[0.09] bg-[#101115] shadow-[8px_8px_20px_rgba(0,0,0,0.5),-4px_-4px_10px_rgba(255,255,255,0.02),inset_1px_1px_3px_rgba(255,255,255,0.05),inset_-1px_-1px_3px_rgba(0,0,0,0.3)]">
        {/* Cover */}
        <div className="relative h-40 overflow-hidden sm:h-56 lg:h-64">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-fuchsia-700" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(255,255,255,0.22),transparent_40%),radial-gradient(ellipse_at_80%_80%,rgba(0,0,0,0.35),transparent_50%)]" />

          <div className="absolute -right-10 -top-24 h-64 w-64 rotate-12 rounded-[55px] border border-white/15 bg-white/[0.05]" />
          <div className="absolute -right-2 -top-16 h-64 w-64 rotate-12 rounded-[55px] border border-white/10" />
          <div className="absolute -bottom-24 left-[35%] h-56 w-56 rotate-45 rounded-[50px] border border-white/10 bg-white/[0.035]" />

          <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1.5 backdrop-blur-md sm:left-7 sm:top-7 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.3)]">
            <Sparkles className="h-3.5 w-3.5 text-blue-100" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/90">
              Community
            </span>
          </div>

          <div className="absolute bottom-4 right-5 hidden items-center gap-1.5 text-white/60 sm:flex drop-shadow-sm">
            <Zap className="h-3.5 w-3.5" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em]">
              Meet the community
            </span>
          </div>
        </div>

        {/* Profile body */}
        <div className="relative px-5 pb-6 sm:px-8 sm:pb-8 lg:px-10">
          <div className="-mt-14 mb-5 flex flex-col gap-5 sm:-mt-[76px] sm:flex-row sm:items-end sm:justify-between">
            {/* 🛠️ Claymorphic Avatar Well */}
            <div className="relative w-fit">
              <div className="absolute -inset-2 rounded-[29px] bg-blue-500/20 blur-xl" />
              <div className="relative h-28 w-28 overflow-hidden rounded-[25px] border-[5px] border-[#101115] bg-[#20232d] shadow-[4px_4px_12px_rgba(0,0,0,0.6),-2px_-2px_6px_rgba(255,255,255,0.03),inset_2px_2px_4px_rgba(255,255,255,0.1),inset_-2px_-2px_4px_rgba(0,0,0,0.4)] sm:h-36 sm:w-36 sm:rounded-[30px]">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={`${displayName}'s avatar`}
                    className="h-full w-full object-cover scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500/30 via-indigo-500/20 to-fuchsia-500/30 text-4xl font-black text-white sm:text-5xl drop-shadow-md">
                    {initials}
                  </div>
                )}
              </div>

              <div className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-xl border-[4px] border-[#101115] bg-blue-500 text-white shadow-[2px_2px_5px_rgba(0,0,0,0.5)]">
                <UserRound className="h-4 w-4" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:pb-1 z-10">
              <div className="min-w-0 flex-1 sm:flex-none">
                {renderActionButton()}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu((value) => !value)}
                  aria-label="More profile options"
                  aria-expanded={showMoreMenu}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/65 transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-white shadow-[2px_2px_6px_rgba(0,0,0,0.3),-1px_-1px_4px_rgba(255,255,255,0.02)] active:scale-95 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>

                {showMoreMenu && (
                  <div className="absolute right-0 top-14 z-30 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#191a20] p-1.5 shadow-[4px_4px_15px_rgba(0,0,0,0.5),-1px_-1px_3px_rgba(255,255,255,0.05)] animate-in fade-in slide-in-from-top-2 duration-200">
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        setActionError('Profile reporting is not available yet.');
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Report profile
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Identity */}
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-[42px] drop-shadow-sm">
                {displayName}
              </h1>
              <span
                title="zQuab community member"
                className="flex h-6 w-6 items-center justify-center rounded-full border border-blue-400/20 bg-blue-400/10 text-blue-300 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)]"
              >
                <Check className="h-3.5 w-3.5" />
              </span>
            </div>

            <p className="mt-1 text-sm font-medium text-white/40 drop-shadow-sm">
              @{profile.username}
            </p>

            {/* 🛠️ Claymorphic Recessed Stat Pills */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              <div className="flex items-center gap-3 rounded-[1.25rem] border border-white/[0.04] bg-[#14151a] px-3.5 py-3 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.4),inset_-1px_-1px_3px_rgba(255,255,255,0.02)]">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)]">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-lg font-black leading-tight text-white drop-shadow-sm">
                    {friendCount}
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold text-white/40">
                    Friends
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-[1.25rem] border border-white/[0.04] bg-[#14151a] px-3.5 py-3 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.4),inset_-1px_-1px_3px_rgba(255,255,255,0.02)]">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)]">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-extrabold leading-tight text-white drop-shadow-sm">
                    {joinedDate}
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold text-white/40">
                    Joined zQuab
                  </p>
                </div>
              </div>

              {profile.country && (
                <div className="flex items-center gap-3 rounded-[1.25rem] border border-white/[0.04] bg-[#14151a] px-3.5 py-3 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.4),inset_-1px_-1px_3px_rgba(255,255,255,0.02)]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)]">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="max-w-32 truncate text-sm font-extrabold text-white drop-shadow-sm">
                      {profile.country}
                    </p>
                    <p className="mt-0.5 text-[10px] font-semibold text-white/40">
                      Location
                    </p>
                  </div>
                </div>
              )}

              {profile.age && (
                <div className="flex items-center gap-3 rounded-[1.25rem] border border-white/[0.04] bg-[#14151a] px-3.5 py-3 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.4),inset_-1px_-1px_3px_rgba(255,255,255,0.02)]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)]">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-lg font-black leading-tight text-white drop-shadow-sm">
                      {profile.age}
                    </p>
                    <p className="mt-0.5 text-[10px] font-semibold text-white/40">
                      Years old
                    </p>
                  </div>
                </div>
              )}

              {profile.gender && profile.gender !== 'Any' && (
                <div className="flex items-center gap-3 rounded-[1.25rem] border border-white/[0.04] bg-[#14151a] px-3.5 py-3 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.4),inset_-1px_-1px_3px_rgba(255,255,255,0.02)]">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)] ${
                      isMale
                        ? 'bg-sky-500/10 text-sky-300'
                        : isFemale
                          ? 'bg-pink-500/10 text-pink-300'
                          : 'bg-violet-500/10 text-violet-300'
                    }`}
                  >
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-white drop-shadow-sm">
                      {profile.gender}
                    </p>
                    <p className="mt-0.5 text-[10px] font-semibold text-white/40">
                      Gender
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 🛠️ Claymorphic Recessed Bio */}
          <div className="mt-6">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-blue-400" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
                About me
              </h2>
            </div>

            <div className="relative overflow-hidden rounded-[1.5rem] border border-white/[0.04] bg-[#0b0c0f] p-5 sm:p-6 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.5),inset_-2px_-2px_6px_rgba(255,255,255,0.02)]">
              <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-blue-500/[0.04] blur-2xl" />
              <p className="relative whitespace-pre-wrap break-words text-sm leading-7 text-white/80">
                {profile.bio || 'This user has not added a bio yet.'}
              </p>
            </div>
          </div>

          {/* Creator identity — integrated into the main profile card */}
          {isCreator && (
            <div className="mt-7 border-t border-white/[0.08] pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Radio className="h-4 w-4 text-blue-400" />
                    <h2 className="text-base font-black text-white">
                      {creatorProfile?.name || displayName}
                    </h2>

                    {creatorProfile?.verified && (
                      <BadgeCheck className="h-4 w-4 text-blue-400" />
                    )}

                    <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-blue-300">
                      Creator
                    </span>
                  </div>

                  {creatorProfile?.headline && (
                    <p className="mt-1 text-xs text-white/50">
                      {creatorProfile.headline}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-white/60">
                    <span>
                      <strong className="text-white">
                        {(creatorProfile?.follower_count ?? 0).toLocaleString()}
                      </strong>{" "}
                      followers
                    </span>

                    <span>
                      <strong className="text-white">
                        {(creatorProfile?.stream_count ?? 0).toLocaleString()}
                      </strong>{" "}
                      streams
                    </span>

                    {creatorProfile?.category && (
                      <span className="capitalize">{creatorProfile.category}</span>
                    )}
                  </div>
                </div>

                {username && (
                  <div className="shrink-0">
                    <FollowButton
                      username={username}
                      creatorName={creatorProfile?.name || displayName}
                      state={followState}
                      onChange={handleFollowChange}
                      isGuest={!user || user.is_guest}
                      onLoginClick={() =>
                        navigate(`/auth?next=${encodeURIComponent(`/user/${username}`)}`)
                      }
                      size="md"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Creator content */}
      {isCreator && (
        <section className="mb-8">
          <div className="mb-5 flex gap-2">
            {(['streams', 'friends'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-xs font-black transition-colors ${
                  activeTab === tab ? 'bg-blue-500 text-white' : 'border border-white/10 bg-white/[0.04] text-white/60 hover:text-white'
                }`}
              >
                {tab === 'streams' ? 'Live & Upcoming' : 'Friends'}
              </button>
            ))}
          </div>

          {activeTab === 'streams' && (
            <div className="space-y-3">
              {creatorProfile?.live_stream && (
                <button
                  onClick={() => navigate(`/live/${creatorProfile.live_stream!.stream_id}`)}
                  className="group flex w-full items-center gap-4 rounded-[1.25rem] border border-red-500/30 bg-red-500/[0.06] p-4 text-left transition hover:bg-red-500/[0.1]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-400">
                    <Radio className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-red-400">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> Live now
                      {creatorProfile.live_stream.is_premium && <span className="text-amber-400">· {creatorProfile.live_stream.entry_price_coins} 🪙</span>}
                    </div>
                    <div className="truncate text-sm font-black text-white">{creatorProfile.live_stream.title}</div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/40 transition-transform group-hover:translate-x-0.5" />
                </button>
              )}

              {upcoming.map((s) => (
                <div key={s.stream_id} className="flex items-center gap-4 rounded-[1.25rem] border border-white/[0.08] bg-[#101115] p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
                    <CalendarClock className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-black text-white">{s.title}</div>
                    <div className="truncate text-xs text-white/50">
                      {new Date(s.scheduled_at).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      {s.category && <span className="capitalize"> · {s.category}</span>}
                    </div>
                  </div>
                </div>
              ))}

              {!creatorProfile?.live_stream && upcoming.length === 0 && !isLoadingUpcoming && (
                <div className="rounded-[1.25rem] border border-white/[0.04] bg-[#0b0c0f] px-5 py-10 text-center text-sm text-white/40">
                  Not live right now, and nothing scheduled yet.
                </div>
              )}

              <PaginationLoader onLoadMore={loadMoreUpcoming} hasMore={upcomingHasMore} isLoading={isLoadingUpcoming} />
            </div>
          )}
        </section>
      )}

      {/* Friends section */}
      {(!isCreator || activeTab === 'friends') && (
      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-blue-300">
                Social network
              </span>
            </div>

            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl drop-shadow-sm">
                Friends
              </h2>
              <span className="rounded-[10px] border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-black tabular-nums text-white/70 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.3)]">
                {friendCount}
              </span>
            </div>
            <p className="mt-1 text-xs text-white/40">
              A peek at {displayName}'s circle.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/30">
            <Users className="h-3.5 w-3.5" />
            Community
          </div>
        </div>

        {friendsList.length === 0 ? (
          <div className="relative overflow-hidden rounded-[24px] border border-white/[0.04] bg-[#0b0c0f] px-5 py-12 text-center sm:py-16 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.4),inset_-2px_-2px_6px_rgba(255,255,255,0.02)]">
            <div className="pointer-events-none absolute -left-12 -top-16 h-40 w-40 rounded-full bg-blue-500/[0.07] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -right-12 h-40 w-40 rounded-full bg-indigo-500/[0.07] blur-3xl" />

            <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[25px] border border-white/[0.08] bg-[#191a20] shadow-[4px_4px_10px_rgba(0,0,0,0.3),-2px_-2px_6px_rgba(255,255,255,0.02)]">
              <Users className="h-8 w-8 text-white/30 drop-shadow-sm" />
              <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-xl border-4 border-[#0b0c0f] bg-blue-500 text-white shadow-md">
                <Sparkles className="h-3 w-3" />
              </span>
            </div>

            <p className="relative mb-2 text-[9px] font-black uppercase tracking-[0.25em] text-blue-300/80">
              The circle starts here
            </p>

            <h3 className="relative text-xl font-black tracking-tight text-white drop-shadow-sm">
              No friends to show
            </h3>

            <p className="relative mx-auto mt-2 max-w-xs text-sm leading-6 text-white/40">
              {displayName} hasn't added any friends to their network yet.
            </p>

            <Link
              to="/discover"
              className="relative mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-bold text-white/70 transition-all hover:border-blue-400/30 hover:bg-blue-500/10 hover:text-white shadow-[2px_2px_5px_rgba(0,0,0,0.2),-1px_-1px_3px_rgba(255,255,255,0.02)] active:scale-95 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]"
            >
              Explore zQuab
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {friendsList.map((friend) => (
              // 🛠️ Claymorphic Friend Card Grid
              <Link
                key={friend.username}
                to={`/user/${friend.username}`}
                aria-label={`View ${friend.name}'s profile`}
                className="group relative overflow-hidden rounded-[1.5rem] border border-white/[0.08] bg-[#101115] p-4 transition-all duration-200 hover:-translate-y-1 hover:border-blue-400/30 hover:bg-[#151720] shadow-[4px_4px_10px_rgba(0,0,0,0.3),-2px_-2px_6px_rgba(255,255,255,0.02),inset_1px_1px_2px_rgba(255,255,255,0.05)] hover:shadow-[6px_6px_15px_rgba(0,0,0,0.4),-2px_-2px_8px_rgba(255,255,255,0.03)] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.4)]"
              >
                <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-blue-500/[0.06] blur-2xl transition group-hover:bg-blue-500/10" />

                <div className="relative mb-4 flex items-center justify-center">
                  <div className="absolute h-20 w-20 rounded-[25px] bg-blue-500/10 blur-lg transition group-hover:bg-blue-500/20" />

                  <div className="relative h-20 w-20 overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#20232d] transition-transform duration-200 group-hover:scale-[1.04] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4),inset_-1px_-1px_3px_rgba(255,255,255,0.05)]">
                    {friend.avatar_url ? (
                      <img
                        src={friend.avatar_url}
                        alt={`${friend.name}'s avatar`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500/30 to-indigo-500/30 text-2xl font-black text-white drop-shadow-md">
                        {friend.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>

                  {friend.is_online && (
                    <span className="absolute bottom-0 right-[calc(50%-34px)] h-4 w-4 rounded-full border-[3px] border-[#101115] bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]" />
                  )}
                </div>

                <div className="relative text-center">
                  <h3 className="truncate text-sm font-black text-white/90 transition-colors group-hover:text-blue-300 drop-shadow-sm">
                    {friend.name}
                  </h3>
                  <p className="mt-1 truncate text-[10px] font-medium text-white/35">
                    @{friend.username}
                  </p>

                  <div className="mt-4 flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-wider text-white/35 transition-colors group-hover:text-blue-300">
                    View profile
                    <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
      )}

      {/* Action error toast */}
      {actionError && (
        <div
          role="alert"
          className="fixed bottom-5 left-4 right-4 z-[100] mx-auto flex max-w-md items-start gap-3 rounded-[1.25rem] border border-red-400/20 bg-[#1b1013] p-4 shadow-[0_15px_40px_rgba(239,68,68,0.15)] sm:bottom-6 animate-in slide-in-from-bottom-4"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />

          <p className="flex-1 text-sm leading-6 text-white/85">
            {actionError}
          </p>

          <button
            onClick={() => setActionError(null)}
            aria-label="Dismiss error"
            className="rounded-lg p-1 text-white/40 transition hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 🛠️ Claymorphic Unfriend confirmation */}
      {showUnfriendConfirm && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !actionLoading) {
              setShowUnfriendConfirm(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="unfriend-title"
            className="w-full max-w-md overflow-hidden rounded-[26px] border border-white/10 bg-[#131419] shadow-[8px_8px_20px_rgba(0,0,0,0.5),-4px_-4px_10px_rgba(255,255,255,0.02),inset_1px_1px_3px_rgba(255,255,255,0.05),inset_-1px_-1px_3px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-200"
          >
            <div className="h-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 shadow-[0_2px_10px_rgba(239,68,68,0.5)]" />

            <div className="p-6 sm:p-8">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-400/15 bg-red-500/10 text-red-400 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-1px_-1px_3px_rgba(255,255,255,0.02)]">
                <UserX className="h-7 w-7 drop-shadow-sm" />
              </div>

              <p className="mb-2 text-center text-[9px] font-black uppercase tracking-[0.25em] text-red-400">
                Relationship settings
              </p>

              <h3
                id="unfriend-title"
                className="text-center text-2xl font-black tracking-tight text-white drop-shadow-sm"
              >
                Remove friend?
              </h3>

              <p className="mt-3 text-center text-sm leading-7 text-white/50">
                Are you sure you want to remove{' '}
                <strong className="text-white">{displayName}</strong> from your
                friends? You may need to reconnect before messaging them again.
              </p>

              <div className="mt-7 flex gap-3">
                <button
                  onClick={() => setShowUnfriendConfirm(false)}
                  disabled={actionLoading}
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm font-bold text-white/70 transition-all hover:bg-white/[0.08] hover:text-white disabled:opacity-50 shadow-[4px_4px_10px_rgba(0,0,0,0.2),-2px_-2px_6px_rgba(255,255,255,0.02)] active:scale-95"
                >
                  Keep friend
                </button>

                <button
                  onClick={handleUnfriend}
                  disabled={actionLoading}
                  className="flex-1 rounded-xl bg-red-500 px-4 py-3.5 text-sm font-black text-white transition-all hover:bg-red-400 disabled:opacity-50 shadow-[4px_4px_10px_rgba(0,0,0,0.4),-2px_-2px_6px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(255,255,255,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.4)] active:scale-95 active:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.4)] border-none"
                >
                  {actionLoading ? (
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  ) : (
                    'Remove friend'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}