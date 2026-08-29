import { useState, useEffect, useCallback } from 'react';

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
      // 🚀 The new backend endpoint to get the playback URL
      const response = await fetch(`/api/v1/streams/${streamId}/enter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add your standard Auth/Bearer token here if your fetch doesn't use cookies automatically
          // 'Authorization': `Bearer ${sessionStorage.getItem('token')}` 
        },
      });

      if (response.status === 402) {
        setIsPaywall(true);
        setError("Premium stream. Insufficient coins to enter.");
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Stream is offline or unavailable.');
      }

      const data = await response.json();
      setPlaybackUrl(data.playback_url);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to stream.');
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