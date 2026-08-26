import React, { useState, useRef, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Settings, 
  Maximize, 
  Minimize, 
  Play, 
  Pause, 
  MessageSquare, 
  X 
} from 'lucide-react';
import Hls from 'hls.js';
import { type Stream, type Creator } from '../../constants/streamMockData';
import { LiveChat } from './LiveChat';

interface NativeStreamPlayerProps {
  streamUrl: string;
  stream: Stream;
  creator: Creator;
  userCoins: number;
  onSpendCoins: (amount: number) => void;
  onOpenCoinPurchase?: () => void;
}

export const NativeStreamPlayer: React.FC<NativeStreamPlayerProps> = ({
  streamUrl,
  stream,
  creator,
  userCoins,
  onSpendCoins,
  onOpenCoinPurchase,
}) => {
  const [isHoveringVideo, setIsHoveringVideo] = useState(false);
  
  // Custom Player States
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true); // MUST START TRUE FOR AUTOPLAY
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenChat, setShowFullscreenChat] = useState(true);

  const [isBuffering, setIsBuffering] = useState(true);
  const [isAtLiveEdge, setIsAtLiveEdge] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls;

    if (Hls.isSupported()) {
      // hls = new Hls({
      //   enableWorker: true,
      //   // 🚀 LL-HLS AGGRESSIVE TUNING
      //   lowLatencyMode: true,
      //   liveSyncDurationCount: 3, // Target 3 part-segments from the live edge
      //   maxLiveSyncPlaybackRate: 1.2, // Play at 1.2x speed to catch up if it falls behind
      //   maxBufferLength: 8, // Stop buffering 30 seconds of video (keeps memory low)
      //   maxMaxBufferLength: 15,
      // });

      hls = new Hls({
        enableWorker: true,
        
        // 🚀 STANDARD HLS TUNING FOR MASSIVE SCALE & CDNS
        lowLatencyMode: false, // MUST BE FALSE: We are using standard 4s CDN chunks now
        
        // 📥 BACKGROUND DOWNLOADING (The Buffer Magic)
        maxBufferLength: 30, // Forces the player to download up to 30 seconds of video in the background
        maxMaxBufferLength: 60, // Maximum memory allowance (matches your 60-second MediaMTX playlist)
        
        // 📺 LIVE SYNC & STABILITY
        liveSyncDurationCount: 3, // Wait until 3 chunks (12s) are downloaded before starting, ensuring zero stutter
        // liveMaxLatencyDurationCount: 10, // If a viewer's bad internet drops them 40s behind, jump forward
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      
      // hls.on(Hls.Events.MANIFEST_PARSED, () => {
      //   // Autoplay directly on load
      //   video.play().catch((e) => console.log("Autoplay prevented:", e));
      // });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("Playlist loaded. Building initial buffer...");
      });

      let chunksDownloaded = 0;
      let hasStartedPlaying = false;

      // 📥 Listen to every time a new chunk finishes downloading
      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        chunksDownloaded++; // Add 1 to our chunk counter
        
        // 🚀 START PLAYING ONLY AFTER 2 CHUNKS (8 SECONDS) ARE IN THE BANK
        if (chunksDownloaded >= 2 && !hasStartedPlaying) {
          console.log("Buffer healthy! Starting playback.");
          hasStartedPlaying = true; // Lock it so the pause button works later
          video.play().catch((e) => console.log("Autoplay prevented:", e));
        }
      });


      // 🎧 Fix for demuxed audio tracks
      // Now Backend uses mpegts hence this code is not needed.
      // hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) => {
      //   if (data.audioTracks && data.audioTracks.length > 0) {
      //     // Force select the first available audio track ID
      //     hls.audioTrack = data.audioTracks[0].id; 
      //   }
      // });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn("HLS Network Error, recovering...");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn("HLS Media Error, recovering...");
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch((e) => console.log("Autoplay prevented:", e));
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  // 🛑 CRITICAL FIX: Removed `isPlaying` from this dependency array.
  // HLS will now ONLY initialize once when the streamUrl loads, preventing latency build-up from UI toggles.
  }, [streamUrl]);

  const seekToLive = () => {
    const video = videoRef.current;
    if (video && video.seekable && video.seekable.length > 0) {
      // Find the absolute newest second of video available
      const liveEdge = video.seekable.end(video.seekable.length - 1);
      
      // Jump to exactly 8 seconds behind the newest frame to maintain our smooth buffer
      video.currentTime = liveEdge - 8;
      
      if (video.paused) {
        video.play().catch(e => console.error("Play failed:", e));
      }
      setIsAtLiveEdge(true);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = async () => {
    if (!playerContainerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await playerContainerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  };

  return (
    <div 
      ref={playerContainerRef}
      className="flex-1 flex flex-col relative bg-black overflow-hidden group/player w-full h-full"
      onMouseEnter={() => setIsHoveringVideo(true)}
      onMouseLeave={() => setIsHoveringVideo(false)}
    >
      <div 
        className="relative flex-1 w-full flex items-center justify-center overflow-hidden bg-[#050505] cursor-pointer"
        onClick={togglePlay}
      >
        <img 
          src={stream.thumbnailUrl} 
          alt="Stream Thumbnail" 
          className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm pointer-events-none"
        />

        <video
          ref={videoRef}
          className="absolute w-full h-full object-contain z-10"
          playsInline
          muted={isMuted}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}

          //  THE NATIVE SPINNER TRIGGERS
          onWaiting={() => setIsBuffering(true)}   // Spinner ON when downloading/stuttering
          onPlaying={() => setIsBuffering(false)}  // Spinner OFF the exact millisecond

          // Grey out the "LIVE" icon if the viewer falls too far behind the live edge
          onTimeUpdate={() => {
            const video = videoRef.current;
            if (video && video.seekable.length > 0) {
              const liveEdge = video.seekable.end(video.seekable.length - 1);
              const latency = liveEdge - video.currentTime;
              
              // If they fall more than 30 seconds behind, turn the icon grey
              setIsAtLiveEdge(latency < 30);
            }
          }}
        />

        {isBuffering && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-12 h-12 border-4 border-white/20 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        )}

        {isFullscreen && (
          <div 
            className={`absolute top-0 right-0 h-full w-80 sm:w-96 z-40 bg-[#0d0f12]/90 backdrop-blur-xl border-l border-white/10 transition-transform duration-300 ease-out shadow-2xl flex flex-col ${
              showFullscreenChat ? 'translate-x-0' : 'translate-x-full'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-200">Live Overlay Chat</span>
              </div>
              <button 
                onClick={() => setShowFullscreenChat(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden relative">
              <LiveChat 
                userBalance={userCoins} 
                onSpendCoins={onSpendCoins} 
                onTopUpClick={onOpenCoinPurchase}
              />
            </div>
          </div>
        )}

        <div 
          onClick={(e) => e.stopPropagation()}
          className={`absolute bottom-20 sm:bottom-24 w-full px-6 pt-12 pb-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-30 flex items-center justify-between transition-opacity duration-300 pointer-events-none ${
            isHoveringVideo ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex items-center gap-5 pointer-events-auto">
            <button onClick={togglePlay} className="text-white/80 hover:text-white transition-colors drop-shadow-md">
              {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />}
            </button>
            <button onClick={toggleMute} className="text-white/80 hover:text-white transition-colors drop-shadow-md">
              {isMuted ? <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" /> : <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
            {/* <div className="flex items-center gap-2 drop-shadow-md ml-2">
              <span className="text-xs font-bold text-white/90">LIVE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            </div> */}
            <button 
              onClick={!isAtLiveEdge ? seekToLive : undefined}
              className={`flex items-center gap-2 drop-shadow-md ml-2 transition-all duration-300 ${
                isAtLiveEdge ? 'cursor-default' : 'cursor-pointer hover:opacity-80'
              }`}
              title={isAtLiveEdge ? "You are at the live edge" : "Click to catch up to live"}
            >
              <span className={`text-xs font-bold transition-colors ${
                isAtLiveEdge ? 'text-white/90' : 'text-gray-400'
              }`}>
                LIVE
              </span>
              <span className={`w-1.5 h-1.5 rounded-full transition-colors ${
                isAtLiveEdge ? 'bg-red-500 animate-pulse' : 'bg-gray-500'
              }`}></span>
            </button>
          </div>

          <div className="flex items-center gap-4 pointer-events-auto">
            {isFullscreen && (
              <button 
                onClick={() => setShowFullscreenChat(!showFullscreenChat)}
                className={`p-2 rounded-lg transition-colors ${
                  showFullscreenChat ? 'bg-indigo-600 text-white' : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <MessageSquare className="w-5 h-5" strokeWidth={2.5} />
              </button>
            )}
            <button className="text-white/80 hover:text-white transition-colors drop-shadow-md">
              <Settings className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
            </button>
            <button onClick={handleToggleFullscreen} className="text-white/80 hover:text-white transition-colors drop-shadow-md">
              {isFullscreen ? <Minimize className="w-5 h-5 sm:w-6 sm:h-6" /> : <Maximize className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>
      </div>

      {!isFullscreen && (
        <div className="absolute bottom-0 w-full p-6 z-20 bg-gradient-to-t from-black/90 via-black/80 to-transparent flex flex-col gap-4 pointer-events-none">
          <div className="flex justify-between items-end pointer-events-auto">
            <div className="flex gap-4 items-center">
              <div className="relative">
                <img src={creator.avatar} alt={creator.name} className="w-14 h-14 rounded-full border-2 border-red-500 object-cover" />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                  Live
                </div>
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-white leading-tight">
                  {stream.title}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-medium text-gray-300">{creator.name}</span>
                  <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                  <span className="text-xs text-red-400 flex items-center gap-1 font-bold">
                    👁️ {stream.viewerCount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};