'use client'

import { Match } from '@/types/types';
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useProcessing(match: Match) {
	const [isProcessing, setIsProcessing] = useState<boolean>(match.status === "processing");
	useEffect(() => {
		if (match.status === "waiting") return;
		
		const socket: Socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
			transports: ['websocket'],
		});

		socket.on('connect', () => {
			socket.emit("joinMatchProcessing", {matchId: match.id});
		});

		socket.on('no_more_processing', () => {
			setIsProcessing(false);
		});
		
		return () => {
			socket.emit("leaveMatchProcessing", {matchId: match.id});

			socket.off("connect");
			socket.off("no_more_processing");

			socket.disconnect();
		};
	}, [match.id]);

	return {isProcessing}
}