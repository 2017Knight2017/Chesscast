'use client';

import { useEffect } from 'react';
import { useAnalysis } from '@/context/analysis_context';


export function useKeyboardNavigation(totalMoves: number) {
	const { 
		selectedMoveIndex, 
		setSelectedMoveIndex, 
		isAnalysisMode,
		currentPath,
		setCurrentPath,
		analysisTree
	} = useAnalysis();

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

			if (isAnalysisMode) {
				switch (event.key) {
					case "ArrowLeft":
						if (currentPath.length > 0) {
							setCurrentPath(prev => prev.slice(0, -1));
						} else {
							const idx = selectedMoveIndex ?? totalMoves - 1;
							if (idx > -1) setSelectedMoveIndex(idx - 1);
						}
						break;

					case "ArrowRight":
						let currentLevel = analysisTree;
						for (const idx of currentPath) {
							if (currentLevel[idx]?.s) {
								currentLevel = currentLevel[idx].s!;
							} else {
								currentLevel = []; break;
							}
						}

						if (currentLevel.length > 0) {
							setCurrentPath(prev => [...prev, 0]);
						} else if (currentPath.length === 0) {
							const idx = selectedMoveIndex ?? totalMoves - 1;
							if (idx < totalMoves - 1) {
								setSelectedMoveIndex(idx + 1);
							} else {
								setSelectedMoveIndex(null);
							}
						}
						break;

					case "ArrowUp":
						let levelUp = analysisTree;
						for (let i = 0; i < currentPath.length - 1; i++) {
							levelUp = levelUp[currentPath[i]].s || [];
						}
					
						if (currentPath.length > 0 && levelUp.length > 1) {
							setCurrentPath(prev => {
								const newPath = [...prev];
								const lastIdx = newPath[newPath.length - 1];
								if (lastIdx > 0) {
									newPath[newPath.length - 1] = lastIdx - 1;
								}
								return newPath;
							});
						} else {
							setCurrentPath([]);
							setSelectedMoveIndex(-1);
						}
						break;
					
					case "ArrowDown":
						let levelDown = analysisTree;
						for (let i = 0; i < currentPath.length - 1; i++) {
							levelDown = levelDown[currentPath[i]].s || [];
						}
					
						if (currentPath.length > 0 && levelDown.length > 1) {
							setCurrentPath(prev => {
								const newPath = [...prev];
								const lastIdx = newPath[newPath.length - 1];
								if (lastIdx < levelDown.length - 1) {
									newPath[newPath.length - 1] = lastIdx + 1;
								}
								return newPath;
							});
						} else {
							setCurrentPath([]); 
							setSelectedMoveIndex(totalMoves - 1);
						}
						break;
				}
			} 
			else {
				const currentIndex = selectedMoveIndex ?? totalMoves - 1;
				switch (event.key) {
					case "ArrowLeft":
						if (currentIndex > -1) setSelectedMoveIndex(currentIndex - 1);
						break;
					case "ArrowRight":
						if (currentIndex < totalMoves - 1) {
							setSelectedMoveIndex(currentIndex + 1);
						} else if (currentIndex === totalMoves - 1) {
							setSelectedMoveIndex(null);
						}
						break;
					case "ArrowUp": setSelectedMoveIndex(-1); break;
					case "ArrowDown": setSelectedMoveIndex(totalMoves - 1); break;
				}
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [totalMoves, selectedMoveIndex, setSelectedMoveIndex, isAnalysisMode, currentPath, setCurrentPath, analysisTree]);
}