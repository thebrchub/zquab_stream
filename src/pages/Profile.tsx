import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../api/users';
import { friendsApi } from '../api/friends';
import { useAuth } from '../context/AuthContext';
import { useRooms } from '../context/RoomsContext';
import { useWallet } from '../context/WalletContext'; 
import UserCard from '../components/UserCard';
import PaginationLoader from '../components/PaginationLoader';
import { ALL_COUNTRIES } from '../constants/countries'; 
import { 
  Loader2, Save, User, AtSign, AlignLeft, 
  Users, MessageSquare, Edit2, X, MapPin, Activity,
  LogOut, UserPlus, Search, Check, Share2, CheckCircle2, Lock, RefreshCw, ChevronDown,
  Video, Star, Clock, Plus 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createAvatar } from '@dicebear/core';
import { lorelei } from '@dicebear/collection';
import { CreatorApplicationModal } from '../components/studio/CreatorApplicationModal';
import { createZAvatarURL, MAX_AVATAR_URL_LENGTH, MAX_USERNAME_LENGTH } from '../utils/avatar';

const GENDER_OPTIONS = ['Prefer not to say', 'Male', 'Female', 'Other'];
type Tab = 'friends' | 'requests' | 'search' | 'blocked';

export default function Profile() {
  const navigate = useNavigate();
  const { user: authUser, logout: logoutUser, refreshSession } = useAuth();
  
  const { friendRequests, setFriendRequests } = useRooms();
  const { balanceCoins, openPurchaseModal } = useWallet();

  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false); 

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('Any');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [age, setAge] = useState(''); 
  const [country, setCountry] = useState(''); 
  const [hasExistingUsername, setHasExistingUsername] = useState(false);

  const [isCountryLocked, setIsCountryLocked] = useState(true); 
  const [isDetectingCountry, setIsDetectingCountry] = useState(false);
  const [showCreatorModal, setShowCreatorModal] = useState(false);

  const [zAvatarRequested, setZAvatarRequested] = useState(false);
  const [avatarVariant, setAvatarVariant] = useState(0);

  const avatarPreview = useMemo(() => {
    if (!zAvatarRequested) return profile?.avatar_url || null;
    if (!username) return null;
    return createAvatar(lorelei, {
      seed: `${username}-${avatarVariant}`,
      size: 128,
      backgroundColor: ["b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf"]
    }).toDataUri();
  }, [username, avatarVariant, zAvatarRequested, profile?.avatar_url]);

  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [networkData, setNetworkData] = useState<any[]>([]);
  const [networkLoading, setNetworkLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const LIMIT = 15;

  useEffect(() => {
    if (authUser && !authUser.is_guest && authUser.user_id !== 'dev_mock_999') {
      refreshSession().catch(console.error);
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (authUser?.is_guest) {
        setProfileLoading(false);
        return;
      }

      if (authUser?.user_id === 'dev_mock_999') {
        setProfile(authUser);
        setUsername(authUser.username || '');
        setProfileLoading(false);
        return;
      }

      try {
        const data = await usersApi.getMe();
        setProfile(data);
        setUsername(data.username || '');
        setBio(data.bio || '');
        setGender(data.gender || 'Any');
        setAge(data.age || '');
        
        if (data.country) {
          setCountry(data.country);
          setIsCountryLocked(true); 
        } else {
          try {
            const res = await fetch("https://ipapi.co/json/");
            const ipData = await res.json();
            if (ipData.country) {
              setCountry(ipData.country); 
              setIsCountryLocked(true);
            } else {
              setIsCountryLocked(false);
            }
          } catch (ipError) {
            console.warn("IP Geolocation failed.", ipError);
            setIsCountryLocked(false);
          }
        }
        
        if (data.username) setHasExistingUsername(true);
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, [authUser]);

  const fetchNetworkData = async (reset = false) => {
    if (activeTab === 'requests') return;

    try {
      if (reset) {
        setNetworkLoading(true);
        setOffset(0);
        setHasMore(true);
        setNetworkData([]); 
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

      setNetworkData(prev => reset ? results : [...prev, ...results]);
      if (results.length < LIMIT && activeTab !== 'search') setHasMore(false);
      setOffset(currentOffset + LIMIT);
    } catch (error) {
      console.error('Failed to fetch network data:', error);
    } finally {
      setNetworkLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'requests') {
       // Data handled by Context natively
    } else if (activeTab !== 'search' || searchQuery) {
      fetchNetworkData(true);
    } else {
      setNetworkData([]);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'search') return;
    const timer = setTimeout(() => {
      if (searchQuery.trim()) fetchNetworkData(true);
      else setNetworkData([]);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = async () => {
    if (username.length > MAX_USERNAME_LENGTH) {
      setError(`Username must be ${MAX_USERNAME_LENGTH} characters or fewer.`);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: any = { bio, gender, country, age };
      if (!hasExistingUsername && username) payload.username = username;
      
      let newAvatarUrl = profile?.avatar_url;
      if (zAvatarRequested) {
        newAvatarUrl = createZAvatarURL(username, avatarVariant);
        if (newAvatarUrl.length > MAX_AVATAR_URL_LENGTH) {
          setError(`Avatar URL must be ${MAX_AVATAR_URL_LENGTH} characters or fewer.`);
          setSaving(false);
          return;
        }
        payload.avatar_url = newAvatarUrl;
      }
      
      const updated = await usersApi.updateMePartial(payload);
      
      setProfile({ ...updated, age, country, avatar_url: newAvatarUrl }); 
      setCountry(country);
      if (updated.username) setHasExistingUsername(true);
      
      setIsEditing(false); 
      setZAvatarRequested(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestCountryChange = async () => {
    setIsDetectingCountry(true);
    try {
      const res = await fetch("https://ipapi.co/json/");
      const ipData = await res.json();
      if (ipData.country) {
        setCountry(ipData.country);
        setIsCountryLocked(true);
      } else {
        setIsCountryLocked(false);
      }
    } catch (err) {
      console.warn("IP Geolocation failed, showing manual dropdown.", err);
      setIsCountryLocked(false);
    } finally {
      setIsDetectingCountry(false);
    }
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    setIsLoggingOut(true);
    setTimeout(async () => {
      try {
        await logoutUser();
        navigate('/');
      } catch (err) {
        console.error('Logout failed:', err);
        window.location.href = '/';
      }
    }, 800); 
  };

  const handleNetworkAction = async (action: () => Promise<void>, targetUsername: string, isRequestTab: boolean) => {
    try {
      if (isRequestTab) {
        setFriendRequests(prev => prev.filter(u => u.username !== targetUsername));
      } else {
        setNetworkData(prev => prev.filter(u => u.username !== targetUsername));
      }
      await action();
    } catch (error) {
      alert('Action failed. Please try again.');
    }
  };

  const handleShareProfile = () => {
    if (!authUser?.username) return;
    const profileUrl = `${window.location.origin}/user/${authUser.username}`;
    const shareText = `Hey! Connect with me on zQuab 🚀\n\n${profileUrl}`;
    
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const genderLower = profile?.gender?.toLowerCase() || '';
  const isMale = genderLower === 'male';
  const isFemale = genderLower === 'female';
  const creatorApprovalStatus = profile?.approval_status ?? authUser?.approval_status;

  if (profileLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" />
      </div>
    );
  }

  if (authUser?.is_guest) {
    return (
      <div className="max-w-4xl mx-auto w-full p-6 pb-20 text-center flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-20 h-20 bg-[var(--card)] rounded-[1.25rem] flex items-center justify-center border border-[var(--border-color)] mb-4 shadow-[4px_4px_10px_rgba(0,0,0,0.2),-2px_-2px_6px_rgba(255,255,255,0.02)]">
          <User className="w-10 h-10 text-[var(--text-muted)] drop-shadow-sm" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-main)] mb-2 drop-shadow-sm">Guest Account</h2>
        <p className="text-[var(--text-muted)] mb-6 max-w-md drop-shadow-sm">
          You are browsing anonymously. To set up a profile, add friends, and save your chats, please create a full account.
        </p>
        <button aria-label="Login" onClick={() => navigate('/auth')} className="px-8 py-3 bg-[#3B82F6] text-white font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-[4px_4px_10px_rgba(0,0,0,0.4),-2px_-2px_6px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(255,255,255,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.4)] active:scale-95 active:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.4)] border-none">
          Log In / Register
        </button>
      </div>
    );
  }

  const displayData = activeTab === 'requests' ? friendRequests : networkData;
  const isDisplayLoading = activeTab === 'requests' ? false : networkLoading;
  const currentHasMore = activeTab === 'requests' ? false : hasMore;

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8 pb-24 relative">
      
      {/* 🛠️ Claymorphic Logout Confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[99] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#101115] border border-white/[0.09] rounded-[2rem] p-6 sm:p-8 max-w-sm w-full shadow-[8px_8px_20px_rgba(0,0,0,0.5),-4px_-4px_10px_rgba(255,255,255,0.02),inset_1px_1px_3px_rgba(255,255,255,0.05),inset_-1px_-1px_3px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-[1.25rem] flex items-center justify-center mb-6 mx-auto border border-red-500/20 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-1px_-1px_3px_rgba(255,255,255,0.02)]">
              <LogOut className="w-8 h-8 ml-1 drop-shadow-sm" />
            </div>
            <h3 className="text-2xl font-black text-white text-center mb-2 drop-shadow-sm">Log Out?</h3>
            <p className="text-zinc-400 text-center mb-8 leading-relaxed">
              Are you sure you want to log out? You will need to sign back in to access your friends and chats.
            </p>
            <div className="flex gap-3">
              <button aria-label="Cancel Logout" onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3.5 bg-white/[0.04] border border-white/10 text-white rounded-xl font-bold hover:border-[#3B82F6] transition-colors shadow-[4px_4px_10px_rgba(0,0,0,0.2),-2px_-2px_6px_rgba(255,255,255,0.02)] active:scale-95">Cancel</button>
              <button aria-label="Logout Confirm" onClick={confirmLogout} className="flex-1 py-3.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2 border-none shadow-[4px_4px_10px_rgba(0,0,0,0.4),-2px_-2px_6px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(255,255,255,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.4)] active:scale-95 active:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.4)]">Log Out</button>
            </div>
          </div>
        </div>
      )}

      {isLoggingOut && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-[#09090b]/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="w-16 h-16 bg-[#101115] rounded-2xl flex items-center justify-center mb-4 shadow-[8px_8px_20px_rgba(0,0,0,0.5),-4px_-4px_10px_rgba(255,255,255,0.02),inset_1px_1px_3px_rgba(255,255,255,0.05),inset_-1px_-1px_3px_rgba(0,0,0,0.3)] border border-white/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-red-500/10 to-transparent"></div>
              <Loader2 className="w-8 h-8 text-red-500 animate-spin relative z-10" />
           </div>
           <h2 className="text-xl font-black text-white tracking-tight drop-shadow-sm">Logging out...</h2>
           <p className="text-zinc-400 text-sm mt-2 font-medium">Securing your session</p>
        </div>
      )}

      <CreatorApplicationModal 
        isOpen={showCreatorModal} 
        onClose={() => setShowCreatorModal(false)} 
        username={username || 'creator'} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 relative">
        <div className="lg:col-span-4 xl:col-span-4 lg:sticky lg:top-24 h-fit space-y-6">
          
          {/* 🛠️ Claymorphic Edit Profile Form */}
          {isEditing ? (
            <div className="bg-[#101115] border border-white/[0.09] rounded-[2rem] p-6 shadow-[8px_8px_20px_rgba(0,0,0,0.5),-4px_-4px_10px_rgba(255,255,255,0.02),inset_1px_1px_3px_rgba(255,255,255,0.05),inset_-1px_-1px_3px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between mb-6 border-b border-white/[0.09] pb-4">
                <h2 className="text-xl font-bold text-white drop-shadow-sm">Edit Profile</h2>
                <button aria-label="Close" onClick={() => { setIsEditing(false); setZAvatarRequested(false); }} className="p-2 bg-white/[0.04] border border-white/10 rounded-xl hover:bg-white/[0.08] transition-colors shadow-[2px_2px_4px_rgba(0,0,0,0.2),-1px_-1px_2px_rgba(255,255,255,0.02)] active:scale-95"><X className="w-5 h-5 text-white" /></button>
              </div>
              
              {error && <div className="p-3 bg-red-500/10 text-red-500 font-medium rounded-xl text-sm mb-4 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.3)]">{error}</div>}

              <div className="flex flex-col items-center justify-center mb-6">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] bg-[#0b0c0f] border-2 border-[#101115] flex items-center justify-center overflow-hidden shadow-[inset_2px_2px_6px_rgba(0,0,0,0.5),inset_-2px_-2px_6px_rgba(255,255,255,0.02)] transition-all duration-300">
                  {avatarPreview ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover scale-110" /> : <User className="w-12 h-12 text-zinc-600 drop-shadow-sm" />}
                </div>
                <div className="mt-4 h-10 flex items-center justify-center">
                  {!zAvatarRequested ? (
                    <button aria-label="New Avatar" type="button" onClick={() => { setZAvatarRequested(true); setAvatarVariant(0); }} disabled={!username} className="px-5 py-2.5 bg-[#3B82F6]/10 text-[#3B82F6] hover:bg-[#3B82F6] hover:text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-[2px_2px_5px_rgba(0,0,0,0.2),inset_1px_1px_2px_rgba(255,255,255,0.05)] active:scale-95 border border-[#3B82F6]/20">Generate New zAvatar</button>
                  ) : (
                    <div className="flex items-center gap-4 bg-[#0b0c0f] px-3 py-1.5 rounded-xl border border-white/[0.04] shadow-[inset_1px_1px_3px_rgba(0,0,0,0.3)]">
                      <button aria-label="Reroll" type="button" onClick={() => setAvatarVariant(v => v + 1)} className="flex items-center gap-1.5 text-xs font-bold text-[#3B82F6] hover:text-blue-400 transition-colors"><RefreshCw className="w-3.5 h-3.5" /> Reroll</button>
                      <div className="w-px h-4 bg-white/10" />
                      <button aria-label="Cancel" type="button" onClick={() => { setZAvatarRequested(false); setAvatarVariant(0); }} className="text-xs font-bold text-zinc-400 hover:text-red-500 transition-colors">Cancel</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-white flex items-center gap-2 drop-shadow-sm"><AtSign className="w-4 h-4 text-[#3B82F6]" /> Username</label>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} disabled={hasExistingUsername} maxLength={MAX_USERNAME_LENGTH} className="w-full bg-[#0b0c0f] border border-white/[0.04] rounded-xl px-4 py-3 text-white outline-none focus:border-[#3B82F6] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.4),inset_-1px_-1px_3px_rgba(255,255,255,0.02)] disabled:opacity-50 placeholder:text-zinc-600" placeholder="choose_a_username" />
                  {hasExistingUsername && (
                    <p className="text-[10px] text-zinc-500 mt-1 font-medium">Usernames cannot be changed once set.</p>
                  )}
                </div>

                <div className="space-y-2" ref={dropdownRef}>
                  <label className="text-sm font-bold text-white drop-shadow-sm">Gender</label>
                  <div className="relative">
                    <button aria-label="Dropdown" type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)} className={`w-full px-4 py-3 bg-[#0b0c0f] rounded-xl text-left flex items-center justify-between transition-all focus:outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.4),inset_-1px_-1px_3px_rgba(255,255,255,0.02)] border ${isDropdownOpen ? 'border-[#3B82F6]' : 'border-white/[0.04]'}`}>
                      <span className="text-white">{gender}</span><ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }} className="absolute z-50 w-full mt-2 bg-[#101115] border border-white/10 rounded-xl shadow-[4px_4px_15px_rgba(0,0,0,0.6),-1px_-1px_3px_rgba(255,255,255,0.05)] overflow-hidden py-1">
                          {GENDER_OPTIONS.map((option) => (
                            <button aria-label="Change Gender" key={option} type="button" onClick={() => { setGender(option); setIsDropdownOpen(false); }} className="w-full px-4 py-3 text-left text-white hover:bg-white/[0.04] transition-colors flex items-center justify-between">
                              {option}{gender === option && <Check className="w-4 h-4 text-[#3B82F6]" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-white drop-shadow-sm">Age</label>
                  <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-[#0b0c0f] border border-white/[0.04] rounded-xl px-4 py-3 text-white outline-none focus:border-[#3B82F6] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.4),inset_-1px_-1px_3px_rgba(255,255,255,0.02)] placeholder:text-zinc-600" placeholder="e.g. 21" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-white flex justify-between drop-shadow-sm">Country {isCountryLocked && <span className="text-xs font-normal text-[#3B82F6] flex items-center gap-1"><Check className="w-3 h-3"/> Auto-detected</span>}</label>
                  {isCountryLocked ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-4 py-3 bg-[#0b0c0f] border border-white/[0.04] rounded-xl flex items-center justify-between opacity-80 cursor-not-allowed shadow-[inset_2px_2px_5px_rgba(0,0,0,0.4),inset_-1px_-1px_3px_rgba(255,255,255,0.02)]">
                        <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#3B82F6]" /><span className="text-white font-semibold">{country}</span></div><Lock className="w-4 h-4 text-zinc-500" />
                      </div>
                      <button aria-label="Change Country" type="button" onClick={handleRequestCountryChange} disabled={isDetectingCountry} className="px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-sm font-bold text-white hover:border-[#3B82F6] hover:text-[#3B82F6] transition-all disabled:opacity-50 flex items-center justify-center min-w-[90px] shadow-[2px_2px_5px_rgba(0,0,0,0.2),-1px_-1px_2px_rgba(255,255,255,0.02)] active:scale-95 active:shadow-[inset_1px_1px_3px_rgba(0,0,0,0.3)]">
                        {isDetectingCountry ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
                      </button>
                      <button type="button" onClick={() => setIsCountryLocked(false)} className="text-xs text-zinc-400 hover:text-[#3B82F6] font-bold underline px-2 whitespace-nowrap">
                        Edit Manually
                      </button>
                    </div>
                  ) : (
                    <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-4 py-3 bg-[#0b0c0f] border border-white/[0.04] rounded-xl text-white focus:outline-none focus:border-[#3B82F6] transition-all cursor-pointer appearance-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.4),inset_-1px_-1px_3px_rgba(255,255,255,0.02)]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em'}}>
                      <option value="" disabled>Select country</option>
                      {ALL_COUNTRIES.map(c => (<option key={c} value={c}>{c}</option>))}
                    </select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-white flex items-center gap-2 drop-shadow-sm"><AlignLeft className="w-4 h-4 text-[#3B82F6]" /> Bio</label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full bg-[#0b0c0f] border border-white/[0.04] rounded-xl px-4 py-3 text-white outline-none focus:border-[#3B82F6] resize-none custom-scrollbar shadow-[inset_2px_2px_5px_rgba(0,0,0,0.4),inset_-1px_-1px_3px_rgba(255,255,255,0.02)] placeholder:text-zinc-600" placeholder="Tell everyone a bit about yourself..." />
                </div>

                <button aria-label="Save" onClick={handleSave} disabled={saving || (!hasExistingUsername && !username.trim())} className="w-full py-4 bg-[#3B82F6] text-white rounded-xl font-bold hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2 shadow-[4px_4px_10px_rgba(0,0,0,0.4),-2px_-2px_6px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(255,255,255,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.4)] active:scale-95 active:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.4)] border-none">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save Profile
                </button>
              </div>
            </div>
          ) : (
            /* 🛠️ Claymorphic Main Profile Panel */
            <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.09] bg-[#101115] shadow-[8px_8px_20px_rgba(0,0,0,0.5),-4px_-4px_10px_rgba(255,255,255,0.02),inset_1px_1px_3px_rgba(255,255,255,0.05),inset_-1px_-1px_3px_rgba(0,0,0,0.3)]">
              <div className="relative h-28 overflow-hidden bg-gradient-to-br from-[#2563eb] via-[#4f46e5] to-[#7c3aed] sm:h-36">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(255,255,255,0.24),transparent_35%),radial-gradient(circle_at_85%_80%,rgba(0,0,0,0.28),transparent_45%)]" />
                <div className="absolute -right-8 -top-16 h-48 w-48 rotate-12 rounded-[40px] border border-white/15 bg-white/[0.05]" />
                <button aria-label="Logout" onClick={() => setShowLogoutConfirm(true)} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-black/30 text-white/80 backdrop-blur transition-all hover:bg-black/50 hover:text-white shadow-[2px_2px_5px_rgba(0,0,0,0.3),-1px_-1px_2px_rgba(255,255,255,0.05)] active:scale-95">
                  <LogOut className="h-4 w-4 drop-shadow-sm" />
                </button>
              </div>

              <div className="relative px-5 pb-5 sm:px-6 sm:pb-6">
                <div className="-mt-12 mb-4 flex items-end justify-between sm:-mt-14">
                  <div className="relative h-24 w-24 overflow-hidden rounded-[1.5rem] border-[5px] border-[#101115] bg-[#09090b] shadow-[4px_4px_12px_rgba(0,0,0,0.6),-2px_-2px_6px_rgba(255,255,255,0.03),inset_2px_2px_4px_rgba(255,255,255,0.1),inset_-2px_-2px_4px_rgba(0,0,0,0.4)] sm:h-28 sm:w-28">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Your avatar" className="h-full w-full object-cover scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500/20 to-violet-500/20"><User className="h-11 w-11 text-white/50 drop-shadow-sm" /></div>
                    )}
                  </div>
                  {creatorApprovalStatus === 'approved' && <span className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-violet-400/25 bg-violet-500/10 px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-violet-300 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)]"><Video className="h-3.5 w-3.5" /> Creator</span>}
                </div>

                <div className="mb-4">
                  <h1 className="break-words text-2xl font-black tracking-tight text-white sm:text-[28px] drop-shadow-sm">{profile?.name || username || 'New User'}</h1>
                  <p className="mt-1 text-sm font-medium text-zinc-400 drop-shadow-sm">@{username || 'choose_username'}</p>
                </div>

                <button onClick={openPurchaseModal} className="mb-5 inline-flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-500/10 px-3.5 py-2 text-amber-300 transition-all hover:border-amber-400/40 hover:bg-amber-500/15 active:scale-95 shadow-[4px_4px_10px_rgba(0,0,0,0.2),-1px_-1px_3px_rgba(255,255,255,0.02)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]">
                  <span className="text-base drop-shadow-md">🪙</span><span className="text-sm font-black drop-shadow-sm">{balanceCoins?.toLocaleString() || 0} zCoins</span><span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-amber-950 shadow-inner"><Plus className="h-3 w-3" /></span>
                </button>

                <div className="mb-5 grid grid-cols-2 gap-2.5">
                  {country && <div className="flex min-w-0 items-center gap-2 rounded-[1.25rem] border border-white/[0.04] bg-[#14151a] px-3 py-2.5 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.4),inset_-1px_-1px_3px_rgba(255,255,255,0.02)]"><MapPin className="h-4 w-4 shrink-0 text-blue-400" /><span className="truncate text-xs font-bold text-white drop-shadow-sm">{country}</span></div>}
                  {age && <div className="flex items-center gap-2 rounded-[1.25rem] border border-white/[0.04] bg-[#14151a] px-3 py-2.5 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.4),inset_-1px_-1px_3px_rgba(255,255,255,0.02)]"><Activity className="h-4 w-4 shrink-0 text-blue-400" /><span className="text-xs font-bold text-white drop-shadow-sm">{age} years old</span></div>}
{profile?.gender && profile.gender !== 'Any' && (
  <div className="flex items-center gap-2 rounded-[1.25rem] border border-white/[0.04] bg-[#14151a] px-3 py-2.5 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.4),inset_-1px_-1px_3px_rgba(255,255,255,0.02)]">
    <User className={`h-4 w-4 shrink-0 ${isMale ? 'text-sky-400' : isFemale ? 'text-pink-400' : 'text-violet-400'}`} />
    <span className="truncate text-xs font-bold text-white drop-shadow-sm">{profile.gender}</span>
  </div>
)}
                </div>

                <div className="mb-5 rounded-[1.5rem] border border-white/[0.04] bg-[#0b0c0f] p-5 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.4),inset_-2px_-2px_6px_rgba(255,255,255,0.02)]">
                  <div className="mb-2 flex items-center gap-2"><span className="h-4 w-1 rounded-full bg-blue-400" /><span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 drop-shadow-sm">About you</span></div>
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-zinc-300 drop-shadow-sm">{bio || <span className="italic text-zinc-600">No bio yet. Tell people a little about yourself.</span>}</p>
                </div>

                <button onClick={() => { if (creatorApprovalStatus === 'approved') navigate('/creator/dashboard'); else if (creatorApprovalStatus !== 'pending') setShowCreatorModal(true); }} disabled={creatorApprovalStatus === 'pending'} className="mb-4 flex w-full items-center justify-center gap-2 rounded-[1.25rem] bg-gradient-to-r from-[#4f46e5] to-[#5b45f5] px-4 py-4 text-sm font-black text-white shadow-[4px_4px_12px_rgba(0,0,0,0.4),-2px_-2px_6px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(255,255,255,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.4)] transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none border-none">
                  {creatorApprovalStatus === 'approved' ? <><Video className="h-5 w-5 drop-shadow-sm" /> Creator Dashboard</> : creatorApprovalStatus === 'pending' ? <><Clock className="h-5 w-5 drop-shadow-sm" /> Application Pending</> : <><Star className="h-5 w-5 drop-shadow-sm" /> Become a Creator</>}
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button aria-label="Share Profile" onClick={handleShareProfile} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3.5 text-sm font-bold text-white transition-all hover:border-blue-400/40 hover:text-white shadow-[2px_2px_5px_rgba(0,0,0,0.2),-1px_-1px_3px_rgba(255,255,255,0.02)] active:scale-95 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]">{copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}{copied ? 'Copied!' : 'Share profile'}</button>
                  <button aria-label="Edit Profile" onClick={() => setIsEditing(true)} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3.5 text-sm font-bold text-white transition-all hover:border-blue-400/40 hover:text-white shadow-[2px_2px_5px_rgba(0,0,0,0.2),-1px_-1px_3px_rgba(255,255,255,0.02)] active:scale-95 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]"><Edit2 className="h-4 w-4" /> Edit profile</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-6 lg:col-span-8 xl:col-span-8">
          {/* 🛠️ Claymorphic Promotional Banner */}
          <section className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-r from-[#3182f6] via-[#4f58f5] to-[#5135f4] p-5 shadow-[4px_4px_15px_rgba(0,0,0,0.4),-2px_-2px_6px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(255,255,255,0.2),inset_-2px_-2px_4px_rgba(0,0,0,0.3)] sm:p-6 border-none">
            <div className="pointer-events-none absolute -right-8 -top-16 h-48 w-48 rounded-full border border-white/15" /><div className="pointer-events-none absolute -right-1 -top-10 h-48 w-48 rounded-full border border-white/10" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div><div className="mb-2 flex items-center gap-2 text-white drop-shadow-sm"><MessageSquare className="h-5 w-5" /><h2 className="text-lg font-black">Stranger Chat</h2></div><p className="max-w-lg text-sm leading-6 text-blue-50/90 drop-shadow-sm">Meet someone new, have a conversation, and discover the wider zQuab community.</p></div>
              <button aria-label="Start Chat" onClick={() => navigate('/chat')} className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-black text-indigo-600 shadow-[4px_4px_10px_rgba(0,0,0,0.3),-2px_-2px_6px_rgba(255,255,255,0.1),inset_1px_1px_2px_rgba(255,255,255,0.8),inset_-1px_-1px_2px_rgba(0,0,0,0.1)] transition-all hover:brightness-110 active:scale-95 border-none"><MessageSquare className="h-4 w-4" /> Start Chat</button>
            </div>
          </section>

          {/* 🛠️ Claymorphic Social Space Panel */}
          <section className="flex min-h-[520px] flex-col overflow-hidden rounded-[2rem] border border-white/[0.09] bg-[#101115] shadow-[8px_8px_20px_rgba(0,0,0,0.5),-4px_-4px_10px_rgba(255,255,255,0.02),inset_1px_1px_3px_rgba(255,255,255,0.05),inset_-1px_-1px_3px_rgba(0,0,0,0.3)]">
            <div className="border-b border-white/[0.07] p-5 sm:p-7">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div><p className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-blue-400 drop-shadow-sm">Your social space</p><h2 className="text-2xl font-black tracking-tight text-white sm:text-[28px] drop-shadow-sm">Your people. Your connections.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400 drop-shadow-sm">Friends are mutual connections. Following is for keeping up with creators and public profiles — it never makes you friends automatically.</p></div>
                <div className="hidden items-center gap-2 rounded-xl border border-white/[0.08] bg-[#09090b] px-3 py-2.5 text-xs font-bold text-white/55 sm:flex shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)]"><Users className="h-4 w-4 text-blue-400" /> Mutual connections</div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {[
                  { id: 'friends', icon: Users, label: 'Friends' },
                  { id: 'requests', icon: UserPlus, label: 'Friend requests', count: friendRequests.length },
                  { id: 'search', icon: Search, label: 'Find people' },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)} className={`relative flex shrink-0 items-center gap-2 rounded-t-xl px-4 py-3 text-sm font-extrabold transition-colors ${activeTab === tab.id ? 'bg-[#0b0c0f] text-blue-400 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.4),inset_-1px_0_3px_rgba(255,255,255,0.02)]' : 'text-zinc-500 hover:bg-white/[0.035] hover:text-white/80'}`}>
                    <tab.icon className="h-4 w-4 drop-shadow-sm" />{tab.label}{tab.id === 'requests' && !!tab.count && <span className="rounded-md bg-blue-500 px-1.5 py-0.5 text-[10px] font-black text-white shadow-[inset_1px_1px_2px_rgba(255,255,255,0.3)]">{tab.count}</span>}{activeTab === tab.id && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 🛠️ Claymorphic Recessed Search Input */}
            {activeTab === 'search' && <div className="px-5 pt-5 sm:px-7"><div className="relative"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 drop-shadow-sm" /><input autoFocus type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by username..." className="w-full rounded-[1.25rem] border border-white/[0.04] bg-[#0b0c0f] py-3.5 pl-11 pr-4 text-sm text-white outline-none transition-all placeholder:text-zinc-600 focus:border-[#3B82F6] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.4),inset_-1px_-1px_3px_rgba(255,255,255,0.02)]" /></div></div>}

            <div className="flex-1 p-5 sm:p-7">
              {isDisplayLoading && displayData.length === 0 ? <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-400" /></div> : displayData.length === 0 ? (
                // 🛠️ Claymorphic Recessed Empty State
                <div className="relative flex min-h-[270px] flex-col items-center justify-center overflow-hidden rounded-[1.5rem] border border-white/[0.04] bg-[#0b0c0f] px-5 py-12 text-center shadow-[inset_2px_2px_6px_rgba(0,0,0,0.4),inset_-2px_-2px_6px_rgba(255,255,255,0.02)]">
                  <div className="pointer-events-none absolute -left-10 -top-16 h-40 w-40 rounded-full bg-blue-500/[0.07] blur-3xl" /><div className="pointer-events-none absolute -bottom-16 -right-10 h-40 w-40 rounded-full bg-violet-500/[0.07] blur-3xl" />
                  <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-[1.25rem] border border-white/[0.08] bg-[#17181d] text-zinc-500 shadow-[4px_4px_10px_rgba(0,0,0,0.3),-2px_-2px_6px_rgba(255,255,255,0.02)]"><Users className="h-7 w-7 drop-shadow-sm" />{activeTab === 'requests' && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#17181d] bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />}</div>
                  <h3 className="relative text-lg font-black text-white drop-shadow-sm">{activeTab === 'friends' ? 'Your circle starts here.' : activeTab === 'requests' ? 'You’re all caught up.' : activeTab === 'blocked' ? 'No blocked accounts.' : searchQuery.trim() ? 'No people found.' : 'Find your people.'}</h3>
                  <p className="relative mt-2 max-w-md text-sm leading-6 text-zinc-400 drop-shadow-sm">{activeTab === 'friends' ? 'Find people and send a friend request. When they accept, you become mutual friends.' : activeTab === 'requests' ? 'Incoming friend requests will appear here. Accepting creates a friendship; following remains separate.' : activeTab === 'blocked' ? 'Accounts you block will appear here.' : searchQuery.trim() ? 'Try another username or check the spelling.' : 'Search the zQuab community by username and open profiles to connect.'}</p>
                  {activeTab === 'friends' && <button onClick={() => setActiveTab('search')} className="relative mt-5 inline-flex items-center gap-2 rounded-xl bg-[#3B82F6] px-4 py-2.5 text-xs font-black text-white transition-all hover:brightness-110 active:scale-95 shadow-[4px_4px_10px_rgba(0,0,0,0.4),-2px_-2px_6px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(255,255,255,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.4)] active:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.4)] border-none"><Search className="h-4 w-4 drop-shadow-sm" /> Find people</button>}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{displayData.map((networkUser) => <UserCard key={networkUser.id || networkUser.request_id} user={{...networkUser, subtitle: activeTab === 'friends' ? (networkUser.friends_since ? `Friends since ${new Date(networkUser.friends_since).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : 'Mutual friend') : activeTab === 'blocked' ? 'Blocked account' : undefined}} onClick={() => navigate(`/user/${networkUser.username}`)} actionButton={activeTab === 'requests' ? <div className="flex gap-2"><button aria-label="Accept friend request" onClick={(e) => { e.stopPropagation(); handleNetworkAction(() => friendsApi.acceptRequest(networkUser.username), networkUser.username, true); }} className="rounded-xl bg-blue-500 p-2 text-white transition-all hover:brightness-110 active:scale-95 shadow-[2px_2px_5px_rgba(0,0,0,0.3),inset_1px_1px_2px_rgba(255,255,255,0.2),inset_-1px_-1px_2px_rgba(0,0,0,0.3)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)] border-none"><Check className="h-5 w-5 drop-shadow-sm" /></button><button aria-label="Reject friend request" onClick={(e) => { e.stopPropagation(); handleNetworkAction(() => friendsApi.rejectRequest(networkUser.username), networkUser.username, true); }} className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-white/65 transition-all hover:border-red-400/30 hover:text-red-400 hover:bg-red-500/10 active:scale-95 shadow-[2px_2px_5px_rgba(0,0,0,0.2),-1px_-1px_2px_rgba(255,255,255,0.02)] active:shadow-[inset_1px_1px_3px_rgba(0,0,0,0.3)]"><X className="h-5 w-5" /></button></div> : activeTab === 'blocked' ? <button aria-label="Unblock user" onClick={(e) => { e.stopPropagation(); handleNetworkAction(() => friendsApi.unblockUser(networkUser.username), networkUser.username, false); }} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/70 transition-all hover:border-blue-400/30 hover:text-white shadow-[2px_2px_5px_rgba(0,0,0,0.2),-1px_-1px_2px_rgba(255,255,255,0.02)] active:scale-95 active:shadow-[inset_1px_1px_3px_rgba(0,0,0,0.3)]">Unblock</button> : null} />)}</div>
              )}
              {activeTab !== 'requests' && <div className="mt-4"><PaginationLoader onLoadMore={() => fetchNetworkData()} hasMore={currentHasMore} isLoading={networkLoading} /></div>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}