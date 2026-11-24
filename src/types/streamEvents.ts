// These interfaces represent the decoded protobuf payloads from the server

export interface ViewerCountEvent {
  viewer_count: number;
}

export interface GiftSentEvent {
  sender_id: string;
  creator_id: string;
  gift_id: number;
  gift_name: string;
  gift_icon: string;
  coins: number;
  message: string; // Empty if no super-chat message
  sender_username: string;
  sender_name: string;
  sender_avatar_url: string;
}

export interface GiftConfirmEvent {
  gift_id: number;
  coins: number;
  balance_coins: number; // The new wallet balance
}

export interface LiveChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  avatarUrl: string;
  isCreator?: boolean;
  isOwn?: boolean;
  text?: string;
  gift?: {
    name: string;
    icon: string;
    coins: number;
  };
}

// Creator-only events
export interface StreamEarningsEvent {
  earnings_coins: number;
}

export interface StreamEndingSoonEvent {
  stream_id: string;
  seconds_remaining: number;
}

export interface StreamAutoEndedEvent {
  stream_id: string;
  room_id: string;
}

export interface StreamExpiredEvent {
  stream_id: string;
  title: string;
}

// Answers to "stream_enter" (sent only to the asking socket)
export interface StreamEnterOkEvent {
  stream_id: string;
  playback_url: string;
  expires_at: number; // unix seconds
  charged_coins: number; // > 0 only on the request that paid
  balance_coins: number; // valid only when has_balance
  has_balance: boolean;
}

export interface StreamConfirmRequiredEvent {
  stream_id: string;
  entry_price_coins: number;
}

export type StreamEnterErrorCode =
  | 'LOGIN_REQUIRED'
  | 'INSUFFICIENT_BALANCE'
  | 'STREAM_NOT_FOUND'
  | 'STREAM_NOT_LIVE'
  | 'ENTER_FAILED';

export interface StreamEnterErrorEvent {
  stream_id: string;
  code: StreamEnterErrorCode;
  message: string;
  balance_coins?: number; // INSUFFICIENT_BALANCE: the viewer's balance, valid only when has_balance
  has_balance?: boolean;
}