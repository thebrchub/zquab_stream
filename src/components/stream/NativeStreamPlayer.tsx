import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';

// Video stuck this long counts as "stream is reconnecting".
const STALL_MS = 10000;
// Shortest gap between two fresh-session restarts, so a down stream isn't hammered.
const FRESH_SESSION_GAP_MS = 5000;
// Bunny path token, e.g. /bcdn_token=HS256-abc&token_path=%2F<pid>%2F&expires=1700000000/; segments inherit it from the playlist URL.
const TOKEN_SEGMENT = /\/bcdn_token=[^/]*\//;

const withoutToken = (url: string) => url.replace(TOKEN_SEGMENT, '/');

// hls.js never retries a 4xx, so one failed request would end the session.
// A 403 can be a ticket that expired just before renewal (xhrSetup puts the
// latest ticket on every retry), so retry it everywhere. A playlist 404 is
// brief (MediaMTX starting or restarting the stream), so retry it too. A
// segment 404 is permanent (it left MediaMTX's 5-segment window, or the
// stream restarted with new names), so it goes straight to the fresh-session
// fallback in the error handler. Retries wait ~1s, 2s, 4s.
type LoadPolicy = typeof Hls.DefaultConfig.fragLoadPolicy;
const retryBrief4xx = (policy: LoadPolicy, statuses: number[]): LoadPolicy => ({
  default: {
    ...policy.default,
    errorRetry: {
      maxNumRetry: 3,
      retryDelayMs: 1000,
      maxRetryDelayMs: 4000,
      shouldRetry: (config, retryCount, _isTimeout, response, retry) =>
        retry || (!!config && retryCount < config.maxNumRetry && statuses.includes(response?.code ?? 0)),
    },
  },
});

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
  // A renewed ticket only changes the token, so the player keeps going and requests pick it up from here.
  const latestUrlRef = useRef(streamUrl);
  const isPlayingRef = useRef(isPlaying);
  const streamPath = withoutToken(streamUrl);

  useEffect(() => {
    latestUrlRef.current = streamUrl;
  }, [streamUrl]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

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
  }, [streamPath]);

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
        fragLoadPolicy: retryBrief4xx(Hls.DefaultConfig.fragLoadPolicy, [403]),
        playlistLoadPolicy: retryBrief4xx(Hls.DefaultConfig.playlistLoadPolicy, [403, 404]),
        manifestLoadPolicy: retryBrief4xx(Hls.DefaultConfig.manifestLoadPolicy, [403, 404]),
        xhrSetup: (xhr, url) => {
          const token = latestUrlRef.current.match(TOKEN_SEGMENT)?.[0];
          if (token && TOKEN_SEGMENT.test(url)) xhr.open('GET', url.replace(TOKEN_SEGMENT, token), true);
        },
      });

      hls.loadSource(latestUrlRef.current);
      hls.attachMedia(video);

      let chunksDownloaded = 0;
      let hasStartedPlaying = false;

      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        chunksDownloaded++;
        if (chunksDownloaded >= 2 && !hasStartedPlaying) {
          hasStartedPlaying = true;
          if (isPlayingRef.current) {
            video.play().catch((e) => console.log("Autoplay prevented:", e));
          }
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          const status = data.response?.code;
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR && (status === 401 || status === 403 || status === 404)) {
            // Session or pieces gone from MediaMTX, or the CDN refused an expired ticket;
            // reload index.m3u8 (with the latest ticket) for a fresh session at the live edge.
            // loadSource resets the <video> (it pauses), so play again once 2 chunks are buffered.
            const wait = Math.max(0, lastFreshSessionAt + FRESH_SESSION_GAP_MS - Date.now());
            window.clearTimeout(freshSessionTimer);
            freshSessionTimer = window.setTimeout(() => {
              lastFreshSessionAt = Date.now();
              chunksDownloaded = 0;
              hasStartedPlaying = false;
              hls.loadSource(latestUrlRef.current);
            }, wait);
          }
          else if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
          else hls.destroy();
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS can't swap tickets per request; a new ticket is used on the next reload.
      video.src = latestUrlRef.current;
      video.addEventListener('loadedmetadata', () => {
        if (isPlaying) video.play().catch((e) => console.log("Autoplay prevented:", e));
      });
    }

    return () => {
      window.clearTimeout(freshSessionTimer);
      if (hls) hls.destroy();
    };
  }, [streamPath]);

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