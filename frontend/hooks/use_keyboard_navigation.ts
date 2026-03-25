'use client';

import { useEffect } from 'react';
import { useAnalysisState } from '@/context/analysis_context';


export function useKeyboardNavigation(totalMoves: number) {
	
	const { 
		selectedMoveIndex, 
		setSelectedMoveIndex, 
		isAnalysisMode,
		currentPath,
		setCurrentPath,
		analysisTree
	} = useAnalysisState();

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

			const branchPoint = selectedMoveIndex !== null ? selectedMoveIndex : totalMoves - 1;

			if (isAnalysisMode) {
				switch (event.key) {
					case "ArrowLeft":
						if (currentPath.length > 0) {
							setCurrentPath(currentPath.slice(0, -1));
						} else {
							const idx = selectedMoveIndex ?? totalMoves - 1;
							if (idx > -1) setSelectedMoveIndex(idx - 1);
						}
						break;

					case "ArrowRight":
						if (currentPath.length > 0) {
							let currentLevel = analysisTree[branchPoint] || [];
							for (const idx of currentPath) {
								currentLevel = currentLevel[idx]?.s || [];
							}
							if (currentLevel.length > 0) {
								setCurrentPath([...currentPath, 0]);
							}
						} else {
							const idx = selectedMoveIndex ?? -1;
							if (idx < totalMoves - 1) {
								setSelectedMoveIndex(idx + 1);
							} else {
								setSelectedMoveIndex(null);
							}
						}
						break;

					case "ArrowUp":
						if (currentPath.length > 0) {
							let parentLevel = analysisTree[branchPoint] || [];
							for (let i = 0; i < currentPath.length - 1; i++) {
								parentLevel = parentLevel[currentPath[i]]?.s || [];
							}
							
							const lastIdx = currentPath[currentPath.length - 1];
							if (lastIdx > 0) {
								const newPath = [...currentPath];
								newPath[newPath.length - 1] = lastIdx - 1;
								setCurrentPath(newPath);
							}
						} else {
							setSelectedMoveIndex(-1);
						}
						break;
					
					case "ArrowDown":
						if (currentPath.length > 0) {
							let parentLevel = analysisTree[branchPoint] || [];
							for (let i = 0; i < currentPath.length - 1; i++) {
								parentLevel = parentLevel[currentPath[i]]?.s || [];
							}
							
							const lastIdx = currentPath[currentPath.length - 1];
							if (lastIdx < parentLevel.length - 1) {
								const newPath = [...currentPath];
								newPath[newPath.length - 1] = lastIdx + 1;
								setCurrentPath(newPath);
							}
						} else {
							if (analysisTree[branchPoint] && analysisTree[branchPoint].length > 0) {
								setCurrentPath([0]);
							} else {
								setSelectedMoveIndex(totalMoves - 1);
							}
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