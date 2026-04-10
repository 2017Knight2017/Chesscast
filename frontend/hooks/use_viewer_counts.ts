"use client";

import { useEffect, useMemo, useState } from "react";
import { useSocket } from "@/context/socket_context";

export interface ViewerStatus {
	username: string;
	isAnalyzing: boolean;
	currentFen?: string;
}

export const useViewerCounts = (matchIds: string[]) => {
	const [cumulativeCounts, setCumulativeCounts] = useState<
		Record<string, number>
	>({});
	const [usernames, setUsernames] = useState<Record<string, ViewerStatus[]>>(
		{},
	);
	const [guestCount, setGuestCount] = useState<Record<string, number>>({});
	const matchIdsKey = useMemo(() => JSON.stringify(matchIds), [matchIds]);
	const socket = useSocket();

	useEffect(() => {
		const currentSocket = socket;

		const handleConnect = () => {
			currentSocket.emit("subscribeToCounts", { matchIds });
		};

		const handleUpdate = ({
			matchId,
			count,
			guestCount,
			usernames,
		}: {
			matchId: string;
			count: number;
			guestCount: number;
			usernames: ViewerStatus[];
		}) => {
			console.log("[use_viewer_counts.ts:handleUpdate]", {
				matchId,
				count,
				guestCount,
				usernames,
			});
			setCumulativeCounts((prev) => ({
				...prev,
				[matchId]: count + guestCount,
			}));
			setGuestCount((prev) => ({ ...prev, [matchId]: guestCount }));
			setUsernames((prev) => ({ ...prev, [matchId]: usernames }));
		};

		if (currentSocket.connected) {
			handleConnect();
		}
		currentSocket.on("connect", handleConnect);
		currentSocket.on("viewer_count_update", handleUpdate);

		return () => {
			currentSocket.emit("unsubscribeFromCounts", { matchIds });
			currentSocket.off("connect", handleConnect);
			currentSocket.off("viewer_count_update", handleUpdate);
		};
	}, [socket, matchIdsKey]);

	return {
		cumulativeCounts: cumulativeCounts,
		usernames: usernames,
		guestCount: guestCount,
	};
};
