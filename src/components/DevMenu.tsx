import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bug, ChevronDown, Rocket, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; 

export default function DevMenu() {
  const [isOpen, setIsOpen] = useState(false);
  
  const { user, devMockLogin, logout } = useAuth();

  if (import.meta.env.PROD) return null;

  const handleAuthToggle = () => {
    if (user) {
      logout(); 
    } else {
      devMockLogin(); 
    }
    setIsOpen(false);
  };

  const triggerMockDisconnect = () => {
    window.dispatchEvent(new CustomEvent('dev_mock_disconnect'));
    setIsOpen(false);
  };

  const triggerWelcomeModal = () => {
    window.dispatchEvent(new CustomEvent('dev_mock_welcome'));
    setIsOpen(false);
  };

  const triggerSocialBanner = () => {
    sessionStorage.removeItem('zquab_social_prompt_shown');
    localStorage.removeItem('zquab_social_last_shown');
    window.dispatchEvent(new CustomEvent('dev_mock_social_banner'));
    setIsOpen(false);
  };

  const triggerOnboardingLoad = () => {
    window.dispatchEvent(new CustomEvent('dev_mock_onboarding_load'));
    setIsOpen(false);
  };

  const triggerEarlyAccessModal = () => {
    window.dispatchEvent(new CustomEvent('dev_mock_early_access'));
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-2">
      {isOpen && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4 w-64 max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 flex flex-col gap-2 backdrop-blur-md animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-700">
            <Rocket className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">Dev Menu</span>
          </div>
          
          <Link to="/dev/onboarding" onClick={() => setIsOpen(false)} aria-label="Account Onboarding" className="text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-colors">
            🎨 UI: Onboarding
          </Link>
          <Link to="/dev/auth" onClick={() => setIsOpen(false)} aria-label="Account Login" className="text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-colors">
            🔐 UI: Auth
          </Link>
          <Link to="/dev/home" onClick={() => setIsOpen(false)} aria-label="Home" className="text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-colors">
            📥 UI: Inbox
          </Link>
          <Link to="/dev/chat" onClick={() => setIsOpen(false)} aria-label="Chat" className="text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-colors">
            💬 UI: Chat Room
          </Link>
          <Link to="/dev/profile" onClick={() => setIsOpen(false)} className="text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-colors">
            👤 UI: Profile
          </Link>
          <Link to="/search" onClick={() => setIsOpen(false)} aria-label="Search" className="text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-colors">
            🔍 UI: Search
          </Link>
          <Link to="/early-access" onClick={() => setIsOpen(false)} aria-label="Waitlist" className="text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-colors">
            🎟️ UI: Waitlist
          </Link>

          {/* 🛠️ NEW: Stream Pivot Routes */}
          <div className="mt-2 pt-2 border-t border-gray-700 space-y-1">
            <div className="text-[10px] font-bold text-gray-500 uppercase px-2 mb-1 tracking-wider">Stream Pivot</div>
            <Link to="/dev/stream/discovery" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-sm font-medium text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10 p-2 rounded-lg transition-colors">
              📡 Stream: Discovery
            </Link>
            <Link to="/dev/stream/live" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-sm font-medium text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10 p-2 rounded-lg transition-colors">
              🔴 Stream: Live Room
            </Link>
            <Link to="/dev/stream/1on1" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-sm font-medium text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10 p-2 rounded-lg transition-colors">
              🤝 Stream: 1 on 1
            </Link>
            <Link to="/dev/stream/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-sm font-medium text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10 p-2 rounded-lg transition-colors">
              🎛️ Stream: Dashboard
            </Link>
          </div>

          <div className="mt-2 pt-2 border-t border-gray-700 space-y-1">
            <button aria-label="Onboarding"
              onClick={triggerOnboardingLoad} 
              className="w-full text-left text-sm font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 p-2 rounded-lg transition-colors"
            >
              ⏳ Show Onboarding Loader
            </button>
            <button aria-label="Show Banner"
              onClick={triggerSocialBanner} 
              className="w-full text-left text-sm font-medium text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 p-2 rounded-lg transition-colors"
            >
              📢 Show Social Banner
            </button>
            <button aria-label="Show Welcome Modal"
              onClick={triggerWelcomeModal} 
              className="w-full text-left text-sm font-medium text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 p-2 rounded-lg transition-colors"
            >
              ✨ Show Welcome Modal
            </button>
            <button aria-label="Show Early Access Modal"
              onClick={triggerEarlyAccessModal} 
              className="w-full text-left text-sm font-medium text-pink-400 hover:text-pink-300 hover:bg-pink-400/10 p-2 rounded-lg transition-colors"
            >
              🚀 Show Early Access
            </button>
            <button aria-label="Disconnect"
              onClick={triggerMockDisconnect} 
              className="w-full text-left text-sm font-medium text-orange-400 hover:text-orange-300 hover:bg-orange-400/10 p-2 rounded-lg transition-colors"
            >
              🔌 Mock Disconnect
            </button>
          </div>

          <div className="mt-2 pt-2 border-t border-gray-700">
            <button aria-label="Toggle Auth"
              onClick={handleAuthToggle}
              className={`w-full flex items-center justify-center gap-2 text-sm font-bold p-2 rounded-lg transition-colors ${
                user 
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                  : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              }`}
            >
              {user ? (
                <>
                  <UserX className="w-4 h-4" /> Drop Mock Auth
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" /> Mock Logged-In
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <button aria-label="Open"
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30 transition-transform active:scale-95 border-2 border-purple-400/50"
      >
        {isOpen ? <ChevronDown className="w-6 h-6" /> : <Bug className="w-6 h-6" />}
      </button>
    </div>
  );
}