'use client'

import { useState, useEffect, useRef } from 'react';
import { getTurnFromFen } from '@/utils/get_turn_from_fen';

interface SyncPayload {
	fen: string;
	whiteTimeMs: number;
	blackTimeMs: number;
}

export const useChessClock = (serverState: SyncPayload | null, initialTimeMs: number) => {
	const [displayWhite, setDisplayWhite] = useState(initialTimeMs || 0);
	const [displayBlack, setDisplayBlack] = useState(initialTimeMs || 0);

	const stateRef = useRef(serverState);
	const syncTimestampRef = useRef(Date.now());

	useEffect(() => {
		if (!serverState) {
			if (initialTimeMs !== undefined) {
				setDisplayWhite(initialTimeMs);
				setDisplayBlack(initialTimeMs);
			}
			return;
		}
		
		stateRef.current = serverState;
		syncTimestampRef.current = Date.now();
		setDisplayWhite(serverState.whiteTimeMs);
		setDisplayBlack(serverState.blackTimeMs);
	}, [serverState, initialTimeMs]);

	useEffect(() => {
		let animationFrameId: number;

		const tick = () => {
			const currentServerState = stateRef.current;
			if (!currentServerState) {
				// still waiting for real data; continue polling so we can start as soon as
				// a server update arrives.
				animationFrameId = requestAnimationFrame(tick);
				return;
			}

			const now = Date.now();
			const elapsedSinceSync = now - syncTimestampRef.current;
			
			const { fen, whiteTimeMs, blackTimeMs } = currentServerState;

			if (getTurnFromFen(fen) === 'b') {
				const newBlack = Math.max(0, blackTimeMs - elapsedSinceSync);
				setDisplayBlack(newBlack);
				setDisplayWhite(whiteTimeMs);
			} else {
				const newWhite = Math.max(0, whiteTimeMs - elapsedSinceSync);
				setDisplayWhite(newWhite);
				setDisplayBlack(blackTimeMs);
			}

			animationFrameId = requestAnimationFrame(tick);
		};

		// kick off the loop immediately
		tick();

		// cleanup when component unmounts
		return () => cancelAnimationFrame(animationFrameId);
	}, []);

	const formatTime = (ms: number): string => {
		const totalSeconds = Math.floor(ms / 1000);
		const h = Math.floor(totalSeconds / 3600);
		const m = Math.floor((totalSeconds % 3600) / 60);
		const s = totalSeconds % 60;
		const mm = m.toString().padStart(2, '0');
		const ss = s.toString().padStart(2, '0');
		
		if (h < 1) return `${mm}:${ss}`;
		else return `${h}:${mm}:${ss}`;
	};

	return {
		whiteTimeFormatted: formatTime(displayWhite),
		blackTimeFormatted: formatTime(displayBlack),
	};
};