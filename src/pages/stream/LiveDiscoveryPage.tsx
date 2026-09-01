import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Users, BadgeCheck, Search, Play } from 'lucide-react';
import { streamService, type LiveStream } from '../../services/streamService';
import { creatorService, type DiscoverCreator } from '../../services/creatorService';
import { MOCK_CREATORS } from '../../constants/streamMockData'; 
import { useAuth } from '../../context/AuthContext'; 

// 🚀 CLEAN UI (For layout, cards, inputs, and tabs)
const CLEAN_CARD = "bg-[var(--card)] rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md transition-all duration-300";
const CLEAN_INPUT = "bg-[var(--card)] border border-[var(--border-color)] rounded-[1.25rem] text-[var(--text-main)] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all shadow-sm";
const TAB_BUTTON = "bg-[var(--card)] border border-[var(--border-color)] rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--background)] transition-colors shadow-sm px-5 py-2.5 whitespace-nowrap capitalize text-sm font-medium";
const TAB_BUTTON_ACTIVE = "bg-[#3B82F6] text-white font-bold rounded-full border-none shadow-md transition-colors px-5 py-2.5 whitespace-nowrap capitalize text-sm";

// 🚀 TRUE CLAYMORPHISM (Reserved STRICTLY for primary action buttons)
const CLAY_BUTTON = "bg-[var(--card)] rounded-[1.25rem] border-none text-[var(--text-muted)] hover:text-[var(--text-main)] active:scale-95 transition-all " +
  "shadow-[4px_4px_10px_rgba(0,0,0,0.06),-4px_-4px_10px_rgba(255,255,255,0.9),inset_1px_1px_2px_rgba(255,255,255,0.8)] " +
  "dark:shadow-[4px_4px_10px_rgba(0,0,0,0.3),-2px_-2px_8px_rgba(255,255,255,0.02),inset_1px_1px_3px_rgba(255,255,255,0.05)]";

const CLAY_BUTTON_ACTIVE = "bg-[#3B82F6] text-white font-bold rounded-[1.25rem] border-none transition-all " +
  "shadow-[4px_4px_12px_rgba(59,130,246,0.3),-4px_-4px_10px_rgba(255,255,255,0.9),inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_4px_rgba(0,0,0,0.1)] " +
  "dark:shadow-[6px_6px_12px_rgba(0,0,0,0.4),-4px_-4px_10px_rgba(255,255,255,0.03),inset_2px_2px_6px_rgba(255,255,255,0.25),inset_-3px_-3px_6px_rgba(0,0,0,0.2)]";

