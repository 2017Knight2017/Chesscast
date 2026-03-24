'use client';

import { forwardRef, useImperativeHandle, useState, useMemo, useEffect, useRef } from 'react';
import Chessground from '@bezalel6/react-chessground';
import { Chess } from 'chess.js';
import { MoveTreeNode } from '@/types/types';
import { useAnalysisState } from '@/context/analysis_context';

interface UserAnalysisBoardProps {
	matchId: string;
	userId: number|null;
	matchHistory: string[];
	currentFen: string;
	onMove?: (move: string) => void;
}

export interface UserAnalysisBoardRef {
	getCurrentFen: () => string;
}

export const UserAnalysisBoard = forwardRef<UserAnalysisBoardRef, UserAnalysisBoardProps>(
	({ matchId, userId, matchHistory, currentFen, onMove }, ref) => {
		const { 
			analysisTree, 
			addMoveToTree, 
			currentPath, 
			setCurrentPath,
			inspectedUserId,
			syncAnalysisToServer,
			selectedMoveIndex,
			setSelectedMoveIndex
		} = useAnalysisState();

		const [fen, setFen] = useState(currentFen);
		const chessRef = useRef(new Chess(currentFen));

		const isReadOnly = inspectedUserId !== null;

		useEffect(() => {
			chessRef.current = new Chess(currentFen);
			setFen(currentFen);
		}, [currentFen]);

		const computedChess = useMemo(() => {
			const chess = new Chess();

			// 1. Накатываем историю до точки ветвления (selectedMoveIndex)
			const branchPoint = selectedMoveIndex !== null ? selectedMoveIndex : matchHistory.length - 1;
			
			for (let i = 0; i <= branchPoint; i++) {
				if (matchHistory[i]) {
					try {
						chess.move(matchHistory[i]);
					} catch (e) {
						console.error("Failed to apply history move", matchHistory[i]);
					}
				}
			}

			// 2. Если мы находимся в ветке анализа, накатываем ходы из дерева
			if (currentPath.length > 0 && analysisTree[branchPoint]) {
				let currentLevel = analysisTree[branchPoint];
				for (const idx of currentPath) {
					if (currentLevel && currentLevel[idx]) {
						try {
							chess.move(currentLevel[idx].m);
							currentLevel = currentLevel[idx].s || [];
						} catch (e) {
							break; 
						}
					} else {
						break;
					}
				}
			}
			
			return chess;
		}, [analysisTree, currentPath, selectedMoveIndex, matchHistory]);

		const computedFen = computedChess.fen();

		useImperativeHandle(ref, () => ({
			getCurrentFen: () => computedFen,
		}));
		
		const handleMove = (orig: string, dest: string) => {
			if (isReadOnly) return;

			const chess = new Chess(computedFen);
			const move = chess.move({ from: orig, to: dest, promotion: 'q' });

			if (move) {
				const branchPoint = selectedMoveIndex !== null ? selectedMoveIndex : matchHistory.length - 1;
				
				// Если currentPath пуст, мы создаем первый ход в новой ветке от branchPoint
				// Если не пуст, мы продолжаем текущую ветку
				addMoveToTree(move.san, branchPoint, currentPath);
			
				if (userId) syncAnalysisToServer(matchId, userId);
				onMove?.(move.san);
			}
		};

		const movableObj = useMemo(() => {
			const dests = new Map();
			const board = computedChess.board().flat();

			board.forEach((piece) => {
				if (piece && piece.color === computedChess.turn()) {
					const moves = computedChess.moves({ square: piece.square, verbose: true });
					if (moves.length) {
						dests.set(piece.square, moves.map(m => m.to));
					}
				}
			});

			return {
				free: false,
				showDests: true,
				dests: dests,
				color: "both" as const
			};
		}, [computedChess]);

		return (
			<div className="w-full h-full rounded-md overflow-hidden flex justify-center items-center">
				<Chessground
					onMove={handleMove}
					fen={computedFen}
					viewOnly={isReadOnly}
					width="100%"
					height="100%"
					coordinates={true}
					movable={movableObj}
					premovable={{ enabled: false }}
					animation={{
						enabled: true,
						duration: 300,
					}}
				/>
			</div>
		);
	}
);

UserAnalysisBoard.displayName = 'UserAnalysisBoard';
