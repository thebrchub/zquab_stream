import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';

// Video stuck this long counts as "stream is reconnecting".
const STALL_MS = 10000;
// Shortest gap between two fresh-session restarts, so a down stream isn't hammered.
const FRESH_SESSION_GAP_MS = 5000;

interface NativeStreamPlayerProps {
  streamUrl: string;
  isPlaying: boolean;
  isMuted: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>; // 🚀 Added "| null" here
  onLiveEdgeChange: (isLive: boolean) => void;
  onStalledChange?: (isStalled: boolean) => void;
  quality?: string;
  isLowLatency?: boolean;
}

export const NativeStreamPlayer: React.FC<NativeStreamPlayerProps> = ({
  streamUrl,
  isPlaying,
  isMuted,
  videoRef,
  onLiveEdgeChange,
  onStalledChange,
}) => {
  const [isBuffering, setIsBuffering] = useState(true);
  const stallTimerRef = useRef<number | null>(null);

  const clearStallTimer = () => {
    if (stallTimerRef.current) window.clearTimeout(stallTimerRef.current);
    stallTimerRef.current = null;
  };

  const startStallTimer = () => {
    if (stallTimerRef.current) return;
    stallTimerRef.current = window.setTimeout(() => onStalledChange?.(true), STALL_MS);
  };

  // A fresh player starts out "waiting" until the first frames play.
  useEffect(() => {
    startStallTimer();
    return clearStallTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamUrl]);

  // --- HLS Setup ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls;
    let lastFreshSessionAt = 0;
    let freshSessionTimer: number | undefined;
    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false, 
        maxBufferLength: 30, 
        maxMaxBufferLength: 60, 
        liveSyncDurationCount: 3, 
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      let chunksDownloaded = 0;
      let hasStartedPlaying = false;

      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        chunksDownloaded++;
        if (chunksDownloaded >= 2 && !hasStartedPlaying) {
          hasStartedPlaying = true;
          if (isPlaying) {
            video.play().catch((e) => console.log("Autoplay prevented:", e));
          }
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          const status = data.response?.code;
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR && (status === 401 || status === 404)) {
            // Session or pieces gone from MediaMTX; reload index.m3u8 for a fresh session.
            const wait = Math.max(0, lastFreshSessionAt + FRESH_SESSION_GAP_MS - Date.now());
            window.clearTimeout(freshSessionTimer);
            freshSessionTimer = window.setTimeout(() => {
              lastFreshSessionAt = Date.now();
              hls.loadSource(streamUrl);
            }, wait);
          }
          else if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
          else hls.destroy();
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        if (isPlaying) video.play().catch((e) => console.log("Autoplay prevented:", e));
      });
    }

    return () => {
      window.clearTimeout(freshSessionTimer);
      if (hls) hls.destroy();
    };
  }, [streamUrl]);

  // --- Sync Play/Pause State ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.play().catch((e) => console.log("Play prevented by browser:", e));
    } else {
      video.pause();
      clearStallTimer(); // paused on purpose, not stuck
    }
  }, [isPlaying]);

  // --- Sync Mute State ---
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = isMuted;
    }
  }, [isMuted]);

  return (
    <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center overflow-hidden pointer-events-none">
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        onWaiting={() => {
          setIsBuffering(true);
          if (isPlaying) startStallTimer();
        }}
        onPlaying={() => {
          setIsBuffering(false);
          clearStallTimer();
          onStalledChange?.(false);
        }}
        onTimeUpdate={() => {
          // 🚀 Calculates latency every time the video frame updates
          const video = videoRef.current;
          if (video && video.seekable.length > 0) {
            const liveEdge = video.seekable.end(video.seekable.length - 1);
            const latency = liveEdge - video.currentTime;
            onLiveEdgeChange(latency < 30); // Grays out if > 30s behind
          }
        }}
      />

      {isBuffering && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-sm transition-all">
          <div className="w-10 h-10 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};