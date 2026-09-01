import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from './AuthContext';

export interface CoinPackage {
  id: number;
  coins: number;
  price_amount: number;
  currency: string;
}

// 🚀 ADDED: GiftItem interface based on the backend spec
export interface GiftItem {
  id: number;
  name: string;
  icon: string;
  cost_coins: number;
}

interface WalletContextType {
  balanceCoins: number;
  packages: CoinPackage[];
  gifts: GiftItem[]; // 🚀 ADDED
  isPurchaseModalOpen: boolean;
  isProcessingPayment: boolean;
  openPurchaseModal: () => void;
  closePurchaseModal: () => void;
  buyCoinPackage: (pkg: CoinPackage) => Promise<void>;
  refreshBalance: () => Promise<void>;
  updateBalanceLocally: (newBalance: number) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [balanceCoins, setBalanceCoins] = useState<number>(0);
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [gifts, setGifts] = useState<GiftItem[]>([]); // 🚀 ADDED
  
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const refreshBalance = useCallback(async () => {
    if (!user || user.is_guest) return;
    try {
      const res = await apiClient.get('/wallet');
      setBalanceCoins(res.data.balance_coins);
    } catch (error) {
      console.error("Failed to fetch wallet balance:", error);
    }
  }, [user]);

  const fetchPackages = useCallback(async () => {
    if (!user || user.is_guest) return;
    try {
      const res = await apiClient.get('/wallet/packages');
      setPackages(res.data);
    } catch (error) {
      console.error("Failed to fetch coin packages:", error);
    }
  }, [user]);

  // 🚀 ADDED: Fetch the live gift catalog
  const fetchGifts = useCallback(async () => {
    try {
      const res = await apiClient.get('/gifts');
      setGifts(res.data);
    } catch (error) {
      console.error("Failed to fetch gifts:", error);
    }
  }, []);

  useEffect(() => {
    refreshBalance();
    fetchPackages();
    fetchGifts(); 
  }, [refreshBalance, fetchPackages, fetchGifts]);

  const openPurchaseModal = () => setIsPurchaseModalOpen(true);
  const closePurchaseModal = () => setIsPurchaseModalOpen(false);

  const pollOrderStatus = async (internalOrderId: string): Promise<boolean> => {
    for (let i = 0; i < 10; i++) {
      try {
        const res = await apiClient.get(`/wallet/purchase/${internalOrderId}`);
        if (res.data.status === 'completed') return true;
        if (res.data.status === 'failed') return false;
      } catch (e) {
        console.error("Polling error:", e);
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    return false;
  };

  const buyCoinPackage = async (pkg: CoinPackage) => {
    if (isProcessingPayment) return;
    setIsProcessingPayment(true);

    try {
      const { data: orderData } = await apiClient.post('/wallet/purchase', {
        package_id: pkg.id
      });

      const options = {
        key: orderData.key_id, 
        amount: orderData.amount, 
        currency: orderData.currency,
        name: "zQuab",
        description: `${orderData.coins} zCoins`,
        order_id: orderData.razorpay_order_id,
        theme: {
          color: "#3B82F6"
        },
        handler: async function (_response: any) {
          const success = await pollOrderStatus(orderData.order_id);
          if (success) {
            await refreshBalance();
            closePurchaseModal();
          } else {
            alert("Payment verification is taking longer than expected. Your coins will reflect shortly if the payment went through.");
          }
          setIsProcessingPayment(false);
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        console.error("Payment failed:", response.error);
        setIsProcessingPayment(false);
      });
      rzp.open();

    } catch (error: any) {
      console.error("Purchase error:", error);
      alert(error?.response?.data?.error || "Failed to initialize payment. Please try again.");
      setIsProcessingPayment(false);
    }
  };

  const updateBalanceLocally = useCallback((newBalance: number) => {
    setBalanceCoins(newBalance);
  }, []);

  return (
    <WalletContext.Provider value={{
      balanceCoins,
      packages,
      gifts, // 🚀 ADDED
      isPurchaseModalOpen,
      isProcessingPayment,
      openPurchaseModal,
      closePurchaseModal,
      buyCoinPackage,
      refreshBalance,
      updateBalanceLocally
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) throw new Error('useWallet must be used within a WalletProvider');
  return context;
};