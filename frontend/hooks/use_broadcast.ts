'use client';

import { useEffect, useRef, useState } from 'react';
import { useSocket } from '@/context/socket_context';
import { Move, Match, NewMoveData } from '@/types/types'
import { useGuestId } from './use_guest_id';

export const useBroadcast = (matchId: string, initialMatch?: Match) => {
	const [currentMoveData, setCurrentMoveData] = useState<Move | null>(() => {
		if (initialMatch) {
			return {
				fen: initialMatch.fen,
				whiteTimeMs: initialMatch.white?.timeMs ?? 0,
				blackTimeMs: initialMatch.black?.timeMs ?? 0,
				newestMoveAt: initialMatch.newestMoveAt ?? Date.now(),
				turn: initialMatch.fen.split(' ')[1],
				evaluations: initialMatch.evaluations || [],
				history: initialMatch.history || [],
				timesRemaining: initialMatch.timesRemaining || [],
			} as Move;
		}
		return null;
	});
	const [isEnded, setIsEnded] = useState<boolean>(initialMatch?.status === "finished");
	const [outcome, setOutcome] = useState<string | undefined>(initialMatch?.outcome);
	const guestId = useGuestId();
	const socket = useSocket();
	
	const hasLiveMove = useRef(false);

	useEffect(() => {
		if (initialMatch) return;

		const controller = new AbortController();
		hasLiveMove.current = false;

		(async () => {
			try {
				const res = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/matches/${matchId}/state`, {
					signal: controller.signal,
				});
				
				if (!res.ok) return;
				
				const text = await res.text();
				if (!text) return; 
				
				const data = JSON.parse(text);

				if (data?.fen && !hasLiveMove.current) {
					setCurrentMoveData({
						fen: data.fen,
						whiteTimeMs: data.white?.timeMs ?? 0,
						blackTimeMs: data.black?.timeMs ?? 0,
						newestMoveAt: data.newestMoveAt ?? Date.now(),
						turn: data.fen.split(' ')[1],
						evaluations: data.evaluations || [],
						history: data.history || [],
						timesRemaining: data.timesRemaining || [],
					} as Move);
				}
			} catch (err: any) {
				if (err.name !== 'AbortError') console.error('Failed to fetch match state', err);
			}
		})();

		return () => controller.abort();
	}, [matchId, initialMatch]);

	useEffect(() => {
		const stored = localStorage.getItem('user');
		const user = stored ? JSON.parse(stored) : null;
		const username = user?.username;

		const handleConnect = () => {
			socket.emit('joinMatch', { matchId, username, guestId });
		};

		const handleNewMove = (data: NewMoveData) => {
			if (data.matchId !== matchId) return;
			hasLiveMove.current = true;
			setCurrentMoveData((prev) => {
				if (!prev) return prev;
					
				const isWhiteMove = prev.history.length % 2 === 0;
				const newTimeRemaining = isWhiteMove ? (data.whiteTimeMs ?? 0) : (data.blackTimeMs ?? 0);

				return {
					...prev,
					fen: data.fen,
					whiteTimeMs: data.whiteTimeMs ?? 0,
					blackTimeMs: data.blackTimeMs ?? 0,
					newestMoveAt: data.newestMoveAt ?? Date.now(),
					turn: data.fen.split(' ')[1],
					evaluations: [...(prev.evaluations || []), data.evaluation],
					history: [...(prev.history || []), data.move],
					timesRemaining: [...(prev.timesRemaining || []), newTimeRemaining],
				} as Move;
			});
		};

		const handleMatchFinished = (data: { matchId: string; outcome: string }) => {
			console.log("[use_broadcast.ts:handleMatchFinished]", data);
			if (data.matchId !== matchId) return;
			setIsEnded(true);
			setOutcome(data.outcome);
		};

		if (socket.connected) {
			handleConnect();
		}

		socket.on('connect', handleConnect);
		socket.on('new_move', handleNewMove);
		socket.on('match_finished', handleMatchFinished);

		return () => {
			socket.emit('leaveMatch', { matchId, username, guestId });
			
			socket.off('connect', handleConnect);
			socket.off('new_move', handleNewMove);
			socket.off('match_finished', handleMatchFinished);
		};
	}, [matchId, guestId, socket]);

	return { currentMoveData, isEnded, outcome };
};