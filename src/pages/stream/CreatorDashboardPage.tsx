import React, { useState } from 'react';
import { MOCK_CREATOR_DASHBOARD } from '../../constants/streamMockData';

export const CreatorDashboardPage: React.FC = () => {
  // Local state to make the form controls feel interactive
  const [isOneOnOneEnabled, setIsOneOnOneEnabled] = useState(
    MOCK_CREATOR_DASHBOARD.oneOnOneSettings.enabled
  );
  const [price, setPrice] = useState(
    MOCK_CREATOR_DASHBOARD.oneOnOneSettings.priceCoins
  );
  const [duration, setDuration] = useState(
    MOCK_CREATOR_DASHBOARD.oneOnOneSettings.durationMinutes
  );

  const { stats } = MOCK_CREATOR_DASHBOARD;

  return (
    <div className="min-h-screen bg-[#0d0f12] text-white flex">
      
      {/* Sidebar Navigation (Desktop) */}
      <aside className="w-64 border-r border-gray-800/60 bg-[#12151a] hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-800/60">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl mb-2">
            Z
          </div>
          <h2 className="font-semibold text-gray-200">Creator Studio</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-2.5 bg-indigo-600/10 text-indigo-400 rounded-xl font-medium">
            <span>📊</span> Overview
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded-xl transition-colors">
            <span>🔴</span> Stream Manager
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded-xl transition-colors">
            <span>💰</span> Earnings
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded-xl transition-colors">
            <span>👥</span> Community
          </a>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, Aiko!</h1>
            <p className="text-sm text-gray-400 mt-1">Here is what is happening with your channel today.</p>
          </div>
          <button className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-red-900/20">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            Go LIVE
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Earnings Overview Cards */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#151921] border border-gray-800/60 p-6 rounded-2xl">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Earnings (This Month)</h3>
              <div className="text-3xl font-bold text-white">₹{stats.monthlyEarningsInr.toLocaleString()}</div>
              <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                <span>↗</span> +12% from last month
              </div>
            </div>
            <div className="bg-[#151921] border border-gray-800/60 p-6 rounded-2xl">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Available to Withdraw</h3>
              <div className="text-3xl font-bold text-white">₹{stats.availableInr.toLocaleString()}</div>
              <button className="mt-3 text-xs font-semibold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors">
                Withdraw
              </button>
            </div>
            <div className="bg-[#151921] border border-gray-800/60 p-6 rounded-2xl">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Pending Clearance</h3>
              <div className="text-3xl font-bold text-gray-300">₹{stats.pendingInr.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-2">Will be available in 3-5 days</p>
            </div>
          </div>

          {/* Left Column: 1:1 Settings */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#151921] border border-gray-800/60 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <span>🤝</span> 1:1 Video Interactions
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">Allow viewers to pay zCoins for private video calls.</p>
                </div>
                {/* Toggle Switch */}
                <button 
                  onClick={() => setIsOneOnOneEnabled(!isOneOnOneEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isOneOnOneEnabled ? 'bg-indigo-600' : 'bg-gray-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isOneOnOneEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className={`grid grid-cols-1 md:grid-cols-2 gap-5 transition-opacity ${!isOneOnOneEnabled ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                {/* Pricing Input */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Price per Session (zCoins)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🪙</span>
                    <input 
                      type="number" 
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full bg-[#1a1f29] border border-gray-700 focus:border-indigo-500 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Duration Input */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Session Duration (Minutes)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">⏱️</span>
                    <input 
                      type="number" 
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full bg-[#1a1f29] border border-gray-700 focus:border-indigo-500 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
                  Save Settings
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Quick Stats & Current Status */}
          <div className="space-y-6">
            <div className="bg-[#151921] border border-gray-800/60 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Current Status</h2>
              
              <div className="flex items-center gap-3 mb-5">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]"></div>
                <span className="font-semibold text-white">Offline</span>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-800/60 pb-3">
                  <span className="text-sm text-gray-400">Total Followers</span>
                  <span className="font-semibold text-white">{stats.totalFollowers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pb-1">
                  <span className="text-sm text-gray-400">1:1 Queue Status</span>
                  <span className="font-semibold text-indigo-400">0 Waiting</span>
                </div>
              </div>
              
              <button className="w-full mt-6 py-2.5 bg-[#1a1f29] hover:bg-[#202634] border border-gray-700 rounded-xl text-sm font-medium transition-colors">
                Schedule Next Stream
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};