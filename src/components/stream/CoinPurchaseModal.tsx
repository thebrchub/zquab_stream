import React from 'react';
import { X, Coins, Loader2, Sparkles } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

export const CoinPurchaseModal: React.FC = () => {
  const {
    isPurchaseModalOpen,
    closePurchaseModal,
    packages,
    buyCoinPackage,
    isProcessingPayment,
    balanceCoins,
  } = useWallet();

  if (!isPurchaseModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#11141a] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 text-white overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight leading-none">
                Get zCoins
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Current Balance:{' '}
                <span className="font-semibold text-amber-400">
                  {balanceCoins.toLocaleString()} 🪙
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={closePurchaseModal}
            disabled={isProcessingPayment}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Package Selection */}
        <div className="flex flex-col gap-3">
          {packages.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">
              No coin packages available right now.
            </div>
          ) : (
            packages.map((pkg) => (
              <div
                key={pkg.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-[#181c24] border border-white/5 hover:border-indigo-500/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🪙</span>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {pkg.coins.toLocaleString()} zCoins
                    </div>
                    <div className="text-[11px] text-gray-400">
                      ₹{pkg.price_amount.toFixed(2)} {pkg.currency}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => buyCoinPackage(pkg)}
                  disabled={isProcessingPayment}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-900/30 flex items-center gap-1.5"
                >
                  {isProcessingPayment ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Buy Now
                    </>
                  )}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer info note */}
        <p className="text-[11px] text-gray-500 text-center leading-relaxed">
          Payments are securely processed via Razorpay. Coins are credited automatically once confirmed.
        </p>
      </div>
    </div>
  );
};