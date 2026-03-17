'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Move } from '@/types/types'
import { useGuestId } from './use_guest_id';

export const useBroadcast = (matchId: string) => {
	const [currentMoveData, setcurrentMoveData] = useState<Move | null>(null);
	const [isEnded, setIsEnded] = useState<boolean>(false);
	const guestId = useGuestId();
	
	const hasLiveMove = useRef(false);

	useEffect(() => {
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
					setcurrentMoveData({
						fen: data.fen,
						whiteTimeMs: data.white?.timeMs ?? 0,
						blackTimeMs: data.black?.timeMs ?? 0,
						turn: data.fen.split(' ')[1],
						evaluations: data.evaluations || [],
						history: data.history || [],
					} as Move);
				}
			} catch (err: any) {
				if (err.name !== 'AbortError') console.error('Failed to fetch match state', err);
			}
		})();

		return () => controller.abort();
	}, [matchId]);

	useEffect(() => {
		const stored = localStorage.getItem('user');
		const user = stored ? JSON.parse(stored) : null;
		const username = user?.username;

		const socket: Socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
			transports: ['websocket'],
		});

		socket.on('connect', () => {
			socket.emit('joinMatch', { matchId, username, guestId });
		});

		socket.on('newMove', (data: any) => {
			setcurrentMoveData((prev) => {
				if (!prev) return prev;
					
				return {
					...prev,
					fen: data.fen,
					whiteTimeMs: data.whiteTimeMs ?? 0,
					blackTimeMs: data.blackTimeMs ?? 0,
					turn: data.fen.split(' ')[1],
					evaluations: [...(prev.evaluations || []), data.evaluation],
					history: [...(prev.history || []), data.move],
				};
			});
		});

		socket.on('analysisEnded', (data: { matchId: string }) => {
			setIsEnded(true);
		});

		socket.on('connect_error', (err) => {
			console.error('Ошибка подключения сокета:', err.message);
		});

		return () => {
			socket.emit('leaveMatch', { matchId, username, guestId });
			
			socket.off('connect');
			socket.off('newMove');
			socket.off('analysisEnded');
			socket.off('connect_error');
			
			socket.disconnect();
		};
	}, [matchId, guestId]);

	return { currentMoveData, isEnded };
};