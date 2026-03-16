'use client';

import { useEffect } from 'react';
import { useAnalysis } from '@/context/analysis_context';

export function useKeyboardNavigation(totalMoves: number) {
	const { selectedMoveIndex, setSelectedMoveIndex, isAnalysisMode } = useAnalysis();

	useEffect(() => {
		if (isAnalysisMode) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
				return;
			}

			const currentIndex = selectedMoveIndex ?? totalMoves - 1;

			switch (event.key) {
				case "ArrowLeft":
					if (currentIndex > -1) {
						setSelectedMoveIndex(currentIndex - 1);
					}
					break;
				case "ArrowRight":
					if (currentIndex < totalMoves - 1) {
						setSelectedMoveIndex(currentIndex + 1);
					} else if (currentIndex === totalMoves - 1) {
						setSelectedMoveIndex(null);
					}
					break;
				case "ArrowUp":
					setSelectedMoveIndex(-1);
					break;
				case "ArrowDown":
					setSelectedMoveIndex(totalMoves - 1);
					break;
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [totalMoves, selectedMoveIndex, setSelectedMoveIndex, isAnalysisMode]);
}