import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../api/users';
import { friendsApi } from '../api/friends';
import { useRooms } from '../context/RoomsContext';
import UserCard from '../components/UserCard';
import PaginationLoader from '../components/PaginationLoader';
import { Users, UserPlus, Search, Check, X, Loader2 } from 'lucide-react';

type Tab = 'friends' | 'requests' | 'blocked' | 'search';

export default function FriendsHub() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  
  // 🛠️ UNIFICATION: The brain connection
  const { friendRequests, setFriendRequests } = useRooms();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  const LIMIT = 15;

  const fetchData = async (reset = false) => {
    // Abort redundant network fetch if requests tab is open
    if (activeTab === 'requests') return;

    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
        setHasMore(true);
        setData([]); 
      }
      
      const currentOffset = reset ? 0 : offset;
      let results: any[] = [];

      if (activeTab === 'friends') {
        results = await friendsApi.getFriends(LIMIT, currentOffset);
      } else if (activeTab === 'blocked') {
        results = await friendsApi.getBlockedUsers(LIMIT, currentOffset);
      } else if (activeTab === 'search' && searchQuery.trim()) {
        results = await usersApi.searchUsers(searchQuery);
        setHasMore(false); 
      }

      setData(prev => reset ? results : [...prev, ...results]);
      if (results.length < LIMIT && activeTab !== 'search') setHasMore(false);
      setOffset(currentOffset + LIMIT);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'requests') {
      // Data is natively available via Context
    } else if (activeTab !== 'search' || searchQuery) {
      fetchData(true);
    } else {
      setData([]);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'search') return;
    const timer = setTimeout(() => {
      if (searchQuery.trim()) fetchData(true);
      else setData([]);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAction = async (action: () => Promise<void>, username: string, isRequestTab: boolean) => {
    try {
      if (isRequestTab) {
        setFriendRequests(prev => prev.filter(u => u.username !== username));
      } else {
        setData(prev => prev.filter(u => u.username !== username));
      }
      await action();
    } catch (error) {
      alert('Action failed. Please try again.');
    }
  };

  // 🛠️ Render Mapping
  const displayData = activeTab === 'requests' ? friendRequests : data;
  const isDisplayLoading = activeTab === 'requests' ? false : loading;
  const currentHasMore = activeTab === 'requests' ? false : hasMore;

  return (
    <div className="max-w-3xl mx-auto w-full p-4 md:p-6 pb-20 flex flex-col h-[100dvh]">
      <h1 className="text-2xl font-bold text-[var(--text-main)] mb-6">Friends Hub</h1>

      <div className="flex overflow-x-auto custom-scrollbar gap-4 mb-6 pb-2 flex-shrink-0 px-2">
        {[
          { id: 'friends', icon: Users, label: 'My Friends' },
          { id: 'requests', icon: UserPlus, label: 'Requests' },
          { id: 'search', icon: Search, label: 'Find Friends' },
        ].map(tab => (
          <button aria-label="Tabs"
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex items-center gap-2 px-5 py-3 rounded-[1.25rem] font-bold text-sm transition-all duration-200 whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-[#4F46E5] text-white shadow-[6px_6px_12px_rgba(0,0,0,0.4),-4px_-4px_10px_rgba(255,255,255,0.03),inset_2px_2px_6px_rgba(255,255,255,0.25),inset_-3px_-3px_6px_rgba(0,0,0,0.2)]' 
                : 'bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--text-main)] border-none shadow-[4px_4px_10px_rgba(0,0,0,0.3),-2px_-2px_8px_rgba(255,255,255,0.02),inset_1px_1px_4px_rgba(255,255,255,0.05)] hover:brightness-110'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'search' && (
        <div className="mb-6 flex-shrink-0 px-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username..."
              className="w-full bg-[var(--background)] rounded-[1.25rem] pl-12 pr-4 py-4 text-[var(--text-main)] outline-none transition-all border-none shadow-[inset_4px_4px_8px_rgba(0,0,0,0.5),inset_-2px_-2px_6px_rgba(255,255,255,0.03)] focus:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-2px_-2px_6px_rgba(255,255,255,0.05),0_0_0_2px_rgba(79,70,229,0.3)]"
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-4">
        {isDisplayLoading && displayData.length === 0 ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin" /></div>
        ) : displayData.length === 0 ? (
          <div className="text-center py-10 text-[var(--text-muted)] bg-[var(--background)] shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3),inset_-2px_-2px_6px_rgba(255,255,255,0.02)] rounded-[2rem]">
            <p className="font-medium">Nothing to show here.</p>
          </div>
        ) : (
          displayData.map((user) => (
            <UserCard
              key={user.id || user.request_id}
              user={{
                ...user,
                subtitle: activeTab === 'friends' ? `Friends since ${new Date(user.friends_since).getFullYear()}` : 
                          activeTab === 'blocked' ? 'Blocked' : undefined
              }}
              onClick={() => navigate(`/user/${user.username}`)}
              actionButton={
                activeTab === 'requests' ? (
                  <div className="flex gap-3">
                    <button aria-label="Accept"
                      onClick={(e) => { e.stopPropagation(); handleAction(() => friendsApi.acceptRequest(user.username), user.username, true); }}
                      className="p-3 bg-[#4F46E5] text-white rounded-xl transition-all duration-200 shadow-[4px_4px_10px_rgba(0,0,0,0.4),-2px_-2px_8px_rgba(255,255,255,0.03),inset_1px_1px_4px_rgba(255,255,255,0.25),inset_-2px_-2px_4px_rgba(0,0,0,0.2)] hover:brightness-110 active:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.4)]"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button aria-label="Cancel"
                      onClick={(e) => { e.stopPropagation(); handleAction(() => friendsApi.rejectRequest(user.username), user.username, true); }}
                      className="p-3 bg-[var(--card)] text-[var(--text-main)] rounded-xl transition-all duration-200 shadow-[4px_4px_10px_rgba(0,0,0,0.3),-2px_-2px_8px_rgba(255,255,255,0.02),inset_1px_1px_4px_rgba(255,255,255,0.05)] hover:text-red-500 hover:shadow-[4px_4px_10px_rgba(239,68,68,0.2),inset_1px_1px_4px_rgba(255,255,255,0.05)] active:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.4)]"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : activeTab === 'blocked' ? (
                  <button aria-label="unblock"
                    onClick={(e) => { e.stopPropagation(); handleAction(() => friendsApi.unblockUser(user.username), user.username, false); }}
                    className="px-5 py-2.5 bg-[var(--card)] text-[var(--text-main)] rounded-xl text-sm font-bold transition-all duration-200 shadow-[4px_4px_10px_rgba(0,0,0,0.3),-2px_-2px_8px_rgba(255,255,255,0.02),inset_1px_1px_4px_rgba(255,255,255,0.05)] hover:brightness-110 active:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.4)]"
                  >
                    Unblock
                  </button>
                ) : null
              }
            />
          ))
        )}
        {activeTab !== 'requests' && (
          <PaginationLoader onLoadMore={() => fetchData()} hasMore={currentHasMore} isLoading={loading} />
        )}
      </div>
    </div>
  );
}