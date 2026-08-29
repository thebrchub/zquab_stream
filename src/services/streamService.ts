const BASE_URL = '/api/v1';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function handleStreamResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new ApiError(errorData.error || `HTTP error ${res.status}`, res.status);
  }
  return res.json();
}

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

// 🚀 Missing Interface added here!
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

// ==========================================
// API SERVICE
// ==========================================

export const streamService = {
  
  // --- Viewer Endpoints ---

  async enterStream(streamId: string): Promise<{ playback_url: string }> {
    const res = await fetch(`${BASE_URL}/streams/${streamId}/enter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleStreamResponse<{ playback_url: string }>(res);
  },

  // 🚀 Missing function added here!
  async getLiveStreams(): Promise<LiveStream[]> {
    const res = await fetch(`${BASE_URL}/streams/live`);
    return handleStreamResponse<LiveStream[]>(res);
  },

  // --- Creator Endpoints ---

  async createStream(payload: CreateStreamPayload): Promise<StreamCreationResponse> {
    const res = await fetch(`${BASE_URL}/streams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return handleStreamResponse<StreamCreationResponse>(res);
  },

  async updatePlannedEnd(streamId: string, plannedEndAt: string): Promise<{ status: string }> {
    const res = await fetch(`${BASE_URL}/streams/${streamId}/planned-end`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ planned_end_at: plannedEndAt }),
    });
    return handleStreamResponse<{ status: string }>(res);
  },

  async regenerateKey(streamId: string): Promise<{ stream_key: string }> {
    const res = await fetch(`${BASE_URL}/streams/${streamId}/regenerate-key`, {
      method: 'POST',
      credentials: 'include',
    });
    return handleStreamResponse<{ stream_key: string }>(res);
  },

  async endStream(streamId: string): Promise<{ room_id: string; status: string }> {
    const res = await fetch(`${BASE_URL}/streams/${streamId}/end`, {
      method: 'POST',
      credentials: 'include',
    });
    return handleStreamResponse<{ room_id: string; status: string }>(res);
  }
};