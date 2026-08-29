import React, { useState, useEffect } from 'react';
import { Loader2, Users, BadgeCheck, Search, Play } from 'lucide-react';
import { streamService, type LiveStream } from '../../services/streamService';
import { creatorService, type DiscoverCreator } from '../../services/creatorService';
import { MOCK_CREATORS } from '../../constants/streamMockData'; 

// --- Claymorphism Utility Classes ---
const CLAY_CARD = "bg-white dark:bg-[#121214] rounded-3xl border border-zinc-100 dark:border-white/5 shadow-[8px_8px_24px_rgba(0,0,0,0.04),inset_2px_2px_4px_rgba(255,255,255,1)] dark:shadow-[8px_8px_24px_rgba(0,0,0,0.6),inset_2px_2px_4px_rgba(255,255,255,0.04)] transition-all duration-300";
const CLAY_BUTTON = "bg-white dark:bg-[#18181b] rounded-2xl shadow-[4px_4px_12px_rgba(0,0,0,0.04),inset_1px_1px_2px_rgba(255,255,255,1)] dark:shadow-[4px_4px_12px_rgba(0,0,0,0.4),inset_1px_1px_2px_rgba(255,255,255,0.05)] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white active:scale-95 transition-all";
const CLAY_BUTTON_ACTIVE = "bg-indigo-50 dark:bg-indigo-500/20 rounded-2xl shadow-[inset_3px_3px_8px_rgba(0,0,0,0.05)] dark:shadow-[inset_3px_3px_8px_rgba(0,0,0,0.2)] text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-200/50 dark:border-indigo-500/20 transition-all";
const CLAY_INPUT = "bg-zinc-50 dark:bg-black rounded-2xl shadow-[inset_4px_4px_8px_rgba(0,0,0,0.04),inset_-4px_-4px_8px_rgba(255,255,255,1)] dark:shadow-[inset_4px_4px_12px_rgba(0,0,0,0.5),inset_-2px_-2px_6px_rgba(255,255,255,0.02)] text-zinc-900 dark:text-zinc-100 outline-none transition-all";

interface LiveDiscoveryPageProps {
  onSelectStream?: (streamId: string) => void;
  onSelectCreator?: (username: string) => void;
  onOpenStrangerChat?: () => void;
}

