import type {
  WalletBalanceResponse,
  WalletTransaction,
  CoinPackage,
  PurchaseInitResponse,
  PurchaseStatusResponse,
  GiftItem,
} from '../types/wallet';

const BASE_URL = '/api/v1';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }
  return res.json();
}

export const walletService = {
  // Wallet & Balance
  async getBalance(): Promise<WalletBalanceResponse> {
    const res = await fetch(`${BASE_URL}/wallet`, { credentials: 'include' });
    return handleResponse<WalletBalanceResponse>(res);
  },

  async getTransactions(limit = 20, offset = 0): Promise<WalletTransaction[]> {
    const res = await fetch(
      `${BASE_URL}/wallet/transactions?limit=${limit}&offset=${offset}`,
      { credentials: 'include' }
    );
    return handleResponse<WalletTransaction[]>(res);
  },

  // Coin Packages & Purchasing
  async getPackages(): Promise<CoinPackage[]> {
    const res = await fetch(`${BASE_URL}/wallet/packages`, { credentials: 'include' });
    return handleResponse<CoinPackage[]>(res);
  },

  async initPurchase(packageId: number): Promise<PurchaseInitResponse> {
    const res = await fetch(`${BASE_URL}/wallet/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ package_id: packageId }),
    });
    return handleResponse<PurchaseInitResponse>(res);
  },

  async pollPurchaseStatus(orderId: string): Promise<PurchaseStatusResponse> {
    const res = await fetch(`${BASE_URL}/wallet/purchase/${orderId}`, {
      credentials: 'include',
    });
    return handleResponse<PurchaseStatusResponse>(res);
  },

  // Gift Catalog
  async getGiftCatalog(): Promise<GiftItem[]> {
    const res = await fetch(`${BASE_URL}/gifts`);
    return handleResponse<GiftItem[]>(res);
  },
};