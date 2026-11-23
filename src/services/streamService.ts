import { apiClient, publicGet } from '../api/client';
import { directoryParams, type DirectoryPage } from './creatorService';
import { MOCK_STREAMS, MOCK_CREATORS } from '../constants/streamMockData';

// Helper to check if we are in mock UI mode
const isMockMode = () => sessionStorage.getItem('dev_stream_mode') === 'mock';

// Helper to simulate network delay for UI testing
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// ==========================================
// INTERFACES
// ==========================================

export interface CreateStreamPayload {
  title: string;
  category: string;
  tags: string[];
  scheduled_at?: string;
  planned_end_at: string;
  is_premium: boolean;
  entry_price_coins: number;
}

export interface StreamCreationResponse {
  stream_id: string;
  room_id: string;
  stream_key: string; // "<playback_id>?key=<secret>", goes in OBS's Stream Key box
  ingest_url: string;
}

export type StreamStatus = 'scheduled' | 'live' | 'ended' | 'cancelled' | 'expired';

export interface CreatorStream {
  stream_id: string;
  room_id: string;
  title: string;
  category: string;
  tags: string[];
  status: StreamStatus;
  stream_key: string;
  scheduled_at: string | null;
  planned_end_at: string;
  started_at: string | null;
  ended_at: string | null;
  is_premium: boolean;
  entry_price_coins: number;
  peak_viewer_count: number;
  unique_viewer_count: number | null; // null for streams ended before this was counted
  total_earnings_coins: number;
}

export interface CreatorStreamsResponse {
  ingest_url: string;
  streams: CreatorStream[];
  // Only on the first page of ended streams: totals over ALL the creator's ended streams.
  summary?: CreatorStreamsSummary;
}

export interface CreatorStreamsSummary {
  count: number;
  avg_peak: number | null;
  avg_unique: number | null; // null when no stream has a unique count (older streams)
  total_earned: number;
}

export interface LiveStream {
  stream_id: string;
  room_id: string;
  title: string;
  category: string;
  tags: string[];
  is_premium: boolean;
  entry_price_coins: number;
  username: string;
  name: string;
  avatar_url: string;
}

export interface UpcomingStream extends LiveStream {
  scheduled_at: string;
}

// A stream as the public directory serves it (lists, search, live updates).
export interface StreamCard extends LiveStream {
  status: 'live' | 'upcoming';
  scheduled_at?: string;
  // Live, but the streamer's video is gone (they may reconnect; ended automatically otherwise).
  is_paused?: boolean;
}

export interface StreamsPage extends DirectoryPage {
  streams: StreamCard[];
}

// What the discover:streams room sends when the directory changes.
export interface DiscoverStreamsChanged {
  added?: StreamCard[];
  updated?: StreamCard[];
  removed?: string[];
}

export interface StreamMetadata {
  stream_id: string;
  room_id: string;
  title: string;
  category: string;
  tags: string[];
  status: StreamStatus;
  is_premium: boolean;
  entry_price_coins: number;
  viewer_count: number;
  is_paused?: boolean;
  creator: {
    username: string;
    name: string;
    avatar_url: string;
  };
}

// ==========================================
// API SERVICE
// ==========================================

