'use client'

import { useState, useEffect, useRef } from 'react';
import { SyncPayload } from '@/types/types';

const getTurnFromFen = (fen: string): 'w' | 'b' => fen.split(' ')[1] === "w" ? "w" : "b";

export const useChessClock = (serverState: SyncPayload | null, initialTimeMs: number) => {
	console.log("[use_chess_clocks.ts:useChessClock]", { serverStateFen: serverState?.fen, initialTimeMs });
	const [displayWhite, setDisplayWhite] = useState(initialTimeMs || 0);
	const [displayBlack, setDisplayBlack] = useState(initialTimeMs || 0);

	const stateRef = useRef(serverState);
	const syncTimestampRef = useRef(Date.now());
	const lastWhiteSecRef = useRef(Math.floor((initialTimeMs || 0) / 1000));
	const lastBlackSecRef = useRef(Math.floor((initialTimeMs || 0) / 1000));

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
		syncTimestampRef.current = Date.now();
		setDisplayWhite(serverState.whiteTimeMs);
		setDisplayBlack(serverState.blackTimeMs);
		lastWhiteSecRef.current = Math.floor(serverState.whiteTimeMs / 1000);
		lastBlackSecRef.current = Math.floor(serverState.blackTimeMs / 1000);
	}, [serverState, initialTimeMs]);

	useEffect(() => {
		let animationFrameId: number;

		const tick = () => {
			const currentServerState = stateRef.current;
			if (!currentServerState) {
				animationFrameId = requestAnimationFrame(tick);
				return;
			}

			const now = Date.now();
			const elapsedSinceSync = now - syncTimestampRef.current;
			
			const { fen, whiteTimeMs, blackTimeMs } = currentServerState;

			if (getTurnFromFen(fen) === 'b') {
				const newBlack = Math.max(0, blackTimeMs - elapsedSinceSync);
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
				const newWhite = Math.max(0, whiteTimeMs - elapsedSinceSync);
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