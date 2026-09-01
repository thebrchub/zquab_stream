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