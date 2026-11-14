import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from './AuthContext';
import { wsEvents } from './WebSocketContext';
import type { PurchaseCompletedEvent } from '../types/wallet';

// How long to wait for the webhook's "purchase_completed" push before refetching the wallet once.
const PURCHASE_PUSH_TIMEOUT_MS = 30000;

type RazorpayConstructor = new (options: Record<string, unknown>) => {
  on: (event: 'payment.failed', handler: (response: { error: unknown }) => void) => void;
  open: () => void;
};

const getRazorpay = () => (window as Window & { Razorpay?: RazorpayConstructor }).Razorpay;

let razorpayScriptPromise: Promise<void> | null = null;

const loadRazorpay = (): Promise<void> => {
  if (getRazorpay()) return Promise.resolve();
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      if (getRazorpay()) {
        resolve();
      } else {
        razorpayScriptPromise = null;
        script.remove();
        reject(new Error('Razorpay checkout failed to initialize.'));
      }
    };
    script.onerror = () => {
      razorpayScriptPromise = null;
      script.remove();
      reject(new Error('Failed to load Razorpay checkout.'));
    };
    document.head.appendChild(script);
  });

  return razorpayScriptPromise;
};

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
  isLoadingPackages: boolean;
  openPurchaseModal: () => void;
  closePurchaseModal: () => void;
  buyCoinPackage: (pkg: CoinPackage) => Promise<void>;
  refreshBalance: () => Promise<void>;
  updateBalanceLocally: (newBalance: number) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.user_id;
  const isGuest = user?.is_guest;
  const [balanceCoins, setBalanceCoins] = useState<number>(0);
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [gifts, setGifts] = useState<GiftItem[]>([]); // 🚀 ADDED
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [hasLoadedPackages, setHasLoadedPackages] = useState(false);
  
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const refreshBalance = useCallback(async () => {
    if (!userId || isGuest) return;
    try {
      const res = await apiClient.get('/wallet');
      setBalanceCoins(res.data.balance_coins);
    } catch (error) {
      console.error("Failed to fetch wallet balance:", error);
    }
  }, [userId, isGuest]);

  const fetchPackages = useCallback(async () => {
    if (!userId || isGuest || isLoadingPackages || hasLoadedPackages) return;
    setIsLoadingPackages(true);
    try {
      const res = await apiClient.get('/wallet/packages');
      setPackages(res.data);
      setHasLoadedPackages(true);
    } catch (error) {
      console.error("Failed to fetch coin packages:", error);
    } finally {
      setIsLoadingPackages(false);
    }
  }, [userId, isGuest, isLoadingPackages, hasLoadedPackages]);

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
    fetchGifts(); 
  }, [refreshBalance, fetchGifts]);

  const openPurchaseModal = () => {
    setIsPurchaseModalOpen(true);
    void fetchPackages();
  };
  const closePurchaseModal = () => setIsPurchaseModalOpen(false);

  const purchaseWaitersRef = useRef(new Map<string, () => void>());
  // Orders whose push arrived before Razorpay's success callback started waiting.
  const completedOrdersRef = useRef(new Set<string>());

  useEffect(() => wsEvents.subscribe((msg) => {
    if (msg.type !== 'purchase_completed') return;
    const event = (msg.payload || {}) as PurchaseCompletedEvent;
    setBalanceCoins(Number(event.balance_coins || 0));
    const onCompleted = purchaseWaitersRef.current.get(event.order_id);
    if (onCompleted) onCompleted();
    else if (event.order_id) completedOrdersRef.current.add(event.order_id);
  }), []);

  const waitForPurchase = (orderId: string) => new Promise<boolean>((resolve) => {
    if (completedOrdersRef.current.delete(orderId)) {
      resolve(true);
      return;
    }
    const timer = window.setTimeout(() => {
      purchaseWaitersRef.current.delete(orderId);
      resolve(false);
    }, PURCHASE_PUSH_TIMEOUT_MS);
    purchaseWaitersRef.current.set(orderId, () => {
      window.clearTimeout(timer);
      purchaseWaitersRef.current.delete(orderId);
      resolve(true);
    });
  });

  const buyCoinPackage = async (pkg: CoinPackage) => {
    if (isProcessingPayment) return;
    setIsProcessingPayment(true);

    try {
      await loadRazorpay();
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
        handler: async function () {
          const success = await waitForPurchase(orderData.order_id);
          if (success) {
            closePurchaseModal();
          } else {
            await refreshBalance();
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

      const Razorpay = getRazorpay();
      if (!Razorpay) throw new Error('Razorpay checkout failed to initialize.');
      const rzp = new Razorpay(options);
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
      isLoadingPackages,
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