"use client";

import { useEffect, useRef } from "react";
import { useAnalysisState } from "@/context/analysis_context";
import { Chess } from "chess.js";

interface MoveSoundPlayerProps {
	history: string[];
}

export function MoveSoundPlayer({ history }: MoveSoundPlayerProps) {
	const { selectedMoveIndex } = useAnalysisState();

	const moveSoundRef = useRef<HTMLAudioElement | null>(null);
	const captureSoundRef = useRef<HTMLAudioElement | null>(null);
	const lastPlayedIndexRef = useRef<number>(-1);

	useEffect(() => {
		moveSoundRef.current = new Audio("/Move.ogg");
		captureSoundRef.current = new Audio("/Capture.ogg");
	}, []);

	useEffect(() => {
		if (selectedMoveIndex === null || selectedMoveIndex === undefined) return;
		if (selectedMoveIndex === -1) return;

		const prevLast = lastPlayedIndexRef.current;
		const current = selectedMoveIndex;

		if (current === prevLast) return;

		// Only play sounds when moving forward
		if (current > prevLast) {
			const chess = new Chess();
			for (let i = 0; i < prevLast + 1 && i < history.length; i++) {
				try { chess.move(history[i]); } catch {}
			}
			for (let i = prevLast + 1; i <= current; i++) {
				if (i >= history.length) break;
				try {
					const move = chess.move(history[i]);
					if (move && move.captured) {
						captureSoundRef.current!.currentTime = 0;
						captureSoundRef.current!.play().catch(() => {});
					} else {
						moveSoundRef.current!.currentTime = 0;
						moveSoundRef.current!.play().catch(() => {});
					}
				} catch {
					break;
				}
			}
			lastPlayedIndexRef.current = current;
		} else {
			// Moving backward: just update the ref, no sound
			lastPlayedIndexRef.current = current;
		}
	}, [selectedMoveIndex, history]);

	return null;
}
