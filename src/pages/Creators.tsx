import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BadgeCheck, Sparkles, Video, Gamepad2, Headphones, Hash, ArrowRight, Search } from 'lucide-react';
// Assuming this is the path to your modal component
// import CreatorApplicationModal from '../components/CreatorApplicationModal';

// --- MOCK DATA ---
const CATEGORIES = ['All', 'Gaming', 'Just Chatting', 'Music', 'Tech & Code'];

const MOCK_CREATORS = [
  {
    id: 1,
    name: 'Sarah Drasner',
    handle: '@sarah_codes',
    avatar: 'https://i.pravatar.cc/150?u=sarah',
    bio: 'Building the future of web dev. Let\'s talk about React, animations, and clean architecture.',
    category: 'Tech & Code',
    isLive: true,
    acceptingCalls: true,
    price: '250',
  },
  {
    id: 2,
    name: 'Alex Chen',
    handle: '@alexc_plays',
    avatar: 'https://i.pravatar.cc/150?u=alex',
    bio: 'Top 500 Valorant | Coffee addict | Streaming every night at 8 PM EST.',
    category: 'Gaming',
    isLive: false,
    acceptingCalls: true,
    price: '150',
  },
  {
    id: 3,
    name: 'Marcus Vibez',
    handle: '@marcus_v',
    avatar: 'https://i.pravatar.cc/150?u=marcus',
    bio: 'Music production, beat breakdowns, and live mixing sessions.',
    category: 'Music',
    isLive: true,
    acceptingCalls: false,
    price: null,
  },
  {
    id: 4,
    name: 'Elena Rose',
    handle: '@elenatalks',
    avatar: 'https://i.pravatar.cc/150?u=elena',
    bio: 'Late night chats, advice, and hanging out. Welcome to the cozy corner.',
    category: 'Just Chatting',
    isLive: false,
    acceptingCalls: true,
    price: '100',
  },
];

