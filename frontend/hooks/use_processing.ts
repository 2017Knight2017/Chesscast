'use client'

import { Match } from '@/types/types';
import { useEffect, useState } from 'react';
import { useSocket } from '@/context/socket_context';

export function useProcessing(match: Match) {
	const [isProcessing, setIsProcessing] = useState<boolean>(match.status === "processing");
	const socket = useSocket();

	useEffect(() => {
		if (match.status === "waiting") return;
		
		const handleConnect = () => {
			socket.emit("joinMatchProcessing", {matchId: match.id});
		};

		if (socket.connected) {
			handleConnect();
		}

		socket.on('connect', handleConnect);

		socket.on('no_more_processing', () => {
			setIsProcessing(false);
		});
		
		return () => {
			socket.emit("leaveMatchProcessing", {matchId: match.id});

			socket.off("connect", handleConnect);
			socket.off("no_more_processing");
		};
	}, [match.id, socket]);

	return {isProcessing}
}