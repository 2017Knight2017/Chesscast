"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useAnalysisState } from "@/context/analysis_context";
import { Chess } from "chess.js";

interface MoveSoundPlayerProps {
	history: string[];
	analysisTree?: Record<number, Array<{ m: string; s?: Array<any> }>>;
}

export function MoveSoundPlayer({ history, analysisTree }: MoveSoundPlayerProps) {
	const { selectedMoveIndex, currentPath } = useAnalysisState();

	const moveSoundRef = useRef<HTMLAudioElement | null>(null);
	const captureSoundRef = useRef<HTMLAudioElement | null>(null);
	const chessRef = useRef<Chess | null>(null);
	const playedCountRef = useRef<number>(0);
	const isFirstRun = useRef(true);
	const prevSelectedIndexRef = useRef<number | null | undefined>(null);

	useEffect(() => {
		moveSoundRef.current = new Audio("/Move.ogg");
		captureSoundRef.current = new Audio("/Capture.ogg");
	}, []);

	useLayoutEffect(() => {
		const moveSound = moveSoundRef.current;
		const captureSound = captureSoundRef.current;
		if (!moveSound || !captureSound) return;

		const prevIndex = prevSelectedIndexRef.current;
		prevSelectedIndexRef.current = selectedMoveIndex;

		if (isFirstRun.current) {
			const chess = new Chess();
			for (let i = 0; i < history.length; i++) {
				try { chess.move(history[i]); } catch {}
			}
			chessRef.current = chess;
			playedCountRef.current = history.length;
			isFirstRun.current = false;
			return;
		}

		if (
			selectedMoveIndex === null &&
			prevIndex !== null &&
			prevIndex !== undefined &&
			prevIndex !== -1
		) {
			const chess = new Chess();
			for (let i = 0; i < history.length; i++) {
				try { chess.move(history[i]); } catch {}
			}
			chessRef.current = chess;
			playedCountRef.current = history.length;
			return;
		}

		if (selectedMoveIndex === null) {
			const prevCount = playedCountRef.current;
			const currCount = history.length;

			if (currCount <= prevCount) return;

			let chess = chessRef.current;
			if (!chess) {
				chess = new Chess();
				for (let i = 0; i < prevCount; i++) {
					try { chess.move(history[i]); } catch {}
				}
			}

			for (let i = prevCount; i < currCount; i++) {
				try {
					const move = chess.move(history[i]);
					if (move && move.captured) {
						captureSound.currentTime = 0;
						captureSound.play().catch(() => {});
					} else {
						moveSound.currentTime = 0;
						moveSound.play().catch(() => {});
					}
				} catch {
					break;
				}
			}

			chessRef.current = chess;
			playedCountRef.current = currCount;
			return;
		}

		if (selectedMoveIndex === undefined || selectedMoveIndex === -1) {
			chessRef.current = new Chess();
			playedCountRef.current = 0;
			return;
		}

		const idx = selectedMoveIndex;

		const moves: string[] = [];
		if (idx >= 0) {
			for (let i = 0; i <= idx && i < history.length; i++) {
				moves.push(history[i]);
			}
		}
		if (analysisTree && analysisTree[idx] && currentPath.length > 0) {
			let level = analysisTree[idx];
			for (const pIdx of currentPath) {
				if (level && level[pIdx]) {
					moves.push(level[pIdx].m);
					level = level[pIdx].s || [];
				} else break;
			}
		}

		const prevCount = playedCountRef.current;
		const currCount = moves.length;

		if (currCount <= prevCount) {
			if (currCount < prevCount) {
				const chess = new Chess();
				for (let i = 0; i < currCount; i++) {
					try { chess.move(moves[i]); } catch {}
				}
				chessRef.current = chess;
				playedCountRef.current = currCount;
			}
			return;
		}

		let chess = chessRef.current;
		if (!chess) {
			chess = new Chess();
			for (let i = 0; i < prevCount && i < moves.length; i++) {
				try { chess.move(moves[i]); } catch {}
			}
		}

		for (let i = prevCount; i < currCount; i++) {
			try {
				const move = chess.move(moves[i]);
				if (move && move.captured) {
					captureSound.currentTime = 0;
					captureSound.play().catch(() => {});
				} else {
					moveSound.currentTime = 0;
					moveSound.play().catch(() => {});
				}
			} catch {
				break;
			}
		}

		chessRef.current = chess;
		playedCountRef.current = currCount;
	}, [selectedMoveIndex, currentPath, history, analysisTree]);

	return null;
}
