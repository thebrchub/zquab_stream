import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Gamepad2, Hash, Headphones, Loader2, Search, Sparkles, Video } from 'lucide-react';
import { creatorService, type DiscoverCreator } from '../services/creatorService';
import { streamService, type StreamCard } from '../services/streamService';
import { useAuth } from '../context/AuthContext';
import { useDebouncedSearch, useDirectoryList } from '../hooks/usePublicLists';
import PaginationLoader from '../components/PaginationLoader';
import { CreatorApplicationModal } from '../components/studio/CreatorApplicationModal';

const CATEGORIES = [
  { id: '', label: 'All' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'chatting', label: 'Just Chatting' },
  { id: 'music', label: 'Music' },
  { id: 'art', label: 'Art' },
];

const creatorKey = (creator: DiscoverCreator) => creator.username;
const streamKey = (stream: StreamCard) => stream.stream_id;

export default function Creators() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [params, setParams] = useSearchParams();
  const activeCategory = params.get('category') || '';
  const searchQuery = params.get('q') || '';
  const isCreator = user?.is_creator === true;

  const setParam = (key: string, value: string) => {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    }, { replace: true });
  };

  const directory = useDirectoryList<DiscoverCreator>(
    (ver, page, signal) => creatorService.getCreatorsPage(activeCategory || undefined, ver, page, signal)
      .then((response) => ({ ver: response.ver, has_more: response.has_more, items: response.creators })),
    creatorKey,
    `creators:${activeCategory}`,
  );
  const search = useDebouncedSearch(searchQuery, (query, signal) => creatorService.searchCreators(query, signal));
  const liveNow = useDirectoryList<StreamCard>(
    (ver, page, signal) => streamService.getStreamsPage('live', undefined, ver, page, signal)
      .then((response) => ({ ver: response.ver, has_more: response.has_more, items: response.streams })),
    streamKey,
    'live',
  );
  const liveUsernames = new Set(liveNow.items.map((stream) => stream.username));
  const creators = search.active
    ? search.results.filter((creator) => !activeCategory || creator.category === activeCategory)
    : directory.items;
  const isLoading = search.active
    ? search.isSearching
    : directory.isLoading && directory.items.length === 0;

  const openApplication = () => {
    if (!user || user.is_guest) {
      navigate(`/auth?next=${encodeURIComponent('/creators')}`);
      return;
    }
    setIsModalOpen(true);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'gaming': return <Gamepad2 className="w-4 h-4" />;
      case 'music': return <Headphones className="w-4 h-4" />;
      case 'art': return <Hash className="w-4 h-4" />;
      case 'chatting': return <Video className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden">
      <div className="min-h-[100dvh] pt-20 md:pt-24 pb-24 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto flex flex-col">
        <div className="flex flex-col items-center text-center mb-10 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[var(--text-main)] tracking-tight mb-6">
              Meet the{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F46E5] to-[#818CF8]">
                Creators
              </span>
            </h1>
            <p className="text-sm sm:text-lg text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
              Connect with verified hosts, gamers, and experts. Follow them and join their live rooms.
            </p>
          </motion.div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 w-full">
          <div className="relative w-full md:w-[400px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search creators..."
              value={searchQuery}
              maxLength={40}
              onChange={(event) => setParam('q', event.target.value)}
              className="w-full bg-[var(--card)] text-[var(--text-main)] pl-12 pr-4 py-3.5 rounded-full border border-[var(--border-color)] shadow-[0_3px_8px_rgba(15,23,42,0.07),0_1px_2px_rgba(15,23,42,0.04),inset_0_1px_1px_rgba(255,255,255,0.85)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.28),0_1px_2px_rgba(0,0,0,0.18),inset_0_1px_1px_rgba(255,255,255,0.045)] placeholder:text-[var(--text-muted)]/80 focus:outline-none focus:border-[#4F46E5]/70 focus:ring-2 focus:ring-[#4F46E5]/10 focus:shadow-[0_4px_12px_rgba(15,23,42,0.08),0_0_0_3px_rgba(79,70,229,0.08)] dark:focus:shadow-[0_4px_12px_rgba(0,0,0,0.3),0_0_0_3px_rgba(79,70,229,0.12)] transition-all duration-200 text-sm font-medium"
            />
          </div>

          {!isCreator && (
            <motion.button
              type="button"
              onClick={openApplication}
              whileTap={{ scale: 0.97 }}
              className="group w-full md:w-auto flex items-center justify-center gap-2 bg-[var(--card)] text-[var(--text-main)] px-6 py-3.5 rounded-full font-bold text-sm border border-[var(--border-color)] shadow-[4px_4px_10px_rgba(0,0,0,0.3),-2px_-2px_6px_rgba(255,255,255,0.02),inset_1px_1px_3px_rgba(255,255,255,0.1),inset_-1px_-1px_3px_rgba(0,0,0,0.2)] hover:text-[#4F46E5] transition-all duration-200"
            >
              Apply to be a Creator
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          )}
        </div>

        <div className="w-full overflow-x-auto pb-4 pt-1 mb-8 hide-scrollbar">
          <div className="flex items-center gap-2 sm:gap-4 w-max pr-4">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setParam('category', category.id)}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all whitespace-nowrap border ${
                  activeCategory === category.id
                    ? 'bg-[#4F46E5] text-white border-[#4F46E5] shadow-[0_2px_5px_rgba(79,70,229,0.18),inset_1px_1px_3px_rgba(255,255,255,0.24),inset_-1px_-1px_3px_rgba(0,0,0,0.2)]'
                    : 'bg-[var(--card)] text-[var(--text-muted)] border-[var(--border-color)] shadow-[0_2px_5px_rgba(15,23,42,0.09),inset_1px_1px_2px_rgba(255,255,255,0.5)] dark:shadow-[0_2px_5px_rgba(0,0,0,0.22),inset_1px_1px_2px_rgba(255,255,255,0.035)] hover:text-[var(--text-main)]'
                }`}
              >
                {getCategoryIcon(category.id)}
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20 w-full">
            <Loader2 className="w-10 h-10 text-[#4F46E5] animate-spin" />
          </div>
        ) : (
          <>
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 w-full"
            >
              <AnimatePresence>
                {creators.map((creator, index) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: Math.min(index % 20, 10) * 0.05 }}
                    key={creator.username}
                    className="flex flex-col bg-[var(--card)] border border-[var(--border-color)] rounded-[2rem] p-6 shadow-[0_3px_10px_rgba(15,23,42,0.07),0_1px_3px_rgba(15,23,42,0.04),inset_0_1px_1px_rgba(255,255,255,0.65)] dark:shadow-[0_5px_14px_rgba(0,0,0,0.22),0_1px_3px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.035)] relative group"
                  >
                    {liveUsernames.has(creator.username) && (
                      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-red-500/20 shadow-sm z-10">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                        Live Now
                      </div>
                    )}

                    <div className="flex flex-col items-center mt-4 mb-4">
                      <div className="relative mb-4">
                        <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-[#4F46E5] to-[#818CF8] shadow-lg">
                          <img
                            src={creator.avatar_url || 'https://via.placeholder.com/150'}
                            alt={creator.name}
                            className="w-full h-full rounded-full object-cover border-4 border-[var(--card)]"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xl font-black text-[var(--text-main)]">
                        {creator.name || creator.username}
                        {creator.verified && <BadgeCheck className="w-5 h-5 text-[#4F46E5]" />}
                      </div>
                      <span className="text-sm font-bold text-[var(--text-muted)] mt-1">@{creator.username}</span>
                      <span className="text-sm font-bold text-[var(--text-muted)] mt-1">
                        {creator.follower_count.toLocaleString()} followers
                        {creator.category ? ` · ${creator.category}` : ''}
                      </span>
                    </div>

                    <p className="text-sm text-[var(--text-muted)] text-center line-clamp-3 mb-6 flex-grow leading-relaxed">
                      {creator.headline}
                    </p>

                    <div className="flex flex-col gap-3 mt-auto">
                      <button
                        type="button"
                        onClick={() => navigate(`/user/${creator.username}`)}
                        className="w-full py-3 px-4 rounded-xl font-bold text-[var(--text-main)] hover:bg-[var(--text-main)]/5 transition-colors text-sm border border-transparent hover:border-[var(--border-color)]"
                      >
                        View Profile
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {!search.active && (
              <PaginationLoader
                onLoadMore={directory.loadMore}
                hasMore={directory.hasMore}
                isLoading={directory.isLoading}
              />
            )}

            {!search.active && !directory.hasMore && creators.length > 0 && (
              <p className="text-[var(--text-muted)] text-center py-6 w-full">That's everyone.</p>
            )}

            {creators.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 opacity-50 w-full"
              >
                <Search className="w-12 h-12 mb-4 text-[var(--text-muted)]" />
                <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">No creators found</h3>
                <p className="text-[var(--text-muted)] text-center">
                  {search.active
                    ? <>We couldn't find anyone matching "{searchQuery}".<br />Try a different name or category.</>
                    : 'No creators in this category yet.'}
                </p>
              </motion.div>
            )}
          </>
        )}

        {user && !isCreator && (
          <CreatorApplicationModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            username={user.username || ''}
          />
        )}
      </div>
    </div>
  );
}
