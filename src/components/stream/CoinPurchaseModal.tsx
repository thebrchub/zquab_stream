import React from 'react';
import { X, Coins, Loader2, Sparkles } from 'lucide-react';
import { useWallet } from '../../context/WalletContext'; // Make sure the path is correct

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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-2xl flex flex-col gap-6 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-500 shadow-inner">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[var(--text-main)] tracking-tight leading-none">
                Get zCoins
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-medium mt-1">
                Current Balance:{' '}
                <span className="font-bold text-amber-500">
                  {balanceCoins.toLocaleString()} 🪙
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={closePurchaseModal}
            disabled={isProcessingPayment}
            className="p-2 rounded-full hover:bg-[var(--background)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Package Selection */}
        <div className="flex flex-col gap-3">
          {packages.length === 0 ? (
            <div className="p-8 text-center text-sm font-medium text-[var(--text-muted)] bg-[var(--background)] border border-[var(--border-color)] border-dashed rounded-2xl">
              No coin packages available right now.
            </div>
          ) : (
            packages.map((pkg) => (
              <div
                key={pkg.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-[var(--background)] border border-[var(--border-color)] hover:border-[#3B82F6] transition-all group shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl drop-shadow-sm">🪙</span>
                  <div>
                    <div className="text-sm font-bold text-[var(--text-main)] group-hover:text-[#3B82F6] transition-colors">
                      {pkg.coins.toLocaleString()} zCoins
                    </div>
                    <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
                      ₹{pkg.price_amount.toFixed(2)} {pkg.currency}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => buyCoinPackage(pkg)}
                  disabled={isProcessingPayment}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-[#3B82F6] text-white hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_4px_10px_rgba(59,130,246,0.3)] flex items-center gap-1.5 border-none"
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
        <p className="text-[11px] text-[var(--text-muted)] font-medium text-center leading-relaxed">
          Payments are securely processed via Razorpay. Coins are credited automatically once confirmed.
        </p>
      </div>
    </div>
  );
};