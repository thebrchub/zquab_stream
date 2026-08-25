import React, { useState } from 'react';
import { COIN_PACKAGES, type CoinPackage } from '../../constants/streamMockData';

interface CoinPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseSuccess: (coinsAdded: number) => void;
  currentBalance: number;
}

export const CoinPurchaseModal: React.FC<CoinPurchaseModalProps> = ({
  isOpen,
  onClose,
  onPurchaseSuccess,
  currentBalance,
}) => {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePurchase = (pkg: CoinPackage) => {
    // Mocking a payment processing delay
    setIsProcessing(pkg.id);
    setTimeout(() => {
      onPurchaseSuccess(pkg.coins);
      setIsProcessing(null);
      onClose();
    }, 800); // 800ms fake delay
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dimmed Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-[#151921] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800/60 bg-[#12151a]">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-xl">🪙</span> Get zCoins
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Current balance: <span className="font-semibold text-amber-400">{currentBalance}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Package Grid */}
        <div className="p-5 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 gap-3">
            {COIN_PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                disabled={isProcessing !== null}
                onClick={() => handlePurchase(pkg)}
                className="relative group flex items-center justify-between p-4 rounded-xl border border-gray-700/50 bg-[#1a1f29] hover:bg-[#202634] hover:border-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              >
                {/* Optional Badge (e.g., Popular, Best Value) */}
                {pkg.badge && (
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
                    {pkg.badge}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/20 flex items-center justify-center border border-amber-500/30">
                    <span className="text-lg">🪙</span>
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-bold text-gray-100 group-hover:text-amber-400 transition-colors">
                      {pkg.coins.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">zCoins</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold text-white bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 group-hover:bg-amber-500 group-hover:text-black group-hover:border-amber-400 transition-all">
                    {isProcessing === pkg.id ? 'Processing...' : `₹${pkg.priceInr}`}
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <p className="text-[11px] text-center text-gray-500 mt-5 px-4">
            zCoins are non-refundable and can only be used to interact with creators on the platform.
          </p>
        </div>

      </div>
    </div>
  );
};