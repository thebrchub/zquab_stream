import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { CoinPackage, GiftItem, WalletTransaction } from '../types/wallet';
import { walletService } from '../services/walletService';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

interface WalletContextType {
  balanceCoins: number;
  packages: CoinPackage[];
  gifts: GiftItem[];
  isLoading: boolean;
  isPurchaseModalOpen: boolean;
  isProcessingPayment: boolean;
  fetchBalance: () => Promise<void>;
  updateBalanceLocally: (newBalance: number) => void;
  openPurchaseModal: () => void;
  closePurchaseModal: () => void;
  buyCoinPackage: (pkg: CoinPackage) => Promise<void>;
  getTransactions: (limit?: number, offset?: number) => Promise<WalletTransaction[]>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [balanceCoins, setBalanceCoins] = useState<number>(0);
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  const fetchBalance = useCallback(async () => {
    try {
      const res = await walletService.getBalance();
      setBalanceCoins(res.balance_coins);
    } catch {
      // Ignored for guests or initial unauthenticated loads
    }
  }, []);

  const fetchCatalogData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pkgs, giftItems] = await Promise.all([
        walletService.getPackages().catch(() => []),
        walletService.getGiftCatalog().catch(() => []),
      ]);
      setPackages(pkgs);
      setGifts(giftItems);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
    fetchCatalogData();
  }, [fetchBalance, fetchCatalogData]);

  const updateBalanceLocally = (newBalance: number) => {
    setBalanceCoins(newBalance);
  };

  // Poll purchase status until completed or failed
  const pollOrderUntilSettled = async (orderId: string, maxAttempts = 15): Promise<boolean> => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        const result = await walletService.pollPurchaseStatus(orderId);
        if (result.status === 'completed') {
          await fetchBalance();
          return true;
        }
        if (result.status === 'failed') {
          return false;
        }
      } catch {
        // Continue next retry
      }
    }
    return false;
  };

  const buyCoinPackage = async (pkg: CoinPackage) => {
    setIsProcessingPayment(true);
    try {
      const order = await walletService.initPurchase(pkg.id);

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded');
      }

      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'zQuab',
        description: `Top up ${order.coins} zCoins`,
        order_id: order.razorpay_order_id,
        handler: async () => {
          // Payment captured on client — poll backend webhook confirmation
          const success = await pollOrderUntilSettled(order.order_id);
          setIsProcessingPayment(false);
          if (success) {
            setIsPurchaseModalOpen(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessingPayment(false);
          },
        },
        theme: {
          color: '#4F46E5',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Purchase initiation failed:', err);
      setIsProcessingPayment(false);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        balanceCoins,
        packages,
        gifts,
        isLoading,
        isPurchaseModalOpen,
        isProcessingPayment,
        fetchBalance,
        updateBalanceLocally,
        openPurchaseModal: () => setIsPurchaseModalOpen(true),
        closePurchaseModal: () => setIsPurchaseModalOpen(false),
        buyCoinPackage,
        getTransactions: walletService.getTransactions,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};