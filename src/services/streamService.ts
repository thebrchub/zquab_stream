import { apiClient } from '../api/client';
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
  stream_key: string;
  rtmp_url?: string; 
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

export interface StreamMetadata {
  stream_id: string;
  room_id: string;
  title: string;
  category: string;
  tags: string[];
  status: 'scheduled' | 'live' | 'ended';
  is_premium: boolean;
  entry_price_coins: number;
  viewer_count: number;
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

  async enterStream(streamId: string): Promise<{ playback_url: string }> {
    if (isMockMode()) {
      await delay(800);
      return { playback_url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" };
    }
    const res = await apiClient.post(`/streams/${streamId}/enter`);
    return res.data;
  },

  async getLiveStreams(): Promise<LiveStream[]> {
    if (isMockMode()) {
      await delay(600);
      return MOCK_STREAMS.map(stream => {
        const creator = MOCK_CREATORS.find(c => c.id === stream.creatorId)!;
        return {
          stream_id: stream.id,
          room_id: `room-${stream.id}`,
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
    }
    const res = await apiClient.get('/streams/live');
    return res.data;
  },

  // --- Creator Endpoints ---

  async createStream(payload: CreateStreamPayload): Promise<StreamCreationResponse> {
    if (isMockMode()) {
      await delay(1200);
      return {
        stream_id: `mock-stream-${Date.now()}`,
        room_id: `mock-room-${Date.now()}`,
        stream_key: `sk_live_mock_${Math.random().toString(36).substring(7)}`,
      };
    }
    const res = await apiClient.post('/streams', payload);
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
      return { stream_key: `sk_live_mock_REGEN_${Math.random().toString(36).substring(7)}` };
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