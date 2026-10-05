import { useState } from 'react';
import ReactCountryFlag from 'react-country-flag';
import { UserPlus, LogOut, Globe2, User, AlertTriangle, Info, } from 'lucide-react';
// import { Plus, Loader2, Check, HelpCircle } from 'lucide-react';

type Status = 'idle' | 'searching' | 'connected' | 'disconnected';

interface Props {
  status: Status;
  onNext: () => void;
  userCountry?: { name: string; code: string } | null;
  partnerCountry?: { name: string; code: string } | null;
  partnerUsername?: string; 
  partnerGender?: string; 
  partnerAvatar?: string; 
  onAddFriend?: () => void;
  friendRequestStatus?: 'none' | 'loading' | 'sent';
  isAlreadyFriend?: boolean;
  onLeaveConfirm: () => void;
}

export default function ConnectionCard({ 
  status, 
  onNext, 
  userCountry, 
  partnerCountry,
  partnerUsername,
  // partnerGender,
  // partnerAvatar,
  onAddFriend,
  // friendRequestStatus = 'none',
  // isAlreadyFriend = false,
  onLeaveConfirm
}: Props) {
  const [showAddConfirm, setShowAddConfirm] = useState(false);
  const [showNextConfirm, setShowNextConfirm] = useState(false);
  const [showSafetyTip, setShowSafetyTip] = useState(false);

  const handleNextClick = () => {
    if (status === 'connected') {
      setShowNextConfirm(true);
    } else {
      onNext();
    }
  };

  return (
    
    <div className="rounded-[2rem] flex flex-col h-full border border-[var(--border-color)] bg-[var(--card)] relative overflow-hidden shadow-[4px_4px_16px_rgba(0,0,0,0.15),-2px_-2px_6px_rgba(255,255,255,0.02),inset_1px_1px_2px_rgba(255,255,255,0.03),inset_-1px_-1px_2px_rgba(0,0,0,0.08)]">
      
      {/* 1. INLINE CONFIRMATION OVERLAY FOR ADD FRIEND */}
      {showAddConfirm && (
        <div className="absolute inset-0 z-20 bg-[var(--card)]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-12 h-12 bg-blue-500/10 text-[#3B82F6] rounded-full flex items-center justify-center mb-3">
            <UserPlus className="w-6 h-6" />
          </div>
          <h4 className="text-[var(--text-main)] font-bold text-lg mb-1">Add @{partnerUsername}?</h4>
          <p className="text-sm text-[var(--text-muted)] mb-6">They will receive a friend request.</p>
          
          <div className="flex flex-col gap-2 w-full">
            <button aria-label="Send Request"
              onClick={() => {
                onAddFriend?.();
                setShowAddConfirm(false);
              }}
              className="w-full py-3 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-500/20 active:scale-[0.98]"
            >
              Send Request
            </button>
            <button aria-label="Cancel"
              onClick={() => setShowAddConfirm(false)}
              className="w-full py-3 bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--border-color)] rounded-xl font-bold transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 2. INLINE CONFIRMATION OVERLAY FOR NEXT STRANGER */}
      {showNextConfirm && (
        <div className="absolute inset-0 z-20 bg-[var(--card)]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h4 className="text-[var(--text-main)] font-bold text-lg mb-1">Skip to Next?</h4>
          <p className="text-sm text-[var(--text-muted)] mb-6">This conversation will be lost forever.</p>
          
          <div className="flex flex-col gap-2 w-full">
            <button aria-label="Skip"
              onClick={() => {
                onNext();
                setShowNextConfirm(false);
              }}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all shadow-md shadow-orange-500/20 active:scale-[0.98]"
            >
              Yes, Skip
            </button>
            <button aria-label="Cancel"
              onClick={() => setShowNextConfirm(false)}
              className="w-full py-3 bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--border-color)] rounded-xl font-bold transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="p-6 flex flex-col h-full overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:!hidden [&::-webkit-scrollbar]:!w-0 [&::-webkit-scrollbar]:!h-0 [-ms-overflow-style:none] [scrollbar-width:none]">
        
        {/* STATUS HEADER */}
        <div className="mb-6 flex-shrink-0">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
            Status
          </h3>
          
          {status === 'searching' && (
            <div className="flex items-center gap-2 text-[#3B82F6] font-bold">
              <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] animate-ping" />
              Searching...
            </div>
          )}
          
          {status === 'connected' && (
            <div className="flex items-center gap-2 text-green-500 font-bold">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_#22C55E]" />
              Stranger Connected
            </div>
          )}

          {status === 'disconnected' && (
            <div className="flex items-center gap-2 text-red-500 font-bold">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              Disconnected
            </div>
          )}
        </div>

        <div className="space-y-4 mt-auto">
          
          {/* UNIFIED STRANGER WARNING BLOCK */}
          {status === 'connected' && (
            <div className="bg-[var(--background)]/50 py-6 px-4 rounded-[1.5rem] border border-[var(--border-color)] border-dashed flex flex-col items-center justify-center text-center relative shadow-[inset_1px_1px_4px_rgba(0,0,0,0.1)]">
              <div className="relative mb-3">
                <div className="w-20 h-20 bg-indigo-500/10 border-2 border-indigo-500/20 rounded-full flex items-center justify-center shadow-sm overflow-hidden transition-colors">
                  <User className="w-10 h-10 text-indigo-500" />
                </div>
              </div>
              
              <h4 className="font-black text-[var(--text-main)] text-xl leading-tight mb-2">
                Stranger
              </h4>
              
              {/* CTA Link replacing description on ALL devices */}
              <div className="relative w-full flex justify-center mt-1">
                <button aria-label="Safety Info"
                  onClick={() => setShowSafetyTip(!showSafetyTip)}
                  onBlur={() => setShowSafetyTip(false)}
                  className="text-xs font-bold text-[#3B82F6] flex items-center gap-1.5 active:scale-95 transition-transform bg-blue-500/10 px-3.5 py-1.5 rounded-full"
                >
                  <Info className="w-3.5 h-3.5" /> Safety Info
                </button>
                
                {/* Universal Tooltip */}
                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-[var(--text-main)] text-[var(--background)] text-xs font-bold p-3 rounded-xl shadow-2xl z-30 transition-all duration-200 pointer-events-none ${showSafetyTip ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'}`}>
                  Talk with strangers but be aware! Share your zQuab IDs in the chat if the conversation goes well.
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--text-main)]"></div>
                </div>
              </div>
            </div>
          )}

          {/* LOCATIONS */}
          <div className="flex items-center justify-between rounded-[1.5rem] border border-[var(--border-color)] bg-[var(--background)]/50 p-4 shadow-[inset_1px_1px_4px_rgba(0,0,0,0.1)]">
            <div className="flex-1 flex flex-col items-center group relative cursor-help">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">You</span>
              {userCountry?.code ? (
                <ReactCountryFlag countryCode={userCountry.code} svg className="text-3xl rounded-sm drop-shadow-sm" />
              ) : (
                <div className="w-8 h-6 bg-[var(--border-color)] rounded animate-pulse" />
              )}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--text-main)] text-[var(--background)] text-xs font-bold px-3 py-1.5 rounded-lg pointer-events-none whitespace-nowrap z-10 shadow-xl">
                {userCountry?.name || 'Detecting...'}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--text-main)]"></div>
              </div>
            </div>

            <div className="w-px h-10 bg-[var(--border-color)] mx-2"></div>

            <div className="flex-1 flex flex-col items-center group relative cursor-help">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Stranger</span>
              {partnerCountry?.code ? (
                <ReactCountryFlag countryCode={partnerCountry.code} svg className="text-3xl rounded-sm drop-shadow-sm" />
              ) : (
                <Globe2 className="w-7 h-7 text-[var(--text-muted)] opacity-50" />
              )}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--text-main)] text-[var(--background)] text-xs font-bold px-3 py-1.5 rounded-lg pointer-events-none whitespace-nowrap z-10 shadow-xl">
                {partnerCountry?.name || 'Unknown Location'}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--text-main)]"></div>
              </div>
            </div>
          </div>

          {/* BUTTONS: Upgraded to claymorphism shadow logic */}
          <button aria-label="Next Stranger"
  onClick={handleNextClick} 
  className="w-full flex items-center justify-center gap-2 bg-[var(--background)] hover:bg-[var(--border-color)] border border-[var(--border-color)] text-[var(--text-main)] py-4 rounded-xl font-bold transition-all active:scale-[0.98] mt-2 shadow-[2px_2px_8px_rgba(0,0,0,0.15),inset_1px_1px_2px_rgba(255,255,255,0.02)] hover:shadow-none"
>
            <UserPlus className="w-5 h-5" />
            Next Stranger
          </button>
          
          <button aria-label="Leave Chat"
            onClick={onLeaveConfirm}
            className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-4 rounded-xl font-bold transition-all active:scale-[0.98]"
          >
            <LogOut className="w-5 h-5" />
            Leave Chat
          </button>
        </div>
      </div>
    </div>
  );
}