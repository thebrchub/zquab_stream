import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Users, BadgeCheck, Search, Play, CalendarClock } from 'lucide-react';
import { streamService, type StreamCard, type DiscoverStreamsChanged } from '../../services/streamService';
import { creatorService, type DiscoverCreator } from '../../services/creatorService';
// import { MOCK_CREATORS } from '../../constants/streamMockData';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket, wsEvents } from '../../context/WebSocketContext';
import { useDebouncedSearch, useDirectoryList } from '../../hooks/usePublicLists';
import PaginationLoader from '../../components/PaginationLoader';

// Without a socket (logged out), how often the live/upcoming lists refresh while the page is visible.
const DISCOVERY_REFRESH_MS = 30_000;
// Public chat room that announces every change to the live/upcoming lists.
const DISCOVER_ROOM = 'discover:streams';
// Creators shown here; the rest are on /creators.
const TOP_CREATORS = 10;

const streamKey = (s: StreamCard) => s.stream_id;
const creatorKey = (c: DiscoverCreator) => c.username;

// Applies a discover_streams_changed message to one list ("live" newest
// first, "upcoming" soonest first) in place: no fetch.
const applyStreamChange = (list: StreamCard[], change: DiscoverStreamsChanged, status: StreamCard['status'], category?: string) => {
  const removed = new Set(change.removed || []);
  const incoming = new Map<string, StreamCard>();
  for (const s of [...(change.added || []), ...(change.updated || [])]) incoming.set(s.stream_id, s);
  const fits = (s: StreamCard) => s.status === status && (!category || s.category === category);

  const next: StreamCard[] = [];
  for (const s of list) {
    if (removed.has(s.stream_id)) continue;
    const fresh = incoming.get(s.stream_id);
    if (fresh) {
      incoming.delete(s.stream_id);
      if (fits(fresh)) next.push(fresh);
      continue;
    }
    next.push(s);
  }
  const added = [...incoming.values()].filter(fits);
  if (added.length === 0) return next;
  if (status === 'live') return [...added, ...next];
  const at = (s: StreamCard) => (s.scheduled_at ? Date.parse(s.scheduled_at) : 0);
  return [...next, ...added].sort((a, b) => at(a) - at(b));
};

// Claymorphism primitives: soft raised surfaces, subtle edge highlights and inset controls.
// Kept theme-aware so the same component works in light and dark mode.
const CLEAN_CARD =
  "bg-[var(--card)] rounded-[2rem] border border-[var(--border-color)] " +
  "shadow-[8px_8px_18px_rgba(0,0,0,0.08),-7px_-7px_18px_rgba(255,255,255,0.72),inset_1px_1px_2px_rgba(255,255,255,0.72)] " +
  "dark:shadow-[8px_8px_18px_rgba(0,0,0,0.34),-4px_-4px_12px_rgba(255,255,255,0.035),inset_1px_1px_2px_rgba(255,255,255,0.045)] " +
  "transition-[box-shadow,border-color] duration-300 ease-out " +
  "hover:shadow-[10px_12px_24px_rgba(0,0,0,0.11),-7px_-7px_18px_rgba(255,255,255,0.78),inset_1px_1px_2px_rgba(255,255,255,0.75)] " +
  "dark:hover:shadow-[10px_12px_24px_rgba(0,0,0,0.4),-4px_-4px_12px_rgba(255,255,255,0.045),inset_1px_1px_2px_rgba(255,255,255,0.055)]";

const CLEAN_INPUT =
  "bg-[var(--card)] border border-[var(--border-color)] rounded-[1.25rem] text-[var(--text-main)] " +
  "shadow-[0_3px_8px_rgba(15,23,42,0.07),0_1px_2px_rgba(15,23,42,0.04),inset_0_1px_1px_rgba(255,255,255,0.85)] " +
  "dark:shadow-[0_4px_10px_rgba(0,0,0,0.28),0_1px_2px_rgba(0,0,0,0.18),inset_0_1px_1px_rgba(255,255,255,0.045)] " +
  "placeholder:text-[var(--text-muted)]/80 focus:outline-none focus:border-[#3B82F6]/60 focus:ring-2 focus:ring-[#3B82F6]/10 " +
  "focus:shadow-[0_4px_12px_rgba(15,23,42,0.08),0_0_0_3px_rgba(59,130,246,0.08)] " +
  "dark:focus:shadow-[0_4px_12px_rgba(0,0,0,0.3),0_0_0_3px_rgba(59,130,246,0.12)] transition-all duration-200";

