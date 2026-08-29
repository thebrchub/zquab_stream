export interface WalletBalanceResponse {
  balance_coins: number;
}

export type TransactionType =
  | 'purchase'
  | 'admin_adjustment'
  | 'gift_sent'
  | 'gift_received'
  | 'premium_entry'
  | 'premium_entry_earning';

export interface WalletTransaction {
  id: number;
  type: TransactionType;
  amount_coins: number; // Negative = spend, Positive = credit/earn
  balance_after: number;
  reference_type: string;
  reference_id: string;
  note: string;
  created_at: string;
}

export interface CoinPackage {
  id: number;
  coins: number;
  price_amount: number;
  currency: string;
}

export interface PurchaseInitResponse {
  order_id: string;
  razorpay_order_id: string;
  key_id: string;
  amount: number;
  currency: string;
  coins: number;
}

export interface PurchaseStatusResponse {
  status: 'pending' | 'completed' | 'failed';
}

export interface GiftItem {
  id: number;
  name: string;
  icon: string;
  cost_coins: number;
}