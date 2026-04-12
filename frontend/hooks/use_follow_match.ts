"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use_auth";

const API_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "";

export const useFollowMatch = (matchId: string) => {
	const [isFollowing, setIsFollowing] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const { token, isAuthenticated } = useAuth();

	const checkFollowStatus = useCallback(async () => {
		if (!token || !isAuthenticated) {
			setIsFollowing(false);
			setIsLoading(false);
			return;
		} 

		try {
			const url = `${API_URL}/matches/${matchId}/follow/status`;
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
		} finally {
			setIsLoading(false);
		}
	}, [matchId, token, isAuthenticated]);

	useEffect(() => {
		setIsLoading(true);
		checkFollowStatus();
	}, [checkFollowStatus]);

	const toggleFollow = useCallback(async () => {
		if (!token || !isAuthenticated) {
			return;
		}

		setIsLoading(true);

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
		} finally {
			setIsLoading(false);
		}
	}, [isFollowing, matchId, token, isAuthenticated]);

	return {
		isFollowing,
		isLoading,
		toggleFollow,
		refetch: checkFollowStatus,
	};
};