const TAB_BUTTON =
  "bg-[var(--card)] border border-[var(--border-color)] rounded-full text-[var(--text-muted)] " +
  "shadow-[2px_2px_4px_rgba(0,0,0,0.055),-2px_-2px_4px_rgba(255,255,255,0.58),inset_1px_1px_1px_rgba(255,255,255,0.55)] " +
  "dark:shadow-[2px_2px_4px_rgba(0,0,0,0.24),-1px_-1px_4px_rgba(255,255,255,0.025),inset_1px_1px_1px_rgba(255,255,255,0.035)] " +
  "hover:text-[var(--text-main)] active:scale-[0.98] transition-all duration-200 " +
  "px-5 py-2.5 whitespace-nowrap capitalize text-sm font-semibold";

const TAB_BUTTON_ACTIVE =
  "bg-[#3B82F6] text-white font-bold rounded-full border border-[#3B82F6]/70 " +
  "shadow-[2px_3px_5px_rgba(59,130,246,0.2),inset_1px_1px_3px_rgba(255,255,255,0.3),inset_-1px_-1px_3px_rgba(0,0,0,0.1)] " +
  "dark:shadow-[2px_3px_5px_rgba(0,0,0,0.24),inset_1px_1px_3px_rgba(255,255,255,0.18),inset_-1px_-1px_3px_rgba(0,0,0,0.16)] " +
  "transition-all duration-200 px-5 py-2.5 whitespace-nowrap capitalize text-sm";

// Legacy clay button tokens retained as comments for the disabled 1:1 section
// const CLAY_BUTTON = "bg-[var(--card)] rounded-[1.25rem] border-none text-[var(--text-muted)] hover:text-[var(--text-main)] active:scale-95 transition-all " +
//   "shadow-[4px_4px_10px_rgba(0,0,0,0.06),-4px_-4px_10px_rgba(255,255,255,0.9),inset_1px_1px_2px_rgba(255,255,255,0.8)] " +
//   "dark:shadow-[4px_4px_10px_rgba(0,0,0,0.3),-2px_-2px_8px_rgba(255,255,255,0.02),inset_1px_1px_3px_rgba(255,255,255,0.05)]";

// const CLAY_BUTTON_ACTIVE = "bg-[#3B82F6] text-white font-bold rounded-[1.25rem] border-none transition-all " +
//   "shadow-[4px_4px_12px_rgba(59,130,246,0.3),-4px_-4px_10px_rgba(255,255,255,0.9),inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_4px_rgba(0,0,0,0.1)] " +
//   "dark:shadow-[6px_6px_12px_rgba(0,0,0,0.4),-4px_-4px_10px_rgba(255,255,255,0.03),inset_2px_2px_6px_rgba(255,255,255,0.25),inset_-3px_-3px_6px_rgba(0,0,0,0.2)]";

