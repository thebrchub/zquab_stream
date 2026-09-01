import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../api/users';
import { friendsApi } from '../api/friends';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useRooms } from '../context/RoomsContext';
import { useWallet } from '../context/WalletContext'; // 🚀 Added Wallet Hook
import UserCard from '../components/UserCard';
import PaginationLoader from '../components/PaginationLoader';
import { ALL_COUNTRIES } from '../constants/countries'; 
import { 
  Loader2, Save, User, AtSign, AlignLeft, 
  Users, MessageSquare, Edit2, X, MapPin, Activity,
  LogOut, UserPlus, Search, Check, Share2, CheckCircle2, Lock, RefreshCw, ChevronDown,
  Video, Star, Clock, Plus // 🚀 Added Plus icon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { createAvatar } from '@dicebear/core';
import { lorelei } from '@dicebear/collection';

const GENDER_OPTIONS = ['Prefer not to say', 'Male', 'Female', 'Other'];
type Tab = 'friends' | 'requests' | 'search' | 'blocked';

export default function Profile() {
  const navigate = useNavigate();
  const { user: authUser, logout: logoutUser, refreshSession } = useAuth();
  
  // 🛠️ UNIFICATION: Pull requests from memory
  const { friendRequests, setFriendRequests } = useRooms();
  
  // 🚀 WALLET CONNECTION
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
  const [creatorCategory, setCreatorCategory] = useState('Gaming');
  const [creatorHeadline, setCreatorHeadline] = useState('');
  const [isSubmittingCreator, setIsSubmittingCreator] = useState(false);
  const CREATOR_CATEGORIES = ['Gaming', 'Just Chatting', 'Music', 'Education', 'Tech & Coding', 'Art'];
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
    const fetchProfile = async () => {
      if (authUser?.is_guest) {
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
    setSaving(true);
    setError(null);
    try {
      const payload: any = { bio, gender, country, age };
      if (!hasExistingUsername && username) payload.username = username;
      
      let newAvatarUrl = profile?.avatar_url;
      if (zAvatarRequested) {
        newAvatarUrl = createAvatar(lorelei, {
          seed: `${username}-${avatarVariant}`,
          size: 128,
          backgroundColor: ["b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf"]
        }).toDataUri();
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
        <div className="w-20 h-20 bg-[var(--card)] rounded-full flex items-center justify-center border border-[var(--border-color)] mb-4 shadow-sm">
          <User className="w-10 h-10 text-[var(--text-muted)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-main)] mb-2">Guest Account</h2>
        <p className="text-[var(--text-muted)] mb-6 max-w-md">
          You are browsing anonymously. To set up a profile, add friends, and save your chats, please create a full account.
        </p>
        <button aria-label="Login" onClick={() => navigate('/auth')} className="px-8 py-3 bg-[#3B82F6] text-white font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-lg">
          Log In / Register
        </button>
      </div>
    );
  }

  const displayData = activeTab === 'requests' ? friendRequests : networkData;
  const isDisplayLoading = activeTab === 'requests' ? false : networkLoading;
  const currentHasMore = activeTab === 'requests' ? false : hasMore;

  const submitCreatorApplication = async () => {
    if (!creatorHeadline.trim()) return;
    setIsSubmittingCreator(true);
    try {
      await apiClient.post('/users/me/creator', {
        category: creatorCategory.toLowerCase(),
        headline: creatorHeadline,
        one_on_one_enabled: false,
        one_on_one_price_coins: 0,
        one_on_one_duration_mins: 0
      });
      await refreshSession();
      setShowCreatorModal(false);
    } catch (err: any) {
      alert(err?.response?.data?.error || err.message || 'Failed to submit application');
    } finally {
      setIsSubmittingCreator(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8 pb-24 relative">
      
      {/* Modals omitted for brevity, keeping existing exact code */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[99] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-[2rem] p-6 sm:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6 mx-auto border border-red-500/20">
              <LogOut className="w-8 h-8 ml-1" />
            </div>
            <h3 className="text-2xl font-black text-[var(--text-main)] text-center mb-2">Log Out?</h3>
            <p className="text-[var(--text-muted)] text-center mb-8 leading-relaxed">
              Are you sure you want to log out? You will need to sign back in to access your friends and chats.
            </p>
            <div className="flex gap-3">
              <button aria-label="Cancel Logout" onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3.5 bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl font-bold hover:border-[#3B82F6] transition-colors">Cancel</button>
              <button aria-label="Logout Confirm" onClick={confirmLogout} className="flex-1 py-3.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/25 flex items-center justify-center gap-2">Log Out</button>
            </div>
          </div>
        </div>
      )}

      {isLoggingOut && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-[var(--background)]/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="w-16 h-16 bg-[var(--card)] rounded-2xl flex items-center justify-center mb-4 shadow-xl border border-[var(--border-color)] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-red-500/10 to-transparent"></div>
              <Loader2 className="w-8 h-8 text-red-500 animate-spin relative z-10" />
           </div>
           <h2 className="text-xl font-black text-[var(--text-main)] tracking-tight">Logging out...</h2>
           <p className="text-[var(--text-muted)] text-sm mt-2 font-medium">Securing your session</p>
        </div>
      )}

      {showCreatorModal && (
        <div className="fixed inset-0 z-[99] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-[2rem] p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black text-[var(--text-main)] mb-1">Become a Creator</h3>
                <p className="text-[var(--text-muted)] text-sm font-medium">Start streaming and earning zCoins.</p>
              </div>
              <button onClick={() => setShowCreatorModal(false)} className="p-2 bg-[var(--background)] rounded-full hover:bg-[var(--border-color)] transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-5 mb-8">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[var(--text-main)]">Primary Content Category</label>
                <select value={creatorCategory} onChange={(e) => setCreatorCategory(e.target.value)} className="w-full px-4 py-3.5 bg-[var(--background)] border border-[var(--border-color)] rounded-xl text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] transition-all cursor-pointer appearance-none" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em'}}>
                  {CREATOR_CATEGORIES.map(c => (<option key={c} value={c}>{c}</option>))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[var(--text-main)]">Channel Headline</label>
                <input type="text" maxLength={60} value={creatorHeadline} onChange={(e) => setCreatorHeadline(e.target.value)} className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-main)] outline-none focus:border-[#4F46E5]" placeholder="e.g. Pro Valorant grinds & viewer games" />
                <div className="text-right text-[10px] text-[var(--text-muted)] font-bold">{creatorHeadline.length}/60</div>
              </div>
            </div>
            <button onClick={submitCreatorApplication} disabled={isSubmittingCreator || !creatorHeadline.trim()} className="w-full py-4 bg-[#4F46E5] text-white rounded-[1.25rem] font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-[6px_6px_12px_rgba(0,0,0,0.4),-4px_-4px_10px_rgba(255,255,255,0.03),inset_2px_2px_6px_rgba(255,255,255,0.25),inset_-3px_-3px_6px_rgba(0,0,0,0.2)] hover:brightness-110 active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-2px_-2px_6px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed">
              {isSubmittingCreator ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Application'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 relative">
        <div className="lg:col-span-4 xl:col-span-4 lg:sticky lg:top-24 h-fit space-y-6">
          
          {isEditing ? (
            <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-[2rem] p-6 shadow-sm animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between mb-6 border-b border-[var(--border-color)] pb-4">
                <h2 className="text-xl font-bold text-[var(--text-main)]">Edit Profile</h2>
                <button aria-label="Close" onClick={() => { setIsEditing(false); setZAvatarRequested(false); }} className="p-2 bg-[var(--background)] rounded-full hover:bg-[var(--border-color)] transition-colors"><X className="w-5 h-5" /></button>
              </div>
              
              {error && <div className="p-3 bg-red-500/10 text-red-500 font-medium rounded-xl text-sm mb-4">{error}</div>}

              <div className="flex flex-col items-center justify-center mb-6">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[var(--background)] border-2 border-[var(--border-color)] flex items-center justify-center overflow-hidden shadow-sm transition-all duration-300">
                  {avatarPreview ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover scale-110" /> : <User className="w-12 h-12 text-[var(--text-muted)]" />}
                </div>
                <div className="mt-4 h-10 flex items-center justify-center">
                  {!zAvatarRequested ? (
                    <button aria-label="New Avatar" type="button" onClick={() => { setZAvatarRequested(true); setAvatarVariant(0); }} disabled={!username} className="px-5 py-2.5 bg-[#3B82F6]/10 text-[#3B82F6] hover:bg-[#3B82F6] hover:text-white rounded-full text-xs font-bold transition-colors disabled:opacity-50">Generate New zAvatar</button>
                  ) : (
                    <div className="flex items-center gap-6">
                      <button aria-label="Reroll" type="button" onClick={() => setAvatarVariant(v => v + 1)} className="flex items-center gap-1.5 text-xs font-bold text-[#3B82F6] hover:text-blue-600 transition-colors"><RefreshCw className="w-3.5 h-3.5" /> Reroll</button>
                      <button aria-label="Cancel" type="button" onClick={() => { setZAvatarRequested(false); setAvatarVariant(0); }} className="text-xs font-bold text-[var(--text-muted)] hover:text-red-500 transition-colors">Cancel</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2"><AtSign className="w-4 h-4 text-[#3B82F6]" /> Username</label>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} disabled={hasExistingUsername} className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-main)] outline-none focus:border-[#3B82F6] disabled:opacity-50" placeholder="choose_a_username" />
                </div>

                <div className="space-y-2" ref={dropdownRef}>
                  <label className="text-sm font-bold text-[var(--text-main)]">Gender</label>
                  <div className="relative">
                    <button aria-label="Dropdown" type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)} className={`w-full px-4 py-3 bg-[var(--background)] border rounded-xl text-left flex items-center justify-between transition-all focus:outline-none ${isDropdownOpen ? 'border-[#3B82F6] ring-2 ring-[#3B82F6]/20' : 'border-[var(--border-color)]'}`}>
                      <span className="text-[var(--text-main)]">{gender}</span><ChevronDown className={`w-5 h-5 text-[var(--text-muted)] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }} className="absolute z-50 w-full mt-2 bg-[var(--card)] border border-[var(--border-color)] rounded-xl shadow-xl overflow-hidden py-1">
                          {GENDER_OPTIONS.map((option) => (
                            <button aria-label="Change Gender" key={option} type="button" onClick={() => { setGender(option); setIsDropdownOpen(false); }} className="w-full px-4 py-3 text-left text-[var(--text-main)] hover:bg-[var(--background)] transition-colors flex items-center justify-between">
                              {option}{gender === option && <Check className="w-4 h-4 text-[#3B82F6]" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--text-main)]">Age</label>
                  <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-main)] outline-none focus:border-[#3B82F6]" placeholder="e.g. 21" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--text-main)] flex justify-between">Country {isCountryLocked && <span className="text-xs font-normal text-[#3B82F6] flex items-center gap-1"><Check className="w-3 h-3"/> Auto-detected</span>}</label>
                  {isCountryLocked ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-4 py-3.5 bg-[var(--background)] border border-[var(--border-color)] rounded-xl flex items-center justify-between opacity-80 cursor-not-allowed">
                        <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#3B82F6]" /><span className="text-[var(--text-main)] font-semibold">{country}</span></div><Lock className="w-4 h-4 text-[var(--text-muted)]" />
                      </div>
                      <button aria-label="Change Country" type="button" onClick={handleRequestCountryChange} disabled={isDetectingCountry} className="px-4 py-3.5 bg-[var(--background)] border border-[var(--border-color)] rounded-xl text-sm font-bold text-[var(--text-main)] hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors disabled:opacity-50 flex items-center justify-center min-w-[90px]">
                        {isDetectingCountry ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
                      </button>
                    </div>
                  ) : (
                    <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-4 py-3.5 bg-[var(--background)] border border-[var(--border-color)] rounded-xl text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all cursor-pointer appearance-none" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em'}}>
                      <option value="" disabled>Select country</option>
                      {ALL_COUNTRIES.map(c => (<option key={c} value={c}>{c}</option>))}
                    </select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2"><AlignLeft className="w-4 h-4 text-[#3B82F6]" /> Bio</label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-main)] outline-none focus:border-[#3B82F6] resize-none custom-scrollbar" placeholder="Tell everyone a bit about yourself..." />
                </div>

                <button aria-label="Save" onClick={handleSave} disabled={saving || (!hasExistingUsername && !username.trim())} className="w-full py-4 bg-[#3B82F6] text-white rounded-xl font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save Profile
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-[2rem] p-6 sm:p-8 shadow-sm flex flex-col items-center text-center relative">
              
              <div className="relative group mb-4">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[var(--background)] border-4 border-[var(--border-color)] overflow-hidden flex items-center justify-center shadow-sm">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover scale-110" />
                  ) : (
                    <User className="w-12 h-12 sm:w-14 sm:h-14 text-[var(--text-muted)]" />
                  )}
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] leading-tight">{profile?.name || username || 'New User'}</h1>
              <p className="text-[var(--text-muted)] font-medium mt-1 mb-3">@{username}</p>

              {/* 🚀 WALLET BADGE */}
              <button
                onClick={openPurchaseModal}
                className="flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 hover:bg-amber-500/20 transition-colors mb-5 active:scale-95"
              >
                <span className="font-extrabold text-sm">🪙 {balanceCoins?.toLocaleString() || 0} zCoins</span>
                <span className="bg-amber-500 text-white rounded-full p-0.5"><Plus className="w-3 h-3" /></span>
              </button>

              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {country && (
                  <span className="px-3 py-1 bg-[var(--background)] border border-[var(--border-color)] rounded-full text-xs font-bold flex items-center gap-1.5 text-[var(--text-main)]">
                    <MapPin className="w-3.5 h-3.5 text-[#3B82F6]" /> {country}
                  </span>
                )}
                {age && (
                  <span className="px-3 py-1 bg-[var(--background)] border border-[var(--border-color)] rounded-full text-xs font-bold flex items-center gap-1.5 text-[var(--text-main)]">
                    <Activity className="w-3.5 h-3.5 text-[#3B82F6]" /> {age} <span className="text-[var(--text-muted)] font-medium">Yrs</span>
                  </span>
                )}
                {profile?.gender && profile.gender !== 'Any' && (
                  <span className={`px-3 py-1 border rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm ${
                    isMale ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                    isFemale ? 'bg-pink-500/10 text-pink-500 border-pink-500/20' : 
                    'bg-purple-500/10 text-purple-500 border-purple-500/20'
                  }`}>
                    <User className="w-3.5 h-3.5" /> {profile.gender}
                  </span>
                )}
              </div>

              <p className="text-sm text-[var(--text-main)] w-full leading-relaxed whitespace-pre-wrap bg-[var(--background)]/50 p-4 rounded-xl border border-[var(--border-color)] mb-6 text-left">
                {bio || <span className="text-[var(--text-muted)] italic">No bio added yet. Click edit to introduce yourself!</span>}
              </p>

              <button 
                onClick={() => {
                  if (authUser?.approval_status === 'approved') {
                    navigate('/creator/dashboard');
                  } else if (authUser?.approval_status !== 'pending') {
                    setShowCreatorModal(true);
                  }
                }}
                disabled={authUser?.approval_status === 'pending'}
                className="w-full py-4 mb-4 bg-[#4F46E5] text-white rounded-[1.25rem] font-bold flex items-center justify-center gap-2 transition-all duration-200
                shadow-[6px_6px_12px_rgba(0,0,0,0.4),-4px_-4px_10px_rgba(255,255,255,0.03),inset_2px_2px_6px_rgba(255,255,255,0.25),inset_-3px_-3px_6px_rgba(0,0,0,0.2)] 
                hover:brightness-110 active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-2px_-2px_6px_rgba(255,255,255,0.1)] 
                disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {authUser?.approval_status === 'approved' ? (
                  <><Video className="w-5 h-5 drop-shadow-md" /> Creator Dashboard</>
                ) : authUser?.approval_status === 'pending' ? (
                  <><Clock className="w-5 h-5 drop-shadow-md" /> Application Pending...</>
                ) : (
                  <><Star className="w-5 h-5 drop-shadow-md" /> Become a Creator</>
                )}
              </button>

              <div className="w-full flex gap-3">
                <button aria-label="Share Profile" onClick={handleShareProfile} className="flex-1 py-3 bg-[var(--background)] border border-[var(--border-color)] rounded-xl text-sm font-bold text-[var(--text-main)] hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors flex items-center justify-center gap-2 shadow-sm">
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}{copied ? 'Copied' : 'Share'}
                </button>
                <button aria-label="Edit Profile" onClick={() => setIsEditing(true)} className="flex-1 py-3 bg-[var(--background)] border border-[var(--border-color)] rounded-xl text-sm font-bold text-[var(--text-main)] hover:border-[var(--text-main)] transition-colors flex items-center justify-center gap-2 shadow-sm">
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
                <button aria-label="Logout" onClick={() => setShowLogoutConfirm(true)} className="flex-1 py-3 bg-[var(--background)] border border-[var(--border-color)] rounded-xl text-sm font-bold text-[var(--text-main)] hover:border-red-500 hover:text-red-500 transition-colors flex items-center justify-center gap-2 shadow-sm">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-8 xl:col-span-8 space-y-6">
          <div className="bg-gradient-to-r from-[#3B82F6] to-indigo-600 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-md gap-4">
            <div>
              <h3 className="text-white text-lg font-bold flex items-center gap-2 mb-1"><MessageSquare className="w-5 h-5" /> Stranger Chat</h3>
              <p className="text-blue-100 text-sm">Connect with someone new in the global network instantly.</p>
            </div>
            <button aria-label="Start Chat" onClick={() => navigate('/chat')} className="w-full sm:w-auto px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl shadow hover:scale-105 active:scale-95 transition-transform whitespace-nowrap">
              Start Chat
            </button>
          </div>

          <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-[2rem] p-4 sm:p-6 shadow-sm min-h-[500px] flex flex-col">
            <div className="flex overflow-x-auto custom-scrollbar gap-2 mb-4 pb-2 flex-shrink-0 border-b border-[var(--border-color)]">
              {[
                { id: 'friends', icon: Users, label: 'My Friends' },
                { id: 'requests', icon: UserPlus, label: 'Requests' },
                { id: 'search', icon: Search, label: 'Find Friends' },
              ].map(tab => (
                <button aria-label="Tab Text"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-t-lg font-bold text-sm transition-colors whitespace-nowrap relative ${
                    activeTab === tab.id 
                      ? 'text-[#3B82F6]' 
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--background)]'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#3B82F6] rounded-t-full"></div>
                  )}
                </button>
              ))}
            </div>

            {activeTab === 'search' && (
              <div className="mb-4 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search global zQuab network by username..."
                    className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl pl-12 pr-4 py-3 text-[var(--text-main)] outline-none focus:border-[#3B82F6] transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
              {isDisplayLoading && displayData.length === 0 ? (
                <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" /></div>
              ) : displayData.length === 0 ? (
                <div className="text-center py-16 px-4 text-[var(--text-muted)] bg-[var(--background)] border border-[var(--border-color)] rounded-2xl border-dashed">
                  <p className="font-medium text-lg mb-1">
                    {activeTab === 'friends' ? "You haven't added any friends yet." : 
                     activeTab === 'requests' ? "No pending friend requests." : 
                     activeTab === 'blocked' ? "You haven't blocked anyone." : 
                     "Type a username above to search."}
                  </p>
                  <p className="text-sm">
                    {activeTab === 'friends' ? "Head over to the 'Find Friends' tab to grow your network!" : ""}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayData.map((user) => (
                    <UserCard
                      key={user.id || user.request_id}
                      user={{
                        ...user,
                        subtitle: activeTab === 'friends' ? `Friends since ${new Date(user.friends_since).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : 
                                  activeTab === 'blocked' ? 'Blocked' : undefined
                      }}
                      onClick={() => navigate(`/user/${user.username}`)}
                      actionButton={
                        activeTab === 'requests' ? (
                          <div className="flex gap-2">
                            <button aria-label="Check" onClick={(e) => { e.stopPropagation(); handleNetworkAction(() => friendsApi.acceptRequest(user.username), user.username, true); }} className="p-2 bg-[#3B82F6] text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm">
                              <Check className="w-5 h-5" />
                            </button>
                            <button aria-label="Close" onClick={(e) => { e.stopPropagation(); handleNetworkAction(() => friendsApi.rejectRequest(user.username), user.username, true); }} className="p-2 bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-colors">
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ) : activeTab === 'blocked' ? (
                          <button aria-label="Unblock" onClick={(e) => { e.stopPropagation(); handleNetworkAction(() => friendsApi.unblockUser(user.username), user.username, false); }} className="px-4 py-1.5 bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg text-sm font-bold hover:bg-[var(--border-color)] transition-colors">
                            Unblock
                          </button>
                        ) : null
                      }
                    />
                  ))}
                </div>
              )}
              {activeTab !== 'requests' && (
                <PaginationLoader onLoadMore={() => fetchNetworkData()} hasMore={currentHasMore} isLoading={networkLoading} />
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}