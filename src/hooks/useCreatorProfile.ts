import { useState, useEffect, useCallback } from 'react';
import { creatorService, type CreatorProfile } from '../services/creatorService';

export const useCreatorProfile = (username: string | undefined) => {
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowMutationPending, setIsFollowMutationPending] = useState<boolean>(false);

  const fetchProfile = useCallback(async () => {
    if (!username) return;
    setIsLoading(true);
    try {
      const data = await creatorService.getProfile(username);
      setProfile(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const toggleFollow = async () => {
    if (!profile || isFollowMutationPending) return;

    const isCurrentlyFollowing = profile.is_following;
    setIsFollowMutationPending(true);

    // Optimistic UI Update
    setProfile((prev) => prev ? {
      ...prev,
      is_following: !isCurrentlyFollowing,
      follower_count: isCurrentlyFollowing ? prev.follower_count - 1 : prev.follower_count + 1
    } : null);

    try {
      if (isCurrentlyFollowing) {
        await creatorService.unfollowCreator(profile.username);
      } else {
        await creatorService.followCreator(profile.username);
      }
    } catch (err) {
      // Revert optimistic update on failure
      setProfile((prev) => prev ? {
        ...prev,
        is_following: isCurrentlyFollowing,
        follower_count: isCurrentlyFollowing ? prev.follower_count + 1 : prev.follower_count - 1
      } : null);
      console.error("Failed to toggle follow:", err);
    } finally {
      setIsFollowMutationPending(false);
    }
  };

  return { profile, isLoading, error, toggleFollow, isFollowMutationPending };
};