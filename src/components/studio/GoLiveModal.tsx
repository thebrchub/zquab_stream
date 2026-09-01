import React, { useState } from 'react';
import { X, Video, Copy, RefreshCw, Check, Loader2, ShieldAlert, Lock, Play, CheckCircle2 } from 'lucide-react';
import { streamService, type CreateStreamPayload, type StreamCreationResponse } from '../../services/streamService';

interface GoLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoLiveModal: React.FC<GoLiveModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Step 1 Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('gaming');
  const [durationHours, setDurationHours] = useState(2);
  const [isPremium, setIsPremium] = useState(false);
  const [price, setPrice] = useState(100);

  // Step 2 OBS Setup State
  const [streamData, setStreamData] = useState<StreamCreationResponse | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Note: Ask your backend team for the exact RTMP ingest URL for your production environment.
  const RTMP_URL = "rtmp://ingest.brchub.tech/live"; 

  if (!isOpen) return null;

  const handleCreateStream = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const endTime = new Date();
      endTime.setHours(endTime.getHours() + durationHours);

      const payload: CreateStreamPayload = {
        title,
        category,
        tags: ["live"], 
        planned_end_at: endTime.toISOString(),
        is_premium: isPremium,
        entry_price_coins: isPremium ? price : 0,
      };

      const data = await streamService.createStream(payload);
      setStreamData(data);
      setStep(2); 
    } catch (err: any) {
      setError(err.message || "Failed to create stream");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyKey = () => {
    if (streamData?.stream_key) {
      navigator.clipboard.writeText(streamData.stream_key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleRegenerateKey = async () => {
    if (!streamData) return;
    setIsLoading(true);
    try {
      const data = await streamService.regenerateKey(streamData.stream_id);
      setStreamData({ ...streamData, stream_key: data.stream_key });
    } catch (err: any) {
      setError("Failed to regenerate key");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset state on close so it's fresh next time
    setTimeout(() => {
      setStep(1);
      setTitle('');
      setIsPremium(false);
      setStreamData(null);
      setError(null);
    }, 200);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-[var(--card)] border border-[var(--border-color)] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 md:px-8 md:pt-8 md:pb-6 border-b border-[var(--border-color)] bg-[var(--card)] z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#3B82F6]/10 rounded-[1rem] text-[#3B82F6] shadow-inner">
              {step === 1 ? <Video className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-xl font-black text-[var(--text-main)] tracking-tight leading-none">
                {step === 1 ? 'Stream Configuration' : 'Ready to Broadcast'}
              </h2>
              <p className="text-xs text-[var(--text-muted)] font-medium mt-1">
                {step === 1 ? 'Set up your room details' : 'Connect your encoder (OBS)'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose} 
            className="p-2 hover:bg-[var(--background)] border border-transparent hover:border-[var(--border-color)] rounded-full text-[var(--text-muted)] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 md:p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-medium flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* STEP 1: Configuration Form */}
          {step === 1 && (
            <form onSubmit={handleCreateStream} className="flex flex-col gap-6 animate-in slide-in-from-left-4 duration-300">
              
              <div className="space-y-2">
                <label className="block text-sm font-bold text-[var(--text-main)] ml-1">Stream Title</label>
                <input 
                  type="text" 
                  required
                  maxLength={100}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Late night ranked grind"
                  className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-[1.25rem] px-4 py-3.5 text-sm text-[var(--text-main)] outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[var(--text-main)] ml-1">Category</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-[1.25rem] px-4 py-3.5 text-sm text-[var(--text-main)] outline-none focus:border-[#3B82F6] transition-all shadow-sm cursor-pointer appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundPosition: 'right 1rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.25em 1.25em'
                    }}
                  >
                    <option value="gaming">Gaming</option>
                    <option value="chatting">Just Chatting</option>
                    <option value="music">Music</option>
                    <option value="art">Art</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[var(--text-main)] ml-1">Duration</label>
                  <select 
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-[1.25rem] px-4 py-3.5 text-sm text-[var(--text-main)] outline-none focus:border-[#3B82F6] transition-all shadow-sm cursor-pointer appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundPosition: 'right 1rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.25em 1.25em'
                    }}
                  >
                    <option value={1}>1 Hour</option>
                    <option value={2}>2 Hours</option>
                    <option value={4}>4 Hours</option>
                    <option value={8}>8 Hours</option>
                  </select>
                </div>
              </div>

              {/* Premium Gate Card */}
              <div className="p-5 rounded-[1.5rem] bg-[var(--background)] border border-[var(--border-color)] shadow-sm flex flex-col gap-4 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[var(--text-main)] flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-500" /> Premium Gate
                    </div>
                    <div className="text-xs font-medium text-[var(--text-muted)] mt-1">Require viewers to pay zCoins to enter</div>
                  </div>
                  
                  {/* Custom Toggle Switch */}
                  <button 
                    type="button"
                    onClick={() => setIsPremium(!isPremium)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      isPremium ? 'bg-amber-500' : 'bg-[var(--card)] border border-[var(--border-color)]'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                      isPremium ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {isPremium && (
                  <div className="pt-4 border-t border-[var(--border-color)] animate-in slide-in-from-top-2 fade-in duration-200">
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">Entry Price (zCoins)</label>
                    <input 
                      type="number" 
                      min="10"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full bg-[var(--card)] border border-amber-500/30 focus:border-amber-500 rounded-[1.25rem] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition-all shadow-sm focus:shadow-md focus:shadow-amber-500/10"
                    />
                  </div>
                )}
              </div>

              {/* Primary Action Button (Tactile Claymorphism) */}
              <button 
                type="submit" 
                disabled={isLoading || !title.trim()}
                className="mt-2 w-full py-4 bg-[#3B82F6] text-white rounded-[1.25rem] font-bold flex items-center justify-center gap-2 transition-all shadow-[0_4px_10px_rgba(59,130,246,0.3)] hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:active:scale-100 border-none"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Play className="w-5 h-5 fill-current" /> Generate Stream Key</>}
              </button>
            </form>
          )}

          {/* STEP 2: OBS Setup Details */}
          {step === 2 && streamData && (
            <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
              
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-[1.25rem] text-amber-600 dark:text-amber-400 text-sm font-medium flex items-start gap-3 leading-relaxed shadow-inner">
                <ShieldAlert className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
                <p>Your stream is provisioned. Paste these settings into OBS Studio. <strong className="font-bold text-amber-700 dark:text-amber-300">Never share your stream key with anyone.</strong></p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider ml-1">Server URL (RTMP)</label>
                  <input 
                    readOnly 
                    value={RTMP_URL}
                    className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-[1.25rem] px-4 py-3.5 text-sm text-[var(--text-main)] font-mono outline-none opacity-80"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1 mb-2">
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Stream Key</label>
                    <button onClick={handleRegenerateKey} disabled={isLoading} className="text-xs font-bold text-[#3B82F6] hover:text-blue-600 transition-colors flex items-center gap-1.5 disabled:opacity-50">
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Reset Key
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="password" 
                      readOnly 
                      value={streamData.stream_key}
                      className="flex-1 bg-[var(--background)] border border-[var(--border-color)] rounded-[1.25rem] px-4 py-3.5 text-sm text-[var(--text-main)] font-mono tracking-widest outline-none shadow-sm"
                    />
                    <button 
                      onClick={handleCopyKey}
                      className="px-5 bg-[var(--background)] border border-[var(--border-color)] rounded-[1.25rem] hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors flex items-center justify-center text-[var(--text-main)] shadow-sm active:scale-95"
                      title="Copy Key"
                    >
                      {copiedKey ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleClose}
                className="mt-4 w-full py-4 bg-[var(--background)] border border-[var(--border-color)] hover:border-[var(--text-main)] text-[var(--text-main)] rounded-[1.25rem] font-bold transition-all shadow-sm active:scale-95"
              >
                Close & Go to Dashboard
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};