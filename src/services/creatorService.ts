import { apiClient } from '../api/client';
import { MOCK_CREATORS } from '../constants/streamMockData';

// Helper to check if we are in mock UI mode
const isMockMode = () => sessionStorage.getItem('dev_stream_mode') === 'mock';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// ==========================================
// INTERFACES
// ==========================================

export interface CreatorProfile {
  username: string;
  name: string;
  avatar_url: string;
  category: string;
  headline: string;
  verified: boolean;
  follower_count: number;
  is_following: boolean;
}

export interface DiscoverCreator {
  username: string;
  name: string;
  avatar_url: string;
  category: string;
  headline: string;
  follower_count: number;
  verified: boolean;
}

export interface DailyEarning {
  day: string;
  earnings_coins: number;
}

export interface CreatorEarnings {
  totalEarningsCoins: number;
  byType: {
    giftReceived: number;
    premiumEntryEarning: number;
  };
  daily: DailyEarning[];
}

export interface ApplyCreatorPayload {
  category: string;
  headline: string;
  one_on_one_enabled: boolean;
  one_on_one_price_coins: number;
  one_on_one_duration_mins: number;
}

export interface ApplyCreatorResponse {
  status: string;
  is_creator: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
}

export interface Follower {
  username: string;
  name: string;
  avatar_url: string;
  followed_at: string;
}

export interface FollowingCreator {
  username: string;
  name: string;
  avatar_url: string;
  category: string;
  headline: string;
  followed_at: string;
}

export interface UpcomingStream {
  stream_id: string;
  title: string;
  category: string;
  scheduled_at: string;
  planned_end_at: string;
}

// ==========================================
// API SERVICE
// ==========================================

export const creatorService = {
  
  // --- Profile & Follow System ---

  async getProfile(username: string): Promise<CreatorProfile> {
    if (isMockMode()) {
      await delay(400);
      const mockC = MOCK_CREATORS[0]; 
      return {
        username: username,
        name: mockC.name,
        avatar_url: mockC.avatar,
        category: 'gaming',
        headline: 'Pro grinds and viewer games.',
        verified: mockC.verified || false,
        follower_count: 12500,
        is_following: false
      };
    }
    const res = await apiClient.get(`/creators/${username}`);
    return res.data;
  },

  async followCreator(username: string): Promise<void> {
    if (isMockMode()) {
      await delay(300);
      return;
    }
    await apiClient.post(`/creators/${username}/follow`);
  },

  async unfollowCreator(username: string): Promise<void> {
    if (isMockMode()) {
      await delay(300);
      return;
    }
    await apiClient.delete(`/creators/${username}/follow`);
  },

  // --- Discovery ---

  async getDiscoverFeed(category?: string, limit = 20, offset = 0): Promise<DiscoverCreator[]> {
    if (isMockMode()) {
      await delay(600);
      return MOCK_CREATORS.map(c => ({
        username: c.name.toLowerCase().replace(/\s/g, ''),
        name: c.name,
        avatar_url: c.avatar,
        category: 'gaming',
        headline: 'Live everyday! Drop a follow.',
        follower_count: Math.floor(Math.random() * 50000),
        verified: c.verified || false
      }));
    }
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const res = await apiClient.get(`/discover?${params.toString()}`);
    return res.data;
  },

  // --- Creator Earnings Dashboard ---
  
  async getMyEarnings(days: number = 30): Promise<CreatorEarnings> {
    if (isMockMode()) {
      await delay(800);
      return {
        totalEarningsCoins: 14500,
        byType: {
          giftReceived: 10500,
          premiumEntryEarning: 4000
        },
        daily: [
          { day: "2026-08-25", earnings_coins: 1200 },
          { day: "2026-08-26", earnings_coins: 3400 },
          { day: "2026-08-27", earnings_coins: 800 },
          { day: "2026-08-28", earnings_coins: 4500 },
          { day: "2026-08-29", earnings_coins: 2100 },
          { day: "2026-08-30", earnings_coins: 2500 }
        ]
      };
    }
    const res = await apiClient.get(`/creators/me/earnings?days=${days}`);
    return res.data;
  },

  // --- Creator Registration & Onboarding ---

  async applyAsCreator(payload: ApplyCreatorPayload): Promise<ApplyCreatorResponse> {
    if (isMockMode()) {
      await delay(500);
      return {
        status: 'ok',
        is_creator: true,
        approval_status: 'pending'
      };
    }
    const res = await apiClient.post('/users/me/creator', payload);
    return res.data;
  },

  // --- Follower System ---

  async getFollowers(username: string, limit: number = 50, offset: number = 0): Promise<Follower[]> {
    if (isMockMode()) {
      await delay(400);
      return [
        {
          username: 'viewer1',
          name: 'Viewer One',
          avatar_url: MOCK_CREATORS[0]?.avatar || '',
          followed_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          username: 'viewer2',
          name: 'Viewer Two',
          avatar_url: MOCK_CREATORS[1]?.avatar || '',
          followed_at: new Date(Date.now() - 172800000).toISOString()
        }
      ];
    }
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    const res = await apiClient.get(`/creators/${username}/followers?${params.toString()}`);
    return res.data;
  },

  async getFollowing(limit: number = 50, offset: number = 0): Promise<FollowingCreator[]> {
    if (isMockMode()) {
      await delay(400);
      return MOCK_CREATORS.slice(0, 3).map(c => ({
        username: c.name.toLowerCase().replace(/\s/g, ''),
        name: c.name,
        avatar_url: c.avatar,
        category: 'gaming',
        headline: 'Live everyday! Drop a follow.',
        followed_at: new Date(Date.now() - Math.random() * 604800000).toISOString()
      }));
    }
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    const res = await apiClient.get(`/users/me/following?${params.toString()}`);
    return res.data;
  },

  // --- Stream Scheduling ---

  async getUpcomingStreams(username: string): Promise<UpcomingStream[]> {
    if (isMockMode()) {
      await delay(400);
      const now = new Date();
      const in2Hours = new Date(now.getTime() + 2 * 3600000);
      const in4Hours = new Date(now.getTime() + 4 * 3600000);
      return [
        {
          stream_id: `upcoming-${Date.now()}`,
          title: 'Upcoming Ranked Session',
          category: 'gaming',
          scheduled_at: in2Hours.toISOString(),
          planned_end_at: in4Hours.toISOString()
        }
      ];
    }
    const res = await apiClient.get(`/creators/${username}/upcoming`);
    return res.data;
  }
};