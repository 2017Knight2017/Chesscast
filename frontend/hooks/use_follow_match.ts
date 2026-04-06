"use client";

import { useState, useEffect, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "";

export const useFollowMatch = (matchId: string) => {
	const [isFollowing, setIsFollowing] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const checkFollowStatus = useCallback(async () => {
		const token = localStorage.getItem("token");
		if (!token) {
			setIsLoading(false);
			return;
		}

		try {
			const url = `${API_URL}/matches/${matchId}/follow/status`;
			console.log("[use_follow_match] Checking status:", {
				url,
				hasToken: !!token,
			});
			const res = await fetch(url, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!res.ok) {
				const errorBody = await res.text();
				throw new Error(
					`Failed to fetch follow status: ${res.status} ${errorBody}`,
				);
			}

			const data = await res.json();
			setIsFollowing(data.isFollowing);
		} catch (err: unknown) {
			console.error("Error checking follow status:", err);
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setIsLoading(false);
		}
	}, [matchId]);

	useEffect(() => {
		checkFollowStatus();
	}, [checkFollowStatus]);

	const toggleFollow = useCallback(async () => {
		const token = localStorage.getItem("token");
		if (!token) {
			setError("User not authenticated");
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const method = isFollowing ? "DELETE" : "POST";
			const expectedStatus = isFollowing ? 204 : 201;
			const url = `${API_URL}/matches/${matchId}/follow`;
			console.log("[use_follow_match] Toggling follow:", {
				url,
				method,
				hasToken: !!token,
			});

			const res = await fetch(url, {
				method,
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (res.status !== expectedStatus && res.status !== 200) {
				const errorData = await res.json().catch(() => ({}));
				throw new Error(errorData.message || "Failed to toggle follow");
			}

			setIsFollowing(!isFollowing);
		} catch (err: unknown) {
			console.error("Error toggling follow:", err);
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setIsLoading(false);
		}
	}, [isFollowing, matchId]);

	return {
		isFollowing,
		isLoading,
		error,
		toggleFollow,
		refetch: checkFollowStatus,
	};
};
