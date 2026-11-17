import { apiClient, publicGet } from './client';

// A user's public card (GET /public/v1/users/{username}): the same for every
// viewer, cached at the edge. What only this viewer sees is in UserRelation.
export interface ProfileCard {
  id: string;
  name: string;
  username: string;
  avatar_url: string;
  bio: string;
  country: string;
  doj: string;
  gender: string | null;
  is_creator: boolean;
  category: string;
  headline: string;
  verified: boolean;
  stream_count: number;
  follower_count: number;
  friend_count: number;
  live_stream: {
    stream_id: string;
    room_id: string;
    title: string;
    is_premium: boolean;
    entry_price_coins: number;
  } | null;
}

export type FriendRequestStatus = 'friends' | 'pending_sent' | 'pending_received' | 'none';

// The viewer's relation to a profile (GET /api/v1/users/{username}/relation, login required).
export interface UserRelation {
  is_self: boolean;
  friend_request_status: FriendRequestStatus;
  is_following: boolean;
  live_alerts: boolean;
  blocked: boolean;
}

export interface PersonResult {
  id: string;
  username: string;
  name: string;
  avatar_url: string;
  is_online: boolean;
}

// One friend in someone's public friends list.
export interface PublicFriend extends PersonResult {
  friends_since?: string;
  last_seen_at?: string;
}

export const usersApi = {
  getMe: async () => {
    const res = await apiClient.get('/users/me');
    return res.data;
  },
  
  updateMePartial: async (data: { username?: string; name?: string; mobile?: string; gender?: string; avatar_url?: string; show_last_seen?: boolean; bio?: string; country?: string }) => {
    const res = await apiClient.patch('/users/me', data);
    return res.data;
  },
  
  // Requires username and name
  updateMeFull: async (data: { username: string; name: string; mobile?: string; gender?: string; avatar_url?: string; show_last_seen?: boolean; bio?: string; country?: string }) => {
    const res = await apiClient.patch('/users/me', data);
    return res.data;
  },
  
  checkUsername: async (username: string) => {
    const res = await apiClient.get(`/users/check-username?username=${encodeURIComponent(username)}`);
    return res.data;
  },
  
  getProfileCard: (username: string, signal?: AbortSignal) =>
    publicGet<ProfileCard>(`/users/${encodeURIComponent(username)}`, signal),

  getRelation: async (username: string): Promise<UserRelation> => {
    const res = await apiClient.get(`/users/${encodeURIComponent(username)}/relation`);
    return res.data;
  },

  // People whose name or username starts with the query (2+ characters).
  searchUsers: async (query: string, signal?: AbortSignal): Promise<PersonResult[]> => {
    const res = await apiClient.get(`/users/search?query=${encodeURIComponent(query)}`, signal);
    return res.data || [];
  },

  // Someone's friends list, as shown on their profile.
  getUserFriends: (username: string, limit = 20, offset = 0) =>
    publicGet<PublicFriend[]>(`/users/${encodeURIComponent(username)}/friends?limit=${limit}&offset=${offset}`)
};