'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useViewerCounts = (matchIds: string[]) => {
	const [counts, setCounts] = useState<Record<string, number>>({});

	useEffect(() => {
		const socket: Socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');

		socket.on('connect', () => {
			socket.emit('subscribeToCounts', { matchIds });
		});

		socket.on('viewer_count_update', ({ matchId, count, guestCount }) => {
			setCounts((prev) => ({ ...prev, [matchId]: count + guestCount }));
		});

		return () => {
			socket.emit('unsubscribeFromCounts');
			socket.off('connect');
			socket.off('viewer_count_update');

			socket.disconnect();
		};
	}, [matchIds.join(',')]);

	return counts;
};