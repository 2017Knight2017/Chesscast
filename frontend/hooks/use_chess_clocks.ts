'use client'

import { useState, useEffect, useRef } from 'react';
import { SyncPayload } from '@/types/types';

const getTurnFromFen = (fen: string): 'w' | 'b' => fen.split(' ')[1] === "w" ? "w" : "b";

export const useChessClock = (serverState: SyncPayload | null, initialTimeMs: number) => {
	console.log("[use_chess_clocks.ts:useChessClock]", { serverStateFen: serverState?.fen, initialTimeMs });
	const [displayWhite, setDisplayWhite] = useState(initialTimeMs || 0);
	const [displayBlack, setDisplayBlack] = useState(initialTimeMs || 0);
	const [isHydrated, setIsHydrated] = useState(false);

	const stateRef = useRef(serverState);
	const lastWhiteSecRef = useRef(Math.floor((initialTimeMs || 0) / 1000));
	const lastBlackSecRef = useRef(Math.floor((initialTimeMs || 0) / 1000));

	useEffect(() => {
		setIsHydrated(true);
	}, []);

	useEffect(() => {
		if (!serverState) {
			if (initialTimeMs !== undefined) {
				setDisplayWhite(initialTimeMs);
				setDisplayBlack(initialTimeMs);
				lastWhiteSecRef.current = Math.floor(initialTimeMs / 1000);
				lastBlackSecRef.current = Math.floor(initialTimeMs / 1000);
			}
			return;
		}
		
		stateRef.current = serverState;

		const now = Date.now();
		const elapsedSinceMove = Math.max(0, now - (serverState.newestMoveAt || now));
		const turn = getTurnFromFen(serverState.fen);
		
		const currentWhite = turn === 'w' 
			? Math.max(0, serverState.whiteTimeMs - elapsedSinceMove)
			: serverState.whiteTimeMs;
		const currentBlack = turn === 'b'
			? Math.max(0, serverState.blackTimeMs - elapsedSinceMove)
			: serverState.blackTimeMs;

		setDisplayWhite(currentWhite);
		setDisplayBlack(currentBlack);
		lastWhiteSecRef.current = Math.floor(currentWhite / 1000);
		lastBlackSecRef.current = Math.floor(currentBlack / 1000);
	}, [serverState, initialTimeMs]);

	useEffect(() => {
		if (!isHydrated) return;

		let animationFrameId: number;

		const tick = () => {
			const currentServerState = stateRef.current;
			if (!currentServerState) {
				animationFrameId = requestAnimationFrame(tick);
				return;
			}

			const now = Date.now();
			const elapsedSinceMove = Math.max(0, now - (currentServerState.newestMoveAt || now));
			
			const { fen, whiteTimeMs, blackTimeMs } = currentServerState;

			if (getTurnFromFen(fen) === 'b') {
				const newBlack = Math.max(0, blackTimeMs - elapsedSinceMove);
				const newBlackSec = Math.floor(newBlack / 1000);
				if (newBlackSec !== lastBlackSecRef.current) {
					setDisplayBlack(newBlack);
					lastBlackSecRef.current = newBlackSec;
				}
				const whiteSec = Math.floor(whiteTimeMs / 1000);
				if (whiteSec !== lastWhiteSecRef.current) {
					setDisplayWhite(whiteTimeMs);
					lastWhiteSecRef.current = whiteSec;
				}
			} else {
				const newWhite = Math.max(0, whiteTimeMs - elapsedSinceMove);
				const newWhiteSec = Math.floor(newWhite / 1000);
				if (newWhiteSec !== lastWhiteSecRef.current) {
					setDisplayWhite(newWhite);
					lastWhiteSecRef.current = newWhiteSec;
				}
				const blackSec = Math.floor(blackTimeMs / 1000);
				if (blackSec !== lastBlackSecRef.current) {
					setDisplayBlack(blackTimeMs);
					lastBlackSecRef.current = blackSec;
				}
			}

			animationFrameId = requestAnimationFrame(tick);
		};

		tick();

		return () => cancelAnimationFrame(animationFrameId);
	}, [isHydrated]);

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

	const whiteMsToFormat = isHydrated ? displayWhite : (serverState?.whiteTimeMs ?? initialTimeMs ?? 0);
	const blackMsToFormat = isHydrated ? displayBlack : (serverState?.blackTimeMs ?? initialTimeMs ?? 0);

	return {
		whiteTimeFormatted: formatTime(whiteMsToFormat),
		blackTimeFormatted: formatTime(blackMsToFormat),
	};
};
