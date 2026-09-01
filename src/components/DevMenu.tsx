import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bug, ChevronDown, Rocket, UserCheck, UserX, Eye, Video, Server, PlayCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; 

export default function DevMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, devMockLogin, logout } = useAuth();
  
  const [devRole, setDevRole] = useState<'viewer' | 'creator'>(
    (sessionStorage.getItem('dev_stream_role') as 'viewer' | 'creator') || 'viewer'
  );

  const [streamMode, setStreamMode] = useState<'api' | 'mock'>(
    (sessionStorage.getItem('dev_stream_mode') as 'api' | 'mock') || 'api'
  );

  if (import.meta.env.PROD) return null;

  const handleAuthToggle = () => {
    if (user) logout(); 
    else devMockLogin(); 
    setIsOpen(false);
  };

  const handleRoleToggle = () => {
    const newRole = devRole === 'viewer' ? 'creator' : 'viewer';
    setDevRole(newRole);
    sessionStorage.setItem('dev_stream_role', newRole);
    window.dispatchEvent(new CustomEvent('dev_role_changed', { detail: { role: newRole } }));
  };

  const handleStreamModeToggle = () => {
    const newMode = streamMode === 'api' ? 'mock' : 'api';
    setStreamMode(newMode);
    sessionStorage.setItem('dev_stream_mode', newMode);
    window.dispatchEvent(new CustomEvent('dev_stream_mode_changed', { detail: { mode: newMode } }));
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-2">
      {isOpen && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4 w-64 max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 flex flex-col gap-2 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-700">
            <Rocket className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">Dev Menu</span>
          </div>
          
          <div className="space-y-1 pb-2 border-b border-gray-800">
            <Link to="/dev/onboarding" onClick={() => setIsOpen(false)} className="block text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-md transition-colors">🎨 UI: Onboarding</Link>
            <Link to="/dev/auth" onClick={() => setIsOpen(false)} className="block text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-md transition-colors">🔐 UI: Auth</Link>
            <Link to="/dev/home" onClick={() => setIsOpen(false)} className="block text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-md transition-colors">📥 UI: Inbox</Link>
          </div>

          <div className="mt-1 pt-1 space-y-2">
            <div className="text-[10px] font-bold text-gray-500 uppercase px-2 tracking-wider">Live Stream Testing</div>
            
            {/* Role Toggle */}
            <button 
              onClick={handleRoleToggle}
              className="w-full flex items-center justify-between p-2 rounded-md transition-colors font-semibold text-sm bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700"
            >
              <div className="flex items-center gap-2">
                {devRole === 'creator' ? <Video className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4 text-blue-400" />}
                Role: {devRole === 'creator' ? 'Creator' : 'Viewer'}
              </div>
              <span className="text-[9px] uppercase bg-black px-1.5 py-0.5 rounded text-gray-400">Swap</span>
            </button>

            {/* Source Toggle */}
            <button 
              onClick={handleStreamModeToggle}
              className="w-full flex items-center justify-between p-2 rounded-md transition-colors font-semibold text-sm bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700"
            >
              <div className="flex items-center gap-2">
                {streamMode === 'api' ? <Server className="w-4 h-4 text-emerald-400" /> : <PlayCircle className="w-4 h-4 text-purple-400" />}
                Feed: {streamMode === 'api' ? 'API' : 'Mock Video'}
              </div>
              <span className="text-[9px] uppercase bg-black px-1.5 py-0.5 rounded text-gray-400">Swap</span>
            </button>

            {/* 🚀 UPDATED GRADUATED PATHS */}
            <Link to="/discover" onClick={() => setIsOpen(false)} className="block text-sm font-medium text-indigo-400 hover:text-indigo-300 hover:bg-gray-800 p-2 rounded-md transition-colors">📡 Stream: Discovery</Link>
            <Link to="/live/stream-1" onClick={() => setIsOpen(false)} className="block text-sm font-medium text-indigo-400 hover:text-indigo-300 hover:bg-gray-800 p-2 rounded-md transition-colors">🔴 Stream: Live Room</Link>
            <Link to="/creator/dashboard" onClick={() => setIsOpen(false)} className="block text-sm font-medium text-indigo-400 hover:text-indigo-300 hover:bg-gray-800 p-2 rounded-md transition-colors">🎛️ Stream: Dashboard</Link>
          </div>

          <div className="mt-2 pt-2 border-t border-gray-700">
            <button onClick={handleAuthToggle} className={`w-full flex items-center justify-center gap-2 text-sm font-bold p-2 rounded-md transition-colors ${user ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}>
              {user ? <><UserX className="w-4 h-4" /> Drop Mock Auth</> : <><UserCheck className="w-4 h-4" /> Mock Logged-In</>}
            </button>
          </div>
        </div>
      )}

      <button onClick={() => setIsOpen(!isOpen)} className="w-12 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 border border-indigo-400">
        {isOpen ? <ChevronDown className="w-6 h-6" /> : <Bug className="w-6 h-6" />}
      </button>
    </div>
  );
}