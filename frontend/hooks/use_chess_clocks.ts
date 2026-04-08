"use client";

import { useState, useEffect, useRef } from "react";
import { SyncPayload } from "@/types/types";

const getTurnFromFen = (fen: string): "w" | "b" =>
	fen.split(" ")[1] === "w" ? "w" : "b";

export const useChessClock = (
	serverState: SyncPayload | null,
	initialTimeMs: number,
	isPaused?: boolean,
) => {
	const [displayWhite, setDisplayWhite] = useState(
		serverState?.whiteTimeMs ?? initialTimeMs ?? 0,
	);
	const [displayBlack, setDisplayBlack] = useState(
		serverState?.blackTimeMs ?? initialTimeMs ?? 0,
	);

	const stateRef = useRef(serverState);
	const lastWhiteSecRef = useRef(Math.floor((displayWhite || 0) / 1000));
	const lastBlackSecRef = useRef(Math.floor((displayBlack || 0) / 1000));
	const unpausedAtRef = useRef<number | null>(null);

	useEffect(() => {
		if (!isPaused && unpausedAtRef.current === null) {
			unpausedAtRef.current = Date.now();
		} else if (isPaused) {
			unpausedAtRef.current = null;
		}
	}, [isPaused]);

	useEffect(() => {
		stateRef.current = serverState;

		queueMicrotask(() => {
			if (!serverState) {
				if (initialTimeMs !== undefined) {
					setDisplayWhite(initialTimeMs);
					setDisplayBlack(initialTimeMs);
					lastWhiteSecRef.current = Math.floor(initialTimeMs / 1000);
					lastBlackSecRef.current = Math.floor(initialTimeMs / 1000);
				}
				return;
			}

			const now = Date.now();
			let referenceTime = now;
			if (serverState.newestMoveAt > 0) {
				referenceTime = serverState.newestMoveAt;
			} else if (unpausedAtRef.current !== null) {
				referenceTime = unpausedAtRef.current;
			}

			const elapsedSinceMove = isPaused ? 0 : Math.max(0, now - referenceTime);

			const turn =
				typeof getTurnFromFen === "function"
					? getTurnFromFen(serverState.fen)
					: "w";

			const currentWhite =
				turn === "w"
					? Math.max(0, serverState.whiteTimeMs - elapsedSinceMove)
					: serverState.whiteTimeMs;
			const currentBlack =
				turn === "b"
					? Math.max(0, serverState.blackTimeMs - elapsedSinceMove)
					: serverState.blackTimeMs;

			setDisplayWhite((prev) =>
				Math.abs(prev - currentWhite) > 10 ? currentWhite : prev,
			);
			setDisplayBlack((prev) =>
				Math.abs(prev - currentBlack) > 10 ? currentBlack : prev,
			);

			lastWhiteSecRef.current = Math.floor(currentWhite / 1000);
			lastBlackSecRef.current = Math.floor(currentBlack / 1000);
		});
	}, [serverState, initialTimeMs, isPaused]);

	useEffect(() => {
		if (isPaused) return;

		let animationFrameId: number;

		const tick = () => {
			const currentServerState = stateRef.current;
			if (!currentServerState) {
				animationFrameId = requestAnimationFrame(tick);
				return;
			}

			const now = Date.now();
			let referenceTime = now;
			if (currentServerState.newestMoveAt > 0) {
			    referenceTime = currentServerState.newestMoveAt;
			} else if (unpausedAtRef.current !== null) {
			    referenceTime = unpausedAtRef.current;
			}
			
			const elapsedSinceMove = Math.max(0, now - referenceTime);

			const { fen, whiteTimeMs, blackTimeMs } = currentServerState;
			const turn =
				typeof getTurnFromFen === "function"
					? getTurnFromFen(fen)
					: "w";

			if (turn === "b") {
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

		animationFrameId = requestAnimationFrame(tick);

		return () => {
			if (animationFrameId) cancelAnimationFrame(animationFrameId);
		};
	}, [isPaused]);

	const formatTime = (ms: number): string => {
		const totalSeconds = Math.max(0, Math.floor(ms / 1000));
		const h = Math.floor(totalSeconds / 3600);
		const m = Math.floor((totalSeconds % 3600) / 60);
		const s = totalSeconds % 60;

		const mm = m.toString().padStart(2, "0");
		const ss = s.toString().padStart(2, "0");

		if (h < 1) return `${mm}:${ss}`;
		return `${h}:${mm}:${ss}`;
	};

	return {
		whiteTimeFormatted: formatTime(displayWhite),
		blackTimeFormatted: formatTime(displayBlack),
	};
};
