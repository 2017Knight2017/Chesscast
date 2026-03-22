'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/context/socket_context';

export const useViewerCounts = (matchIds: string[]) => {
	const [cumulativeCounts, setCumulativeCounts] = useState<Record<string, number>>({});
	const [usernames, setUsernames] = useState<Record<string, string[]>>({});
	const [guestCount, setGuestCount] = useState<Record<string, number>>({});
	const socket = useSocket();

	useEffect(() => {
		const handleConnect = () => {
			socket.emit('subscribeToCounts', { matchIds });
		};

		if (socket.connected) {
			handleConnect();
		}

		socket.on('connect', handleConnect);

		const handleUpdate = ({ matchId, count, guestCount, usernames }: any) => {
			setCumulativeCounts((prev) => ({ ...prev, [matchId]: count + guestCount }));
			setGuestCount((prev) => ({ ...prev, [matchId]: guestCount }))
			setUsernames((prev) => ({ ...prev, [matchId]: usernames }));
		};

		socket.on('viewer_count_update', handleUpdate);

		return () => {
			socket.emit('unsubscribeFromCounts', { matchIds });
			socket.off('connect', handleConnect);
			socket.off('viewer_count_update', handleUpdate);
		};
	}, [matchIds.join(','), socket]);

	return {cumulativeCounts: cumulativeCounts, usernames: usernames, guestCount: guestCount};
};