export const LiveDiscoveryPage: React.FC = () => {
  const navigate = useNavigate(); 
  const { user } = useAuth(); 

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [discoverCreators, setDiscoverCreators] = useState<DiscoverCreator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const categories = ['All', 'gaming', 'chatting', 'music'];
  const creatorsAcceptingCalls = MOCK_CREATORS.filter((c) => c.oneOnOne.enabled);

  const handleProtectedAction = (path: string) => {
    if (!user || user.is_guest) {
      navigate('/auth');
      return;
    }
    navigate(path);
  };

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
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] pb-20 transition-colors duration-300 font-sans selection:bg-[#3B82F6]/30">
      
      <section className="px-4 sm:px-6 pt-8 pb-10">
        <div className={`max-w-7xl mx-auto p-8 sm:p-12 relative overflow-hidden ${CLEAN_CARD} bg-gradient-to-br from-[var(--background)] to-[#3B82F6]/5 dark:from-[var(--card)] dark:to-[#3B82F6]/10`}>
          
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#3B82F6]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest mb-4 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                Live Social Hub
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3 text-[var(--text-main)]">
                Watch, Connect & Interact
              </h1>
              <p className="text-[var(--text-muted)] text-sm md:text-base font-medium max-w-lg mx-auto md:mx-0">
                Join live creator rooms, enter private 1:1 queues, or jump into global chats instantly.
              </p>
            </div>

            {/* 🚀 REMOVED AUTH BOUNCER: Let guest users jump straight into chat */}
            <button
              onClick={() => navigate('/chat')} 
              className="group flex items-center gap-4 px-6 py-4 rounded-[1.5rem] bg-[#3B82F6] hover:brightness-110 text-white transition-all active:scale-95 border-none
              shadow-[6px_6px_16px_rgba(59,130,246,0.3),-6px_-6px_16px_rgba(255,255,255,0.9),inset_2px_2px_6px_rgba(255,255,255,0.4),inset_-3px_-3px_6px_rgba(0,0,0,0.1)] 
              dark:shadow-[8px_8px_20px_rgba(0,0,0,0.4),-4px_-4px_12px_rgba(255,255,255,0.03),inset_2px_2px_6px_rgba(255,255,255,0.25),inset_-3px_-3px_6px_rgba(0,0,0,0.2)]"
            >
              <div className="w-12 h-12 bg-white/20 rounded-[1rem] flex items-center justify-center text-2xl shadow-[inset_2px_2px_4px_rgba(255,255,255,0.3)] group-hover:rotate-12 transition-transform">
                🎲
              </div>
              <div className="text-left pr-2">
                {/* 🚀 TEXT UPDATED */}
                <div className="font-bold text-lg leading-tight">Meet New People</div>
                <div className="text-[11px] text-blue-100 font-medium tracking-wide">Instant text & video</div>
              </div>
            </button>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="relative w-full lg:max-w-md group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-[var(--text-muted)] group-focus-within:text-[#3B82F6] transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search streams, creators, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-12 pr-4 py-3.5 ${CLEAN_INPUT}`}
            />
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-4 sm:pb-0 custom-scrollbar px-1 pt-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={selectedCategory === cat ? TAB_BUTTON_ACTIVE : TAB_BUTTON}
              >
                {cat === 'chatting' ? 'Just Chatting' : cat}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="w-12 h-12 text-[#3B82F6] animate-spin drop-shadow-md" />
          </div>
        ) : (
          <div className="space-y-16 animate-fadeIn">
            
            {/* --- Section: Live Streams --- */}
            <section>
              <div className="flex items-center gap-3 mb-6 px-2">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shadow-inner">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                </div>
                <h2 className="text-xl font-bold text-[var(--text-main)]">Live Broadcasts</h2>
                <span className="px-3 py-1 rounded-full bg-[var(--card)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-muted)] shadow-sm">{displayedStreams.length}</span>
              </div>

              {displayedStreams.length === 0 ? (
                <div className="py-20 text-center bg-[var(--background)] border border-[var(--border-color)] border-dashed rounded-[2rem] flex flex-col items-center justify-center">
                  <Play className="w-10 h-10 text-[var(--text-muted)] mb-3 opacity-50" />
                  <p className="text-[var(--text-muted)] font-medium">No active broadcasts match your search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {displayedStreams.map((stream) => (
                    <div
                      key={stream.stream_id}
                      onClick={() => handleProtectedAction(`/live/${stream.stream_id}`)} 
                      className={`group cursor-pointer flex flex-col overflow-hidden ${CLEAN_CARD} hover:-translate-y-1`}
                    >
                      <div className="relative aspect-video w-full bg-black overflow-hidden rounded-t-[1.9rem]">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6]/20 to-black overflow-hidden">
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
                          <img 
                            src={stream.avatar_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop'} 
                            alt="Cover" 
                            className="w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700"
                          />
                        </div>

                        <div className="absolute top-4 left-4 z-20 bg-red-500 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1.5 uppercase tracking-widest shadow-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span> LIVE
                        </div>

                        {stream.is_premium && (
                          <div className="absolute top-4 right-4 z-20 bg-amber-400 text-amber-950 text-[10px] font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-md">
                            <span>👑</span> {stream.entry_price_coins}
                          </div>
                        )}
                      </div>

                      <div className="p-5 flex gap-4 flex-1">
                        <div className="relative shrink-0">
                          <img
                            src={stream.avatar_url || 'https://via.placeholder.com/150'}
                            alt={stream.name}
                            className="w-12 h-12 rounded-xl object-cover shadow-sm border border-[var(--border-color)]"
                          />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[var(--card)]" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h3 className="text-sm font-bold text-[var(--text-main)] truncate group-hover:text-[#3B82F6] transition-colors">
                            {stream.title}
                          </h3>
                          <p className="text-xs text-[var(--text-muted)] font-medium mt-1 truncate">
                            {stream.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-[10px] font-bold bg-[#3B82F6]/10 text-[#3B82F6] px-2.5 py-1 rounded-md uppercase tracking-wider">
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
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shadow-inner text-amber-500">
                    🌟
                  </div>
                  <h2 className="text-xl font-bold text-[var(--text-main)]">Rising Creators</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedCreators.map((creator) => (
                    <div
                      key={creator.username}
                      onClick={() => navigate(`/user/${creator.username}`)} 
                      className={`group cursor-pointer p-6 flex flex-col justify-between ${CLEAN_CARD} hover:-translate-y-1`}
                    >
                      <div>
                        <div className="flex items-center gap-4">
                          <img
                            src={creator.avatar_url || 'https://via.placeholder.com/150'}
                            alt={creator.name}
                            className="w-14 h-14 rounded-full object-cover border border-[var(--border-color)] shadow-sm group-hover:ring-4 ring-[#3B82F6]/20 transition-all"
                          />
                          <div>
                            <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-1.5">
                              {creator.name}
                              {creator.verified && <BadgeCheck className="w-4 h-4 text-[#3B82F6]" />}
                            </h3>
                            <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">@{creator.username}</p>
                          </div>
                        </div>
                        <p className="text-sm text-[var(--text-muted)] mt-4 line-clamp-2 leading-relaxed font-medium">
                          {creator.headline}
                        </p>
                      </div>

                      <div className="mt-6 flex items-center justify-between pt-5 border-t border-[var(--border-color)]">
                        <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)]">
                          <div className="w-6 h-6 rounded-lg bg-[var(--background)] border border-[var(--border-color)] flex items-center justify-center shadow-sm">
                            <Users className="w-3.5 h-3.5" />
                          </div>
                          {creator.follower_count.toLocaleString()}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#3B82F6] bg-[#3B82F6]/10 px-2.5 py-1.5 rounded-lg">
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
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shadow-inner text-emerald-500">
                    🤝
                  </div>
                  <h2 className="text-xl font-bold text-[var(--text-main)]">1:1 Consultations</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {displayed1on1.map((creator) => (
                    <div
                      key={creator.id}
                      className={`p-6 flex flex-col justify-between ${CLEAN_CARD}`}
                    >
                      <div>
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <img
                              src={creator.avatar}
                              alt={creator.name}
                              className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-[var(--border-color)]"
                            />
                            {creator.isLive && (
                              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[var(--card)] rounded-full"></span>
                            )}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-[var(--text-main)]">
                              {creator.name}
                            </h3>
                            <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">{creator.handle}</p>
                          </div>
                        </div>

                        <p className="text-sm text-[var(--text-muted)] mt-4 line-clamp-2 leading-relaxed font-medium">
                          {creator.bio}
                        </p>

                        <div className="grid grid-cols-3 gap-3 mt-5 bg-[var(--background)] p-3 rounded-2xl shadow-sm border border-[var(--border-color)]">
                          <div className="text-center">
                            <div className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Rate</div>
                            <div className="text-xs font-bold text-amber-500 mt-1">
                              {creator.oneOnOne.priceCoins} 🪙
                            </div>
                          </div>
                          <div className="text-center border-x border-[var(--border-color)]">
                            <div className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Time</div>
                            <div className="text-xs font-bold text-[var(--text-main)] mt-1">
                              {creator.oneOnOne.durationMinutes}m
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Queue</div>
                            <div className="text-xs font-bold text-[#3B82F6] mt-1">
                              {creator.oneOnOne.currentQueueCount}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center gap-4">
                        <button
                          onClick={() => navigate(`/user/${creator.id}`)}
                          className={`flex-1 py-3 text-xs text-center font-bold ${CLAY_BUTTON}`}
                        >
                          Profile
                        </button>
                        <button
                          onClick={() => handleProtectedAction(`/stream/1on1/${creator.id}`)}
                          className={`flex-[2] py-3 text-xs text-center font-bold ${CLAY_BUTTON_ACTIVE}`}
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