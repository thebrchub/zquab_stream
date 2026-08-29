export interface Creator {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  followersCount: number;
  verified?: boolean;
  isLive: boolean;
  oneOnOne: {
    enabled: boolean;
    priceCoins: number;
    durationMinutes: number;
    estimatedWaitMinutes: number;
    currentQueueCount: number;
  };
}

export interface Stream {
  id: string;
  creatorId: string;
  title: string;
  category: 'Gaming' | 'Just Chatting' | 'Music' | 'Entertainment';
  viewerCount: number;
  thumbnailUrl: string;
  playbackUrl: string;
  isPremium: boolean;
  entryPriceCoins?: number;
  tags: string[];
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  message?: string;
  gift?: {
    name: string;
    icon: string;
    coins: number;
  };
  timestamp: string;
  isSystem?: boolean;
}

export interface GiftTier {
  id: string;
  name: string;
  icon: string;
  coins: number;
  animationColor: string;
}

export interface CoinPackage {
  id: string;
  coins: number;
  priceInr: number;
  badge?: string;
}

export interface QueueEntry {
  position: number;
  userName: string;
  isCurrentUser: boolean;
  status: 'talking' | 'next' | 'waiting';
}

// ------------------- MOCK DATA ------------------- //

export const MOCK_CREATORS: Creator[] = [
  {
    id: 'creator-1',
    name: 'Aiko Gaming',
    handle: '@aikogaming',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Ranked Valorant grinds & weekend viewer custom lobbies! 🎮',
    followersCount: 42300,
    isLive: true,
    oneOnOne: {
      enabled: true,
      priceCoins: 2000,
      durationMinutes: 10,
      estimatedWaitMinutes: 25,
      currentQueueCount: 7,
    },
  },
  {
    id: 'creator-2',
    name: 'Kabir Live',
    handle: '@kabirlive',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'Acoustic jams, chill chats, and live song requests 🎸',
    followersCount: 18900,
    isLive: true,
    oneOnOne: {
      enabled: true,
      priceCoins: 1500,
      durationMinutes: 10,
      estimatedWaitMinutes: 10,
      currentQueueCount: 2,
    },
  },
  {
    id: 'creator-3',
    name: 'Tara Stories',
    handle: '@tarastories',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    bio: 'Late night chill podcasts & comedy storytelling 🎙️',
    followersCount: 65400,
    isLive: false,
    oneOnOne: {
      enabled: false,
      priceCoins: 3000,
      durationMinutes: 15,
      estimatedWaitMinutes: 0,
      currentQueueCount: 0,
    },
  },
];

export const MOCK_STREAMS: Stream[] = [
  {
    id: 'stream-1',
    creatorId: 'creator-1',
    title: 'Playing ranked + viewer games! Come squad up 🔥',
    category: 'Gaming',
    viewerCount: 2184,
    thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    playbackUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    isPremium: false,
    tags: ['Valorant', 'Competitive', 'ViewerGames'],
  },
  {
    id: 'stream-2',
    creatorId: 'creator-2',
    title: 'Late Night Acoustic Sessions & Q&A 🎵',
    category: 'Music',
    viewerCount: 842,
    thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    playbackUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    isPremium: true,
    entryPriceCoins: 500,
    tags: ['Indie', 'Acoustic', 'Guitar'],
  },
];

export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'chat-1',
    userId: 'u-1',
    userName: 'Rohan_99',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    message: 'That clutch play was insane!! 🤯',
    timestamp: 'Just now',
  },
  {
    id: 'chat-2',
    userId: 'u-2',
    userName: 'PoojaK',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
    gift: { name: 'Rocket', icon: '🚀', coins: 100 },
    timestamp: 'Just now',
  },
  {
    id: 'chat-3',
    userId: 'u-3',
    userName: 'AdityaR',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
    message: 'Are you taking 1:1 calls after this match?',
    timestamp: '1m ago',
  },
];

export const GIFT_TIERS: GiftTier[] = [
  { id: 'gift-heart', name: 'Heart', icon: '❤️', coins: 10, animationColor: '#EF4444' },
  { id: 'gift-fire', name: 'Fire', icon: '🔥', coins: 50, animationColor: '#F97316' },
  { id: 'gift-rocket', name: 'Rocket', icon: '🚀', coins: 100, animationColor: '#3B82F6' },
  { id: 'gift-crown', name: 'Crown', icon: '👑', coins: 500, animationColor: '#EAB308' },
  { id: 'gift-diamond', name: 'Diamond', icon: '💎', coins: 1000, animationColor: '#A855F7' },
];

export const COIN_PACKAGES: CoinPackage[] = [
  { id: 'pkg-1', coins: 100, priceInr: 49 },
  { id: 'pkg-2', coins: 500, priceInr: 229, badge: 'Popular' },
  { id: 'pkg-3', coins: 1200, priceInr: 499, badge: 'Best Value' },
  { id: 'pkg-4', coins: 3000, priceInr: 1199 },
];

export const MOCK_QUEUE: QueueEntry[] = [
  { position: 1, userName: 'Rahul S.', isCurrentUser: false, status: 'talking' },
  { position: 2, userName: 'Priya M.', isCurrentUser: false, status: 'next' },
  { position: 3, userName: 'Arjun K.', isCurrentUser: false, status: 'waiting' },
  { position: 4, userName: 'You', isCurrentUser: true, status: 'waiting' },
];

export const MOCK_CREATOR_DASHBOARD = {
  stats: {
    monthlyEarningsInr: 42850,
    pendingInr: 8250,
    availableInr: 34600,
    totalFollowers: 42300,
    currentLiveViewers: 2184,
  },
  oneOnOneSettings: {
    enabled: true,
    priceCoins: 2000,
    durationMinutes: 10,
    maxQueueLimit: 10,
  },
};