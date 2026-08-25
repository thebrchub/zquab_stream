import React, { useState } from 'react';
import { MOCK_STREAMS, MOCK_CREATORS, type Stream, type Creator } from '../../constants/streamMockData';
import { LiveChat } from '../../components/stream/LiveChat'; 
import { NativeStreamPlayer } from '../../components/stream/NativeStreamPlayer';

interface LiveRoomPageProps {
  streamId?: string;
  onLeaveRoom?: () => void;
  onOpenCoinPurchase?: () => void;
}

export const LiveRoomPage: React.FC<LiveRoomPageProps> = ({
  streamId = 'stream-1',
  onLeaveRoom,
  onOpenCoinPurchase,
}) => {
  const [userCoins, setUserCoins] = useState<number>(120); 

  const stream = MOCK_STREAMS.find((s) => s.id === streamId) as Stream;
  const creator = MOCK_CREATORS.find((c) => c.id === stream.creatorId) as Creator;

  if (!stream || !creator) {
    return <div className="text-white p-10">Stream not found.</div>;
  }

  // 🚀 PASTE YOUR COPIED .m3u8 LINK RIGHT HERE
  // It will look something like this depending on your server:
  const RAW_STREAM_URL = "https://aarpaar-stream.brchub.tech/benki-stream/index.m3u8"; 

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-[#090b0e] text-white overflow-hidden">
      
      {/* LEFT COLUMN: Main Player Area */}
      <div className="flex-1 flex flex-col relative bg-black overflow-hidden">
        
        {/* Global Top Nav */}
        <div className="absolute top-0 w-full p-4 flex justify-between items-start z-30 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
          <button 
            onClick={onLeaveRoom}
            className="pointer-events-auto p-2 rounded-full bg-black/40 backdrop-blur-md hover:bg-white/20 transition-colors"
          >
            <span className="text-xl">←</span>
          </button>

          <div className="flex gap-3 pointer-events-auto">
            <button 
              onClick={onOpenCoinPurchase}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-amber-500/30 hover:bg-black/60 transition-colors"
            >
              <span className="text-amber-400">🪙</span>
              <span className="text-sm font-semibold text-amber-50">{userCoins}</span>
              <span className="text-xs text-amber-500 ml-1 bg-amber-500/20 px-1.5 rounded">+</span>
            </button>
          </div>
        </div>

        {/* 
          Our Custom Player will take that .m3u8 link, run it through hls.js, 
          and spit out beautiful, controllable video!
        */}
        <NativeStreamPlayer 
          streamUrl={RAW_STREAM_URL}
          stream={stream}
          creator={creator}
          userCoins={userCoins}
          onSpendCoins={(amount) => setUserCoins(prev => prev - amount)}
          onOpenCoinPurchase={onOpenCoinPurchase}
        />
      </div>

      {/* RIGHT COLUMN: Desktop Side Chat */}
      <div className="w-full lg:w-[380px] h-[40vh] lg:h-full border-t lg:border-t-0 lg:border-l border-gray-800/60 flex flex-col bg-[#0d0f12]">
        <div className="p-4 border-b border-gray-800/60 bg-[#12151a]">
          <h2 className="text-sm font-semibold text-gray-200">Live Chat</h2>
        </div>
        
        <div className="flex-1 overflow-hidden relative">
          <LiveChat 
            userBalance={userCoins} 
            onSpendCoins={(amount) => setUserCoins(prev => prev - amount)} 
            onTopUpClick={onOpenCoinPurchase}
          />
        </div>
      </div>

    </div>
  );
};