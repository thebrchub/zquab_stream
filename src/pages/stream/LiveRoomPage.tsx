import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { StreamChatSidebar } from '../../components/stream/StreamChatSidebar'; 
import { useStreamEntry } from '../../hooks/useStreamEntry';
import { useLiveStreamRoom } from '../../hooks/useLiveStreamRoom';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';
import { NativeStreamPlayer } from '../../components/stream/NativeStreamPlayer';
import { FollowButton, type FollowState } from '../../components/stream/FollowButton';
import { streamService, type StreamMetadata } from '../../services/streamService';
import { creatorService, type CreatorProfile } from '../../services/creatorService';
import { 
  Loader2, AlertCircle, ArrowLeft, 
  Eye, Share2, Copy, Activity, StopCircle, BadgeCheck,
  Play, Pause, Volume1, Volume2, VolumeX, Flag, PictureInPicture2, Maximize, Minimize, MessageSquare,
  X, Users, Lock, Coins, LogIn
} from 'lucide-react';
import { StreamOverlayAd } from '../../components/stream/StreamOverlayAd';
import { AnimatePresence } from 'framer-motion';

interface LiveRoomPageProps {
  streamId?: string;
  onLeaveRoom?: () => void;
}

export const LiveRoomPage: React.FC<LiveRoomPageProps> = ({
  streamId = 'stream-1',
  onLeaveRoom,
}) => {
  const navigate = useNavigate();
  const { streamId: routeStreamId } = useParams<{ streamId: string }>();
  const resolvedStreamId = routeStreamId || streamId;

  const [devRole, setDevRole] = useState<'viewer' | 'creator' | null>(
    (sessionStorage.getItem('dev_stream_role') as 'viewer' | 'creator' | null) || null
  );
  const [streamMode, setStreamMode] = useState<'api' | 'mock'>(
    (sessionStorage.getItem('dev_stream_mode') as 'api' | 'mock') || 'api'
  );

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [prevVolume, setPrevVolume] = useState(1);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  
  const [showProfileOverlay, setShowProfileOverlay] = useState(false);
  const [isAtLiveEdge, setIsAtLiveEdge] = useState(true);
  const [isUserActive, setIsUserActive] = useState(true);
  
  // Playback defaults retained while the settings modal is removed from the viewer UI.
  const streamQuality = 'Auto';
  const isLowLatency = true;

  const [stream, setStream] = useState<StreamMetadata | null>(null);
  const [isLoadingStream, setIsLoadingStream] = useState(true);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [followState, setFollowState] = useState<FollowState>({ isFollowing: false, liveAlerts: true });
  const [isStalled, setIsStalled] = useState(false);
  const [playerKey, setPlayerKey] = useState(0);
  const activityTimeoutRef = useRef<number | null>(null);
  const { user } = useAuth();
  const isGuest = !user || user.is_guest;

  const rootRef = useRef<HTMLDivElement>(null);
  const videoColumnRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted || volume === 0;
    }
  }, [volume, isMuted]);

  const handleMuteToggle = () => {
    if (isMuted || volume === 0) {
      setIsMuted(false);
      setVolume(prevVolume > 0 ? prevVolume : 1);
    } else {
      setIsMuted(true);
      setPrevVolume(volume);
      setVolume(0);
    }
  };

  const handleInteraction = () => {
    setIsUserActive(true);
    if (activityTimeoutRef.current) window.clearTimeout(activityTimeoutRef.current);
    activityTimeoutRef.current = window.setTimeout(() => {
      setIsUserActive(false);
    }, 3000);
  };

  useEffect(() => {
    handleInteraction();
    return () => {
      if (activityTimeoutRef.current) window.clearTimeout(activityTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;

    const fetchStream = async () => {
      setIsLoadingStream(true);
      setStreamError(null);
      try {
        const data = await streamService.getStreamMetadata(resolvedStreamId);
        if (isCurrent) setStream(data);
      } catch (err) {
        if (isCurrent) setStreamError(err instanceof Error ? err.message : 'Stream not found.');
      } finally {
        if (isCurrent) setIsLoadingStream(false);
      }
    };

    fetchStream();
    return () => { isCurrent = false; };
  }, [resolvedStreamId]);

  const isMember = Boolean(user && !user.is_guest);
  useEffect(() => {
    if (!stream?.creator.username) return;
    let isCurrent = true;

    creatorService.getProfile(stream.creator.username, isMember)
      .then((profile) => {
        if (!isCurrent) return;
        setCreatorProfile(profile);
        setFollowState({ isFollowing: profile.is_following, liveAlerts: profile.live_alerts ?? true });
      })
      .catch(() => {
        if (isCurrent) setCreatorProfile(null);
      });

    return () => { isCurrent = false; };
  }, [stream?.creator.username, isMember]);

  const seekToLive = () => {
    const video = videoRef.current;
    if (video && video.seekable.length > 0) {
      const liveEdge = video.seekable.end(video.seekable.length - 1);
      video.currentTime = liveEdge - 8; 
      if (!isPlaying) setIsPlaying(true);
      setIsAtLiveEdge(true);
    }
  };

  useEffect(() => {
    const handleRoleChange = (e: any) => setDevRole(e.detail.role);
    const handleModeChange = (e: any) => setStreamMode(e.detail.mode);
    window.addEventListener('dev_role_changed', handleRoleChange);
    window.addEventListener('dev_stream_mode_changed', handleModeChange);
    return () => {
      window.removeEventListener('dev_role_changed', handleRoleChange);
      window.removeEventListener('dev_stream_mode_changed', handleModeChange);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    const isMobile = window.innerWidth < 1024;
    const targetRef = isMobile ? videoColumnRef : rootRef;

    if (!document.fullscreenElement) {
      await targetRef.current?.requestFullscreen().catch(() => {});
    } else {
      await document.exitFullscreen().catch(() => {});
    }
  };

  // 🛠️ Picture-in-Picture Logic
  const handleTogglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled && videoRef.current) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error("PiP failed to initialize", err);
    }
  };

  // 🛠️ In-Video Overlay Ad State
  const [overlayAd, setOverlayAd] = useState<{
    brandName: string;
    message: string;
    linkUrl: string;
  } | null>(null);

  // Report dialog UI state. Submission is intentionally not wired to an API here.
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  // Listen for Overlay Ad trigger
  useEffect(() => {
    const handleOverlayAdTrigger = (e: any) => {
      setOverlayAd(e.detail);
    };
    window.addEventListener('dev_overlay_ad_triggered', handleOverlayAdTrigger);
    return () => window.removeEventListener('dev_overlay_ad_triggered', handleOverlayAdTrigger);
  }, []);

  useEffect(() => {
    if (!isReportOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsReportOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isReportOpen]);

  useEffect(() => {
    if (!isShareMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setIsShareMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsShareMenuOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isShareMenuOpen]);

  const { balanceCoins, openPurchaseModal } = useWallet();
  const {
    playbackUrl: apiPlaybackUrl, isLoading: apiIsLoading, error: apiError, isPaywall, isLoginRequired,
    confirmPrice, needsConfirm, isUnlocking, hasAccess, unlock, retryEnter, refreshPlaybackUrl,
  } = useStreamEntry(resolvedStreamId);

  const roomId = stream?.room_id;
  const canJoinRoom = !stream?.is_premium || hasAccess;
  const { viewerCount, messages, isGiftPending, sendError, isStreamEnded, isPaused, streamEarnings, sendChat, sendGift, retractMessage, muteUser } = useLiveStreamRoom(roomId, resolvedStreamId, stream?.creator.username, stream?.is_paused ?? false, canJoinRoom);

  const isReconnecting = streamMode !== 'mock' && !isStreamEnded && (isPaused || isStalled);

  // A fresh signed link plus a brand-new player: the streamer's new session restarts the video.
  const restartPlayer = useCallback(async () => {
    await refreshPlaybackUrl();
    setPlayerKey((k) => k + 1);
  }, [refreshPlaybackUrl]);

  // Streamer is back: restart straight away instead of waiting for the next retry.
  const wasPausedRef = useRef(isPaused);
  useEffect(() => {
    if (wasPausedRef.current && !isPaused && !isStreamEnded) void restartPlayer();
    wasPausedRef.current = isPaused;
  }, [isPaused, isStreamEnded, restartPlayer]);

  // Keep retrying while the streamer is away, in case the "resumed" event was
  // missed. A stall on its own (pieces arriving late) never restarts the
  // player: hls.js keeps its buffer and plays on as soon as the next piece
  // arrives, while a rebuilt player would start loading from scratch.
  useEffect(() => {
    if (streamMode === 'mock' || !isPaused || isStreamEnded) return;
    const timer = window.setInterval(() => void restartPlayer(), 10000);
    return () => window.clearInterval(timer);
  }, [streamMode, isPaused, isStreamEnded, restartPlayer]);

  useEffect(() => {
    if (isStreamEnded) setIsStalled(false);
  }, [isStreamEnded]);

  const [isHoveringPlayer, setIsHoveringPlayer] = useState(false);
  const [isOverControls, setIsOverControls] = useState(false);

  if (isLoadingStream) return <div className="min-h-screen bg-[#0e0e10] flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>;
  if (!stream) return <div className="text-white p-10 bg-[#0e0e10] min-h-screen">{streamError || 'Stream not found.'}</div>;

  const creator = stream.creator;
  const isOwnStream = !!user?.username && user.username === creator.username;
  const role: 'viewer' | 'creator' = devRole ?? (isOwnStream ? 'creator' : 'viewer');

  const goToLogin = () => navigate(`/auth?next=${encodeURIComponent(`/live/${resolvedStreamId}`)}`);

  const handleFollowChange = (next: FollowState) => {
    if (next.isFollowing !== followState.isFollowing) {
      setCreatorProfile((p) => p ? { ...p, follower_count: Math.max(0, p.follower_count + (next.isFollowing ? 1 : -1)) } : p);
    }
    setFollowState(next);
  };

  const activePlaybackUrl = streamMode === 'mock' ? "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" : apiPlaybackUrl;
  const activeIsLoading = streamMode === 'mock' ? false : apiIsLoading;
  const activeError = streamMode === 'mock' ? null : apiError;
  const unlockPrice = confirmPrice ?? stream.entry_price_coins;
  const needsCoins = isPaywall || balanceCoins < unlockPrice;

  // 🛠️ Keep UI visible if the settings menu is open
  const showMobileUI = isChatCollapsed || isUserActive || !isPlaying || showProfileOverlay;
  // Desktop bar hides after 3s without mouse movement, unless the mouse rests on the bar itself.
  const showDesktopUI = (isHoveringPlayer && (isUserActive || isOverControls)) || !isPlaying || showProfileOverlay;
  const uiVisibilityClasses = `transition-opacity duration-300 pointer-events-none ${showMobileUI ? 'opacity-100' : 'opacity-0'} ${showDesktopUI ? 'lg:opacity-100' : 'lg:opacity-0'}`;
  const hideCursor = isFullscreen && !showDesktopUI;

  const handleLeaveRoom = () => {
    if (onLeaveRoom) {
      onLeaveRoom();
    } else {
      navigate('/discover');
    }
  };

  const handleCopyStreamLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Stream link copied!');
      setIsShareMenuOpen(false);
    } catch {
      toast.error('Could not copy the link. Please copy the URL from your browser.');
    }
  };

  const handleNativeShare = async () => {
    const shareData = { title: stream.title, text: `Watch ${stream.title} on zQuab`, url: window.location.href };
    if (!navigator.share) {
      await handleCopyStreamLink();
      return;
    }

    try {
      await navigator.share(shareData);
      setIsShareMenuOpen(false);
    } catch (error) {
      // Closing the native share sheet is not an application error.
      if (error instanceof Error && error.name !== 'AbortError') {
        toast.error('Unable to open sharing options.');
      }
    }
  };

  return (
    <div ref={rootRef} className="flex flex-col lg:flex-row h-[100dvh] w-full bg-[#0e0e10] text-gray-100 overflow-hidden font-sans">
      <Toaster position="top-right" />
      
      {/* --- LEFT COLUMN: Video & Meta --- */}
      <div 
        ref={videoColumnRef}
        className={`
          relative bg-black flex flex-col justify-between overflow-hidden group/player shrink-0
          transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
          ${isChatCollapsed ? 'h-full lg:flex-1 w-full' : 'h-[40vh] lg:h-auto lg:flex-1 w-full'}
          ${hideCursor ? 'cursor-none' : ''}
        `}
        onMouseEnter={() => { setIsHoveringPlayer(true); handleInteraction(); }}
        onMouseLeave={() => setIsHoveringPlayer(false)}
        onMouseMove={handleInteraction}
        onTouchStart={handleInteraction}
        onClick={() => {
          const isMobile = window.innerWidth < 1024;
          const areControlsHidden = !isChatCollapsed && !isUserActive && isPlaying && !showProfileOverlay;
          
          handleInteraction();
          
          if (isMobile && areControlsHidden) return; 
          
          setIsPlaying(!isPlaying);
        }}
      >
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <img 
            src="/logo.webp" 
            alt="Brand Watermark" 
            className="absolute top-20 right-4 lg:top-24 lg:right-6 w-8 h-8 lg:w-10 lg:h-10 object-contain opacity-25 drop-shadow-md z-10 pointer-events-none"
          />

          {activeIsLoading ? (
            <div className="flex flex-col items-center gap-4 z-20 pointer-events-auto">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : isStreamEnded ? (
            <div className="flex flex-col items-center gap-3 text-center p-8 z-20 bg-zinc-950/90 backdrop-blur-md border border-white/10 rounded-[2rem] shadow-2xl pointer-events-auto">
              <h3 className="text-xl font-bold text-white">Stream Ended</h3>
              <p className="text-sm text-zinc-400">Thanks for watching.</p>
            </div>
          ) : isLoginRequired ? (
            <div className="flex flex-col items-center max-w-sm text-center p-8 z-20 bg-zinc-950/90 backdrop-blur-md border border-amber-500/20 rounded-[2rem] shadow-2xl pointer-events-auto">
              <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Premium Broadcast</h3>
              <p className="text-sm text-zinc-400 mb-6 leading-relaxed">Log in to unlock this stream.</p>
              <button
                onClick={(e) => { e.stopPropagation(); goToLogin(); }}
                className="w-full py-4 bg-amber-500 text-amber-950 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:bg-amber-400 active:scale-95"
              >
                <LogIn className="w-5 h-5" /> Log in to unlock
              </button>
            </div>
          ) : needsConfirm || isPaywall ? (
            <div className="flex flex-col items-center max-w-sm text-center p-8 z-20 bg-zinc-950/90 backdrop-blur-md border border-amber-500/20 rounded-[2rem] shadow-2xl pointer-events-auto">
              <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Premium stream</h3>
              <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                Unlock for <strong className="text-white">{unlockPrice.toLocaleString()} zCoins</strong>. Your balance: <strong className="text-white">{balanceCoins.toLocaleString()}</strong>
              </p>
              
              {needsCoins ? (
                <button 
                  onClick={(e) => { e.stopPropagation(); openPurchaseModal(); }} 
                  className="w-full py-4 bg-amber-500 text-amber-950 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:bg-amber-400 active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                >
                  <Coins className="w-5 h-5" /> Get zCoins
                </button>
              ) : (
                <button 
                  onClick={(e) => { e.stopPropagation(); unlock(); }} 
                  disabled={isUnlocking}
                  className="w-full py-4 bg-amber-500 text-amber-950 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:bg-amber-400 active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.2)] disabled:opacity-60 disabled:active:scale-100"
                >
                  {isUnlocking
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Unlocking…</>
                    : <>Unlock for {unlockPrice.toLocaleString()} 🪙</>}
                </button>
              )}
            </div>
          ) : activeError || !activePlaybackUrl ? (
            <div className="flex flex-col items-center max-w-sm text-center p-8 z-20 bg-zinc-950/90 backdrop-blur-md border border-red-500/20 rounded-[2rem] shadow-2xl pointer-events-auto">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Stream Unavailable</h3>
              <p className="text-sm text-zinc-400 mb-6 leading-relaxed">{activeError}</p>
              <button 
                onClick={retryEnter} 
                className="w-full py-3.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white font-bold transition-all active:scale-95"
              >
                Retry Connection
              </button>
            </div>
          ) : (
            <NativeStreamPlayer 
              key={playerKey}
              streamUrl={activePlaybackUrl} 
              isPlaying={isPlaying} 
              isMuted={isMuted || volume === 0} 
              videoRef={videoRef}               
              onLiveEdgeChange={setIsAtLiveEdge} 
              onStalledChange={setIsStalled}
              // Passing settings down (NativeStreamPlayer needs to handle these eventually)
              quality={streamQuality}
              isLowLatency={isLowLatency}
            />
          )}
          {!activePlaybackUrl && (
            <img src={creator.avatar_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-2xl pointer-events-none" />
          )}

          {isReconnecting && activePlaybackUrl && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-sm text-center px-6 pointer-events-none">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-base lg:text-lg font-bold text-white">{creator.name} is reconnecting…</p>
              <p className="text-xs lg:text-sm text-zinc-400">Hang tight, the video will continue by itself. Chat is still on.</p>
            </div>
          )}

          <AnimatePresence>
            {overlayAd && (
              <StreamOverlayAd
                brandName={overlayAd.brandName}
                message={overlayAd.message}
                linkUrl={overlayAd.linkUrl}
                duration={5}
                onComplete={() => setOverlayAd(null)}
              />
            )}
          </AnimatePresence>
        </div>

        <div className={`relative z-30 p-3 lg:p-4 flex justify-between items-start ${uiVisibilityClasses}`}>
          <button onClick={handleLeaveRoom} className="pointer-events-auto p-2 rounded-md bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-colors border border-white/10">
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 pointer-events-auto">
            {role === 'viewer' && !isGuest && (
              <button onClick={openPurchaseModal} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm border border-blue-500/30 transition-colors shadow-lg">
                <span className="text-blue-400 text-sm">🪙</span>
                <span className="text-sm font-bold">{balanceCoins.toLocaleString()}</span>
              </button>
            )}
            {role === 'creator' && (
              <div title="Earned this stream" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-black/60 text-white backdrop-blur-sm border border-amber-500/30 shadow-lg">
                <span className="text-amber-400 text-sm">🪙</span>
                <span className="text-xs text-zinc-300">Earned</span>
                <span className="text-sm font-bold">{(streamEarnings ?? 0).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        <div className={`absolute inset-x-0 bottom-0 z-40 flex flex-col justify-end pointer-events-none overflow-hidden h-full ${showProfileOverlay ? 'opacity-100' : 'opacity-0 delay-200'}`}>
          <div 
            className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-500 pointer-events-auto ${showProfileOverlay ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
            onClick={(e) => { e.stopPropagation(); setShowProfileOverlay(false); }}
          />
          
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`relative bg-zinc-950/95 backdrop-blur-xl border-t border-white/10 p-5 lg:p-8 rounded-t-3xl pointer-events-auto transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col gap-4 ${showProfileOverlay ? 'translate-y-0' : 'translate-y-full'}`}
          >
            <button onClick={() => setShowProfileOverlay(false)} className="absolute top-4 right-4 lg:top-6 lg:right-6 p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-zinc-400 hover:text-white transition-colors">
              <X className="w-4 h-4 lg:w-5 lg:h-5" />
            </button>
            
            <div className="flex items-start gap-4 lg:gap-6">
              <img src={creator.avatar_url} alt={creator.name} className="w-16 h-16 lg:w-24 lg:h-24 rounded-full border-2 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)] object-cover" />
              <div className="flex-1 mt-1">
                <h2 className="text-xl lg:text-3xl font-bold text-white flex items-center gap-2">
                  {creator.name} {creatorProfile?.verified && <BadgeCheck className="w-5 h-5 lg:w-7 lg:h-7 text-blue-400" />}
                </h2>
                <p className="text-xs lg:text-sm text-indigo-400 font-medium mt-0.5 tracking-wide uppercase">{stream.category} Creator</p>
                
                <div className="flex items-center gap-4 lg:gap-6 mt-3 lg:mt-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] lg:text-xs text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Followers</span>
                    <div className="flex items-center gap-1.5 text-sm lg:text-base font-semibold text-zinc-200">
                      <Users className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-zinc-400" /> {(creatorProfile?.follower_count || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="w-px h-8 bg-white/10"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] lg:text-xs text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Streams</span>
                    <div className="flex items-center gap-1.5 text-sm lg:text-base font-semibold text-zinc-200">
                      <Activity className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-emerald-400" /> 42
                    </div>
                  </div>
                </div>
              </div>
              
              {role === 'viewer' && (
                <div className="mt-2 mr-10 lg:mr-12">
                  <FollowButton
                    username={creator.username}
                    creatorName={creator.name}
                    state={followState}
                    onChange={handleFollowChange}
                    isGuest={isGuest}
                    onLoginClick={goToLogin}
                    size="md"
                  />
                </div>
              )}
            </div>
            <p className="text-zinc-400 text-xs lg:text-sm leading-relaxed mt-2 max-w-2xl">
              Professional {stream.category} player. Streaming daily ranked grinds, viewer tournaments, and random challenges. Drop a follow to squad up next game!
            </p>
          </div>
        </div>

        <div 
          onClick={(e) => e.stopPropagation()} 
          onMouseEnter={() => setIsOverControls(true)}
          onMouseLeave={() => setIsOverControls(false)}
          className={`relative z-30 w-full pt-20 pb-3 px-4 lg:pt-32 lg:pb-4 lg:px-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent ${uiVisibilityClasses}`}
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-3 lg:mb-4 pointer-events-auto">
            <div className="flex items-center gap-3">
              <div 
                className="relative shrink-0 hidden lg:block cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setShowProfileOverlay(true)}
              >
                <img src={creator.avatar_url} alt={creator.name} className="w-14 h-14 rounded-full object-cover border border-gray-600 shadow-md" />
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm">Live</div>
              </div>
              <div className="flex flex-col drop-shadow-md">
                <h1 className="text-base lg:text-xl font-bold text-white leading-tight mb-0.5 line-clamp-1">{stream.title}</h1>
                <div className="flex items-center gap-1.5 text-xs lg:text-sm text-gray-200 font-medium">
                  <span 
                    className="hover:underline cursor-pointer flex items-center gap-1"
                    onClick={() => setShowProfileOverlay(true)}
                  >
                    {creator.name} {creatorProfile?.verified && <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="hover:text-white cursor-pointer">{stream.category}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {role === 'viewer' && (
                <FollowButton
                  username={creator.username}
                  creatorName={creator.name}
                  state={followState}
                  onChange={handleFollowChange}
                  isGuest={isGuest}
                  onLoginClick={goToLogin}
                />
              )}

              {(role === 'viewer' || role === 'creator') && (
                <div ref={shareMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsShareMenuOpen((open) => !open);
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] text-white shadow-[inset_1px_1px_2px_rgba(255,255,255,0.06),0_4px_12px_rgba(0,0,0,0.22)] backdrop-blur-md transition-colors duration-200 hover:border-indigo-400/30 hover:bg-indigo-400/15 hover:text-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70"
                    title="Share stream"
                    aria-label="Share stream"
                    aria-expanded={isShareMenuOpen}
                    aria-haspopup="menu"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>

                  {isShareMenuOpen && (
                    <div
                      role="menu"
                      aria-label="Share stream options"
                      className="absolute bottom-full right-0 z-[100] mb-2 w-56 origin-bottom-right rounded-2xl border border-white/10 bg-[#19191d]/95 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.55),inset_1px_1px_2px_rgba(255,255,255,0.05)] backdrop-blur-2xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-3 pb-2 pt-1">
                        <p className="text-xs font-bold text-white">Share this stream</p>
                        <p className="mt-0.5 text-[11px] text-zinc-500">Invite others to watch live</p>
                      </div>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleCopyStreamLink}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-400/15 bg-indigo-400/10 text-indigo-300">
                          <Copy className="h-4 w-4" />
                        </span>
                        <span>Copy link</span>
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleNativeShare}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-400/15 bg-emerald-400/10 text-emerald-300">
                          <Share2 className="h-4 w-4" />
                        </span>
                        <span>Share with others</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {role === 'creator' && (
                <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-zinc-950/75 p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.28)] backdrop-blur-xl">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/creator/dashboard');
                    }}
                    className="group inline-flex min-h-9 items-center gap-2 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.08] px-3 py-1.5 text-xs font-semibold text-zinc-100 transition-colors duration-200 hover:border-emerald-400/30 hover:bg-emerald-400/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                    title="Open creator dashboard"
                    aria-label="Open creator dashboard"
                  >
                    <Activity className="h-4 w-4 text-emerald-400 transition-transform duration-200 group-hover:scale-110" />
                    <span>Dashboard</span>
                  </button>
                  <button
                    type="button"
                    className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-200 hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                    title="End stream"
                    aria-label="End stream"
                  >
                    <StopCircle className="h-4 w-4" />
                    <span>End</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 lg:pt-3 border-t border-white/20 pointer-events-auto">
            <div className="flex items-center gap-2 lg:gap-3">
              <button onClick={() => setIsPlaying(!isPlaying)} className="p-1 hover:bg-white/20 rounded transition-colors text-white">
                {isPlaying ? <Pause className="w-4 h-4 lg:w-5 lg:h-5 fill-current" /> : <Play className="w-4 h-4 lg:w-5 lg:h-5 fill-current" />}
              </button>
              
              <div className="flex items-center group relative h-full">
                <button 
                  onClick={handleMuteToggle} 
                  className="p-1 hover:bg-white/20 rounded transition-colors text-white z-10"
                >
                  {isMuted || volume === 0 
                    ? <VolumeX className="w-4 h-4 lg:w-5 lg:h-5" /> 
                    : volume < 0.5 
                      ? <Volume1 className="w-4 h-4 lg:w-5 lg:h-5" /> 
                      : <Volume2 className="w-4 h-4 lg:w-5 lg:h-5" />
                  }
                </button>
                
                <div className="hidden lg:flex items-center w-0 overflow-hidden group-hover:w-24 opacity-0 group-hover:opacity-100 transition-all duration-300 origin-left ml-1">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const newVol = parseFloat(e.target.value);
                      setVolume(newVol);
                      if (newVol > 0 && isMuted) setIsMuted(false);
                      if (newVol === 0 && !isMuted) setIsMuted(true);
                    }}
                    className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer accent-white"
                  />
                </div>
              </div>
              
              <button
                type="button"
                onClick={!isAtLiveEdge ? seekToLive : undefined}
                disabled={isAtLiveEdge}
                className={`ml-1 lg:ml-2 inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1
                  outline-none transition-colors duration-200
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black
                  ${
                    isAtLiveEdge
                      ? 'cursor-default'
                      : 'cursor-pointer bg-white/10 hover:bg-white/20 active:bg-white/15'
                  }`}
                title={isAtLiveEdge ? "At live edge" : "Click to catch up to live"}
                aria-label={isAtLiveEdge ? "At live edge" : "Go to live"}
              >
                {isAtLiveEdge ? (
                  <>
                    <span className="text-[10px] lg:text-xs font-bold text-white uppercase tracking-wider drop-shadow-md">
                      Live
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.8)]"></span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] lg:text-xs font-bold text-zinc-300 whitespace-nowrap">
                      Go Live
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                  </>
                )}
              </button>

              <span className="flex items-center gap-1 text-[10px] lg:text-xs font-semibold text-gray-200 ml-1 lg:ml-2">
                <Eye className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> {viewerCount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1 lg:gap-2 h-full">
              
              {(isChatCollapsed || isFullscreen) && (
                <button 
                  onClick={async (e) => { 
                    e.stopPropagation(); 
                    if (isFullscreen && document.fullscreenElement) {
                      await document.exitFullscreen().catch(() => {});
                    }
                    setIsChatCollapsed(false); 
                  }} 
                  className={`p-1 hover:bg-white/20 rounded transition-colors text-white relative group ${!isChatCollapsed ? 'lg:hidden' : ''}`}
                  title={isFullscreen ? "Exit Fullscreen & Open Chat" : "Expand Chat"}
                >
                  <MessageSquare className="w-4 h-4 lg:w-5 lg:h-5" />
                </button>
              )}

              {/* Focused timeline actions: report and picture-in-picture only */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setReportReason('');
                  setReportDetails('');
                  setIsReportOpen(true);
                }}
                className="p-1.5 rounded-md text-white/85 hover:text-white hover:bg-white/15 transition-colors"
                title="Report stream"
                aria-label="Report stream"
              >
                <Flag className="w-4 h-4 lg:w-5 lg:h-5" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleTogglePiP();
                }}
                className="p-1.5 rounded-md text-white/85 hover:text-white hover:bg-white/15 transition-colors"
                title="Picture-in-Picture"
                aria-label="Picture-in-Picture"
              >
                <PictureInPicture2 className="w-4 h-4 lg:w-5 lg:h-5" />
              </button>

              <button onClick={toggleFullscreen} className="p-1 hover:bg-white/20 rounded transition-colors text-white">
                {isFullscreen ? <Minimize className="w-4 h-4 lg:w-5 lg:h-5" /> : <Maximize className="w-4 h-4 lg:w-5 lg:h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Responsive report dialog */}
        {isReportOpen && (
          <div
            className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/75 p-0 backdrop-blur-md sm:items-center sm:p-5"
            role="presentation"
            onClick={() => setIsReportOpen(false)}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="report-stream-title"
              aria-describedby="report-stream-description"
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[calc(100dvh-12px)] w-full flex-col overflow-hidden rounded-t-[1.6rem] border border-white/10 bg-[#171719] shadow-[0_24px_80px_rgba(0,0,0,0.6),inset_1px_1px_2px_rgba(255,255,255,0.05)] sm:max-h-[88dvh] sm:max-w-lg sm:rounded-[1.6rem]"
            >
              {/* Mobile grabber + fixed header */}
              <div className="shrink-0 px-5 pb-4 pt-3 sm:px-6 sm:pt-6">
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/10 text-red-400 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.25)]">
                      <Flag className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <h2 id="report-stream-title" className="text-base font-bold text-white sm:text-xl">
                        Report this stream
                      </h2>
                      <p id="report-stream-description" className="mt-1 text-xs leading-relaxed text-zinc-400 sm:text-sm">
                        Tell us what’s wrong so our team can review it.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsReportOpen(false)}
                    className="shrink-0 rounded-full p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
                    aria-label="Close report dialog"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <form
                className="flex min-h-0 flex-1 flex-col"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!reportReason) return;
                  setIsReportOpen(false);
                  window.alert('The report form is ready, but report submission is not connected to the backend yet.');
                }}
              >
                {/* Scrollable form content */}
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 sm:px-6">
                  <fieldset>
                    <legend className="mb-3 text-sm font-semibold text-zinc-200">
                      Select a reason
                    </legend>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {[
                        'Harassment or bullying',
                        'Hate speech',
                        'Sexual or nudity content',
                        'Violence or dangerous acts',
                        'Spam, scam or misleading content',
                        'Copyright infringement',
                        'Underage user safety',
                        'Something else',
                      ].map((reason) => (
                        <label
                          key={reason}
                          className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-[13px] transition-colors sm:text-sm ${
                            reportReason === reason
                              ? 'border-indigo-400/60 bg-indigo-500/10 text-white'
                              : 'border-white/10 bg-black/20 text-zinc-300 hover:border-white/20 hover:bg-white/[0.04]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="report-reason"
                            value={reason}
                            checked={reportReason === reason}
                            onChange={() => setReportReason(reason)}
                            className="h-4 w-4 shrink-0 accent-indigo-500"
                          />
                          <span>{reason}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div className="mt-4">
                    <label htmlFor="report-details" className="mb-2 block text-sm font-semibold text-zinc-200">
                      More details <span className="font-normal text-zinc-500">(optional)</span>
                    </label>
                    <textarea
                      id="report-details"
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value.slice(0, 500))}
                      placeholder="Add context to help us review…"
                      rows={3}
                      className="w-full resize-y rounded-xl border border-white/10 bg-black/25 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/15"
                    />
                    <p className="mt-1 text-right text-[11px] text-zinc-500">{reportDetails.length}/500</p>
                  </div>
                </div>

                {/* Fixed action area stays visible on short screens */}
                <div className="shrink-0 border-t border-white/[0.07] bg-[#171719] px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pb-6">
                  <p className="mb-3 text-[11px] leading-relaxed text-zinc-500">
                    Reports are reviewed by our team. Please only submit accurate information.
                  </p>
                  <div className="flex flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => setIsReportOpen(false)}
                      className="min-h-11 flex-1 rounded-xl border border-white/10 px-4 text-sm font-semibold text-zinc-300 transition hover:bg-white/5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!reportReason}
                      className="min-h-11 flex-[1.35] rounded-xl bg-red-600 px-4 text-sm font-bold text-white shadow-[0_5px_16px_rgba(220,38,38,0.2)] transition hover:bg-red-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Submit report
                    </button>
                  </div>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>

      {/* --- RIGHT COLUMN: Chat Sidebar --- */}
      <div 
        className={`
          flex flex-col bg-[#09090b] shrink-0 z-40 relative
          transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
          ${isChatCollapsed 
            ? 'h-0 w-full lg:h-full lg:w-0 opacity-0 overflow-hidden border-none' 
            : 'flex-1 lg:flex-none lg:h-full lg:w-[350px] opacity-100 border-t lg:border-t-0 lg:border-l border-white/5'
          }
        `}
      >
        <div className="absolute inset-0 w-full h-full min-w-[320px] flex flex-col">
          {/* Always-visible creator bar (YouTube-style), right under the video on mobile */}
          <div className="shrink-0 flex items-center gap-3 px-4 py-2.5 border-b border-white/5 bg-[#09090b]">
            <img
              src={creator.avatar_url || '/logo.webp'}
              alt={creator.name}
              onClick={() => setShowProfileOverlay(true)}
              className="w-9 h-9 rounded-full object-cover border border-white/10 cursor-pointer"
            />
            <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setShowProfileOverlay(true)}>
              <p className="text-sm font-bold text-white truncate flex items-center gap-1">
                {creator.name} {creatorProfile?.verified && <BadgeCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
              </p>
              <p className="text-[11px] text-zinc-500">{(creatorProfile?.follower_count || 0).toLocaleString()} followers</p>
            </div>
            {role === 'viewer' && (
              <FollowButton
                username={creator.username}
                creatorName={creator.name}
                state={followState}
                onChange={handleFollowChange}
                isGuest={isGuest}
                onLoginClick={goToLogin}
              />
            )}
          </div>

          <div className="flex-1 min-h-0">
          <StreamChatSidebar 
            role={role}
            balanceCoins={balanceCoins}
            viewerCount={viewerCount}
            messages={messages}
            onSendChat={sendChat}
            onSendGift={sendGift}
            onRetractMessage={retractMessage}
            onMuteUser={muteUser}
            isGiftPending={isGiftPending}
            sendError={sendError}
            isStreamEnded={isStreamEnded}
            onOpenPurchase={openPurchaseModal}
            onToggleCollapse={() => setIsChatCollapsed(true)} 
            isGuest={isGuest}
            onLoginClick={goToLogin}
          />
          </div>
        </div>
      </div>

    </div>
  );
};