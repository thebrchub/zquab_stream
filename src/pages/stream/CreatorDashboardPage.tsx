import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BarChart2, Settings, TrendingUp, Loader2, DollarSign, ArrowRight, Play, Copy, Radio, X, Clock3, RefreshCw, AlertTriangle } from 'lucide-react';
import { creatorService, type CreatorEarnings } from '../../services/creatorService';
import { streamService, type CreatorStream } from '../../services/streamService';
import { GoLiveModal } from '../../components/studio/GoLiveModal'; 
import { wsEvents } from '../../context/WebSocketContext';

const toDateTimeLocal = (value: string) => {
  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

export const CreatorDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [earnings, setEarnings] = useState<CreatorEarnings | null>(null);
  const [isLoadingEarnings, setIsLoadingEarnings] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');
  const [isGoLiveModalOpen, setIsGoLiveModalOpen] = useState(false);
  const [streams, setStreams] = useState<CreatorStream[]>([]);
  const [ingestURL, setIngestURL] = useState('');
  const [isLoadingStreams, setIsLoadingStreams] = useState(true);
  const [streamActionID, setStreamActionID] = useState<string | null>(null);
  const [editingPlannedEndID, setEditingPlannedEndID] = useState<string | null>(null);
  const [plannedEndAt, setPlannedEndAt] = useState('');
  const [streamNotice, setStreamNotice] = useState<string | null>(null);

  // Monetization Settings State
  const [isOneOnOneEnabled, setIsOneOnOneEnabled] = useState(false);
  const [price, setPrice] = useState(100);
  const [duration, setDuration] = useState(15);

  // Guard: Redirect non-approved users
  useEffect(() => {
    if (user && user.approval_status !== 'approved') {
      navigate('/profile', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const data = await creatorService.getMyEarnings(30);
        setEarnings(data);
      } catch (err) {
        console.error("Failed to load earnings", err);
      } finally {
        setIsLoadingEarnings(false);
      }
    };
    fetchEarnings();
  }, []);

  const fetchStreams = async () => {
    setIsLoadingStreams(true);
    try {
      const data = await streamService.getMyStreams();
      setStreams(data.streams);
      setIngestURL(data.ingest_url);
    } catch (err) {
      console.error('Failed to load creator streams', err);
    } finally {
      setIsLoadingStreams(false);
    }
  };

  useEffect(() => {
    fetchStreams();
  }, []);

  useEffect(() => wsEvents.subscribe((message) => {
    if (message.type === 'stream_live') {
      fetchStreams();
    }

    const payload = message.payload || {};
    if (message.type === 'stream_ending_soon') {
      const secondsRemaining = Number(payload.seconds_remaining || payload.secondsRemaining || 0);
      setStreamNotice(`Your stream will end in ${Math.max(1, Math.ceil(secondsRemaining / 60))} minute${secondsRemaining > 60 ? 's' : ''}.`);
    }

    if (message.type === 'stream_auto_ended') {
      setStreamNotice('Your stream was ended because it reached its planned end time.');
      fetchStreams();
    }

    if (message.type === 'stream_earnings') {
      const earnings = Number(payload.earnings_coins || payload.earningsCoins || 0);
      if (earnings > 0) setStreamNotice(`You earned ${earnings.toLocaleString()} zCoins from your stream.`);
    }
  }), []);

  const handleStreamAction = async (stream: CreatorStream) => {
    setStreamActionID(stream.stream_id);
    try {
      if (stream.status === 'live') {
        await streamService.endStream(stream.stream_id);
      } else {
        await streamService.cancelStream(stream.stream_id);
      }
      await fetchStreams();
    } catch (err) {
      console.error('Failed to update stream', err);
    } finally {
      setStreamActionID(null);
    }
  };

  const copyStreamKey = (streamKey: string) => {
    navigator.clipboard.writeText(streamKey);
  };

  const copyIngestURL = () => {
    navigator.clipboard.writeText(ingestURL);
  };

  const startEditingPlannedEnd = (stream: CreatorStream) => {
    setEditingPlannedEndID(stream.stream_id);
    setPlannedEndAt(toDateTimeLocal(stream.planned_end_at));
  };

  const savePlannedEnd = async (stream: CreatorStream) => {
    const nextPlannedEnd = new Date(plannedEndAt);
    if (Number.isNaN(nextPlannedEnd.getTime())) return;

    setStreamActionID(stream.stream_id);
    try {
      await streamService.updatePlannedEnd(stream.stream_id, nextPlannedEnd.toISOString());
      setEditingPlannedEndID(null);
      setStreamNotice('Planned end updated.');
      await fetchStreams();
    } catch (err) {
      console.error('Failed to update planned end', err);
    } finally {
      setStreamActionID(null);
    }
  };

  const regenerateStreamKey = async (stream: CreatorStream) => {
    if (!window.confirm('Reset this stream key? OBS will stop accepting the old key.')) return;

    setStreamActionID(stream.stream_id);
    try {
      await streamService.regenerateKey(stream.stream_id);
      setStreamNotice('Stream key reset. Copy the new key into OBS before broadcasting.');
      await fetchStreams();
    } catch (err) {
      console.error('Failed to regenerate stream key', err);
    } finally {
      setStreamActionID(null);
    }
  };

  const maxDailyEarning = earnings?.daily.length 
    ? Math.max(...earnings.daily.map(d => d.earnings_coins))
    : 100;

  // Prevent rendering the dashboard momentarily before redirect
  if (user?.approval_status !== 'approved') return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans selection:bg-blue-500/30 transition-colors duration-300">
      <GoLiveModal 
        isOpen={isGoLiveModalOpen} 
        onClose={() => setIsGoLiveModalOpen(false)} 
		onStreamCreated={fetchStreams}
      />

      <div className="max-w-6xl mx-auto px-6 lg:px-8 pt-12 pb-24">
        
        {/* --- Premium Header --- */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <img 
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop" 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-black rounded-full" />
            </div>
            <div>
              <h1 className="text-3xl font-medium tracking-tight text-zinc-900 dark:text-white mb-1">Creator Studio</h1>
              <p className="text-sm text-zinc-500 font-medium">Manage broadcasts and track revenue.</p>
            </div>
          </div>

          <button 
            onClick={() => setIsGoLiveModalOpen(true)}
            className="group flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-all shadow-[0_0_15px_rgba(37,99,235,0.1)] hover:shadow-[0_0_20px_rgba(37,99,235,0.2)] dark:shadow-[0_0_20px_rgba(37,99,235,0.15)] dark:hover:shadow-[0_0_25px_rgba(37,99,235,0.3)]"
          >
            <Play className="w-4 h-4 fill-current group-hover:scale-105 transition-transform" />
            Initialize Stream
          </button>
        </header>

        {/* --- Minimalist Tabs --- */}
        <div className="flex items-center gap-8 border-b border-zinc-200 dark:border-zinc-900 mb-10">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`pb-4 text-sm font-medium transition-colors relative ${
              activeTab === 'overview' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Overview
            {activeTab === 'overview' && <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-blue-600 dark:bg-blue-500" />}
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`pb-4 text-sm font-medium transition-colors relative ${
              activeTab === 'settings' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Monetization Settings
            {activeTab === 'settings' && <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-blue-600 dark:bg-blue-500" />}
          </button>
        </div>

        {/* --- OVERVIEW TAB --- */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            
            {/* Left Column: Primary Metrics & Chart */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">My Streams</h3>
                  <Radio className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />
                </div>

                {ingestURL && (
                  <div className="mb-4 flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2.5">
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Ingest URL</span>
                    <span className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-700 dark:text-zinc-300">{ingestURL}</span>
                    <button onClick={copyIngestURL} className="shrink-0 text-zinc-500 hover:text-zinc-900 dark:hover:text-white" title="Copy ingest URL">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {!isLoadingStreams && !ingestURL && (
                  <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-500/10 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Streaming setup is unavailable. Ask an administrator to configure the ingest URL.</span>
                  </div>
                )}

                {streamNotice && (
                  <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-500/10 px-3 py-2.5 text-xs text-blue-700 dark:text-blue-300">
                    <span>{streamNotice}</span>
                    <button onClick={() => setStreamNotice(null)} className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-200" title="Dismiss notification">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {isLoadingStreams ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-zinc-400 animate-spin" /></div>
                ) : streams.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-500">No active or scheduled streams.</div>
                ) : (
                  <div className="space-y-3">
                    {streams.map((stream) => (
                      <div key={stream.stream_id} className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-zinc-900 dark:text-white truncate">{stream.title}</div>
                            <div className="text-xs text-zinc-500 mt-1">{stream.status === 'live' ? 'Live now' : stream.scheduled_at ? `Scheduled ${new Date(stream.scheduled_at).toLocaleString()}` : 'Ready to broadcast'}</div>
                          </div>
                          <span className={`shrink-0 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${stream.status === 'live' ? 'bg-red-500/10 text-red-500' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>{stream.status}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {stream.status === 'scheduled' && (
                            <button onClick={() => copyStreamKey(stream.stream_key)} className="inline-flex items-center gap-1.5 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                              <Copy className="w-3.5 h-3.5" /> Copy Stream Key
                            </button>
                          )}
                          <button
                            onClick={() => editingPlannedEndID === stream.stream_id ? setEditingPlannedEndID(null) : startEditingPlannedEnd(stream)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                          >
                            <Clock3 className="w-3.5 h-3.5" /> Edit End
                          </button>
                          {stream.status === 'scheduled' && (
                            <button
                              onClick={() => regenerateStreamKey(stream)}
                              disabled={streamActionID === stream.stream_id}
                              className="inline-flex items-center gap-1.5 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors disabled:opacity-50"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${streamActionID === stream.stream_id ? 'animate-spin' : ''}`} /> Reset Key
                            </button>
                          )}
                          <button
                            onClick={() => handleStreamAction(stream)}
                            disabled={streamActionID === stream.stream_id}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${stream.status === 'live' ? 'bg-red-500 text-white hover:bg-red-600' : 'border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10'}`}
                          >
                            {streamActionID === stream.stream_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                            {stream.status === 'live' ? 'End Stream' : 'Cancel'}
                          </button>
                        </div>
                        {editingPlannedEndID === stream.stream_id && (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                            <input
                              type="datetime-local"
                              value={plannedEndAt}
                              onChange={(event) => setPlannedEndAt(event.target.value)}
                              className="flex-1 bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none"
                            />
                            <button
                              onClick={() => savePlannedEnd(stream)}
                              disabled={streamActionID === stream.stream_id}
                              className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium disabled:opacity-50"
                            >
                              Save End Time
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Total Revenue Card */}
              <div className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800/80 p-8 rounded-2xl flex flex-col justify-between min-h-[200px] shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                    Net Revenue (30 Days)
                  </h3>
                  {!isLoadingEarnings && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                      <TrendingUp className="w-3 h-3" /> Live
                    </div>
                  )}
                </div>
                
                {isLoadingEarnings ? (
                  <div className="flex items-center h-full pt-4">
                    <Loader2 className="w-6 h-6 text-zinc-400 dark:text-zinc-600 animate-spin" />
                  </div>
                ) : (
                  <div className="pt-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-light tracking-tighter text-zinc-900 dark:text-white">
                        {earnings?.totalEarningsCoins.toLocaleString() || 0}
                      </span>
                      <span className="text-lg text-zinc-500 font-medium">zCoins</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Activity Chart */}
              <div className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800/80 p-8 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                    Performance Timeline
                  </h3>
                  <BarChart2 className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />
                </div>
                
                {isLoadingEarnings ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-5 h-5 text-zinc-400 dark:text-zinc-600 animate-spin" />
                  </div>
                ) : !earnings?.daily.length ? (
                  <div className="flex items-center justify-center h-32 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                    <span className="text-sm text-zinc-500 dark:text-zinc-600">Insufficient data for this period.</span>
                  </div>
                ) : (
                  <div className="h-40 flex items-end justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/50 pb-2">
                    {earnings.daily.map((dayData, idx) => {
                      const heightPercent = Math.max((dayData.earnings_coins / maxDailyEarning) * 100, 4);
                      return (
                        <div key={idx} className="group relative flex flex-col items-center flex-1 h-full justify-end">
                          <div 
                            className="w-full max-w-[16px] bg-zinc-200 dark:bg-zinc-800 group-hover:bg-blue-600 dark:group-hover:bg-blue-500 rounded-t-sm transition-colors duration-200"
                            style={{ height: `${heightPercent}%` }}
                          />
                          {/* Tooltip */}
                          <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white px-2.5 py-1.5 rounded shadow-lg whitespace-nowrap z-10 pointer-events-none">
                            <span className="font-semibold">{dayData.earnings_coins}</span> zCoins
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Breakdown */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              <div className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800/80 p-8 rounded-2xl h-full shadow-sm">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-8">
                  Revenue Ledger
                </h3>
                
                <div className="space-y-6">
                  {/* Ledger Item */}
                  <div className="flex items-start justify-between group">
                    <div className="flex items-start gap-4">
                      <div className="mt-0.5 w-8 h-8 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-200">Gifts & Superchats</div>
                        <div className="text-xs text-zinc-500 mt-1">Viewer tips</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-zinc-900 dark:text-white">
                      {isLoadingEarnings ? '--' : (earnings?.byType.giftReceived.toLocaleString() || 0)}
                    </div>
                  </div>

                  <div className="w-full h-[1px] bg-zinc-100 dark:bg-zinc-800/50" />

                  {/* Ledger Item */}
                  <div className="flex items-start justify-between group">
                    <div className="flex items-start gap-4">
                      <div className="mt-0.5 w-8 h-8 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        <Settings className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-200">Premium Access</div>
                        <div className="text-xs text-zinc-500 mt-1">Paywall entries</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-zinc-900 dark:text-white">
                      {isLoadingEarnings ? '--' : (earnings?.byType.premiumEntryEarning.toLocaleString() || 0)}
                    </div>
                  </div>
                </div>

                <button className="w-full mt-10 flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
                  View Full Ledger
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- SETTINGS TAB --- */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl animate-fadeIn">
            <div className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-8 border-b border-zinc-200 dark:border-zinc-800/50">
                <div>
                  <h2 className="text-lg font-medium text-zinc-900 dark:text-white flex items-center gap-3">
                    1:1 Video Consultations 
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase tracking-widest border border-zinc-200 dark:border-zinc-700">
                      Beta
                    </span>
                  </h2>
                  <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed max-w-md">
                    Allow viewers to book private video sessions directly from your profile. Configure your pricing and duration below.
                  </p>
                </div>
                {/* Custom Minimal Toggle */}
                <button 
                  onClick={() => setIsOneOnOneEnabled(!isOneOnOneEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    isOneOnOneEnabled ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isOneOnOneEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-8 transition-opacity duration-300 ${!isOneOnOneEnabled ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Session Rate (zCoins)
                  </label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-800 focus:border-blue-500 rounded-lg py-2.5 px-4 text-sm text-zinc-900 dark:text-white outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Duration (Minutes)
                  </label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-800 focus:border-blue-500 rounded-lg py-2.5 px-4 text-sm text-zinc-900 dark:text-white outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-10 flex justify-end">
                <button 
                  disabled={!isOneOnOneEnabled}
                  className="px-6 py-2.5 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black text-sm font-medium rounded-lg transition-colors disabled:opacity-30"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};