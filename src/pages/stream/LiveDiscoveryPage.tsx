import React, { useState } from 'react';
import {
  MOCK_CREATORS,
  MOCK_STREAMS,
  type Stream,
  type Creator,
} from '../../constants/streamMockData';

interface LiveDiscoveryPageProps {
  onSelectStream?: (streamId: string) => void;
  onSelectCreator?: (creatorId: string) => void;
  onOpenStrangerChat?: () => void;
}

export const LiveDiscoveryPage: React.FC<LiveDiscoveryPageProps> = ({
  onSelectStream,
  onSelectCreator,
  onOpenStrangerChat,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Gaming', 'Just Chatting', 'Music', 'Entertainment'];

  const filteredStreams = selectedCategory === 'All'
    ? MOCK_STREAMS
    : MOCK_STREAMS.filter((s) => s.category === selectedCategory);

  const creatorsAcceptingCalls = MOCK_CREATORS.filter(
    (c) => c.oneOnOne.enabled
  );

  return (
    <div className="min-h-screen bg-[#0d0f12] text-white pb-16">
      {/* Top Banner / Hero */}
      <section className="px-6 pt-8 pb-6 border-b border-gray-800/60 bg-gradient-to-b from-[#161a22] to-transparent">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Live Social
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Watch, Connect & Interact
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Join live creator rooms, enter private 1:1 queues, or explore stranger chats.
            </p>
          </div>

          {/* Quick Action: Meet Strangers */}
          <button
            onClick={onOpenStrangerChat}
            className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition-all font-medium text-sm shadow-lg shadow-indigo-900/30"
          >
            <span className="text-lg">🎲</span>
            <div className="text-left">
              <div className="font-semibold leading-tight">Meet Strangers</div>
              <div className="text-xs text-indigo-200 opacity-80">Instant text & video</div>
            </div>
          </button>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-10">
        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-white text-black'
                  : 'bg-[#181c24] text-gray-400 hover:text-white hover:bg-[#202530]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Section: Live Streams */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              Live Streams ({filteredStreams.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStreams.map((stream) => {
              const creator = MOCK_CREATORS.find((c) => c.id === stream.creatorId);

              return (
                <div
                  key={stream.id}
                  onClick={() => onSelectStream && onSelectStream(stream.id)}
                  className="group cursor-pointer rounded-2xl overflow-hidden bg-[#151921] border border-gray-800/60 hover:border-gray-700 transition-all duration-200 flex flex-col"
                >
                  {/* Thumbnail & Badges */}
                  <div className="relative aspect-video w-full bg-gray-900 overflow-hidden">
                    <img
                      src={stream.thumbnailUrl}
                      alt={stream.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* LIVE badge */}
                    <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1.5 uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                      LIVE
                    </div>

                    {/* Premium badge */}
                    {stream.isPremium && (
                      <div className="absolute top-3 right-3 bg-amber-500 text-black text-xs font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-md">
                        <span>👑</span> {stream.entryPriceCoins} zCoins
                      </div>
                    )}

                    {/* Viewer Counter */}
                    <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-gray-200 text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5">
                      <span className="text-gray-400">👁️</span>
                      {stream.viewerCount.toLocaleString()} watching
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="p-4 flex gap-3 flex-1">
                    <img
                      src={creator?.avatar}
                      alt={creator?.name}
                      className="w-10 h-10 rounded-full object-cover border border-gray-700"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-100 truncate group-hover:text-indigo-400 transition-colors">
                        {stream.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {creator?.name}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                        <span className="text-[11px] font-medium bg-[#1e232f] text-gray-300 px-2 py-0.5 rounded">
                          {stream.category}
                        </span>
                        {stream.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[11px] text-gray-500 bg-[#161a22] px-1.5 py-0.5 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section: 1:1 Creator Interactions */}
        <section className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span>🤝</span> Talk 1:1 with Creators
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Join private queues for direct 1-on-1 video sessions
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {creatorsAcceptingCalls.map((creator) => (
              <div
                key={creator.id}
                className="bg-[#151921] border border-gray-800/60 rounded-2xl p-5 flex flex-col justify-between hover:border-gray-700 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-3.5">
                    <div className="relative">
                      <img
                        src={creator.avatar}
                        alt={creator.name}
                        className="w-12 h-12 rounded-full object-cover border border-gray-700"
                      />
                      {creator.isLive && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-red-500 border-2 border-[#151921] rounded-full"></span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-100">
                        {creator.name}
                      </h3>
                      <p className="text-xs text-gray-400">{creator.handle}</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 mt-3 line-clamp-2">
                    {creator.bio}
                  </p>

                  <div className="grid grid-cols-3 gap-2 mt-4 bg-[#101318] p-2.5 rounded-xl text-center">
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase">Rate</div>
                      <div className="text-xs font-semibold text-amber-400 mt-0.5">
                        {creator.oneOnOne.priceCoins} 🪙
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase">Duration</div>
                      <div className="text-xs font-semibold text-gray-200 mt-0.5">
                        {creator.oneOnOne.durationMinutes} mins
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase">Queue</div>
                      <div className="text-xs font-semibold text-gray-200 mt-0.5">
                        {creator.oneOnOne.currentQueueCount} waiting
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2">
                  <button
                    onClick={() => onSelectCreator && onSelectCreator(creator.id)}
                    className="flex-1 py-2 rounded-xl bg-[#202530] hover:bg-[#282f3d] text-xs font-medium text-gray-200 transition-colors"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => onSelectCreator && onSelectCreator(creator.id)}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors"
                  >
                    Join Queue (~{creator.oneOnOne.estimatedWaitMinutes}m)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};