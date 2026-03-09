'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useViewerCounts = (matchIds: string[]) => {
	const [cumulativeCounts, setCumulativeCounts] = useState<Record<string, number>>({});
	const [usernames, setUsernames] = useState<Record<string, string[]>>({});
	const [guestCount, setGuestCount] = useState<Record<string, number>>({});

	useEffect(() => {
		const socket: Socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');

		socket.on('connect', () => {
			socket.emit('subscribeToCounts', { matchIds });
		});

		socket.on('viewer_count_update', ({ matchId, count, guestCount, usernames }) => {
			console.log(matchId, count, guestCount, usernames);
			setCumulativeCounts((prev) => ({ ...prev, [matchId]: count + guestCount }));
			setGuestCount((prev) => ({ ...prev, [matchId]: guestCount }))
			setUsernames((prev) => ({ ...prev, [matchId]: usernames }));
		});

		return () => {
			socket.emit('unsubscribeFromCounts', { matchIds });
			socket.off('connect');
			socket.off('viewer_count_update');

			socket.disconnect();
		};
	}, [matchIds.join(',')]);

	return {cumulativeCounts: cumulativeCounts, usernames: usernames, guestCount: guestCount};
};