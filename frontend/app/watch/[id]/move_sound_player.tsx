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

	useEffect(() => {
		moveSoundRef.current = new Audio("/Move.ogg");
		captureSoundRef.current = new Audio("/Capture.ogg");
	}, []);

	useLayoutEffect(() => {
		const moveSound = moveSoundRef.current;
		const captureSound = captureSoundRef.current;
		if (!moveSound || !captureSound) return;

		// Starting position or no selection — reset
		if (selectedMoveIndex === null || selectedMoveIndex === undefined || selectedMoveIndex === -1) {
			chessRef.current = new Chess();
			playedCountRef.current = 0;
			return;
		}

		const idx = selectedMoveIndex;

		// Build current move sequence inline (no useMemo overhead)
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

		// Moving backward or staying the same — no sound
		if (currCount <= prevCount) {
			if (currCount < prevCount) {
				// Rebuild chess state from scratch for consistency
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
