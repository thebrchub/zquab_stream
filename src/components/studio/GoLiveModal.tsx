import React, { useState } from 'react';
import { X, Video, Copy, RefreshCw, Check, Loader2, ShieldAlert } from 'lucide-react';
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
  // We'll use a generic placeholder here.
  const RTMP_URL = "rtmp://ingest.brchub.tech/live"; 

  if (!isOpen) return null;

  const handleCreateStream = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Calculate the mandatory planned_end_at ISO string
      const endTime = new Date();
      endTime.setHours(endTime.getHours() + durationHours);

      const payload: CreateStreamPayload = {
        title,
        category,
        tags: ["live"], // You can add a tag input UI later
        planned_end_at: endTime.toISOString(),
        is_premium: isPremium,
        entry_price_coins: isPremium ? price : 0,
      };

      const data = await streamService.createStream(payload);
      setStreamData(data);
      setStep(2); // Move to OBS setup
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#11141a] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Video className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">
              {step === 1 ? 'Go Live' : 'OBS Studio Setup'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> {error}
          </div>
        )}

        {/* STEP 1: Configuration Form */}
        {step === 1 && (
          <form onSubmit={handleCreateStream} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Stream Title</label>
              <input 
                type="text" 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g., Late night ranked grind"
                className="w-full bg-[#1a1f29] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#1a1f29] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="gaming">Gaming</option>
                  <option value="chatting">Just Chatting</option>
                  <option value="music">Music</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Planned Duration (Hours)</label>
                <input 
                  type="number" 
                  min="1" max="12"
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full bg-[#1a1f29] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#1a1f29] border border-gray-800 flex flex-col gap-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                    Premium Stream Gate
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">Charge zCoins for viewers to enter</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={isPremium}
                  onChange={(e) => setIsPremium(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-700 text-amber-500 focus:ring-amber-500 bg-[#11141a]"
                />
              </label>

              {isPremium && (
                <div className="pt-3 border-t border-gray-800">
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Entry Price (zCoins)</label>
                  <input 
                    type="number" 
                    min="10"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-[#11141a] border border-gray-800 rounded-xl px-4 py-2 text-sm text-amber-50 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={isLoading || !title.trim()}
              className="mt-2 w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl font-bold transition-all shadow-lg shadow-indigo-900/20 flex justify-center items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Stream Key'}
            </button>
          </form>
        )}

        {/* STEP 2: OBS Setup Details */}
        {step === 2 && streamData && (
          <div className="flex flex-col gap-5">
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 text-sm flex gap-3 leading-relaxed">
              <ShieldAlert className="w-5 h-5 shrink-0 text-amber-500" />
              <p>Your stream is provisioned. Paste these settings into OBS Studio. <strong>Never share your stream key with anyone.</strong></p>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Server URL (RTMP)</label>
                <input 
                  readOnly 
                  value={RTMP_URL}
                  className="w-full bg-[#1a1f29] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-300 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-400">Stream Key</label>
                  <button onClick={handleRegenerateKey} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} /> Reset Key
                  </button>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="password" 
                    readOnly 
                    value={streamData.stream_key}
                    className="flex-1 bg-[#1a1f29] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono tracking-widest outline-none"
                  />
                  <button 
                    onClick={handleCopyKey}
                    className="px-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors flex items-center justify-center min-w-[48px]"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-green-300" /> : <Copy className="w-4 h-4 text-white" />}
                  </button>
                </div>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="mt-2 w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all"
            >
              Done
            </button>
          </div>
        )}

      </div>
    </div>
  );
};