export const LiveDiscoveryPage: React.FC<LiveDiscoveryPageProps> = ({
  onSelectStream,
  onSelectCreator,
  onOpenStrangerChat,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [discoverCreators, setDiscoverCreators] = useState<DiscoverCreator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const categories = ['All', 'gaming', 'chatting', 'music'];
  const creatorsAcceptingCalls = MOCK_CREATORS.filter((c) => c.oneOnOne.enabled);

  useEffect(() => {
    const fetchDiscoveryData = async () => {
      setIsLoading(true);
      try {
        const apiCategory = selectedCategory === 'All' ? undefined : selectedCategory;
        
        const [streamsData, creatorsData] = await Promise.all([
          streamService.getLiveStreams().catch(() => []),
          creatorService.getDiscoverFeed(apiCategory).catch(() => [])
        ]);

        const filteredStreams = apiCategory 
          ? streamsData.filter((s: LiveStream) => s.category === apiCategory)
          : streamsData;

        setLiveStreams(filteredStreams);
        setDiscoverCreators(creatorsData);
      } catch (error) {
        console.error("Failed to load discovery feeds:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiscoveryData();
  }, [selectedCategory]);

  // --- Real-time Search Filtering ---
  const query = searchQuery.toLowerCase();
  const displayedStreams = liveStreams.filter(s => 
    s.title.toLowerCase().includes(query) || s.name.toLowerCase().includes(query) || s.category.toLowerCase().includes(query)
  );
  const displayedCreators = discoverCreators.filter(c => 
    c.name.toLowerCase().includes(query) || c.username.toLowerCase().includes(query)
  );
  const displayed1on1 = creatorsAcceptingCalls.filter(c => 
    c.name.toLowerCase().includes(query) || c.handle.toLowerCase().includes(query)
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0c] text-zinc-900 dark:text-zinc-100 pb-20 transition-colors duration-300 font-sans selection:bg-indigo-500/30">
      
      {/* --- Clay Hero Section --- */}
      <section className="px-4 sm:px-6 pt-8 pb-10">
        <div className={`max-w-7xl mx-auto p-8 sm:p-12 relative overflow-hidden ${CLAY_CARD} bg-gradient-to-br from-white to-indigo-50/50 dark:from-[#121214] dark:to-indigo-950/20`}>
          
          {/* Decorative Background Blob */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-[10px] font-bold uppercase tracking-widest mb-4 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                Live Social Hub
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3 text-zinc-900 dark:text-white">
                Watch, Connect & Interact
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-medium max-w-lg mx-auto md:mx-0">
                Join live creator rooms, enter private 1:1 queues, or jump into stranger chats instantly.
              </p>
            </div>

            <button
              onClick={onOpenStrangerChat}
              className="group flex items-center gap-4 px-6 py-4 rounded-3xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-[8px_8px_20px_rgba(79,70,229,0.25),inset_2px_2px_4px_rgba(255,255,255,0.3)] dark:shadow-[8px_8px_20px_rgba(79,70,229,0.15),inset_2px_2px_4px_rgba(255,255,255,0.1)] active:scale-95"
            >
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:rotate-12 transition-transform">
                🎲
              </div>
              <div className="text-left pr-2">
                <div className="font-bold text-lg leading-tight">Meet Strangers</div>
                <div className="text-xs text-indigo-200 font-medium tracking-wide">Instant text & video</div>
              </div>
            </button>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        
        {/* --- Tools Row: Search & Filters --- */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Clay Search Bar */}
          <div className="relative w-full lg:max-w-md group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search streams, creators, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-12 pr-4 py-3.5 ${CLAY_INPUT} text-sm font-medium focus:ring-2 focus:ring-indigo-500/30`}
            />
          </div>

          {/* Clay Category Filters */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 whitespace-nowrap capitalize text-sm ${
                  selectedCategory === cat ? CLAY_BUTTON_ACTIVE : CLAY_BUTTON
                }`}
              >
                {cat === 'chatting' ? 'Just Chatting' : cat}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin drop-shadow-md" />
          </div>
        ) : (
          <div className="space-y-16 animate-fadeIn">
            
            {/* --- Section: Live Streams --- */}
            <section>
              <div className="flex items-center gap-3 mb-6 px-2">
                <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center shadow-inner">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Live Broadcasts</h2>
                <span className="px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-xs font-bold text-zinc-500">{displayedStreams.length}</span>
              </div>

              {displayedStreams.length === 0 ? (
                <div className={`py-16 text-center ${CLAY_CARD} flex flex-col items-center justify-center`}>
                  <Play className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-3" />
                  <p className="text-zinc-500 font-medium">No active broadcasts match your search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {displayedStreams.map((stream) => (
                    <div
                      key={stream.stream_id}
                      onClick={() => onSelectStream && onSelectStream(stream.stream_id)}
                      className={`group cursor-pointer flex flex-col overflow-hidden ${CLAY_CARD} hover:-translate-y-1`}
                    >
                      <div className="relative aspect-video w-full bg-zinc-900 overflow-hidden rounded-t-3xl p-1">
                        <div className="absolute inset-1 rounded-[1.25rem] bg-gradient-to-br from-indigo-900/40 to-black overflow-hidden">
                          {/* Simulated Video Feed hover effect */}
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
                          <img 
                            src={stream.avatar_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop'} 
                            alt="Cover" 
                            className="w-full h-full object-cover opacity-50 group-hover:scale-105 group-hover:opacity-80 transition-all duration-500"
                          />
                        </div>

                        <div className="absolute top-4 left-4 z-20 bg-red-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1.5 uppercase tracking-widest shadow-lg">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span> LIVE
                        </div>

                        {stream.is_premium && (
                          <div className="absolute top-4 right-4 z-20 bg-amber-400 text-amber-950 text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                            <span>👑</span> {stream.entry_price_coins}
                          </div>
                        )}
                      </div>

                      <div className="p-5 flex gap-4 flex-1">
                        <div className="relative shrink-0">
                          <img
                            src={stream.avatar_url || 'https://via.placeholder.com/150'}
                            alt={stream.name}
                            className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-zinc-200 dark:border-zinc-700"
                          />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-[#121214]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                            {stream.title}
                          </h3>
                          <p className="text-xs text-zinc-500 font-medium mt-1 truncate">
                            {stream.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                              {stream.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* --- Section: Discover Creators --- */}
            {displayedCreators.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6 px-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shadow-inner text-amber-500">
                    🌟
                  </div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Rising Creators</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedCreators.map((creator) => (
                    <div
                      key={creator.username}
                      onClick={() => onSelectCreator && onSelectCreator(creator.username)}
                      className={`group cursor-pointer p-6 flex flex-col justify-between ${CLAY_CARD} hover:-translate-y-1`}
                    >
                      <div>
                        <div className="flex items-center gap-4">
                          <img
                            src={creator.avatar_url || 'https://via.placeholder.com/150'}
                            alt={creator.name}
                            className="w-14 h-14 rounded-full object-cover border border-zinc-200 dark:border-zinc-800 shadow-sm group-hover:ring-4 ring-indigo-500/20 transition-all"
                          />
                          <div>
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                              {creator.name}
                              {creator.verified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                            </h3>
                            <p className="text-xs text-zinc-500 font-medium mt-0.5">@{creator.username}</p>
                          </div>
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-4 line-clamp-2 leading-relaxed font-medium">
                          {creator.headline}
                        </p>
                      </div>

                      <div className="mt-6 flex items-center justify-between pt-5 border-t border-zinc-100 dark:border-zinc-800/50">
                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                          <div className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shadow-inner">
                            <Users className="w-3 h-3" />
                          </div>
                          {creator.follower_count.toLocaleString()}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1.5 rounded-lg">
                          {creator.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* --- Section: 1:1 Creator Interactions --- */}
            {displayed1on1.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6 px-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shadow-inner text-emerald-500">
                    🤝
                  </div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">1:1 Consultations</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {displayed1on1.map((creator) => (
                    <div
                      key={creator.id}
                      className={`p-6 flex flex-col justify-between ${CLAY_CARD}`}
                    >
                      <div>
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <img
                              src={creator.avatar}
                              alt={creator.name}
                              className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-zinc-200 dark:border-zinc-800"
                            />
                            {creator.isLive && (
                              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-[#121214] rounded-full"></span>
                            )}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                              {creator.name}
                            </h3>
                            <p className="text-xs text-zinc-500 font-medium mt-0.5">{creator.handle}</p>
                          </div>
                        </div>

                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-4 line-clamp-2 leading-relaxed font-medium">
                          {creator.bio}
                        </p>

                        <div className="grid grid-cols-3 gap-3 mt-5 bg-zinc-50 dark:bg-[#0a0a0c] p-3 rounded-2xl shadow-inner border border-zinc-100 dark:border-zinc-800/50">
                          <div className="text-center">
                            <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Rate</div>
                            <div className="text-xs font-extrabold text-amber-500 mt-1">
                              {creator.oneOnOne.priceCoins} 🪙
                            </div>
                          </div>
                          <div className="text-center border-x border-zinc-200 dark:border-zinc-800/50">
                            <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Time</div>
                            <div className="text-xs font-extrabold text-zinc-700 dark:text-zinc-300 mt-1">
                              {creator.oneOnOne.durationMinutes}m
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Queue</div>
                            <div className="text-xs font-extrabold text-indigo-500 mt-1">
                              {creator.oneOnOne.currentQueueCount}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center gap-3">
                        <button
                          onClick={() => onSelectCreator && onSelectCreator(creator.id)}
                          className={`flex-1 py-3 text-xs text-center font-bold ${CLAY_BUTTON}`}
                        >
                          Profile
                        </button>
                        <button
                          onClick={() => onSelectCreator && onSelectCreator(creator.id)}
                          className={`flex-[2] py-3 text-xs text-center font-bold ${CLAY_BUTTON_ACTIVE} bg-indigo-600 dark:bg-indigo-600 text-white dark:text-white border-none shadow-[8px_8px_16px_rgba(79,70,229,0.2),inset_2px_2px_4px_rgba(255,255,255,0.3)] hover:bg-indigo-500`}
                        >
                          Join Queue
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}
      </main>
    </div>
  );
};