import { useState, useEffect, useCallback } from 'react';
import { streamService, ApiError } from '../services/streamService';
import { useWallet } from '../context/WalletContext';

export const useStreamEntry = (streamId: string | undefined) => {
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaywall, setIsPaywall] = useState<boolean>(false);
  
  const { openPurchaseModal } = useWallet();

  const enterStream = useCallback(async () => {
    if (!streamId) return;
    
    setIsLoading(true);
    setError(null);
    setIsPaywall(false);

    try {
      const data = await streamService.enterStream(streamId);
      setPlaybackUrl(data.playback_url);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 402) {
        setIsPaywall(true);
        setError("Insufficient zCoins to enter this premium stream.");
        // Automatically pop the top-up modal for the user
        openPurchaseModal();
      } else {
        setError(err.message || "Failed to enter stream");
      }
    } finally {
      setIsLoading(false);
    }
  }, [streamId, openPurchaseModal]);

  useEffect(() => {
    enterStream();
  }, [enterStream]);

  return { 
    playbackUrl, 
    isLoading, 
    error, 
    isPaywall, 
    retryEnter: enterStream 
  };
};