export const LiveDiscoveryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isConnected, sendMessage } = useWebSocket();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['All', 'gaming', 'chatting', 'music'];
  const apiCategory = selectedCategory === 'All' ? undefined : selectedCategory;
  // 1:1 calls will be enabled in the next release.
  // const creatorsAcceptingCalls = MOCK_CREATORS.filter((c) => c.oneOnOne.enabled);

  const handleProtectedAction = (path: string) => {
    if (!user || user.is_guest) {
      navigate(`/auth?next=${encodeURIComponent(path)}`);
      return;
    }
    navigate(path);
  };

  // Lists from /public (edge-cached), page by page.
  const live = useDirectoryList<StreamCard>(
    (ver, page, signal) => streamService.getStreamsPage('live', apiCategory, ver, page, signal)
      .then((r) => ({ ver: r.ver, has_more: r.has_more, items: r.streams })),
    streamKey, `live:${selectedCategory}`,
  );
  const upcoming = useDirectoryList<StreamCard>(
    (ver, page, signal) => streamService.getStreamsPage('upcoming', apiCategory, ver, page, signal)
      .then((r) => ({ ver: r.ver, has_more: r.has_more, items: r.streams })),
    streamKey, `upcoming:${selectedCategory}`,
  );
  const creators = useDirectoryList<DiscoverCreator>(
    (ver, page, signal) => creatorService.getCreatorsPage(apiCategory, ver, page, signal)
      .then((r) => ({ ver: r.ver, has_more: r.has_more, items: r.creators })),
    creatorKey, `creators:${selectedCategory}`,
  );

  // Search runs on the server (2+ characters, after a short pause).
  const streamSearch = useDebouncedSearch(searchQuery, (q, signal) => streamService.searchStreams(q, signal));
  const creatorSearch = useDebouncedSearch(searchQuery, (q, signal) => creatorService.searchCreators(q, signal));

  // With a socket, join the discover room: every change to the lists arrives
  // as one message and is applied in place. After a reconnect the lists are
  // reloaded once, since changes may have been missed while offline.
  const { reload: reloadLive, setItems: setLiveItems } = live;
  const { reload: reloadUpcoming, setItems: setUpcomingItems } = upcoming;
  const joinedOnceRef = useRef(false);
  useEffect(() => {
    if (!isConnected) return;
    sendMessage('join_room', undefined, DISCOVER_ROOM);
    if (joinedOnceRef.current) {
      reloadLive();
      reloadUpcoming();
    }
    joinedOnceRef.current = true;
    return () => {
      sendMessage('leave_room', undefined, DISCOVER_ROOM);
    };
  }, [isConnected, sendMessage, reloadLive, reloadUpcoming]);

  useEffect(() => wsEvents.subscribe((msg) => {
    if (msg?.type !== 'discover_streams_changed' || !msg.payload || msg.payload instanceof Uint8Array) return;
    const change = msg.payload as DiscoverStreamsChanged;
    setLiveItems((prev) => applyStreamChange(prev, change, 'live', apiCategory));
    setUpcomingItems((prev) => applyStreamChange(prev, change, 'upcoming', apiCategory));
  }), [apiCategory, setLiveItems, setUpcomingItems]);

  // Without a socket (logged out), refresh every 30s while visible and on return to the tab.
  useEffect(() => {
    if (isConnected) return;
    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      reloadLive();
      reloadUpcoming();
    };
    const timer = window.setInterval(refresh, DISCOVERY_REFRESH_MS);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [isConnected, reloadLive, reloadUpcoming]);

  const inCategory = <T extends { category: string }>(items: T[]) =>
    apiCategory ? items.filter((i) => i.category === apiCategory) : items;
  const displayedStreams = streamSearch.active
    ? inCategory(streamSearch.results.filter((s) => s.status === 'live'))
    : live.items;
  const displayedUpcomingStreams = streamSearch.active
    ? inCategory(streamSearch.results.filter((s) => s.status === 'upcoming'))
    : upcoming.items;
  const displayedCreators = (creatorSearch.active ? inCategory(creatorSearch.results) : creators.items).slice(0, TOP_CREATORS);
  const isLoading = streamSearch.active
    ? streamSearch.isSearching
    : live.isLoading && live.items.length === 0;
  const seeAllCreators = `/creators${apiCategory ? `?category=${encodeURIComponent(apiCategory)}` : ''}`;
  // 1:1 calls will be enabled in the next release.
  // const displayed1on1 = creatorsAcceptingCalls.filter(c => 
  //   c.name.toLowerCase().includes(query) || c.handle.toLowerCase().includes(query)
  // );

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] pb-20 transition-colors duration-300 font-sans selection:bg-[#3B82F6]/30">
      
      <section className="px-4 sm:px-6 pt-8 pb-10">
        <div className={`max-w-7xl mx-auto p-7 sm:p-10 md:p-12 relative overflow-hidden ${CLEAN_CARD} bg-gradient-to-br from-[var(--card)] via-[var(--card)] to-[#3B82F6]/[0.07] dark:to-[#3B82F6]/[0.12]`}>
          
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
                {/* 1:1 calls will be enabled in the next release; then restore "enter private 1:1 queues" here. */}
                Join live creator rooms or jump into global chats instantly.
              </p>
            </div>

            {/* 🚀 REMOVED AUTH BOUNCER: Let guest users jump straight into chat */}
            <button
              onClick={() => navigate('/chat')} 
              className="group flex items-center gap-4 px-6 py-4 rounded-[1.5rem] bg-[#3B82F6] hover:brightness-110 text-white transition-all active:scale-95 border-none
              shadow-[7px_8px_16px_rgba(59,130,246,0.25),-5px_-5px_14px_rgba(255,255,255,0.78),inset_2px_2px_5px_rgba(255,255,255,0.38),inset_-2px_-2px_5px_rgba(0,0,0,0.12)]
              dark:shadow-[7px_8px_16px_rgba(0,0,0,0.38),-3px_-3px_10px_rgba(255,255,255,0.04),inset_2px_2px_5px_rgba(255,255,255,0.22),inset_-2px_-2px_5px_rgba(0,0,0,0.2)]"
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

          <div className="flex items-center gap-3 overflow-x-auto pb-3 sm:pb-1 custom-scrollbar px-1 pt-1">
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
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shadow-[inset_2px_2px_5px_rgba(0,0,0,0.08),inset_-2px_-2px_5px_rgba(255,255,255,0.55)] dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.22),inset_-1px_-1px_4px_rgba(255,255,255,0.035)]">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                </div>
                <h2 className="text-xl font-bold text-[var(--text-main)]">Live Broadcasts</h2>
                <span className="px-3 py-1 rounded-full bg-[var(--card)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-muted)] rounded-full shadow-[3px_3px_7px_rgba(0,0,0,0.07),-3px_-3px_7px_rgba(255,255,255,0.65)] dark:shadow-[3px_3px_7px_rgba(0,0,0,0.28),-2px_-2px_6px_rgba(255,255,255,0.03)]">{displayedStreams.length}</span>
              </div>

              {displayedStreams.length === 0 ? (
                <div className="py-20 text-center bg-[var(--background)] border border-[var(--border-color)] border-dashed rounded-[2rem] flex flex-col items-center justify-center shadow-[inset_4px_4px_10px_rgba(0,0,0,0.055),inset_-4px_-4px_10px_rgba(255,255,255,0.68)] dark:shadow-[inset_4px_4px_10px_rgba(0,0,0,0.24),inset_-3px_-3px_8px_rgba(255,255,255,0.025)]">
                  <Play className="w-10 h-10 text-[var(--text-muted)] mb-3 opacity-50" />
                  <p className="text-[var(--text-muted)] font-medium">No active broadcasts match your search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {displayedStreams.map((stream) => (
                    <div
                      key={stream.stream_id}
                      onClick={() => stream.is_premium
                        ? handleProtectedAction(`/live/${stream.stream_id}`)
                        : navigate(`/live/${stream.stream_id}`)} 
                      className={`group cursor-pointer flex flex-col overflow-hidden ${CLEAN_CARD}`}
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
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span> {stream.is_paused ? 'PAUSED' : 'LIVE'}
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
                            className="w-12 h-12 rounded-xl object-cover border border-[var(--border-color)] shadow-[3px_3px_7px_rgba(0,0,0,0.12),-2px_-2px_6px_rgba(255,255,255,0.5)] dark:shadow-[3px_3px_7px_rgba(0,0,0,0.3),-1px_-1px_5px_rgba(255,255,255,0.035)]"
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
              {!streamSearch.active && (
                <PaginationLoader onLoadMore={live.loadMore} hasMore={live.hasMore} isLoading={live.isLoading} />
              )}
            </section>

            {/* --- Section: Upcoming Streams --- */}
            {displayedUpcomingStreams.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6 px-2">
                  <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center shadow-[inset_2px_2px_5px_rgba(0,0,0,0.07),inset_-2px_-2px_5px_rgba(255,255,255,0.6)] dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2),inset_-1px_-1px_4px_rgba(255,255,255,0.035)] text-[#3B82F6]">
                    <CalendarClock className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-[var(--text-main)]">Upcoming Broadcasts</h2>
                  <span className="px-3 py-1 rounded-full bg-[var(--card)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-muted)] rounded-full shadow-[3px_3px_7px_rgba(0,0,0,0.07),-3px_-3px_7px_rgba(255,255,255,0.65)] dark:shadow-[3px_3px_7px_rgba(0,0,0,0.28),-2px_-2px_6px_rgba(255,255,255,0.03)]">{displayedUpcomingStreams.length}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {displayedUpcomingStreams.map((stream) => (
                    <div
                      key={stream.stream_id}
                      onClick={() => navigate(`/user/${stream.username}`)}
                      className={`group cursor-pointer flex flex-col overflow-hidden ${CLEAN_CARD}`}
                    >
                      <div className="relative aspect-video w-full bg-black overflow-hidden rounded-t-[1.9rem]">
                        <img
                          src={stream.avatar_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop'}
                          alt="Cover"
                          className="w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700"
                        />
                        <div className="absolute top-4 left-4 bg-[#3B82F6] text-white text-[10px] font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1.5 uppercase tracking-widest shadow-md">
                          <CalendarClock className="w-3 h-3" /> Upcoming
                        </div>
                      </div>

                      <div className="p-5 flex gap-4 flex-1">
                        <img
                          src={stream.avatar_url || 'https://via.placeholder.com/150'}
                          alt={stream.name}
                          className="w-12 h-12 rounded-xl object-cover border border-[var(--border-color)] shadow-[3px_3px_7px_rgba(0,0,0,0.12),-2px_-2px_6px_rgba(255,255,255,0.5)] dark:shadow-[3px_3px_7px_rgba(0,0,0,0.3),-1px_-1px_5px_rgba(255,255,255,0.035)]"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-[var(--text-main)] truncate group-hover:text-[#3B82F6] transition-colors">{stream.title}</h3>
                          <p className="text-xs text-[var(--text-muted)] font-medium mt-1 truncate">{stream.name}</p>
                          <p className="text-xs text-[#3B82F6] font-bold mt-2">{new Date(stream.scheduled_at ?? '').toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {!streamSearch.active && (
                  <PaginationLoader onLoadMore={upcoming.loadMore} hasMore={upcoming.hasMore} isLoading={upcoming.isLoading} />
                )}
              </section>
            )}

            {/* --- Section: Discover Creators --- */}
            {displayedCreators.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6 px-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shadow-[inset_2px_2px_5px_rgba(0,0,0,0.07),inset_-2px_-2px_5px_rgba(255,255,255,0.6)] dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2),inset_-1px_-1px_4px_rgba(255,255,255,0.035)] text-amber-500">
                    🌟
                  </div>
                  <h2 className="text-xl font-bold text-[var(--text-main)]">Rising Creators</h2>
                  <Link to={seeAllCreators} className="ml-auto text-xs font-bold text-[#3B82F6]">
                    See all creators →
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedCreators.map((creator) => (
                    <div
                      key={creator.username}
                      onClick={() => navigate(`/user/${creator.username}`)} 
                      className={`group cursor-pointer p-6 flex flex-col justify-between ${CLEAN_CARD}`}
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
                          <div className="w-6 h-6 rounded-lg bg-[var(--background)] border border-[var(--border-color)] flex items-center justify-center shadow-[inset_1px_1px_2px_rgba(255,255,255,0.65),2px_2px_5px_rgba(0,0,0,0.06)] dark:shadow-[inset_1px_1px_2px_rgba(255,255,255,0.04),2px_2px_5px_rgba(0,0,0,0.25)]">
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

            {/* --- Section: 1:1 Creator Interactions (will be enabled in the next release) ---
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
                              className="w-14 h-14 rounded-2xl object-cover border border-[var(--border-color)] shadow-[3px_3px_7px_rgba(0,0,0,0.12),-2px_-2px_6px_rgba(255,255,255,0.5)] dark:shadow-[3px_3px_7px_rgba(0,0,0,0.3),-1px_-1px_5px_rgba(255,255,255,0.035)]"
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
            )} */}

          </div>
        )}
      </main>
    </div>
  );
};