export const streamService = {
  
  // --- Viewer Endpoints ---

  // One page of live streams (newest first) or upcoming ones (soonest first).
  async getStreamsPage(status: 'live' | 'upcoming', category?: string, ver?: number, page = 0, signal?: AbortSignal): Promise<StreamsPage> {
    if (isMockMode()) {
      await delay(600);
      const streams: StreamCard[] = status !== 'live' ? [] : MOCK_STREAMS.map(stream => {
        const creator = MOCK_CREATORS.find(c => c.id === stream.creatorId)!;
        return {
          stream_id: stream.id,
          room_id: `room-${stream.id}`,
          status: 'live' as const,
          title: stream.title,
          category: stream.category,
          tags: ["live"],
          is_premium: false,
          entry_price_coins: 0,
          username: creator.name.toLowerCase().replace(/\s/g, ''),
          name: creator.name,
          avatar_url: creator.avatar,
        };
      });
      return { ver: 1, page, has_more: false, streams };
    }
    const params = directoryParams(category, ver, page);
    params.append('status', status);
    return publicGet<StreamsPage>(`/streams?${params.toString()}`, signal);
  },

  // Live and upcoming streams whose title, creator, category or tag starts with q (2+ characters).
  async searchStreams(q: string, signal?: AbortSignal): Promise<StreamCard[]> {
    const res = await publicGet<{ streams: StreamCard[] }>(`/streams/search?q=${encodeURIComponent(q)}`, signal);
    return res.streams || [];
  },

  // --- Creator Endpoints ---

  async createStream(payload: CreateStreamPayload): Promise<StreamCreationResponse> {
    if (isMockMode()) {
      await delay(1200);
      return {
        stream_id: `mock-stream-${Date.now()}`,
        room_id: `mock-room-${Date.now()}`,
        stream_key: `pb_mock_${Math.random().toString(36).substring(7)}?key=sk_live_mock_${Math.random().toString(36).substring(7)}`,
        ingest_url: '',
      };
    }
    const res = await apiClient.post('/streams', payload);
    return res.data;
  },

  async getMyStreams(status?: StreamStatus, limit?: number, offset?: number): Promise<CreatorStreamsResponse> {
    if (isMockMode()) {
      await delay(500);
      return { ingest_url: '', streams: [] };
    }
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (limit !== undefined) params.append('limit', String(limit));
    if (offset !== undefined) params.append('offset', String(offset));
    const query = params.toString();
    const res = await apiClient.get(query ? `/streams/me?${query}` : '/streams/me');
    return res.data;
  },

  async updatePlannedEnd(streamId: string, plannedEndAt: string): Promise<{ status: string }> {
    if (isMockMode()) {
      await delay(500);
      return { status: 'ok' };
    }
    const res = await apiClient.patch(`/streams/${streamId}/planned-end`, { planned_end_at: plannedEndAt });
    return res.data;
  },

  async regenerateKey(streamId: string): Promise<{ stream_key: string }> {
    if (isMockMode()) {
      await delay(1000);
      return { stream_key: `pb_mock?key=sk_live_mock_REGEN_${Math.random().toString(36).substring(7)}` };
    }
    const res = await apiClient.post(`/streams/${streamId}/regenerate-key`);
    return res.data;
  },

  async endStream(streamId: string): Promise<{ room_id: string; status: string }> {
    if (isMockMode()) {
      await delay(800);
      return { room_id: `room-${streamId}`, status: 'ended' };
    }
    const res = await apiClient.post(`/streams/${streamId}/end`);
    return res.data;
  },

  async cancelStream(streamId: string): Promise<{ status: string }> {
    if (isMockMode()) {
      await delay(500);
      return { status: 'cancelled' };
    }
    const res = await apiClient.post(`/streams/${streamId}/cancel`);
    return res.data;
  },

  // --- Stream Metadata (public, no playback URL) ---

  async getStreamMetadata(streamId: string): Promise<StreamMetadata> {
    if (isMockMode()) {
      await delay(500);
      const mockStream = MOCK_STREAMS[0];
      const mockCreator = MOCK_CREATORS[0];
      return {
        stream_id: streamId,
        room_id: `room-${streamId}`,
        title: mockStream?.title || 'Mock Stream',
        category: mockStream?.category || 'gaming',
        tags: ['live', 'gaming'],
        status: 'live',
        is_premium: false,
        entry_price_coins: 0,
        viewer_count: Math.floor(Math.random() * 500) + 50,
        creator: {
          username: mockCreator.name.toLowerCase().replace(/\s/g, ''),
          name: mockCreator.name,
          avatar_url: mockCreator.avatar
        }
      };
    }
    const res = await apiClient.get(`/streams/${streamId}`);
    return res.data;
  }
};