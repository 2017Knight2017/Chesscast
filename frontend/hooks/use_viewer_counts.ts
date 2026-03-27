'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/context/socket_context';

export interface ViewerStatus {
	username: string;
	isAnalyzing: boolean;
	currentFen?: string;
}

export const useViewerCounts = (matchIds: string[]) => {
	const [cumulativeCounts, setCumulativeCounts] = useState<Record<string, number>>({});
	const [usernames, setUsernames] = useState<Record<string, ViewerStatus[]>>({});
	const [guestCount, setGuestCount] = useState<Record<string, number>>({});
	const socket = useSocket();

	useEffect(() => {
		const currentSocket = socket;
		
		const ids = [...matchIds]; 

		const handleConnect = () => {
			currentSocket.emit('subscribeToCounts', { matchIds: ids });
		};

		const handleUpdate = ({ matchId, count, guestCount, usernames }: any) => {
			setCumulativeCounts((prev) => ({ ...prev, [matchId]: count + guestCount }));
			setGuestCount((prev) => ({ ...prev, [matchId]: guestCount }));
			setUsernames((prev) => ({ ...prev, [matchId]: usernames }));
		};

		if (currentSocket.connected) {
			handleConnect();
		}
		currentSocket.on('connect', handleConnect);
		currentSocket.on('viewer_count_update', handleUpdate);

		return () => {
			currentSocket.emit('unsubscribeFromCounts', { matchIds: ids });
			currentSocket.off('connect', handleConnect);
			currentSocket.off('viewer_count_update', handleUpdate);
		};
	}, [socket, JSON.stringify(matchIds)]);

	return {cumulativeCounts: cumulativeCounts, usernames: usernames, guestCount: guestCount};
};