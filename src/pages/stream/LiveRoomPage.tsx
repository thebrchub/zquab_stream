import React, { useState, useEffect, useRef } from 'react';
import { MOCK_STREAMS, MOCK_CREATORS, type Stream, type Creator } from '../../constants/streamMockData';
import { StreamChatSidebar } from '../../components/stream/StreamChatSidebar'; 
import { useStreamEntry } from '../../hooks/useStreamEntry';
import { useLiveStreamRoom } from '../../hooks/useLiveStreamRoom';
import { useWallet } from '../../context/WalletContext';
import { NativeStreamPlayer } from '../../components/stream/NativeStreamPlayer';
import { 
  Loader2, AlertCircle, ArrowLeft, 
  Users, Heart, Share2,  Activity, StopCircle, BadgeCheck,
  Play, Pause, Volume2, VolumeX, Settings, Maximize, Minimize, MessageSquare
} from 'lucide-react';

interface LiveRoomPageProps {
  streamId?: string;
  onLeaveRoom?: () => void;
}

export const LiveRoomPage: React.FC<LiveRoomPageProps> = ({
  streamId = 'stream-1',
  onLeaveRoom,
}) => {
  const [role, setRole] = useState<'viewer' | 'creator'>(
    (sessionStorage.getItem('dev_stream_role') as 'viewer' | 'creator') || 'viewer'
  );
  const [streamMode, setStreamMode] = useState<'api' | 'mock'>(
    (sessionStorage.getItem('dev_stream_mode') as 'api' | 'mock') || 'api'
  );

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  
  // 🚀 New Refs & State for Live Edge Sync
  const [isAtLiveEdge, setIsAtLiveEdge] = useState(true);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 🚀 Jump to Live Function
  const seekToLive = () => {
    const video = videoRef.current;
    if (video && video.seekable.length > 0) {
      const liveEdge = video.seekable.end(video.seekable.length - 1);
      video.currentTime = liveEdge - 8; // Safely buffer 8 seconds from absolute edge
      if (!isPlaying) setIsPlaying(true);
      setIsAtLiveEdge(true);
    }
  };

  useEffect(() => {
    const handleRoleChange = (e: any) => setRole(e.detail.role);
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
    if (!document.fullscreenElement) {
      await playerContainerRef.current?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const { balanceCoins, openPurchaseModal } = useWallet();
  const { playbackUrl: apiPlaybackUrl, isLoading: apiIsLoading, error: apiError, isPaywall: _isPaywall, retryEnter } = useStreamEntry(streamId);

  const stream = MOCK_STREAMS.find((s) => s.id === streamId) as Stream;
  const creator = MOCK_CREATORS.find((c) => c.id === stream.creatorId) as Creator;
  const roomId = (stream as any)?.roomId || stream?.id || 'mock-room-id';
  const { viewerCount, sendGift } = useLiveStreamRoom(roomId);

  const [isFollowing, setIsFollowing] = useState(false);
  const [isHoveringPlayer, setIsHoveringPlayer] = useState(false);

  if (!stream || !creator) return <div className="text-white p-10 bg-[#0e0e10] min-h-screen">Stream not found.</div>;

  const activePlaybackUrl = streamMode === 'mock' ? "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" : apiPlaybackUrl;
  const activeIsLoading = streamMode === 'mock' ? false : apiIsLoading;
  const activeError = streamMode === 'mock' ? null : apiError;

  return (
    <div className="flex flex-col lg:flex-row h-[100dvh] w-full bg-[#0e0e10] text-gray-100 overflow-hidden font-sans">
      
      {/* --- LEFT COLUMN: Video & Meta --- */}
      <div 
        ref={playerContainerRef}
        className={`
          relative bg-black flex flex-col justify-between overflow-hidden group shrink-0
          transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
          ${isFullscreen ? 'w-full h-full' : ''}
          ${!isFullscreen ? 'lg:flex-1' : ''}
          ${!isFullscreen && isChatCollapsed ? 'h-full' : ''}
          ${!isFullscreen && !isChatCollapsed ? 'h-[40vh] lg:h-auto' : ''}
        `}
        onMouseEnter={() => setIsHoveringPlayer(true)}
        onMouseLeave={() => setIsHoveringPlayer(false)}
        onClick={() => setIsPlaying(!isPlaying)}
      >
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <img 
            src="/logo.svg" 
            alt="Brand Watermark" 
            className="absolute top-20 right-4 lg:top-24 lg:right-6 w-8 h-8 lg:w-10 lg:h-10 object-contain opacity-25 drop-shadow-md z-10 pointer-events-none"
          />

          {activeIsLoading ? (
            <div className="flex flex-col items-center gap-4 z-20 pointer-events-auto">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : activeError || !activePlaybackUrl ? (
            <div className="flex flex-col items-center max-w-sm text-center p-6 z-20 bg-gray-900 border border-gray-800 rounded-lg shadow-xl pointer-events-auto">
              <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
              <h3 className="text-base font-bold text-white mb-1">Stream Offline</h3>
              <p className="text-sm text-gray-400 mb-5">{activeError}</p>
              <button onClick={retryEnter} className="w-full py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md text-sm font-semibold transition-colors">Retry</button>
            </div>
          ) : (
            <NativeStreamPlayer 
              streamUrl={activePlaybackUrl} 
              isPlaying={isPlaying} 
              isMuted={isMuted} 
              videoRef={videoRef}               // 🚀 Pass Ref
              onLiveEdgeChange={setIsAtLiveEdge} // 🚀 Pass State Updater
            />
          )}
          {!activePlaybackUrl && (
            <img src={stream.thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-2xl pointer-events-none" />
          )}
        </div>

        <div className={`relative z-30 p-3 lg:p-4 flex justify-between items-start transition-opacity duration-300 pointer-events-none ${isHoveringPlayer || !isPlaying ? 'opacity-100' : 'opacity-0 lg:opacity-0 opacity-100'}`}>
          <button onClick={onLeaveRoom} className="pointer-events-auto p-2 rounded-md bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-colors border border-white/10">
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 pointer-events-auto">
            {role === 'viewer' && (
              <button onClick={openPurchaseModal} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm border border-blue-500/30 transition-colors shadow-lg">
                <span className="text-blue-400 text-sm">🪙</span>
                <span className="text-sm font-bold">{balanceCoins.toLocaleString()}</span>
              </button>
            )}
            
            {isChatCollapsed && !isFullscreen && (
              <button 
                onClick={(e) => { e.stopPropagation(); setIsChatCollapsed(false); }} 
                className="flex items-center justify-center w-9 h-9 rounded-md bg-black/60 hover:bg-blue-600 text-white backdrop-blur-sm border border-white/10 transition-colors shadow-lg group/btn"
                title="Expand Chat"
              >
                <MessageSquare className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
              </button>
            )}
          </div>
        </div>

        <div 
          onClick={(e) => e.stopPropagation()} 
          className={`relative z-30 w-full pt-20 pb-3 px-4 lg:pt-32 lg:pb-4 lg:px-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 pointer-events-none ${isHoveringPlayer || !isPlaying ? 'opacity-100' : 'opacity-0 lg:opacity-0 opacity-100'}`}
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-3 lg:mb-4 pointer-events-auto">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0 hidden lg:block">
                <img src={creator.avatar} alt={creator.name} className="w-14 h-14 rounded-full object-cover border border-gray-600 shadow-md" />
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm">Live</div>
              </div>
              <div className="flex flex-col drop-shadow-md">
                <h1 className="text-base lg:text-xl font-bold text-white leading-tight mb-0.5 line-clamp-1">{stream.title}</h1>
                <div className="flex items-center gap-1.5 text-xs lg:text-sm text-gray-200 font-medium">
                  <span className="hover:underline cursor-pointer flex items-center gap-1">
                    {creator.name} {creator.verified && <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="hover:text-white cursor-pointer">{stream.category}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {role === 'viewer' ? (
                <>
                  <button onClick={() => setIsFollowing(!isFollowing)} className={`flex items-center gap-1 px-3 py-1.5 lg:px-4 lg:py-2 rounded-md text-xs lg:text-sm font-bold transition-all backdrop-blur-md ${isFollowing ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-blue-600 text-white hover:bg-blue-500'}`}>
                    <Heart className={`w-3.5 h-3.5 lg:w-4 lg:h-4 ${isFollowing ? 'fill-current text-blue-400' : ''}`} />
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button className="hidden lg:block p-2 rounded-md bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"><Share2 className="w-4 h-4" /></button>
                </>
              ) : (
                <div className="flex items-center gap-2 backdrop-blur-md bg-black/40 p-1 lg:p-1.5 rounded-lg border border-white/10">
                  <button className="flex items-center gap-1.5 px-2 py-1 lg:px-3 lg:py-1.5 rounded-md hover:bg-white/10 text-xs lg:text-sm font-semibold text-gray-200 transition-colors"><Activity className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-emerald-400" /> Dashboard</button>
                  <button className="flex items-center gap-1.5 px-2 py-1 lg:px-3 lg:py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-xs lg:text-sm font-semibold text-white transition-colors"><StopCircle className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> End</button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 lg:pt-3 border-t border-white/20 pointer-events-auto">
            <div className="flex items-center gap-2 lg:gap-3">
              <button onClick={() => setIsPlaying(!isPlaying)} className="p-1 hover:bg-white/20 rounded transition-colors text-white">
                {isPlaying ? <Pause className="w-4 h-4 lg:w-5 lg:h-5 fill-current" /> : <Play className="w-4 h-4 lg:w-5 lg:h-5 fill-current" />}
              </button>
              <button onClick={() => setIsMuted(!isMuted)} className="p-1 hover:bg-white/20 rounded transition-colors text-white">
                {isMuted ? <VolumeX className="w-4 h-4 lg:w-5 lg:h-5" /> : <Volume2 className="w-4 h-4 lg:w-5 lg:h-5" />}
              </button>
              
              {/* 🚀 Restored LIVE Button Logic */}
              {/* 🚀 Dynamic LIVE / Go Live Catch-Up Button */}
              <button 
                onClick={!isAtLiveEdge ? seekToLive : undefined}
                className={`flex items-center gap-1.5 ml-1 lg:ml-2 transition-all duration-300 ${
                  isAtLiveEdge 
                    ? 'cursor-default' 
                    : 'cursor-pointer px-2 py-1 bg-white/10 hover:bg-white/20 rounded-md border border-white/10 backdrop-blur-sm shadow-sm'
                }`}
                title={isAtLiveEdge ? "At live edge" : "Click to catch up to live"}
              >
                {isAtLiveEdge ? (
                  <>
                    {/* Active state: No container, just text and pulsing red dot */}
                    <span className="text-[10px] lg:text-xs font-bold text-white uppercase tracking-wider drop-shadow-md">
                      Live
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.8)]"></span>
                  </>
                ) : (
                  <>
                    {/* Catch-up state: Grayed out inside a premium frosted container */}
                    <span className="text-[10px] lg:text-xs font-bold text-zinc-300 whitespace-nowrap">
                      Go Live
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                  </>
                )}
              </button>

              <span className="flex items-center gap-1 text-[10px] lg:text-xs font-semibold text-gray-200 ml-1 lg:ml-2">
                <Users className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> {viewerCount > 0 ? viewerCount.toLocaleString() : '1,204'}
              </span>
            </div>
            <div className="flex items-center gap-1 lg:gap-2">
              <button className="p-1 hover:bg-white/20 rounded transition-colors text-white"><Settings className="w-4 h-4 lg:w-5 lg:h-5" /></button>
              <button onClick={toggleFullscreen} className="p-1 hover:bg-white/20 rounded transition-colors text-white">
                {isFullscreen ? <Minimize className="w-4 h-4 lg:w-5 lg:h-5" /> : <Maximize className="w-4 h-4 lg:w-5 lg:h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- RIGHT COLUMN: Chat Sidebar --- */}
      <div 
        className={`
          flex flex-col bg-[#09090b] shrink-0 z-40 relative
          transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
          ${isFullscreen ? 'hidden' : 'flex'}
          ${isChatCollapsed 
            ? 'h-0 w-full lg:h-full lg:w-0 opacity-0 overflow-hidden border-none' 
            : 'flex-1 lg:flex-none lg:h-full lg:w-[350px] opacity-100 border-t lg:border-t-0 lg:border-l border-white/5'
          }
        `}
      >
        <div className="absolute inset-0 w-full h-full min-w-[320px]">
          <StreamChatSidebar 
            role={role}
            balanceCoins={balanceCoins}
            viewerCount={viewerCount}
            onSpendCoins={(_amount, giftId, message) => { if (giftId) sendGift(giftId, message); }}
            onOpenPurchase={openPurchaseModal}
            onToggleCollapse={() => setIsChatCollapsed(true)} 
          />
        </div>
      </div>

    </div>
  );
};