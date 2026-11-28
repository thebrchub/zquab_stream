import { apiClient, publicGet } from '../api/client';
import { usersApi } from '../api/users';
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
  stream_count: number;
  is_following: boolean;
  live_alerts?: boolean;
  // 1:1 calls will be enabled in the next release.
  // one_on_one_enabled: boolean;
  // one_on_one_price_coins: number;
  // one_on_one_duration_mins: number;
  live_stream?: CreatorLiveStream | null;
}

export interface CreatorLiveStream {
  stream_id: string;
  room_id: string;
  title: string;
  is_premium: boolean;
  entry_price_coins: number;
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

// One page of a public directory list (creators or streams). Pass ver from
// the first page when asking for the next ones; a 410 means the list changed,
// so start again from page 0.
export interface DirectoryPage {
  ver: number;
  page: number;
  has_more: boolean;
}

export interface CreatorsPage extends DirectoryPage {
  creators: DiscoverCreator[];
}

// Query string for a directory page: category, then ver/page for later pages.
export const directoryParams = (category: string | undefined, ver: number | undefined, page: number) => {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (ver) params.append('ver', String(ver));
  if (page > 0) params.append('page', String(page));
  return params;
};

// Earnings in one 15-minute slot: [UTC start time in unix seconds, coins].
export type EarningSlot = [number, number];

export interface CreatorEarnings {
  totalEarningsCoins: number;
  byType: {
    giftReceived: number;
    premiumEntryEarning: number;
  };
  slots: EarningSlot[];
}

export interface ApplyCreatorPayload {
	 social_links: SocialLink[];
  category: string;
  headline: string;
  // 1:1 calls will be enabled in the next release.
  // one_on_one_enabled: boolean;
  // one_on_one_price_coins: number;
  // one_on_one_duration_mins: number;
}

export interface ApplyCreatorResponse {
  status: string;
  is_creator: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
	 verification_code: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface CreatorApplication {
  approval_status: 'pending' | 'approved' | 'rejected';
  is_creator: boolean;
  social_links: SocialLink[];
  rejection_reason: string;
  application_submitted_at: string;
  verification_code: string;
  // Seconds a live stream may stay paused (video dropped) before it is ended; copied into each new stream.
  pause_timeout?: number;
}

// Creator settings that can be changed (PATCH /users/me/creator); send only what changes.
export interface CreatorSettings {
  pause_timeout?: number;
}

interface CreatorAvatarUpload {
  url: string;
  object_key: string;
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

  // A creator's channel: the public card (edge-cached) plus, with
  // withRelation, whether this viewer follows them (needs login).
  async getProfile(username: string, withRelation = false): Promise<CreatorProfile> {
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
    		stream_count: 42,
        is_following: false,
        // 1:1 calls will be enabled in the next release.
    		// one_on_one_enabled: false,
    		// one_on_one_price_coins: 0,
    		// one_on_one_duration_mins: 0,
      };
    }
    const [card, relation] = await Promise.all([
      usersApi.getProfileCard(username),
      withRelation ? usersApi.getRelation(username).catch(() => null) : Promise.resolve(null),
    ]);
    return {
      username: card.username,
      name: card.name,
      avatar_url: card.avatar_url,
      category: card.category,
      headline: card.headline,
      verified: card.verified,
      follower_count: card.follower_count,
      stream_count: card.stream_count,
      is_following: relation?.is_following ?? false,
      live_alerts: relation?.live_alerts ?? false,
      live_stream: card.live_stream,
    };
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

  async setLiveAlerts(username: string, enabled: boolean): Promise<void> {
    if (isMockMode()) {
      await delay(300);
      return;
    }
    await apiClient.put(`/creators/${username}/live-alerts`, { enabled });
  },

  // --- Discovery ---

  // One page of all creators (most followers first), optionally one category.
  async getCreatorsPage(category?: string, ver?: number, page = 0, signal?: AbortSignal): Promise<CreatorsPage> {
    if (isMockMode()) {
      await delay(600);
      const creators = MOCK_CREATORS.map(c => ({
        username: c.name.toLowerCase().replace(/\s/g, ''),
        name: c.name,
        avatar_url: c.avatar,
        category: 'gaming',
        headline: 'Live everyday! Drop a follow.',
        follower_count: Math.floor(Math.random() * 50000),
        verified: c.verified || false
      }));
      return { ver: 1, page, has_more: false, creators };
    }
    const params = directoryParams(category, ver, page);
    const query = params.toString();
    return publicGet<CreatorsPage>(query ? `/creators?${query}` : '/creators', signal);
  },

  // Creators whose name or username starts with q (2+ characters), most followers first.
  async searchCreators(q: string, signal?: AbortSignal): Promise<DiscoverCreator[]> {
    const res = await publicGet<{ creators: DiscoverCreator[] }>(`/creators/search?q=${encodeURIComponent(q)}`, signal);
    return res.creators || [];
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
        slots: [5, 4, 3, 2, 1, 0].map((daysAgo, i): EarningSlot => [
          Math.floor((Date.now() - daysAgo * 86400000) / 1000),
          [1200, 3400, 800, 4500, 2100, 2500][i],
        ])
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
    approval_status: 'pending',
    verification_code: 'zQuab-creator',
      };
    }
    const res = await apiClient.post('/users/me/creator', payload);
    return res.data;
  },

  async getMyApplication(): Promise<CreatorApplication | null> {
  if (isMockMode()) return null;
  try {
    const res = await apiClient.get('/users/me/creator');
    return res.data;
  } catch (error: any) {
    if (error?.status === 404) return null;
    throw error;
  }
  },

  async updateSettings(settings: CreatorSettings): Promise<CreatorSettings> {
    const res = await apiClient.patch('/users/me/creator', settings);
    return res.data;
  },

  async getAvatarUploadUrl(contentType: string): Promise<CreatorAvatarUpload> {
  const res = await apiClient.post('/users/me/creator/avatar/upload-url', { content_type: contentType });
  return res.data;
  },

  async completeAvatar(objectKey: string): Promise<{ avatar_url: string }> {
  const res = await apiClient.post('/users/me/creator/avatar/complete', { object_key: objectKey });
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

  async getUpcomingStreams(username: string, limit: number = 10, offset: number = 0): Promise<UpcomingStream[]> {
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
    const res = await apiClient.get(`/creators/${username}/upcoming?limit=${limit}&offset=${offset}`);
    return res.data;
  }
};