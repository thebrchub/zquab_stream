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
    isLoadingPackages,
    balanceCoins,
  } = useWallet();

  if (!isPurchaseModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* 🛠️ Claymorphic Modal Wrapper */}
      <div className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border-color)] rounded-[2rem] p-6 shadow-[8px_8px_20px_rgba(0,0,0,0.4),-4px_-4px_10px_rgba(255,255,255,0.02),inset_1px_1px_3px_rgba(255,255,255,0.1),inset_-1px_-1px_3px_rgba(0,0,0,0.2)] flex flex-col gap-6 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 🛠️ Claymorphic Icon Box */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-[1.25rem] text-amber-500 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-1px_-1px_3px_rgba(255,255,255,0.02)]">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight leading-none mb-1.5">
                Get zCoins
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-medium">
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
            className="p-2 rounded-full bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--text-muted)] transition-colors shadow-[4px_4px_10px_rgba(0,0,0,0.2),-2px_-2px_6px_rgba(255,255,255,0.02)] active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Package Selection */}
        <div className="flex flex-col gap-3">
          {isLoadingPackages ? (
            <div className="p-8 flex items-center justify-center text-[var(--text-muted)]">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : packages.length === 0 ? (
            // 🛠️ Claymorphic Inset Empty State
            <div className="p-8 text-center text-sm font-medium text-[var(--text-muted)] bg-[var(--background)] border border-[var(--border-color)] rounded-[1.5rem] shadow-[inset_2px_2px_6px_rgba(0,0,0,0.2),inset_-2px_-2px_6px_rgba(255,255,255,0.02)]">
              No coin packages available right now.
            </div>
          ) : (
            packages.map((pkg) => (
              // 🛠️ Claymorphic Package Card
              <div
                key={pkg.id}
                className="flex items-center justify-between p-4 rounded-[1.25rem] bg-[var(--card)] border border-[var(--border-color)] hover:border-[#3B82F6]/50 transition-all duration-200 group shadow-[4px_4px_10px_rgba(0,0,0,0.2),-2px_-2px_6px_rgba(255,255,255,0.02)] hover:shadow-[6px_6px_12px_rgba(0,0,0,0.3),-2px_-2px_8px_rgba(255,255,255,0.03)]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 flex items-center justify-center bg-[var(--background)] rounded-full border border-[var(--border-color)] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-1px_-1px_3px_rgba(255,255,255,0.02)]">
                     <span className="text-xl drop-shadow-sm">🪙</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[var(--text-main)] group-hover:text-[#3B82F6] transition-colors">
                      {pkg.coins.toLocaleString()} zCoins
                    </div>
                    <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
                      ₹{pkg.price_amount.toFixed(2)} {pkg.currency}
                    </div>
                  </div>
                </div>

                {/* 🛠️ Claymorphic Primary Button */}
                <button
                  onClick={() => buyCoinPackage(pkg)}
                  disabled={isProcessingPayment}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl bg-[#4F46E5] text-white hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-[4px_4px_10px_rgba(0,0,0,0.4),-2px_-2px_6px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(255,255,255,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.4)] active:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.4)]"
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
        <p className="text-[11px] text-[var(--text-muted)] font-medium text-center leading-relaxed px-4">
          Payments are securely processed via Razorpay. Coins are credited automatically once confirmed.
        </p>
      </div>
    </div>
  );
};