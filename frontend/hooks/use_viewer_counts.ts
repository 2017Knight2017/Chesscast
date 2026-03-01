'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useViewerCounts = (matchIds: string[]) => {
	const [counts, setCounts] = useState<Record<string, number>>({});

	useEffect(() => {
		const socket: Socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');

		socket.on('connect', () => {
			socket.emit('subscribe_to_counts', { matchIds });
		});

		socket.on('viewer_count_update', ({ matchId, count }) => {
			setCounts((prev) => ({ ...prev, [matchId]: count }));
		});

		return () => {
			socket.disconnect();
		};
	}, [matchIds.join(',')]);

	return counts;
};