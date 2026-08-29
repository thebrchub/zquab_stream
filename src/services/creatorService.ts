const BASE_URL = '/api/v1';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new ApiError(errorData.error || `HTTP error ${res.status}`, res.status);
  }
  return res.json();
}

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
  // one_on_one fields exist but are omitted from UI per your backend guide
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

// ==========================================
// API SERVICE
// ==========================================

export const creatorService = {
  // --- Profile & Follow System ---

  async getProfile(username: string): Promise<CreatorProfile> {
    const res = await fetch(`${BASE_URL}/creators/${username}`, {
      credentials: 'include', // Needed so backend knows if current user is_following
    });
    return handleResponse<CreatorProfile>(res);
  },

  async followCreator(username: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/creators/${username}/follow`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) await handleResponse(res);
  },

  async unfollowCreator(username: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/creators/${username}/follow`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) await handleResponse(res);
  },

  // --- Discovery ---

  async getDiscoverFeed(category?: string, limit = 20, offset = 0): Promise<DiscoverCreator[]> {
    const url = new URL(`${window.location.origin}${BASE_URL}/discover`);
    if (category) url.searchParams.append('category', category);
    url.searchParams.append('limit', limit.toString());
    url.searchParams.append('offset', offset.toString());

    const res = await fetch(url.toString());
    return handleResponse<DiscoverCreator[]>(res);
  },

  // --- Creator Earnings Dashboard ---
  
  async getMyEarnings(days: number = 30): Promise<CreatorEarnings> {
    const res = await fetch(`${BASE_URL}/creators/me/earnings?days=${days}`, {
      credentials: 'include',
    });
    return handleResponse<CreatorEarnings>(res);
  }
};