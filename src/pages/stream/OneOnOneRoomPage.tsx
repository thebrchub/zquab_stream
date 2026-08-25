import React, { useState, useEffect } from 'react';
import { MOCK_CREATORS, type Creator } from '../../constants/streamMockData';

interface OneOnOneRoomPageProps {
  creatorId?: string;
  onEndCall?: () => void;
}

export const OneOnOneRoomPage: React.FC<OneOnOneRoomPageProps> = ({
  creatorId = 'creator-1', // Default for testing
  onEndCall,
}) => {
  const creator = MOCK_CREATORS.find((c) => c.id === creatorId) as Creator;
  
  // Calculate remaining time based on the creator's set duration
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(
    (creator?.oneOnOne.durationMinutes || 5) * 60
  );
  
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  useEffect(() => {
    if (!creator) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onEndCall?.(); // Auto-end call when time is up
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [creator, onEndCall]);

  if (!creator) {
    return <div className="text-white p-10">Creator not found for 1:1 call.</div>;
  }

  // Format time (MM:SS)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeftSeconds <= 60; // Less than 1 minute remaining

  return (
    <div className="flex flex-col h-screen w-full bg-[#050608] text-white overflow-hidden">
      
      {/* Top Navigation / Status Bar */}
      <div className="flex items-center justify-between p-4 bg-[#0a0c10] border-b border-gray-800/50 z-20">
        <div className="flex items-center gap-3">
          <img 
            src={creator.avatar} 
            alt={creator.name} 
            className="w-10 h-10 rounded-full border border-gray-700 object-cover"
          />
          <div>
            <h1 className="text-sm font-semibold text-white">
              Private Call with {creator.name}
            </h1>
            <p className="text-xs text-gray-400">Paid 1:1 Interaction</p>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className={`px-4 py-1.5 rounded-lg border font-mono text-sm font-bold flex items-center gap-2 transition-colors ${
          isLowTime 
            ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse' 
            : 'bg-[#151921] border-gray-700 text-gray-200'
        }`}>
          <span>⏱️</span>
          {formatTime(timeLeftSeconds)}
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 flex flex-col md:flex-row p-4 gap-4 overflow-hidden">
        
        {/* Creator Video (Main Focus) */}
        <div className="flex-1 relative rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 shadow-2xl flex items-center justify-center">
           {/* Mocking the creator video feed with the thumbnail for now */}
           <img 
             src={creator.avatar} 
             alt={creator.name}
             className="absolute inset-0 w-full h-full object-cover opacity-40 blur-md"
           />
           <div className="z-10 flex flex-col items-center gap-4">
             <img 
                src={creator.avatar} 
                alt={creator.name}
                className="w-24 h-24 rounded-full border-4 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.5)]"
             />
             <span className="text-gray-300 font-medium">Connecting to creator's video feed...</span>
           </div>

           {/* Name Overlay */}
           <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm font-medium border border-white/10">
             {creator.name}
           </div>
        </div>

        {/* User Video (Self View) */}
        <div className="w-full md:w-1/3 lg:w-1/4 relative rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 shadow-2xl flex items-center justify-center min-h-[200px]">
           <div className="z-10 text-gray-400 text-sm flex flex-col items-center gap-2">
             <span className="text-3xl">👤</span>
             Your Camera
           </div>

           {/* Name Overlay */}
           <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm font-medium border border-white/10">
             You
           </div>

           {/* Mute Indicators */}
           <div className="absolute top-4 right-4 flex gap-2">
             {isMicMuted && (
               <div className="bg-red-500/80 backdrop-blur-md p-1.5 rounded-md text-white text-xs">
                 🔇
               </div>
             )}
           </div>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="p-6 bg-gradient-to-t from-black via-[#0a0c10] to-transparent flex items-center justify-center gap-4 z-20">
        
        <button 
          onClick={() => setIsMicMuted(!isMicMuted)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isMicMuted ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' : 'bg-[#1a1f29] text-white border border-gray-700 hover:bg-[#252c3a]'
          }`}
          title={isMicMuted ? "Unmute" : "Mute"}
        >
          {isMicMuted ? '🔇' : '🎤'}
        </button>

        <button 
          onClick={() => setIsCameraOff(!isCameraOff)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isCameraOff ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' : 'bg-[#1a1f29] text-white border border-gray-700 hover:bg-[#252c3a]'
          }`}
          title={isCameraOff ? "Turn on camera" : "Turn off camera"}
        >
          {isCameraOff ? '🚫' : '📷'}
        </button>

        <div className="w-px h-8 bg-gray-800 mx-2"></div>

        <button 
          onClick={onEndCall}
          className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold shadow-lg shadow-red-900/20 transition-colors flex items-center gap-2"
        >
          <span className="text-lg">📞</span> End Call
        </button>

      </div>

    </div>
  );
};