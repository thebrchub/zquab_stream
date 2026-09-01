import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, Shuffle, LogOut, Loader2, User } from 'lucide-react';

const CLEAN_CARD = "bg-[var(--card)] rounded-[2rem] border border-[var(--border-color)] shadow-sm overflow-hidden relative";

export default function VideoChatPage() {
  const navigate = useNavigate();
  
  const [isSearching, setIsSearching] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  // Simulate finding a stranger after 3 seconds for UI testing
  useEffect(() => {
    if (isSearching) {
      const timer = setTimeout(() => setIsSearching(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isSearching]);

  const handleNext = () => {
    setIsSearching(true);
  };

  const handleLeave = () => {
    navigate('/chat');
  };

  return (
    <div className="min-h-[100dvh] md:min-h-[calc(100vh-5rem)] bg-[var(--background)] p-2 md:p-6 flex flex-col transition-colors duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-[var(--text-main)]">Global Video</h1>
          <p className="text-xs md:text-sm text-[var(--text-muted)] font-medium">
            {isSearching ? 'Looking for someone...' : 'Connected with a stranger'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--card)] border border-[var(--border-color)]">
            <span className={`w-2 h-2 rounded-full ${isSearching ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              {isSearching ? 'Searching' : 'Live'}
            </span>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-7xl mx-auto w-full relative">
        
        {/* Stranger's Video */}
        <div className={`${CLEAN_CARD} bg-black flex items-center justify-center min-h-[40vh] md:min-h-0`}>
          {isSearching ? (
            <div className="flex flex-col items-center gap-4 text-[var(--text-muted)] opacity-50">
              <Loader2 className="w-12 h-12 animate-spin text-[#3B82F6]" />
              <p className="font-medium tracking-wide">Waiting for connection...</p>
            </div>
          ) : (
            <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
              <User className="w-20 h-20 text-zinc-800" />
              <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                <span className="text-white text-xs font-bold tracking-wider uppercase">Stranger</span>
              </div>
            </div>
          )}
        </div>

        {/* Local Video */}
        <div className={`${CLEAN_CARD} bg-zinc-900 flex items-center justify-center min-h-[40vh] md:min-h-0 relative`}>
          {!videoEnabled ? (
            <div className="flex flex-col items-center gap-4 text-zinc-500">
              <VideoOff className="w-12 h-12" />
              <p className="font-medium tracking-wide">Camera Disabled</p>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              {/* This is where the local <video> element will go */}
              <User className="w-20 h-20 text-zinc-800" />
            </div>
          )}
          
          <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
            <span className="text-white text-xs font-bold tracking-wider uppercase">You</span>
          </div>

          {/* Floating Controls (Inside local video on desktop, bottom fixed on mobile) */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[var(--card)]/80 backdrop-blur-xl border border-[var(--border-color)] p-2 rounded-2xl shadow-xl">
            <button 
              onClick={() => setMicEnabled(!micEnabled)}
              className={`p-3 rounded-xl transition-all ${micEnabled ? 'bg-[var(--background)] hover:bg-[var(--text-main)]/5 text-[var(--text-main)]' : 'bg-red-500/10 text-red-500'}`}
            >
              {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => setVideoEnabled(!videoEnabled)}
              className={`p-3 rounded-xl transition-all ${videoEnabled ? 'bg-[var(--background)] hover:bg-[var(--text-main)]/5 text-[var(--text-main)]' : 'bg-red-500/10 text-red-500'}`}
            >
              {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Primary Action Bar */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto w-full">
        <button 
          onClick={handleLeave}
          className="w-full sm:w-auto px-8 py-4 rounded-[1.25rem] bg-[var(--card)] border border-[var(--border-color)] text-[var(--text-main)] font-bold flex items-center justify-center gap-2 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all shadow-sm active:scale-95"
        >
          <LogOut className="w-5 h-5" />
          Leave
        </button>
        <button 
          onClick={handleNext}
          disabled={isSearching}
          className="w-full sm:flex-1 px-8 py-4 rounded-[1.25rem] bg-[#3B82F6] text-white font-bold flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-[0_8px_16px_rgba(59,130,246,0.3)] border-none"
        >
          <Shuffle className="w-5 h-5" />
          {isSearching ? 'Searching...' : 'Next Stranger'}
        </button>
      </div>

    </div>
  );
}