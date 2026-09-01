import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';

export const useStreamEntry = (streamId: string | undefined) => {
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaywall, setIsPaywall] = useState(false);

  const fetchStreamUrl = useCallback(async () => {
    if (!streamId) return;
    
    setIsLoading(true);
    setError(null);
    setIsPaywall(false);

    try {
      // Hit the real backend using your pre-configured Axios client
      const response = await apiClient.post(`/streams/${streamId}/enter`);
      
      setPlaybackUrl(response.data.playback_url);
    } catch (err: any) {
      // Intercept the specific 402 Payment Required status
      if (err.response?.status === 402) {
        setIsPaywall(true);
        setError("Insufficient zCoins to enter this premium stream.");
      } else {
        setError(err.response?.data?.error || 'Stream is offline or unavailable.');
      }
      setPlaybackUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, [streamId]);

  useEffect(() => {
    fetchStreamUrl();
  }, [fetchStreamUrl]);

  return { 
    playbackUrl, 
    isLoading, 
    error, 
    isPaywall, 
    retryEnter: fetchStreamUrl 
  };
};