export default function Creators() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter by both Category AND Search Query
  const filteredCreators = MOCK_CREATORS.filter(c => {
    const matchesCategory = activeCategory === 'All' || c.category === activeCategory;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.handle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Helper for category icons
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Gaming': return <Gamepad2 className="w-4 h-4" />;
      case 'Music': return <Headphones className="w-4 h-4" />;
      case 'Tech & Code': return <Hash className="w-4 h-4" />;
      case 'Just Chatting': return <Video className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen pt-16 md:pt-20 pb-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
      
      {/* HERO SECTION - Margin reduced to bring heading up */}
      <div className="flex flex-col items-center text-center mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[var(--text-main)] tracking-tight mb-6">
            Meet the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F46E5] to-[#818CF8]">Creators</span>
          </h1>
          <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
            Connect with verified hosts, gamers, and experts. Join their live rooms or book exclusive 1-on-1 sessions.
          </p>
        </motion.div>
      </div>

      {/* CONTROL BAR: Search & Apply Button */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
        
        {/* Search Input */}
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search creators by name or handle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--background)] text-[var(--text-main)] pl-12 pr-4 py-3.5 rounded-full border border-[var(--border-color)] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-1px_-1px_3px_rgba(255,255,255,0.02)] focus:outline-none focus:border-[#4F46E5] transition-colors text-sm font-medium placeholder:text-[var(--text-muted)]"
          />
        </div>

        {/* Repositioned Apply Button */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="group w-full md:w-auto flex items-center justify-center gap-2 bg-[var(--card)] text-[var(--text-main)] px-6 py-3.5 rounded-full font-bold transition-all duration-200 active:scale-95 text-sm border border-[var(--border-color)] shadow-[4px_4px_10px_rgba(0,0,0,0.3),-2px_-2px_6px_rgba(255,255,255,0.02),inset_1px_1px_3px_rgba(255,255,255,0.1),inset_-1px_-1px_3px_rgba(0,0,0,0.2)] hover:text-[#4F46E5]"
        >
          Apply to be a Creator
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

      </div>

      {/* CATEGORY FILTERS */}
      <div className="flex overflow-x-auto pb-6 mb-8 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-3 sm:gap-4 mx-auto md:mx-0">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all whitespace-nowrap border ${
                activeCategory === category
                  ? 'bg-[#4F46E5] text-white border-[#4F46E5] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.4)]'
                  : 'bg-[var(--card)] text-[var(--text-muted)] border-[var(--border-color)] shadow-[4px_4px_10px_rgba(0,0,0,0.3),-2px_-2px_6px_rgba(255,255,255,0.02),inset_1px_1px_2px_rgba(255,255,255,0.05),inset_-1px_-1px_2px_rgba(0,0,0,0.2)] hover:text-[var(--text-main)]'
              }`}
            >
              {getCategoryIcon(category)}
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* CREATOR GRID */}
      <motion.div 
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8"
      >
        <AnimatePresence>
          {filteredCreators.map((creator, index) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              key={creator.id}
              className="flex flex-col bg-[var(--card)] border border-[var(--border-color)] rounded-[2rem] p-6 shadow-[8px_8px_20px_rgba(0,0,0,0.4),-4px_-4px_10px_rgba(255,255,255,0.02),inset_1px_1px_3px_rgba(255,255,255,0.1),inset_-1px_-1px_3px_rgba(0,0,0,0.2)] relative group"
            >
              {/* Live Indicator Badge */}
              {creator.isLive && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-red-500/20 shadow-sm z-10">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                  Live Now
                </div>
              )}

              {/* Profile Header */}
              <div className="flex flex-col items-center mt-4 mb-4">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-[#4F46E5] to-[#818CF8] shadow-lg">
                    <img 
                      src={creator.avatar} 
                      alt={creator.name} 
                      className="w-full h-full rounded-full object-cover border-4 border-[var(--card)]"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 text-xl font-black text-[var(--text-main)]">
                  {creator.name}
                  <BadgeCheck className="w-5 h-5 text-[#4F46E5]" />
                </div>
                <span className="text-sm font-bold text-[var(--text-muted)] mt-1">{creator.handle}</span>
              </div>

              {/* Bio & Tags */}
              <p className="text-sm text-[var(--text-muted)] text-center line-clamp-3 mb-6 flex-grow leading-relaxed">
                {creator.bio}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 mt-auto">
                {creator.acceptingCalls ? (
                  <button className="w-full flex items-center justify-center gap-2 bg-[#4F46E5] text-white py-3 px-4 rounded-xl font-bold transition-transform active:scale-95 text-sm shadow-[4px_4px_10px_rgba(0,0,0,0.4),-2px_-2px_6px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(255,255,255,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.4)] hover:shadow-[2px_2px_6px_rgba(0,0,0,0.4),-1px_-1px_4px_rgba(255,255,255,0.05),inset_1px_1px_3px_rgba(255,255,255,0.3),inset_-1px_-1px_3px_rgba(0,0,0,0.4)]">
                    <Video className="w-4 h-4" />
                    Request 1-on-1 • {creator.price} zCoins
                  </button>
                ) : (
                  <button className="w-full py-3 px-4 rounded-xl font-bold text-[var(--text-muted)] bg-[var(--background)] border border-[var(--border-color)] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.02)] cursor-not-allowed text-sm">
                    Not taking calls
                  </button>
                )}
                
                <button className="w-full py-3 px-4 rounded-xl font-bold text-[var(--text-main)] hover:bg-[var(--text-main)]/5 transition-colors text-sm border border-transparent hover:border-[var(--border-color)]">
                  View Profile
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State Fallback */}
      {filteredCreators.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 opacity-50"
        >
          <Search className="w-12 h-12 mb-4 text-[var(--text-muted)]" />
          <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">No creators found</h3>
          <p className="text-[var(--text-muted)] text-center">We couldn't find anyone matching "{searchQuery}".<br/>Try a different name or category.</p>
        </motion.div>
      )}

      {/* MODAL INTEGRATION */}
      {/* 
        <CreatorApplicationModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        /> 
      */}

    </div>
  );
}