import React, { useEffect, useRef, useState } from 'react';
import { X, Video, Copy, RefreshCw, Check, Loader2, ShieldAlert, Lock, Play, CheckCircle2, ImagePlus } from 'lucide-react';
import { streamService, type CreateStreamPayload, type StreamCreationResponse } from '../../services/streamService';
import { convertToWebp } from '../../utils/webpImage';

interface GoLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStreamCreated?: () => void;
}

const toDateTimeLocal = (date: Date) => {
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

export const GoLiveModal: React.FC<GoLiveModalProps> = ({ isOpen, onClose, onStreamCreated }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Step 1 Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('gaming');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [plannedEndAt, setPlannedEndAt] = useState(() => toDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000)));
  const [isPremium, setIsPremium] = useState(false);
  const [price, setPrice] = useState(100);
  const [banner, setBanner] = useState<Blob | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isPreparingBanner, setIsPreparingBanner] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Step 2 OBS Setup State
  const [streamData, setStreamData] = useState<StreamCreationResponse | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [bannerNote, setBannerNote] = useState<string | null>(null);

  useEffect(() => {
    if (!banner) {
      setBannerPreview(null);
      return;
    }
    const url = URL.createObjectURL(banner);
    setBannerPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [banner]);

  if (!isOpen) return null;

  const handleBannerPicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsPreparingBanner(true);
    setError(null);
    try {
      setBanner(await convertToWebp(file, { maxWidth: 1280, maxHeight: 720 }));
    } catch (err: any) {
      setError(err.message || 'Could not use this image.');
    } finally {
      setIsPreparingBanner(false);
    }
  };

  const handleScheduledAtChange = (value: string) => {
    setScheduledAt(value);
    const start = new Date(value);
    if (!Number.isNaN(start.getTime())) {
      setPlannedEndAt(toDateTimeLocal(new Date(start.getTime() + 60 * 60 * 1000)));
    }
  };

  const enableScheduling = () => {
    const start = new Date(Date.now() + 5 * 60 * 1000);
    setIsScheduled(true);
    setScheduledAt(toDateTimeLocal(start));
    setPlannedEndAt(toDateTimeLocal(new Date(start.getTime() + 60 * 60 * 1000)));
  };

  const handleCreateStream = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const plannedEnd = new Date(plannedEndAt);
      const scheduledStart = isScheduled ? new Date(scheduledAt) : null;
      if (Number.isNaN(plannedEnd.getTime()) || (scheduledStart && (Number.isNaN(scheduledStart.getTime()) || plannedEnd <= scheduledStart))) {
        setError('Choose a planned end after the scheduled start.');
        return;
      }

      const payload: CreateStreamPayload = {
        title,
        category,
        tags: ["live"], 
        planned_end_at: plannedEnd.toISOString(),
        is_premium: isPremium,
        entry_price_coins: isPremium ? price : 0,
        has_banner: banner !== null,
      };
      if (scheduledStart) payload.scheduled_at = scheduledStart.toISOString();

      const data = await streamService.createStream(payload);
      // The stream exists now; a banner that fails to upload never undoes it.
      if (banner) {
        try {
          if (!data.banner_upload_url) throw new Error('no upload url');
          await streamService.uploadBanner(data.stream_id, data.banner_upload_url, banner);
        } catch {
          setBannerNote('Your stream is ready, but the banner could not be uploaded.');
        }
      }
      setStreamData(data);
      setStep(2); 
      onStreamCreated?.();
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
		  setIsScheduled(false);
		  setScheduledAt('');
		  setPlannedEndAt(toDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000)));
      setStreamData(null);
      setBanner(null);
      setBannerNote(null);
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

              <div className="space-y-2">
                <label className="block text-sm font-bold text-[var(--text-main)] ml-1">
                  Banner <span className="font-medium text-[var(--text-muted)]">(optional)</span>
                </label>
                <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerPicked} />
                {bannerPreview ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-[1.25rem] border border-[var(--border-color)] bg-black">
                    <img src={bannerPreview} alt="Banner preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setBanner(null)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                      title="Remove banner"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={isPreparingBanner}
                    className="w-full py-6 bg-[var(--background)] border border-dashed border-[var(--border-color)] hover:border-[#3B82F6] rounded-[1.25rem] text-sm font-medium text-[var(--text-muted)] hover:text-[#3B82F6] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isPreparingBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                    Add a banner image
                  </button>
                )}
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
                  <label className="block text-sm font-bold text-[var(--text-main)] ml-1">Planned End</label>
                  <input
                    type="datetime-local"
                    required
                    value={plannedEndAt}
                    onChange={(e) => setPlannedEndAt(e.target.value)}
                    className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-[1.25rem] px-4 py-3.5 text-sm text-[var(--text-main)] outline-none focus:border-[#3B82F6] transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="p-5 rounded-[1.5rem] bg-[var(--background)] border border-[var(--border-color)] shadow-sm flex items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-[var(--text-main)]">Schedule for later</div>
                  <div className="text-xs font-medium text-[var(--text-muted)] mt-1">Choose a future start time instead of going live now.</div>
                </div>
                <button
                  type="button"
                  onClick={() => isScheduled ? setIsScheduled(false) : enableScheduling()}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${isScheduled ? 'bg-[#3B82F6]' : 'bg-[var(--card)] border border-[var(--border-color)]'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${isScheduled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {isScheduled && (
                <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-200">
                  <label className="block text-sm font-bold text-[var(--text-main)] ml-1">Scheduled Start</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={(e) => handleScheduledAtChange(e.target.value)}
                    className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-[1.25rem] px-4 py-3.5 text-sm text-[var(--text-main)] outline-none focus:border-[#3B82F6] transition-all shadow-sm"
                  />
                </div>
              )}

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
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">Entry Price <span className="normal-case">(zCoins)</span></label>
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
              {bannerNote && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-medium flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <p>{bannerNote}</p>
                </div>
              )}
              
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-[1.25rem] text-amber-600 dark:text-amber-400 text-sm font-medium flex items-start gap-3 leading-relaxed shadow-inner">
                <ShieldAlert className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
                <p>Your stream is provisioned. In OBS Studio, open Settings → Stream, choose Service "Custom", paste the Ingest URL into "Server" and the Stream Key into "Stream Key". <strong className="font-bold text-amber-700 dark:text-amber-300">Never share your stream key with anyone.</strong></p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider ml-1">Ingest URL (OBS "Server")</label>
                  <input 
                    readOnly 
                    value={streamData.ingest_url}
                    className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-[1.25rem] px-4 py-3.5 text-sm text-[var(--text-main)] font-mono outline-none opacity-80"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1 mb-2">
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Stream Key (OBS "Stream Key")</label>
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