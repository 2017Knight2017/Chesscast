'use client';

import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_SOCKET_URL || '';

export const useFollowMatch = (matchId: string) => {
	const [isFollowing, setIsFollowing] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const checkFollowStatus = useCallback(async () => {
		const stored = localStorage.getItem('user');
		const user = stored ? JSON.parse(stored) : null;
		if (!user) {
			setIsLoading(false);
			return;
		}

		try {
			const token = user.token;
			const res = await fetch(`${API_URL}/matches/${matchId}/follow/status`, {
				headers: {
					'Authorization': `Bearer ${token}`,
				},
			});

			if (!res.ok) {
				throw new Error('Failed to fetch follow status');
			}

			const data = await res.json();
			setIsFollowing(data.isFollowing);
		} catch (err: unknown) {
			console.error('Error checking follow status:', err);
			setError(err instanceof Error ? err.message : 'Unknown error');
		} finally {
			setIsLoading(false);
		}
	}, [matchId]);

	useEffect(() => {
		checkFollowStatus();
	}, [checkFollowStatus]);

	const toggleFollow = useCallback(async () => {
		const stored = localStorage.getItem('user');
		const user = stored ? JSON.parse(stored) : null;
		if (!user) {
			setError('User not authenticated');
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const token = user.token;
			const method = isFollowing ? 'DELETE' : 'POST';
			const expectedStatus = isFollowing ? 204 : 201;

			const res = await fetch(`${API_URL}/matches/${matchId}/follow`, {
				method,
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (res.status !== expectedStatus && res.status !== 200) {
				const errorData = await res.json().catch(() => ({}));
				throw new Error(errorData.message || 'Failed to toggle follow');
			}

			setIsFollowing(!isFollowing);
		} catch (err: unknown) {
			console.error('Error toggling follow:', err);
			setError(err instanceof Error ? err.message : 'Unknown error');
		} finally {
			setIsLoading(false);
		}
	}, [isFollowing, matchId]);

	return { isFollowing, isLoading, error, toggleFollow, refetch: checkFollowStatus };
};
