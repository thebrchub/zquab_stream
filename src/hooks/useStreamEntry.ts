import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';

export const useStreamEntry = (streamId: string | undefined, enabled = true) => {
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaywall, setIsPaywall] = useState(false);
  const [isLoginRequired, setIsLoginRequired] = useState(false);

  const fetchStreamUrl = useCallback(async () => {
    if (!streamId || !enabled) return;
    
    setIsLoading(true);
    setError(null);
    setIsPaywall(false);
    setIsLoginRequired(false);

    try {
      // Hit the real backend using your pre-configured Axios client
      const response = await apiClient.post(`/streams/${streamId}/enter`);
      
      setPlaybackUrl(response.data.playback_url);
    } catch (err: unknown) {
      const status = typeof err === 'object' && err !== null && 'status' in err
        ? (err as { status?: number }).status
        : undefined;
      const message = err instanceof Error ? err.message : 'Stream is offline or unavailable.';

      if (status === 402) {
        setIsPaywall(true);
        setError("Insufficient zCoins to enter this premium stream.");
      } else if (status === 403) {
        // Guests can't open premium streams.
        setIsLoginRequired(true);
        setError(message);
      } else {
        setError(message);
      }
      setPlaybackUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, [streamId, enabled]);

  // Gets a fresh signed link without showing the loading state (used while reconnecting).
  const refreshPlaybackUrl = useCallback(async () => {
    if (!streamId || !enabled) return;
    try {
      const response = await apiClient.post(`/streams/${streamId}/enter`);
      setPlaybackUrl(response.data.playback_url);
      setError(null);
    } catch {
      // Keep the current link; the next retry will try again.
    }
  }, [streamId, enabled]);

  useEffect(() => {
    fetchStreamUrl();
  }, [fetchStreamUrl]);

  return { 
    playbackUrl, 
    isLoading, 
    error, 
    isPaywall, 
    isLoginRequired,
    retryEnter: fetchStreamUrl,
    refreshPlaybackUrl,
  };
};