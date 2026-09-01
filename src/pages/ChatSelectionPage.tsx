
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Video, ShieldAlert, MessageCircle, MoreHorizontal } from 'lucide-react';

// 🚀 TRUE CLAYMORPHISM (Strictly for primary action buttons)
const CLAY_BUTTON_ACTIVE = "bg-[#3B82F6] text-white font-bold rounded-[1.25rem] border-none transition-all hover:brightness-110 active:scale-95 " +
  "shadow-[4px_4px_12px_rgba(59,130,246,0.3),-4px_-4px_10px_rgba(255,255,255,0.9),inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_4px_rgba(0,0,0,0.1)] " +
  "dark:shadow-[6px_6px_12px_rgba(0,0,0,0.4),-4px_-4px_10px_rgba(255,255,255,0.03),inset_2px_2px_6px_rgba(255,255,255,0.25),inset_-3px_-3px_6px_rgba(0,0,0,0.2)]";

export default function ChatSelectionPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[85vh] bg-[var(--background)] text-[var(--text-main)] flex flex-col items-center justify-center p-6 transition-colors duration-300 font-sans selection:bg-[#3B82F6]/30">
      
      <div className="max-w-4xl w-full space-y-10 animate-fadeIn">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] text-[10px] font-bold uppercase tracking-widest mb-2">
            <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse"></span>
            Global Network
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-[var(--text-main)]">
            Meet New People
          </h1>
          <p className="text-[var(--text-muted)] text-base md:text-lg font-medium max-w-xl mx-auto">
            Instantly connect with someone across the globe. Choose your preferred way to chat below.
          </p>
        </div>

        {/* Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          
          {/* 🚀 Text Chat Card with Hover Animations */}
          <div className="group relative p-6 md:p-8 flex flex-col items-center text-center bg-[var(--card)] rounded-[2rem] border border-[var(--border-color)] overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/30">
            
            {/* Animated Window */}
            <div className="relative w-full h-48 mb-8 rounded-[1.5rem] bg-gradient-to-b from-[var(--background)] to-transparent border border-[var(--border-color)]/50 flex items-center justify-center overflow-hidden">
              
              {/* Background Grid Pattern */}
              <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
              
              {/* Floating Bubble 1 (Left) */}
              <div className="absolute left-6 top-8 bg-indigo-500/10 text-indigo-500 p-3 rounded-2xl rounded-bl-none transform -translate-x-4 translate-y-8 opacity-0 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out">
                <MoreHorizontal className="w-5 h-5 animate-pulse" />
              </div>

              {/* Floating Bubble 2 (Right) */}
              <div className="absolute right-6 bottom-8 bg-blue-500/10 text-blue-500 p-3 rounded-2xl rounded-br-none transform translate-x-4 translate-y-8 opacity-0 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100 ease-out">
                <MessageCircle className="w-5 h-5" />
              </div>

              {/* Center Icon */}
              <div className="z-10 bg-indigo-500/10 text-indigo-500 p-5 rounded-[1.25rem] shadow-inner group-hover:scale-110 transition-transform duration-500 ease-out">
                <MessageSquare className="w-10 h-10" />
              </div>
            </div>

            <h2 className="text-2xl font-extrabold mb-3 text-[var(--text-main)]">Text Chat</h2>
            <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-8 flex-1 font-medium">
              Classic, fast, and completely anonymous messaging. Perfect for quick conversations without turning on your camera.
            </p>
            <button 
              onClick={() => navigate('/chat/text')} 
              className={`w-full py-4 text-base ${CLAY_BUTTON_ACTIVE} bg-indigo-500 shadow-[4px_4px_12px_rgba(99,102,241,0.3),-4px_-4px_10px_rgba(255,255,255,0.9),inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_4px_rgba(0,0,0,0.1)]`}
            >
              Start Typing
            </button>
          </div>

          {/* 🚀 Video Chat Card with Hover Animations */}
          <div className="group relative p-6 md:p-8 flex flex-col items-center text-center bg-[var(--card)] rounded-[2rem] border border-[var(--border-color)] overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/10 hover:border-emerald-500/30">
            
            {/* Animated Window */}
            <div className="relative w-full h-48 mb-8 rounded-[1.5rem] bg-gradient-to-b from-[var(--background)] to-transparent border border-[var(--border-color)]/50 flex items-center justify-center overflow-hidden">
              
              {/* Background Grid Pattern */}
              <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
              
              {/* Pulsing Radar Rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="absolute w-24 h-24 rounded-full border border-emerald-500/30 opacity-0 group-hover:animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                <div className="absolute w-24 h-24 rounded-full border border-emerald-500/20 opacity-0 group-hover:animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite] delay-300" />
              </div>

              {/* REC Indicator */}
              <div className="absolute top-4 right-5 flex items-center gap-1.5 opacity-0 translate-y-2 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                <span className="text-[10px] font-black text-red-500 tracking-widest">REC</span>
              </div>

              {/* Center Icon */}
              <div className="z-10 bg-emerald-500/10 text-emerald-500 p-5 rounded-[1.25rem] shadow-inner group-hover:scale-110 transition-transform duration-500 ease-out">
                <Video className="w-10 h-10" />
              </div>
            </div>

            <h2 className="text-2xl font-extrabold mb-3 text-[var(--text-main)]">Video Chat</h2>
            <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-8 flex-1 font-medium">
              Face-to-face random connections. Make sure your microphone and camera are ready before jumping in.
            </p>
            <button 
              onClick={() => navigate('/chat/video')} 
              className={`w-full py-4 text-base ${CLAY_BUTTON_ACTIVE} bg-emerald-500 shadow-[4px_4px_12px_rgba(16,185,129,0.3),-4px_-4px_10px_rgba(255,255,255,0.9),inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_4px_rgba(0,0,0,0.1)]`}
            >
              Enable Camera
            </button>
          </div>

        </div>

        {/* Safety Disclaimer */}
        <div className="flex items-center justify-center gap-2 text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider mt-8">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <span>Moderated for safety. Be respectful.</span>
        </div>

      </div>
    </div>
  );
}